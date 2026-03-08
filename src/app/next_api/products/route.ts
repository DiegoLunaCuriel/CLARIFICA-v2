import { NextRequest } from "next/server";
import { createSuccessResponse, createErrorResponse } from "@/lib/create-response";
import { requestMiddleware, parseQueryParams, ApiParams } from "@/lib/api-utils";
import { createPostgrestClient } from "@/lib/postgrest";

type UnwrangleProduct = {
  store_name?: string;
  store_website_url?: string;

  product_url: string; // unwrangle usa "url" normalmente; lo normalizamos abajo
  name: string;

  description?: string;
  price?: number;
  image_url?: string;
  availability_status?: string;
  rating?: number;
  review_count?: number;
  sku?: string;
};

const TTL_HOURS = 24;

function normalizeQuery(q: string) {
  return q.trim().toLowerCase();
}

function hoursAgoDate(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

/**
 * Mapea website_url -> plataforma de Unwrangle.
 * Ajusta si agregas más tiendas.
 */
function platformFromWebsiteUrl(websiteUrl?: string | null): string | null {
  if (!websiteUrl) return null;
  const u = websiteUrl.toLowerCase();

  if (u.includes("amazon.")) return "amazon_search"; // docs: platform=amazon_search :contentReference[oaicite:1]{index=1}
  if (u.includes("homedepot.")) return "homedepot_search"; // docs: platform=homedepot_search :contentReference[oaicite:2]{index=2}

  return null;
}

function ensureEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function toPlusSeparated(s: string) {
  // Unwrangle recomienda sustituir espacios por + (ej: "ssd 1tb" -> "ssd+1tb") :contentReference[oaicite:3]{index=3}
  return s.trim().split(/\s+/).join("+");
}

/**
 * Llama Unwrangle y normaliza el resultado al shape que insertamos.
 * - storeId null  => hace búsqueda multi-store (Amazon + HomeDepot) y mezcla resultados.
 * - storeId != null => detecta la plataforma según la store en BD (si no se puede, no llama).
 */
async function fetchFromUnwrangle(
  client: ReturnType<typeof createPostgrestClient>,
  search: string,
  storeId: number | null
): Promise<UnwrangleProduct[]> {
  const apiKey = ensureEnv("UNWRANGLE_API_KEY");
  const countryCode = process.env.UNWRANGLE_COUNTRY_CODE || "us";

  let platforms: { platform: string; store_name: string; store_website_url: string }[] = [];

  if (storeId !== null) {
    // Resolver plataforma según la store elegida en BD
    const { data: store, error } = await client
      .from("product_stores")
      .select("id,name,website_url")
      .eq("id", storeId)
      .maybeSingle();

    if (error) throw error;

    const platform = platformFromWebsiteUrl(store?.website_url || null);
    if (!platform) return [];

    platforms = [
      {
        platform,
        store_name: store?.name || "Store",
        store_website_url: store?.website_url || "",
      },
    ];
  } else {
    // "All stores": por ahora consultamos Amazon + Home Depot
    platforms = [
      { platform: "amazon_search", store_name: "Amazon", store_website_url: "https://www.amazon.com" },
      { platform: "homedepot_search", store_name: "Home Depot", store_website_url: "https://www.homedepot.com" },
    ];
  }

  const term = toPlusSeparated(search);

  const all: UnwrangleProduct[] = [];

  for (const p of platforms) {
    const url = new URL("https://data.unwrangle.com/api/getter/");
    url.searchParams.set("platform", p.platform);
    url.searchParams.set("search", term);
    url.searchParams.set("country_code", countryCode);
    url.searchParams.set("api_key", apiKey);

    const resp = await fetch(url.toString(), { method: "GET" });

    if (!resp.ok) {
      const body = await resp.text().catch(() => "");
      throw new Error(`Unwrangle failed (${p.platform}) ${resp.status}: ${body.slice(0, 300)}`);
    }

    const json: any = await resp.json();

    const results: any[] = Array.isArray(json?.results) ? json.results : [];
    for (const r of results) {
      // Normalización básica (Unwrangle suele devolver: name, url, thumbnail, rating, total_ratings, price)
      const productUrl = (r?.url || r?.product_url || "").toString().trim();
      const name = (r?.name || "").toString().trim();
      if (!productUrl || !name) continue;

      const price =
        typeof r?.price === "number"
          ? r.price
          : typeof r?.price === "string"
            ? Number(String(r.price).replace(/[^0-9.]/g, "")) || undefined
            : undefined;

      all.push({
        store_name: p.store_name,
        store_website_url: p.store_website_url,
        product_url: productUrl,
        name,
        description: r?.description ? String(r.description) : undefined,
        price,
        image_url: r?.thumbnail ? String(r.thumbnail) : r?.image_url ? String(r.image_url) : undefined,
        availability_status: "in_stock",
        rating: typeof r?.rating === "number" ? r.rating : undefined,
        review_count:
          typeof r?.total_ratings === "number"
            ? r.total_ratings
            : typeof r?.review_count === "number"
              ? r.review_count
              : undefined,
        sku: r?.asin ? String(r.asin) : r?.sku ? String(r.sku) : undefined,
      });
    }
  }

  return all;
}

/**
 * Upsert store por website_url o name.
 * Regresa store_id.
 */
async function upsertStore(
  client: ReturnType<typeof createPostgrestClient>,
  store: { name: string; website_url?: string; logo_url?: string }
): Promise<number> {
  const website_url = store.website_url?.trim() || null;
  const name = store.name.trim();

  if (website_url) {
    const { data: existing, error: e1 } = await client
      .from("product_stores")
      .select("id")
      .eq("website_url", website_url)
      .limit(1)
      .maybeSingle();

    if (e1) throw e1;
    if (existing?.id) return existing.id;

    const { data: created, error: e2 } = await client
      .from("product_stores")
      .insert([{ name, website_url, logo_url: store.logo_url ?? null }])
      .select("id")
      .single();

    if (e2) throw e2;
    return created.id;
  }

  const { data: existingByName, error: e3 } = await client
    .from("product_stores")
    .select("id")
    .eq("name", name)
    .limit(1)
    .maybeSingle();

  if (e3) throw e3;
  if (existingByName?.id) return existingByName.id;

  const { data: createdByName, error: e4 } = await client
    .from("product_stores")
    .insert([{ name }])
    .select("id")
    .single();

  if (e4) throw e4;
  return createdByName.id;
}

export const GET = requestMiddleware(
  async (request: NextRequest, params: ApiParams) => {
    try {
      const { limit, offset, search } = parseQueryParams(request);

      const rawSearch = (search || "").toString();
      const term = normalizeQuery(rawSearch);

      if (!term) {
        return createErrorResponse({
          status: 400,
          errorMessage: "Missing search term",
          errorCode: "BAD_REQUEST",
        });
      }

      const sp = request.nextUrl.searchParams;
      const storeIdParam = sp.get("store_id");

      // HÍBRIDO:
      // - store_id específico => cache por query + store_id
      // - "all" o null => cache por query + store_id = NULL
      const storeId = storeIdParam && storeIdParam !== "all" ? Number(storeIdParam) : null;

      const client = createPostgrestClient(params.token);

      // 1) Revisar caché
      let cacheQuery = client
        .from("product_search_cache")
        .select("id, last_fetched_at")
        .eq("query", term)
        .limit(1);

      cacheQuery = storeId === null ? cacheQuery.is("store_id", null) : cacheQuery.eq("store_id", storeId);

      const { data: cacheRow, error: cacheErr } = await cacheQuery.maybeSingle();
      if (cacheErr) throw cacheErr;

      const threshold = hoursAgoDate(TTL_HOURS);
      const lastFetched = cacheRow?.last_fetched_at ? new Date(cacheRow.last_fetched_at) : null;
      const isFresh = lastFetched ? lastFetched >= threshold : false;

      // 2) Si está stale => llamar Unwrangle y upsert
      if (!isFresh) {
        const unwrangleResults = await fetchFromUnwrangle(client, term, storeId);

        if (Array.isArray(unwrangleResults) && unwrangleResults.length > 0) {
          for (const p of unwrangleResults) {
            let resolvedStoreId = storeId;

            if (resolvedStoreId === null) {
              const storeName = (p.store_name || "Unknown Store").trim();
              const website_url = p.store_website_url?.trim();
              resolvedStoreId = await upsertStore(client, { name: storeName, website_url });
            }

            const payload = {
              store_id: resolvedStoreId,
              material_id: null,
              name: p.name,
              description: p.description ?? null,
              price: typeof p.price === "number" ? p.price : 0,
              image_url: p.image_url ?? null,
              product_url: p.product_url,
              sku: p.sku ?? null,
              availability_status: p.availability_status ?? "in_stock",
              rating: typeof p.rating === "number" ? p.rating : null,
              review_count: typeof p.review_count === "number" ? p.review_count : 0,
              last_synced_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };

            const { error: upsertErr } = await client.from("products").upsert(payload, {
              onConflict: "store_id,product_url",
              ignoreDuplicates: false,
            });

            if (upsertErr) throw upsertErr;
          }
        }

        // Cache: se actualiza aunque la respuesta venga vacía (para evitar "pegarle" a Unwrangle en cada request)
        const cachePayload = {
          query: term,
          store_id: storeId,
          last_fetched_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { error: cacheUpsertErr } = await client
          .from("product_search_cache")
          .upsert(cachePayload, { onConflict: "query,store_id" });

        if (cacheUpsertErr) throw cacheUpsertErr;
      }

      // 3) Responder desde BD
      let productsQuery = client
        .from("products")
        .select("*")
        .or(`name.ilike.%${term}%,description.ilike.%${term}%`)
        .order("id", { ascending: false });

      if (storeId !== null) {
        productsQuery = productsQuery.eq("store_id", storeId);
      }

      const from = offset;
      const to = offset + limit - 1;
      productsQuery = productsQuery.range(from, to);

      const { data: products, error: productsErr } = await productsQuery;
      if (productsErr) throw productsErr;

      return createSuccessResponse(products ?? []);
    } catch (err: any) {
      console.error("products route error:", err);
      return createErrorResponse({
        status: 500,
        errorMessage: err?.message || "Failed to fetch products",
      });
    }
  },
  false
);
