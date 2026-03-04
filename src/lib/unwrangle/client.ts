type UnwrangleAmazonSearchResponse = {
  success: boolean;
  results?: Array<{
    name?: string;
    url?: string;
    price?: string; // viene como string en amazon_search
    currency?: string;
  }>;
  error?: string;
  message?: string;
};

type UnwrangleHomeDepotSearchResponse = {
  success: boolean;
  results?: Array<{
    name?: string;
    url?: string;
    price?: number; // viene como número en homedepot_search
    currency?: string;
  }>;
  error?: string;
  message?: string;
};

type UnwranglePlatform = "amazon_search" | "homedepot_search";

type UnwrangleSearchParams = {
  platform: UnwranglePlatform;
  search: string;
  apiKey: string;
  countryCode?: string; // amazon_search
};

type UnwrangleSearchResult = {
  title: string;
  url: string;
  price: number | null;
  currency: string | null;
};

function parsePriceLoose(input: unknown): number | null {
  if (typeof input === "number") return Number.isFinite(input) ? input : null;
  if (typeof input !== "string") return null;

  // Ej: "$12.34", "1,299.00", "MX$ 1,299"
  const cleaned = input
    .replace(/[^\d.,]/g, "")
    .trim();

  if (!cleaned) return null;

  // Heurística: si tiene ambos, asumimos coma como separador de miles
  // y punto como decimal.
  const normalized =
    cleaned.includes(".") && cleaned.includes(",")
      ? cleaned.replace(/,/g, "")
      : cleaned.replace(/,/g, ".");

  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

// Cache simple en memoria (para DEV/demo). Evita gastar créditos repitiendo queries.
declare global {
  // eslint-disable-next-line no-var
  var __unwrangleCache: Map<string, { expiresAt: number; data: UnwrangleSearchResult[] }> | undefined;
}
const cache = globalThis.__unwrangleCache ?? (globalThis.__unwrangleCache = new Map());

export async function unwrangleSearch(params: UnwrangleSearchParams): Promise<UnwrangleSearchResult[]> {
  const { platform, search, apiKey, countryCode } = params;

  const ttlSeconds = Number(process.env.UNWRANGLE_CACHE_TTL_SECONDS || "900");
  const now = Date.now();
  const cacheKey = `${platform}::${countryCode ?? ""}::${search.toLowerCase().trim()}`;

  const hit = cache.get(cacheKey);
  if (hit && hit.expiresAt > now) return hit.data;

  const url = new URL("https://data.unwrangle.com/api/getter/");
  url.searchParams.set("platform", platform);
  url.searchParams.set("search", search);

  if (platform === "amazon_search") {
    url.searchParams.set("country_code", countryCode || process.env.UNWRANGLE_COUNTRY_CODE || "us");
  }

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `token ${apiKey}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    // Unwrangle documenta: 400 request inválido, 403 auth/créditos, etc. :contentReference[oaicite:1]{index=1}
    const text = await res.text().catch(() => "");
    throw new Error(`Unwrangle HTTP ${res.status}: ${text.slice(0, 200)}`);
  }

  const json = (await res.json()) as UnwrangleAmazonSearchResponse | UnwrangleHomeDepotSearchResponse;

  if (!json?.success || !Array.isArray(json.results)) {
    throw new Error(`Unwrangle response inválida (success=false o sin results)`);
  }

  const results: UnwrangleSearchResult[] = json.results
    .map((r: any) => ({
      title: String(r?.name ?? "").trim(),
      url: String(r?.url ?? "").trim(),
      price: parsePriceLoose(r?.price),
      currency: typeof r?.currency === "string" ? r.currency : null,
    }))
    .filter((r) => r.title && r.url);

  cache.set(cacheKey, { expiresAt: now + ttlSeconds * 1000, data: results });
  return results;
}
