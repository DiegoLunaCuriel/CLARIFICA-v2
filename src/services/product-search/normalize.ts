// src/services/product-search/normalize.ts

export type EvidenceProduct = {
  title: string;
  url: string;
  snippet?: string;
  source?: string;
  image?: string;
};

type GoogleCseItem = {
  title?: string;
  link?: string;
  snippet?: string;
  displayLink?: string;
  pagemap?: any;
};

function pickImage(pagemap: any): string | undefined {
  // 1. OpenGraph image (highest quality, usually the product photo)
  const og = pagemap?.metatags?.[0]?.["og:image"];
  if (og) return og;

  // 2. Twitter card image
  const twitter = pagemap?.metatags?.[0]?.["twitter:image"];
  if (twitter) return twitter;

  // 3. CSE thumbnail
  const thumb = pagemap?.cse_thumbnail?.[0]?.src;
  if (thumb) return thumb;

  // 4. CSE image
  const img = pagemap?.cse_image?.[0]?.src;
  if (img) return img;

  // 5. Product schema image
  const product = pagemap?.product?.[0]?.image;
  if (product) return product;

  // 6. Any image from metatags
  const metaImage = pagemap?.metatags?.[0]?.["image"];
  if (metaImage) return metaImage;

  return undefined;
}

export function normalizeCseItems(items: any[]): EvidenceProduct[] {
  const arr: GoogleCseItem[] = Array.isArray(items) ? items : [];

  return arr
    .map((it) => {
      const title = String(it?.title ?? "").trim();
      const url = String(it?.link ?? "").trim();
      const snippet = it?.snippet ? String(it.snippet) : undefined;
      const source = it?.displayLink ? String(it.displayLink) : undefined;
      const image = pickImage(it?.pagemap);

      return { title, url, snippet, source, image };
    })
    .filter((x) => x.title && x.url);
}
