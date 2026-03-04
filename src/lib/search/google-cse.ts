// src/lib/search/google-cse.ts
// Migrated from Google CSE to Serper.dev (Google CSE closed for new customers)
// The external interface stays the same so all consumers work without changes.

export type CseItem = {
  title: string;
  link: string;
  snippet?: string;
  displayLink?: string;
  pagemap?: any;
};

/* ── Serper.dev types ── */

type SerperOrganicResult = {
  title?: string;
  link?: string;
  snippet?: string;
  sitelinks?: any[];
  position?: number;
  imageUrl?: string;
  thumbnail?: string;
  rating?: number;
  ratingCount?: number;
};

type SerperResponse = {
  organic?: SerperOrganicResult[];
  searchParameters?: any;
  credits?: number;
};

type SerperImageResult = {
  title?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  link?: string;
  domain?: string;
};

/**
 * Search using Serper.dev API.
 * Keeps the same signature as the old Google CSE wrapper so all callers
 * (decision/route.ts, decision-engine, etc.) work without modification.
 */
export async function googleCseSearch(
  query: string,
  opts?: { num?: number; siteSearch?: string }
): Promise<CseItem[]> {
  const num = opts?.num ?? 8;

  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) {
    console.warn("[search] Falta SERPER_API_KEY en .env.local");
    return [];
  }

  let q = query;
  if (opts?.siteSearch) {
    q = `${query} site:${opts.siteSearch}`;
  }

  try {
    const res = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q,
        gl: "mx",
        hl: "es",
        num: Math.min(Math.max(num, 1), 20),
      }),
    });

    if (!res.ok) {
      console.warn(`[search] Serper error ${res.status}: ${await res.text().catch(() => "")}`);
      return [];
    }

    const data: SerperResponse = await res.json().catch(() => ({}));
    const organic = Array.isArray(data?.organic) ? data.organic : [];

    // Convert to CseItem format
    const items = organic.map((r) => serperToCseItem(r));

    // Enrich items that don't have images
    await enrichImages(items, query, opts?.siteSearch);

    return items;
  } catch (err: any) {
    console.warn("[search] Serper fetch error:", err?.message);
    return [];
  }
}

/**
 * Convert a Serper organic result to CseItem format.
 */
function serperToCseItem(r: SerperOrganicResult): CseItem {
  const link = r.link || "";
  let displayLink = "";
  try {
    displayLink = new URL(link).hostname;
  } catch {
    displayLink = link;
  }

  const pagemap: any = {};
  const imageUrl = r.imageUrl || r.thumbnail;
  if (imageUrl) {
    pagemap.metatags = [{ "og:image": imageUrl }];
    pagemap.cse_image = [{ src: imageUrl }];
    pagemap.cse_thumbnail = [{ src: imageUrl }];
  }

  return {
    title: r.title || "",
    link,
    snippet: r.snippet,
    displayLink,
    pagemap: Object.keys(pagemap).length > 0 ? pagemap : undefined,
  };
}

/* ── Image enrichment ── */

function hasImage(item: CseItem): boolean {
  return !!item.pagemap?.metatags?.[0]?.["og:image"];
}

function setImage(item: CseItem, img: string): void {
  item.pagemap = {
    ...(item.pagemap || {}),
    metatags: [{ "og:image": img }],
    cse_image: [{ src: img }],
    cse_thumbnail: [{ src: img }],
  };
}

function isAmazonUrl(url: string): boolean {
  try {
    return new URL(url).hostname.includes("amazon");
  } catch {
    return false;
  }
}

/**
 * Enrich items without images using two strategies:
 * 1. Non-Amazon items: fetch og:image from product page (free, no credits)
 * 2. Amazon items: use Serper /images endpoint (1 extra credit per batch)
 *    Amazon blocks bot requests so og:image won't work for them.
 */
async function enrichImages(
  items: CseItem[],
  query: string,
  siteSearch?: string
): Promise<void> {
  const needsImage = items.filter((it) => !hasImage(it));
  if (needsImage.length === 0) return;

  const amazonItems = needsImage.filter((it) => isAmazonUrl(it.link));
  const otherItems = needsImage.filter((it) => !isAmazonUrl(it.link));

  // Strategy 1: Fetch og:image for non-Amazon items (free)
  if (otherItems.length > 0) {
    console.log(`[search] Fetching og:image for ${otherItems.length} non-Amazon items...`);
    await Promise.all(
      otherItems.map(async (item) => {
        try {
          const img = await fetchOgImage(item.link);
          if (img) setImage(item, img);
        } catch { /* skip */ }
      })
    );
  }

  // Strategy 2: Serper /images for Amazon items (1 credit per batch)
  if (amazonItems.length > 0) {
    console.log(`[search] Fetching images for ${amazonItems.length} Amazon items via Serper Images...`);
    await enrichAmazonImages(amazonItems, query, siteSearch);
  }

  const withImages = items.filter((it) => hasImage(it));
  console.log(`[search] Images found: ${withImages.length}/${items.length}`);
}

/**
 * Use Serper /images endpoint to get images for Amazon items.
 * Does ONE search call (1 credit) and matches images to items by URL or title.
 */
async function enrichAmazonImages(
  amazonItems: CseItem[],
  query: string,
  siteSearch?: string
): Promise<void> {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) return;

  // Build image search query — use original query + amazon.com.mx
  const site = siteSearch || "amazon.com.mx";
  const q = `${query} site:${site}`;

  try {
    const res = await fetch("https://google.serper.dev/images", {
      method: "POST",
      headers: {
        "X-API-KEY": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q,
        gl: "mx",
        hl: "es",
        num: Math.min(amazonItems.length * 3, 20), // Get extra images for better matching
      }),
    });

    if (!res.ok) {
      console.warn(`[search] Serper images error ${res.status}`);
      return;
    }

    const data = await res.json().catch(() => ({}));
    const images: SerperImageResult[] = Array.isArray(data?.images) ? data.images : [];

    if (images.length === 0) return;

    // Match images to Amazon items by URL or title similarity
    for (const item of amazonItems) {
      if (hasImage(item)) continue;

      // Try exact URL match first
      const exactMatch = images.find((img) => img.link === item.link);
      if (exactMatch?.imageUrl) {
        setImage(item, exactMatch.imageUrl);
        continue;
      }

      // Try matching by title similarity (first 30 chars to handle truncation)
      const itemTitleLower = (item.title || "").toLowerCase().slice(0, 30);
      if (itemTitleLower.length > 5) {
        const titleMatch = images.find((img) => {
          const imgTitle = (img.title || "").toLowerCase();
          return imgTitle.includes(itemTitleLower) || itemTitleLower.includes(imgTitle.slice(0, 30));
        });
        if (titleMatch?.imageUrl) {
          setImage(item, titleMatch.imageUrl);
          continue;
        }
      }

      // Fallback: use first available image from same domain
      const domainMatch = images.find((img) =>
        img.domain?.includes("amazon") && img.imageUrl && !amazonItems.some(
          (other) => other !== item && hasImage(other) &&
          other.pagemap?.metatags?.[0]?.["og:image"] === img.imageUrl
        )
      );
      if (domainMatch?.imageUrl) {
        setImage(item, domainMatch.imageUrl);
      }
    }

    console.log(`[search] Amazon images matched: ${amazonItems.filter(hasImage).length}/${amazonItems.length}`);
  } catch (err: any) {
    console.warn("[search] Serper images fetch error:", err?.message);
  }
}

/**
 * Fetch a page and extract og:image from the HTML <head>.
 * Uses a short timeout and only reads the first ~30KB to be fast.
 */
async function fetchOgImage(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html",
      },
    });

    clearTimeout(timeout);
    if (!res.ok) return null;

    const reader = res.body?.getReader();
    if (!reader) return null;

    let html = "";
    const decoder = new TextDecoder();
    const MAX_BYTES = 30_000;

    while (html.length < MAX_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      html += decoder.decode(value, { stream: true });
      if (html.includes("</head>")) break;
    }

    reader.cancel().catch(() => {});

    // og:image (both attribute orders)
    const m1 = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
    if (m1?.[1]) return m1[1];
    const m2 = html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    if (m2?.[1]) return m2[1];

    // twitter:image fallback
    const m3 = html.match(/<meta[^>]+(?:name|property)=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);
    if (m3?.[1]) return m3[1];
    const m4 = html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']twitter:image["']/i);
    if (m4?.[1]) return m4[1];

    return null;
  } catch {
    return null;
  }
}

/* ── pickImage + normalizeCseItems ── */

function pickImage(pagemap: any): string | undefined {
  const og = pagemap?.metatags?.[0]?.["og:image"];
  if (og) return og;
  const twitter = pagemap?.metatags?.[0]?.["twitter:image"];
  if (twitter) return twitter;
  const thumb = pagemap?.cse_thumbnail?.[0]?.src;
  if (thumb) return thumb;
  const img = pagemap?.cse_image?.[0]?.src;
  if (img) return img;
  const product = pagemap?.product?.[0]?.image;
  if (product) return product;
  const metaImage = pagemap?.metatags?.[0]?.["image"];
  if (metaImage) return metaImage;
  return undefined;
}

export function normalizeCseItems(items: CseItem[]) {
  return items.map((it) => ({
    title: it.title,
    url: it.link,
    snippet: it.snippet,
    source: it.displayLink,
    image: pickImage(it.pagemap),
  }));
}
