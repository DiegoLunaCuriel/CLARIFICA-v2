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
  { storeId: "amazon", storeName: "Amazon", livePlatform: "amazon_search" },
];

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
    if (!apiKey || !store.livePlatform) continue;

    try {
      const results = await unwrangleSearch({
        platform: store.livePlatform,
        search: query,
        apiKey,
        countryCode,
      });

      // Elegimos el mejor: el menor precio válido de los primeros resultados
      const best = results
        .filter((r) => typeof r.price === “number” && r.price !== null)
        .sort((a, b) => (a.price! as number) - (b.price! as number))[0]
        ?? results[0];

      if (!best) {
        throw new Error(“No results”);
      }

      const price = typeof best.price === “number” ? best.price : null;
      if (price === null) {
        throw new Error(“Result without parsable price”);
      }

      table.push({
        storeId: store.storeId,
        storeName: store.storeName,
        title: best.title || `${query}`,
        price,
        currency: best.currency || “MXN”,
        url: best.url,
        confidence: 92,
        source: “live”,
      });

      liveStores.push(store.storeId);
    } catch (e: any) {
      errors.push({
        storeId: store.storeId,
        message: typeof e?.message === “string” ? e.message : “Live fetch failed”,
      });
    }
  }

  const normalized = await normalizeOffersWithAI(table);

  const mode = liveStores.length > 0 ? “live” : “unavailable”;

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
