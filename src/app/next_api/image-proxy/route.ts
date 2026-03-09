// src/app/next_api/image-proxy/route.ts
// Server-side image proxy — bypasses browser CORS / hotlink protection for
// product images from Amazon and MercadoLibre CDNs.

import { NextRequest, NextResponse } from "next/server";

/** Only proxy images from trusted product-image CDNs. */
const ALLOWED_HOSTNAMES = [
  "http2.mlstatic.com",
  "mlstatic.com",
  "m.media-amazon.com",
  "images-na.ssl-images-amazon.com",
  "ssl-images-amazon.com",
  "mobileimages.lowes.com",
  "images.homedepot.com",
  "images.homedepot.com.mx",
];

function isAllowedUrl(raw: string): boolean {
  try {
    const { hostname } = new URL(raw);
    return ALLOWED_HOSTNAMES.some(
      (allowed) => hostname === allowed || hostname.endsWith(`.${allowed}`)
    );
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  const urlParam = req.nextUrl.searchParams.get("url");
  if (!urlParam) {
    return NextResponse.json({ error: "Missing url param" }, { status: 400 });
  }

  let imageUrl: string;
  try {
    imageUrl = decodeURIComponent(urlParam);
  } catch {
    return NextResponse.json({ error: "Invalid url encoding" }, { status: 400 });
  }

  if (!isAllowedUrl(imageUrl)) {
    return NextResponse.json({ error: "Domain not allowed" }, { status: 403 });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(imageUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        "Accept-Language": "es-MX,es;q=0.9",
        Referer: "https://www.google.com/",
      },
    });

    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json(
        { error: `Upstream returned ${res.status}` },
        { status: 502 }
      );
    }

    const contentType = res.headers.get("content-type") ?? "image/jpeg";
    if (!contentType.startsWith("image/")) {
      return NextResponse.json({ error: "Not an image" }, { status: 415 });
    }

    const buffer = await res.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        "X-Robots-Tag": "noindex",
      },
    });
  } catch (err: any) {
    if (err?.name === "AbortError") {
      return NextResponse.json({ error: "Upstream timeout" }, { status: 504 });
    }
    return NextResponse.json({ error: "Failed to fetch image" }, { status: 500 });
  }
}
