import { requestMiddleware } from "@/lib/api-utils";
import { createErrorResponse, createSuccessResponse } from "@/lib/create-response";
import { unwrangleSearch } from "@/lib/unwrangle/client";
import { normalizeOffersWithAI, type Offer } from "@/lib/ai/normalize-offers";

type StoreDef = {
  storeId: string;
  storeName: string;
  livePlatform?: "amazon_search" | "homedepot_search";
};

const STORES: StoreDef[] = [
  { storeId: "home_depot", storeName: "Home Depot", livePlatform: "homedepot_search" },
  { storeId: "walmart", storeName: "Walmart" },
  { storeId: "amazon", storeName: "Amazon", livePlatform: "amazon_search" },
  { storeId: "mercado_libre", storeName: "Mercado Libre" },
  { storeId: "sodimac", storeName: "Sodimac" },
];

function makeMockOffer(store: StoreDef, query: string): Offer {
  // Mock estable (para demo)
  const base = Math.abs(hashCode(`${store.storeId}:${query}`)) % 700;
  const price = 300 + base + (store.storeId.length * 7);
  return {
    storeId: store.storeId,
    storeName: store.storeName,
    title: `${query} - Presentación Estándar`,
    price: Number(price.toFixed(2)),
    currency: "MXN",
    url: `https://example.com/${store.storeId}?q=${encodeURIComponent(query)}`,
    confidence: 75,
    source: "mock",
  };
}

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return h | 0;
}

export const GET = requestMiddleware(async (request) => {
  const sp = request.nextUrl.searchParams;
  const query = (sp.get("query") ?? "").trim();
  const limit = Math.min(Math.max(Number(sp.get("limit") ?? "5"), 1), 10);
  const liveRequested = sp.get("live") === "1";

  if (!query) {
    return createErrorResponse({ status: 400, errorMessage: "Missing 'query' parameter" });
  }

  const apiKey = process.env.UNWRANGLE_API_KEY?.trim() || "";
  const countryCode = process.env.UNWRANGLE_COUNTRY_CODE?.trim() || "us";

  const stores = STORES.slice(0, limit);

  const errors: Array<{ storeId: string; message: string }> = [];
  const table: Offer[] = [];
  const liveStores: string[] = [];

  for (const store of stores) {
    const canLive = liveRequested && apiKey && store.livePlatform;

    if (!canLive) {
      table.push(makeMockOffer(store, query));
      continue;
    }

    try {
      const results = await unwrangleSearch({
        platform: store.livePlatform!,
        search: query,
        apiKey,
        countryCode,
      });

      // Elegimos el mejor: el menor precio válido de los primeros resultados
      const best = results
        .filter((r) => typeof r.price === "number" && r.price !== null)
        .sort((a, b) => (a.price! as number) - (b.price! as number))[0]
        ?? results[0];

      if (!best) {
        throw new Error("No results");
      }

      const price = typeof best.price === "number" ? best.price : null;
      if (price === null) {
        throw new Error("Result without parsable price");
      }

      table.push({
        storeId: store.storeId,
        storeName: store.storeName,
        title: best.title || `${query}`,
        price,
        currency: best.currency || (store.storeId === "amazon" ? "USD" : "USD"),
        url: best.url,
        confidence: 92,
        source: "live",
      });

      liveStores.push(store.storeId);
    } catch (e: any) {
      errors.push({
        storeId: store.storeId,
        message: typeof e?.message === "string" ? e.message : "Live fetch failed",
      });

      // Para que la tabla siga “completa” en demo, caemos a mock en esa tienda
      table.push(makeMockOffer(store, query));
    }
  }

  const normalized = await normalizeOffersWithAI(table);

  const mode =
    liveRequested && apiKey
      ? (liveStores.length > 0 ? "hybrid" : "mock")
      : "mock";

  return createSuccessResponse({
    mode,
    query,
    limit,
    liveRequested,
    liveStores,
    fetchedAt: new Date().toISOString(),
    table: normalized,
    errors,
  });
}, false);
