import { createErrorResponse, createSuccessResponse } from "@/lib/create-response";
import { requestMiddleware } from "@/lib/api-utils";

type GoogleItem = {
  title?: string;
  link?: string;
  snippet?: string;
  displayLink?: string;
};

type EnrichedItem = {
  title: string;
  link: string;
  snippet: string;
  displayLink: string;
  image: string | null;
  favicon: string | null;
};

function safeStr(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function absolutizeUrl(maybeUrl: string, baseUrl: string): string | null {
  try {
    if (!maybeUrl) return null;
    const u = new URL(maybeUrl, baseUrl);
    return u.toString();
  } catch {
    return null;
  }
}

function extractMetaContent(html: string, key: string): string | null {
  // Busca:
  // <meta property="og:image" content="...">
  // <meta name="twitter:image" content="...">
  // Acepta comillas simples/dobles y espacios.
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=[\\s]*["']${key}["'][^>]+content=[\\s]*["']([^"']+)["'][^>]*>`,
    "i"
  );
  const m = html.match(re);
  return m?.[1]?.trim() ? m[1].trim() : null;
}

function extractLinkHref(html: string, rel: string): string | null {
  // <link rel="icon" href="...">
  const re = new RegExp(
    `<link[^>]+rel=[\\s]*["'][^"']*${rel}[^"']*["'][^>]+href=[\\s]*["']([^"']+)["'][^>]*>`,
    "i"
  );
  const m = html.match(re);
  return m?.[1]?.trim() ? m[1].trim() : null;
}

async function fetchHtmlWithTimeout(url: string, timeoutMs: number): Promise<string> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
      headers: {
        // UA simple para evitar bloqueos básicos
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome Safari",
        Accept: "text/html,application/xhtml+xml",
      },
      // next: { revalidate: 0 } // opcional
    });

    // Si no es HTML, mejor no intentar parsear
    const ct = res.headers.get("content-type") || "";
    if (!res.ok) throw new Error(`Fetch ${res.status}`);
    if (!ct.toLowerCase().includes("text/html")) return "";

    return await res.text();
  } finally {
    clearTimeout(t);
  }
}

async function enrichOne(link: string): Promise<{ image: string | null; favicon: string | null }> {
  try {
    const html = await fetchHtmlWithTimeout(link, 4500);
    if (!html) {
      // Fallback: favicon por default en /favicon.ico
      const fav = absolutizeUrl("/favicon.ico", link);
      return { image: null, favicon: fav };
    }

    const og =
      extractMetaContent(html, "og:image") ??
      extractMetaContent(html, "og:image:url") ??
      extractMetaContent(html, "twitter:image") ??
      extractMetaContent(html, "twitter:image:src");

    const icon =
      extractLinkHref(html, "icon") ??
      extractLinkHref(html, "shortcut icon") ??
      extractLinkHref(html, "apple-touch-icon");

    const image = og ? absolutizeUrl(og, link) : null;
    const favicon = icon ? absolutizeUrl(icon, link) : absolutizeUrl("/favicon.ico", link);

    return { image, favicon };
  } catch {
    // Si el sitio bloquea o falla: no romper
    const fav = absolutizeUrl("/favicon.ico", link);
    return { image: null, favicon: fav };
  }
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, idx: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length) as any;
  let i = 0;

  const workers = new Array(Math.min(concurrency, items.length)).fill(0).map(async () => {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx], idx);
    }
  });

  await Promise.all(workers);
  return results;
}

export const GET = requestMiddleware(
  async (request) => {
    try {
      const sp = request.nextUrl.searchParams;

      const q = safeStr(sp.get("q")).trim();
      const site = safeStr(sp.get("site")).trim(); // opcional: "amazon.com.mx" / "homedepot.com.mx"
      const numRaw = Number(sp.get("num") || "5");
      const num = Number.isFinite(numRaw) ? Math.max(1, Math.min(10, numRaw)) : 5;

      // si enrich=0 no enriquecemos (por si quieres probar rápido)
      const enrich = sp.get("enrich") !== "0";

      if (!q) {
        return createErrorResponse({ status: 400, errorMessage: "Missing 'q' parameter" });
      }

      const apiKey = process.env.SERPER_API_KEY || "";

      if (!apiKey) {
        return createErrorResponse({
          status: 500,
          errorMessage: "Missing SERPER_API_KEY in env",
        });
      }

      const finalQuery = site ? `${q} site:${site}` : q;

      const res = await fetch("https://google.serper.dev/search", {
        method: "POST",
        headers: {
          "X-API-KEY": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          q: finalQuery,
          gl: "mx",
          hl: "es",
          num,
        }),
      });

      const text = await res.text();

      if (!res.ok) {
        return createErrorResponse({
          status: res.status,
          errorMessage: `Serper HTTP ${res.status}: ${text.slice(0, 400)}`,
        });
      }

      const json = JSON.parse(text) as { organic?: Array<{
        title?: string; link?: string; snippet?: string;
      }> };

      const rawItems =
        (json.organic || []).map((it) => {
          let displayLink = "";
          try { displayLink = new URL(it.link || "").hostname; } catch { displayLink = it.link || ""; }
          return {
            title: safeStr(it.title),
            link: safeStr(it.link),
            snippet: safeStr(it.snippet),
            displayLink,
          };
        });

      // Filtra entradas inválidas
      const baseItems = rawItems.filter((x) => x.title && x.link);

      if (!enrich) {
        const items: EnrichedItem[] = baseItems.map((x) => ({
          ...x,
          image: null,
          favicon: null,
        }));
        return createSuccessResponse({ q, site: site || null, finalQuery, count: items.length, items });
      }

      // Enriquecimiento con concurrencia controlada (evita saturar / bloquear)
      const enriched = await mapWithConcurrency(
        baseItems,
        3,
        async (it): Promise<EnrichedItem> => {
          const { image, favicon } = await enrichOne(it.link);
          return { ...it, image, favicon };
        }
      );

      return createSuccessResponse({
        q,
        site: site || null,
        finalQuery,
        count: enriched.length,
        items: enriched,
      });
    } catch (e: any) {
      return createErrorResponse({
        status: 500,
        errorMessage: typeof e?.message === "string" ? e.message : "Google CSE request failed",
      });
    }
  },
  false
);
