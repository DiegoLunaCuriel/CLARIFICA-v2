// src/app/next_api/prices/search/route.ts
import { requestMiddleware } from "@/lib/api-utils";
import { createErrorResponse, createSuccessResponse } from "@/lib/create-response";
import { geminiGenerateJson } from "@/lib/ai/gemini-json";

type AssistantOutputV1 = {
  version: "assist.v1";
  input: { raw_query: string; locale: "es-MX" };
  intent: { domain: string; product_type: string; use_case: string; confidence: number };
  guidance: { headline: string; explanation: string; do: string[]; avoid: string[] };
  query_plan: {
    normalized_query: string;
    must_include: string[];
    should_include: string[];
    exclude: string[];
    site_overrides: Array<{ site: string; must_include: string[]; exclude: string[] }>;
  };
  ranking_rules: {
    prefer_product_pages: boolean;
    demote_search_pages: boolean;
    demote_category_pages: boolean;
    allow_blog_results: boolean;
  };
  ui: { chips: string[] };
  safety: { policy: "ok"; notes: string[] };
};

type GoogleItem = {
  title?: string;
  link?: string;
  snippet?: string;
  displayLink?: string;
  pagemap?: any; // cse_thumbnail / cse_image / metatags
};

type StoreDef = {
  storeId: string;
  storeName: string;
  sites: string[]; // dominios/subdominios donde viven productos/listados
};

type StoreResult = {
  storeId: string;
  storeName: string;
  site: string; // principal para mostrar
  finalQuery: string; // query sin "site:" (restricción se aplica con siteSearch)
  items: Array<{
    title: string;
    link: string;
    snippet: string;
    displayLink: string;
    image?: string;
    favicon?: string;
    score?: number;
    flags?: string[];
  }>;
};

const STORES: StoreDef[] = [
  {
    storeId: "home_depot",
    storeName: "Home Depot",
    sites: ["homedepot.com.mx"],
  },
  {
    storeId: "mercado_libre",
    storeName: "Mercado Libre",
    // Buscar primero en articulo. (productos individuales), luego fallback al dominio general
    sites: ["articulo.mercadolibre.com.mx"],
  },
  {
    storeId: "amazon",
    storeName: "Amazon",
    sites: ["amazon.com.mx"],
  },
  // agrega más después: walmart.com.mx, soriana.com, costco.com.mx, etc.
];

/** Dominios permitidos — solo tiendas reales mexicanas. */
const ALLOWED_DOMAINS = new Set([
  ...STORES.flatMap((s) => s.sites.map((d) => d.toLowerCase())),
  // ML: el siteSearch usa articulo.mercadolibre pero los resultados pueden venir
  // de cualquier subdominio de mercadolibre.com.mx (www., articulo., etc.)
  "mercadolibre.com.mx",
]);

/**
 * Verifica que la URL pertenezca a uno de los dominios permitidos.
 * Cubre subdominios (articulo.mercadolibre.com.mx pasa para mercadolibre.com.mx).
 */
function isAllowedDomain(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    for (const allowed of ALLOWED_DOMAINS) {
      if (hostname === allowed || hostname.endsWith(`.${allowed}`)) return true;
    }
    return false;
  } catch {
    return false;
  }
}

function clampLimit(n: number) {
  if (!Number.isFinite(n)) return 5;
  return Math.max(1, Math.min(10, Math.floor(n)));
}

function uniqClean(arr: string[]) {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of arr || []) {
    const s = (raw ?? "").toString().trim();
    if (!s) continue;
    const key = s.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
  }
  return out;
}

function normText(s: string) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}

function isPdf(url: string) {
  const u = (url || "").toLowerCase();
  return u.endsWith(".pdf") || u.includes(".pdf?");
}

/**
 * Señales positivas de contexto de construcción/ferretería en título o snippet.
 * Si un resultado NO contiene ninguna de estas señales, probablemente no es relevante.
 */
const CONSTRUCTION_CONTEXT_SIGNALS = [
  "construccion", "construcci", "ferreteria", "ferreter", "albañil", "albanil",
  "hidratada", "hidratado", "portland", "mortero", "mezcla", "concreto", "cemento",
  "saco", "bulto", "costal", "kg", "kilos", "kilogramo",
  "herramienta", "material", "obra", "remodelacion", "plomeria", "electricidad",
  "pintura", "impermeabilizante", "soldadura", "tuberia",
  "truper", "pretul", "surtek", "dewalt", "milwaukee", "bosch", "makita", "stanley",
  "cemex", "holcim", "comex", "sika", "calidra",
  "homedepot", "home depot", "ferretero",
];

/**
 * Verifica si el título+snippet del resultado tiene alguna señal de contexto
 * de construcción/ferretería. Útil para filtrar resultados irrelevantes
 * cuando el término de búsqueda es ultra-corto o ambiguo (ej: "cal").
 */
function hasConstructionContext(title: string, snippet: string): boolean {
  const text = normText(`${title} ${snippet}`);
  return CONSTRUCTION_CONTEXT_SIGNALS.some((sig) => text.includes(sig));
}

/**
 * Lista de términos de búsqueda que son tan cortos/ambiguos que requieren
 * validación de contexto de construcción en los resultados.
 * Para estos términos, si un resultado no menciona NADA de construcción,
 * se penaliza fuertemente o se descarta.
 */
const ULTRA_AMBIGUOUS_TERMS = [
  "cal", "base", "malla", "block", "caja", "llave", "cable",
  "cinta", "tubo", "pala", "rollo", "tapa", "placa",
];

function getFaviconFromUrl(url: string) {
  try {
    const u = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(u.hostname)}&sz=64`;
  } catch {
    return undefined;
  }
}

/** Imagen para UI (prioriza thumbnail, luego image, luego og:image). */
function extractImage(it: GoogleItem): string | undefined {
  const pm = it?.pagemap;
  if (!pm) return undefined;

  const thumbs = Array.isArray(pm.cse_thumbnail) ? pm.cse_thumbnail : [];
  if (thumbs[0]?.src) return String(thumbs[0].src);

  const imgs = Array.isArray(pm.cse_image) ? pm.cse_image : [];
  if (imgs[0]?.src) return String(imgs[0].src);

  const mt = Array.isArray(pm.metatags) ? pm.metatags : [];
  const m0 = mt[0] || {};
  const og =
    m0["og:image"] ||
    m0["og:image:url"] ||
    m0["twitter:image"] ||
    m0["twitter:image:src"];
  if (og) return String(og);

  return undefined;
}

/** Baseline estricto si Gemini te manda todo false. */
function normalizeRankingRules(
  rr: AssistantOutputV1["ranking_rules"] | undefined | null
): AssistantOutputV1["ranking_rules"] {
  const fallback: AssistantOutputV1["ranking_rules"] = {
    prefer_product_pages: true,
    demote_search_pages: true,
    demote_category_pages: true,
    allow_blog_results: false,
  };

  if (!rr) return fallback;

  const allFalse =
    !rr.prefer_product_pages &&
    !rr.demote_search_pages &&
    !rr.demote_category_pages &&
    !rr.allow_blog_results;

  if (allFalse) return fallback;

  return {
    prefer_product_pages: Boolean(rr.prefer_product_pages),
    demote_search_pages: Boolean(rr.demote_search_pages),
    demote_category_pages: Boolean(rr.demote_category_pages),
    allow_blog_results: Boolean(rr.allow_blog_results),
  };
}

/** Modo amplio: relaja filtros (sirve cuando una tienda regresa vacío). */
function applyWideMode(
  ranking: AssistantOutputV1["ranking_rules"],
  wide: boolean
): AssistantOutputV1["ranking_rules"] {
  if (!wide) return ranking;

  return {
    prefer_product_pages: false,
    demote_search_pages: false,
    demote_category_pages: false,
    allow_blog_results: true,
  };
}

/**
 * Query SIN meter site: en texto.
 * El dominio se aplica con `siteSearch`.
 */
/**
 * Construye la query para Google CSE.
 * IMPORTANTE: Mantener la query CORTA. Google CSE funciona mal con queries largas.
 * El filtro de IA se encarga de la relevancia — la query solo necesita traer material.
 *
 * Max ~80 caracteres de query efectiva para mejores resultados.
 */
function buildFinalQuery(params: {
  normalized: string;
  must: string[];
  should: string[];
  exclude: string[];
  ranking: AssistantOutputV1["ranking_rules"];
  primarySite: string;
  siteOverrides?: AssistantOutputV1["query_plan"]["site_overrides"];
}) {
  const normalized = (params.normalized || "").trim();
  const must = uniqClean(params.must || []);

  const parts: string[] = [];
  parts.push(normalized || "");

  // Only add must_include terms (these are critical for finding the right product)
  for (const t of must.slice(0, 3)) {
    if (!t) continue;
    // Don't duplicate terms already in normalized
    if (normalized.toLowerCase().includes(t.toLowerCase())) continue;
    parts.push(t.includes(" ") ? `"${t}"` : t);
  }

  // NOTE: should_include and exclude are intentionally NOT added to the query.
  // Google CSE works best with SHORT, focused queries.
  // The AI filter handles relevance checking after results come back.

  return parts
    .map((p) => (p ?? "").toString().trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * ═══════════════════════════════════════════════════════════
 *  CACHÉ EN MEMORIA para planes del asistente.
 *  Evita llamar a Gemini repetidamente para el mismo término.
 *  TTL de 10 minutos — después se re-consulta.
 * ═══════════════════════════════════════════════════════════
 */
const planCache = new Map<string, { plan: AssistantOutputV1; timestamp: number }>();
const PLAN_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutos

function getCachedPlan(query: string): AssistantOutputV1 | null {
  const key = query.toLowerCase().trim();
  const entry = planCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > PLAN_CACHE_TTL_MS) {
    planCache.delete(key);
    return null;
  }
  console.log(`[plan-cache] HIT for "${query}"`);
  return entry.plan;
}

function cachePlan(query: string, plan: AssistantOutputV1) {
  const key = query.toLowerCase().trim();
  planCache.set(key, { plan, timestamp: Date.now() });
  // Prevent cache from growing indefinitely
  if (planCache.size > 100) {
    const oldest = planCache.keys().next().value;
    if (oldest) planCache.delete(oldest);
  }
}

async function fetchAssistantPlan(origin: string, query: string): Promise<AssistantOutputV1 | null> {
  // Check cache first
  const cached = getCachedPlan(query);
  if (cached) return cached;

  try {
    const url = new URL("/next_api/assistant/plan", origin);
    url.searchParams.set("q", query);

    const res = await fetch(url.toString(), { cache: "no-store" });
    const json = await res.json();
    if (!res.ok || !json?.success) return null;

    const plan = (json.data || null) as AssistantOutputV1 | null;
    if (plan) {
      cachePlan(query, plan);
    }
    return plan;
  } catch {
    return null;
  }
}

/**
 * Búsqueda usando Serper.dev API (reemplazo de Google CSE).
 * Cuando `siteSearch` se proporciona, se agrega `site:<dominio>` al query.
 * Devuelve resultados en el mismo formato GoogleItem para compatibilidad.
 */
async function googleCseSearch(params: {
  q: string;
  num: number;
  siteSearch?: string;
}): Promise<{ items: GoogleItem[] }> {
  const apiKey = process.env.SERPER_API_KEY || "";
  if (!apiKey) throw new Error("Missing SERPER_API_KEY in env");

  // Build query with site: restriction
  let q = params.q;
  if (params.siteSearch) {
    q = `${params.q} site:${params.siteSearch}`;
  }

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
      num: params.num,
    }),
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`Serper HTTP ${res.status}: ${text.slice(0, 400)}`);

  const json = JSON.parse(text) as { organic?: Array<{
    title?: string;
    link?: string;
    snippet?: string;
    imageUrl?: string;
    thumbnail?: string;
  }> };

  const organic = Array.isArray(json.organic) ? json.organic : [];

  // Convert Serper results to GoogleItem format for compatibility
  const items: GoogleItem[] = organic.map((r) => {
    let displayLink = "";
    try { displayLink = new URL(r.link || "").hostname; } catch { displayLink = r.link || ""; }

    const imageUrl = r.imageUrl || r.thumbnail;
    const pagemap: any = {};
    if (imageUrl) {
      pagemap.metatags = [{ "og:image": imageUrl }];
      pagemap.cse_image = [{ src: imageUrl }];
      pagemap.cse_thumbnail = [{ src: imageUrl }];
    }

    return {
      title: r.title,
      link: r.link,
      snippet: r.snippet,
      displayLink,
      pagemap: Object.keys(pagemap).length > 0 ? pagemap : undefined,
    };
  });

  // Enrich images via ONE Serper /shopping call (covers Amazon + MercadoLibre).
  // For other stores (Home Depot) that Serper organic already returns images for,
  // we fall back to og:image scraping.
  const needsImage = items.filter((it) => !it.pagemap);
  if (needsImage.length > 0) {
    const getHostname = (url: string) => { try { return new URL(url).hostname; } catch { return ""; } };
    const isAmazon = (url: string) => getHostname(url).includes("amazon");
    const isMercadoLibre = (url: string) => getHostname(url).includes("mercadolibre");

    const amazonItems = needsImage.filter((it) => isAmazon(it.link || ""));
    const mlItems     = needsImage.filter((it) => isMercadoLibre(it.link || ""));
    const otherItems  = needsImage.filter((it) => !isAmazon(it.link || "") && !isMercadoLibre(it.link || ""));

    // Other stores (e.g. Home Depot): skip og:image scraping — too slow (4s per item).
    // HD images usually come through Serper organic results directly.

    // Amazon + MercadoLibre: ONE Serper /shopping call, filter by source
    if (amazonItems.length > 0 || mlItems.length > 0) {
      try {
        const shopRes = await fetch("https://google.serper.dev/shopping", {
          method: "POST",
          headers: { "X-API-KEY": apiKey, "Content-Type": "application/json" },
          // Shopping doesn't support site: — use base query, filter by source afterwards
          body: JSON.stringify({ q: params.q, gl: "mx", hl: "es", num: 20 }),
        });
        if (shopRes.ok) {
          const shopData = await shopRes.json().catch(() => ({}));
          const allShop: Array<{ title?: string; imageUrl?: string; thumbnailUrl?: string; link?: string; source?: string }> =
            Array.isArray(shopData?.shopping) ? shopData.shopping : [];

          /** Assign images from a filtered pool to a set of items, no duplicates. */
          const assignFromPool = (
            targetItems: GoogleItem[],
            pool: typeof allShop
          ) => {
            const imgPool = pool
              .filter((s) => s.imageUrl || s.thumbnailUrl)
              .map((s) => ({ title: s.title ?? "", link: s.link ?? "", url: (s.imageUrl || s.thumbnailUrl)! }));

            const usedUrls = new Set<string>();
            for (const item of targetItems) {
              // 1. Exact URL match
              let pick = imgPool.find((s) => s.link === item.link);
              // 2. Title similarity (first 20 chars)
              if (!pick) {
                const t1 = (item.title || "").toLowerCase().slice(0, 20);
                if (t1.length > 5) {
                  pick = imgPool.find((s) => {
                    const t2 = s.title.toLowerCase();
                    return t2.includes(t1) || t1.includes(t2.slice(0, 20));
                  });
                }
              }
              // 3. Next unused image from pool
              if (!pick) pick = imgPool.find((s) => !usedUrls.has(s.url));

              if (pick?.url) {
                usedUrls.add(pick.url);
                item.pagemap = {
                  metatags: [{ "og:image": pick.url }],
                  cse_image: [{ src: pick.url }],
                  cse_thumbnail: [{ src: pick.url }],
                };
              }
            }
          };

          const amazonShop = allShop.filter((s) =>
            (s.source ?? "").toLowerCase().includes("amazon") ||
            (s.link ?? "").includes("amazon.com")
          );
          const mlShop = allShop.filter((s) =>
            (s.source ?? "").toLowerCase().includes("mercado") ||
            (s.link ?? "").includes("mercadolibre")
          );

          if (amazonItems.length > 0) assignFromPool(amazonItems, amazonShop);
          if (mlItems.length > 0)     assignFromPool(mlItems, mlShop);
        }
      } catch { /* skip enrichment */ }
    }
  }

  return { items };
}

/** Extract MercadoLibre item ID (e.g. MLM3166849376) from a product URL. */
function extractMercadoLibreItemId(url: string): string | null {
  const match = url.match(/\/MLM[-]?(\d+)/i);
  return match ? `MLM${match[1]}` : null;
}

/**
 * Fetch product thumbnail from MercadoLibre's public API (no auth required).
 * Much more reliable than scraping because ML uses Cloudflare on product pages.
 */
async function fetchMercadoLibreImage(itemId: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(
      `https://api.mercadolibre.com/items/${itemId}?attributes=thumbnail,pictures`,
      { signal: controller.signal, headers: { Accept: "application/json" } }
    );
    clearTimeout(timeout);
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    if (!data) return null;
    // Prefer first picture (full size) over thumbnail (90x90)
    const picUrl: string | undefined =
      (Array.isArray(data.pictures) && data.pictures[0]?.url) || data.thumbnail;
    if (!picUrl) return null;
    // Upgrade from -I (90x90) → -V (~720px) for better display quality
    return picUrl.replace(/-[A-Z](\.(jpg|png|webp))$/i, "-V$1");
  } catch {
    return null;
  }
}

/** Fetch og:image from a product page HTML <head>. Fast: 4s timeout, reads max 30KB. */
async function fetchOgImageFromPage(url: string): Promise<string | null> {
  if (!url) return null;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html",
      },
    });
    clearTimeout(timeout);
    if (!res.ok) return null;

    const reader = res.body?.getReader();
    if (!reader) return null;

    let html = "";
    const decoder = new TextDecoder();
    while (html.length < 30_000) {
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

/** =========================
 *  Post-filter + scoring
 *  ========================= */

function looksLikeSearchOrQnA(primarySite: string, url: string, title?: string) {
  const u = (url || "").toLowerCase();
  if (isPdf(u)) return true;

  // URL-based detection — comprehensive
  if (u.includes("/search") || u.includes("search?")) return true;
  if (u.includes("/buscar")) return true;

  if (primarySite.includes("amazon")) {
    if (u.includes("/s?") || u.includes("s?k=") || u.includes("/ask/")) return true;
    if (/amazon\.com\.mx\/s[/?]/.test(u)) return true; // /s/ or /s?
    if (u.includes("/b/")) return true; // category
  }

  if (primarySite.includes("mercadolibre")) {
    // Bloquear páginas de listado/búsqueda — solo queremos productos individuales
    if (u.includes("listado.mercadolibre")) return true;
    if (u.includes("/ayuda/")) return true;
    if (/mercadolibre\.com\.mx\/c\//.test(u)) return true;
    // Bloquear notas/reviews/opiniones
    if (u.includes("/notas/") || u.includes("/opiniones/")) return true;
  }

  if (primarySite.includes("homedepot")) {
    // HD search: /s/keyword
    if (/homedepot\.com\.mx\/s\//.test(u)) return true;
  }

  // Title-based detection — "Resultados para X" is a search page
  if (title) {
    const t = title.trim();
    if (/^resultados?\s+(para|de|por)\b/i.test(t)) return true;
    if (/^\d+\s+resultados?\b/i.test(t)) return true;
    if (/^buscar\s/i.test(t)) return true;
    if (/^ofertas?\s+de\b/i.test(t)) return true;
    if (/the home depot/i.test(t) && /resultados/i.test(t)) return true;
  }

  return false;
}

function looksLikeProductUrl(primarySite: string, url: string) {
  const u = (url || "").toLowerCase();
  if (isPdf(u)) return false;

  if (primarySite.includes("amazon")) {
    return u.includes("/dp/") || u.includes("/gp/product/");
  }

  if (primarySite.includes("homedepot")) {
    return u.includes("/p/") || /homedepot\.com\.mx.*\/\d{6,}/.test(u);
  }

  if (primarySite.includes("mercadolibre")) {
    // Formato clásico: articulo.mercadolibre.com.mx/MLM-XXXXXX
    if (/\/MLM-\d+/i.test(url)) return true;
    // Formato nuevo: www.mercadolibre.com.mx/producto-nombre/p/MLM... o /up/MLM...
    if (/mercadolibre\.com\.mx\/[^/]+-[^/]+\//i.test(url) && !u.includes("listado.")) return true;
    return false;
  }

  return false;
}

function scoreItem(params: {
  primarySite: string;
  item: GoogleItem;
  plan: AssistantOutputV1 | null;
  ranking: AssistantOutputV1["ranking_rules"];
  rawQuery?: string;
}) {
  const { primarySite, item, plan, ranking, rawQuery } = params;

  const title = normText(item.title || "");
  const snippet = normText(item.snippet || "");
  const link = (item.link || "").toString();
  const linkLower = link.toLowerCase();

  const text = `${title} ${snippet}`.trim();

  const must = uniqClean(plan?.query_plan?.must_include || []).map(normText);
  const should = uniqClean(plan?.query_plan?.should_include || []).map(normText);
  const exclude = uniqClean(plan?.query_plan?.exclude || []).map(normText);

  const flags: string[] = [];
  let score = 0;

  if (isPdf(linkLower)) {
    score -= 100;
    flags.push("demoted:pdf");
  }

  if (ranking.demote_search_pages && looksLikeSearchOrQnA(primarySite, link, item.title)) {
    score -= 80; // Very heavy penalty — search/listing pages should almost never show
    flags.push("demoted:search/category/qna");
  }

  if (ranking.prefer_product_pages && looksLikeProductUrl(primarySite, link)) {
    score += 40; // Strong boost for confirmed product pages
    flags.push("boost:product-url");
  }

  if (primarySite.includes("mercadolibre") && /\/MLM-\d+/i.test(link)) {
    score += 15;
    flags.push("boost:mlm-product");
  }

  let mustHits = 0;
  for (const t of must) {
    if (!t) continue;
    if (text.includes(t)) mustHits++;
  }
  score += mustHits * 12;

  let shouldHits = 0;
  for (const t of should.slice(0, 6)) {
    if (!t) continue;
    if (text.includes(t)) shouldHits++;
  }
  score += shouldHits * 4;

  let excludeHits = 0;
  for (const t of exclude) {
    if (!t) continue;
    const token = t.replace(/"/g, "").replace(/^-/, "");
    if (!token) continue;

    const inText = text.includes(normText(token));
    const inUrl = linkLower.includes(token.toLowerCase());
    if (inText || inUrl) excludeHits++;
  }
  score -= excludeHits * 18;
  if (excludeHits > 0) flags.push(`penalty:exclude(${excludeHits})`);

  if (plan && must.length > 0 && mustHits === 0 && ranking.prefer_product_pages) {
    score -= 20;
    flags.push("penalty:no-must-hit");
  }

  // ── Heavy machinery / industrial equipment penalty ──
  // Users want hand tools and ferretería, NOT heavy machinery
  const HEAVY_MACHINERY_SIGNALS = [
    "excavadora", "retroexcavadora", "demolicion", "hidraulico industrial",
    "maquinaria pesada", "bulldozer", "montacargas", "grua industrial",
    "retroexcavador", "rompedor hidraulico", "martillo hidraulico",
    "para excavadora", "refaccion maquinaria", "brazo hidraulico",
    "pala mecanica", "aditamento para", "accesorio para excavadora",
    "cargador frontal", "minicargador", "miniexcavadora",
    "trascabo", "motoconformadora", "aplanadora",
  ];
  const hasHeavyMachinery = HEAVY_MACHINERY_SIGNALS.some(
    (sig) => text.includes(normText(sig))
  );
  if (hasHeavyMachinery) {
    score -= 60;
    flags.push("penalty:heavy-machinery");
  }

  // ── Construction context validation for ultra-ambiguous terms ──
  // For short/ambiguous queries like "cal", "base", "malla", etc.,
  // if the result has NO construction context at all, it's almost certainly irrelevant
  // (e.g., "Cobertor Cal King", "Camisa 8 Cal/cm²", "Base de maquillaje")
  if (rawQuery) {
    const queryTerms = normText(rawQuery).split(/\s+/).filter(Boolean);
    const isAmbiguous = queryTerms.some((t) =>
      ULTRA_AMBIGUOUS_TERMS.includes(t)
    );
    if (isAmbiguous && !hasConstructionContext(item.title || "", item.snippet || "")) {
      score -= 80;
      flags.push("penalty:no-construction-context");
    }
  }

  const img = extractImage(item);
  if (img) score += 4;

  return { score, flags };
}

/**
 * ═══════════════════════════════════════════════════════════
 *  FILTRO ESTÁTICO DE RELEVANCIA (no requiere IA)
 *  Valida que cada resultado sea realmente un producto de
 *  construcción/ferretería que coincide con lo que se busca.
 *  Se usa SIEMPRE — como primer filtro, y como fallback si
 *  Gemini falla (429, quota, etc.)
 * ═══════════════════════════════════════════════════════════
 */

/**
 * Para cada término ambiguo, define:
 * - positiveSignals: si el resultado contiene alguna de estas → es relevante
 * - negativeSignals: si el resultado contiene alguna de estas → NO es relevante
 *   (incluso si tiene señales de construcción genéricas)
 */
const TERM_SPECIFIC_FILTERS: Record<string, {
  positiveSignals: string[];
  negativeSignals: string[];
}> = {
  cal: {
    positiveSignals: [
      // Señales que DEBEN contener "cal" como contexto de cal de construcción
      "cal hidratada", "cal viva", "calidra", "cal para", "cal uniblock",
      "cal apagada", "oxido de calcio", "cal dolomita",
      "saco de cal", "bulto de cal", "cal de construccion", "cal alba",
      "cal 25kg", "cal 25 kg", "cal 20kg", "cal 20 kg", "cal saco",
      "cal para muro", "cal para pega", "pintura a la cal", "pintura cal",
      // NO incluir "hidratada" solo — puede matchear "concreto hidráulico"
      // NO incluir "mortero", "aplanado", "albañil" solos — son contexto genérico
    ],
    negativeSignals: [
      "cal king", "california", "calking", "calibre", "cal 16", "cal 14",
      "cal 12", "cal 10", "cal. 22", "cal. 20", "cal. 18", "cal. 16", "cal. 14", "cal. 12", "cal. 10",
      "cal/cm", "cal cm", "caloria", "calorias",
      "calendario", "calcomania", "calcomanias", "calceta", "calcetin",
      "calzado", "calzon", "calvario", "calentador de agua", "calefaccion",
      "calentador electrico", "calculator", "calculadora", "calidad premium",
      "chocolate", "nixtamal", "tortilla", "cobertor", "sabana", "colchon",
      "camisa", "retardante", "alfombra", "rubber", "tapete",
      "alambre cal", "cable cal", "cal-c-tose",
      "alimenticio", "grado alimenticio", "comestible",
      "agenda", "planeador", "libro",
      "tela gallinera", "gallinero",
    ],
  },
  malla: {
    positiveSignals: [
      "electrosoldada", "malla 6x6", "acero", "refuerzo", "castillo",
      "galvanizada", "malla para", "rollos", "construccion",
      "fierro", "varilla", "armex",
    ],
    negativeSignals: [
      "deportiva", "futbol", "tenis", "porteria", "mosquitero",
      "pesca", "malla de cabello", "cosmetico",
    ],
  },
  base: {
    positiveSignals: [
      "triturada", "grava", "compactacion", "relleno", "cimentacion",
      "material", "piedra", "m3", "metros cubicos", "camion",
      "tepetate", "terraceria",
    ],
    negativeSignals: [
      "maquillaje", "base liquida", "base de datos", "base de cama",
      "base para colchon", "base de carga", "base de celular",
      "base de laptop", "base para tv", "base para monitor",
    ],
  },
  cable: {
    positiveSignals: [
      "electrico", "thw", "calibre", "cobre", "condumex", "instalacion",
      "iusa", "aislado", "duplex", "uso rudo", "extension electrica",
      "romex", "12 awg", "14 awg", "10 awg",
    ],
    negativeSignals: [
      "usb", "hdmi", "lightning", "tipo c", "type c", "cargador",
      "audifonos", "ethernet", "red", "datos", "fibra optica",
    ],
  },
  caja: {
    positiveSignals: [
      "chalupa", "registro", "electrica", "cuadrada", "octagonal",
      "sobreponer", "empotrar", "interruptor", "contacto",
    ],
    negativeSignals: [
      "carton", "regalo", "mudanza", "archivo", "herramienta completa",
      "juego de", "almacenamiento", "organizador",
    ],
  },
  llave: {
    positiveSignals: [
      "española", "allen", "stilson", "perica", "mixta", "juego de llaves",
      "mm", "pulgadas", "truper", "surtek", "pretul",
      "herramienta", "ferreteria", "mecanica",
    ],
    negativeSignals: [
      "electronica", "digital", "smart", "inteligente", "cerradura smart",
      "auto", "automovil",
    ],
  },
  block: {
    positiveSignals: [
      "concreto", "tabicon", "muro", "construccion", "15x20",
      "20x40", "ligero", "pesado", "cemento", "block hueco",
    ],
    negativeSignals: [
      "blockchain", "block chain", "bloqueo", "sun block", "sunblock",
      "bloqueador", "block de notas",
    ],
  },
  cinta: {
    positiveSignals: [
      "masking", "aislar", "aislante", "ducto", "medicion",
      "metrica", "truper", "pretul", "electrica", "canela",
      "papel", "pintor", "tuck", "teflon",
    ],
    negativeSignals: [
      "cassette", "pelicula", "vhs", "musica", "video",
      "correr", "atletismo", "caminadora",
    ],
  },
  tubo: {
    positiveSignals: [
      "pvc", "cpvc", "galvanizado", "cobre", "hidraulico", "sanitario",
      "conduit", "plomeria", "agua", "drenaje", "diametro",
      "tuboplus", "presion",
    ],
    negativeSignals: [
      "ensayo", "laboratorio", "youtube", "tubo de escape",
    ],
  },
  pala: {
    positiveSignals: [
      "cuadrada", "redonda", "punta", "cuchara", "carbon", "truper",
      "pretul", "mango", "herramienta", "excavacion", "jardin",
      "albañil", "albanil", "concretera",
    ],
    negativeSignals: [
      "padel", "tenis", "ping pong", "juego", "retroexcavadora",
      "mecanica", "excavadora", "maquinaria",
    ],
  },
};

/**
 * Filtro estático — decide si un resultado es relevante para la búsqueda
 * del usuario, sin usar IA. Usa reglas específicas por término.
 *
 * Retorna: true si el resultado DEBE MOSTRARSE, false si debe descartarse.
 */
function staticRelevanceFilter(
  rawQuery: string,
  title: string,
  snippet: string
): boolean {
  const queryNorm = normText(rawQuery);
  const queryTerms = queryNorm.split(/\s+/).filter(Boolean);
  const text = normText(`${title} ${snippet}`);

  // Para términos ultra-ambiguos, el resultado DEBE contener el término
  // o alguna de sus señales positivas. Esto evita que "Agenda del Constructor"
  // aparezca al buscar "cal".
  const isUltraAmbiguous = queryTerms.some((t) => ULTRA_AMBIGUOUS_TERMS.includes(t));

  // Para cada término de la query, checar si hay un filtro específico
  let hasSpecificFilter = false;
  for (const term of queryTerms) {
    const filter = TERM_SPECIFIC_FILTERS[term];
    if (!filter) continue;
    hasSpecificFilter = true;

    // Si tiene señales negativas → RECHAZAR inmediatamente
    const hasNegative = filter.negativeSignals.some((sig) => text.includes(normText(sig)));
    if (hasNegative) {
      return false;
    }

    // Si tiene señales positivas → ACEPTAR
    const hasPositive = filter.positiveSignals.some((sig) => text.includes(normText(sig)));
    if (hasPositive) {
      return true;
    }

    // Si no tiene ni positivas ni negativas, checar contexto de construcción genérico
    // Para términos ultra-ambiguos, REQUIERE contexto de construcción Y que el término
    // aparezca como PALABRA COMPLETA (no como substring de "calcio", "local", etc.)
    if (ULTRA_AMBIGUOUS_TERMS.includes(term)) {
      // El término debe aparecer como palabra completa, not as part of another word
      const wordBoundary = new RegExp(`\\b${term}\\b`);
      const termAsWord = wordBoundary.test(text);
      if (!termAsWord) {
        return false;
      }
      if (!hasConstructionContext(title, snippet)) {
        return false;
      }
    }
  }

  // Si era ultra-ambiguo pero no tiene filtro específico, requerir contexto
  if (isUltraAmbiguous && !hasSpecificFilter) {
    if (!hasConstructionContext(title, snippet)) {
      return false;
    }
  }

  // Para queries que no son ultra-ambiguas (ej: "cemento", "taladro"),
  // aceptar si tiene contexto de construcción o si no es un término conocido
  return true;
}

/**
 * ═══════════════════════════════════════════════════════════
 *  FILTRO INTELIGENTE CON GEMINI (opcional — mejora los resultados)
 *  Después del filtro estático, la IA revisa cada resultado
 *  y decide si es realmente un producto que coincide.
 * ═══════════════════════════════════════════════════════════
 */
type AiFilterResult = {
  results: Array<{
    index: number;
    relevant: boolean;
    reason?: string;
  }>;
};

async function aiFilterResults(
  rawQuery: string,
  items: Array<{ title: string; link: string; snippet: string }>
): Promise<Set<number> | null> {
  if (items.length === 0) return new Set();

  const itemList = items
    .map((it, i) => `${i + 1}. "${it.title}" — ${it.snippet?.slice(0, 150) || "sin descripcion"}`)
    .join("\n");

  const prompt = `Eres un filtro de relevancia para una plataforma de MATERIALES DE CONSTRUCCION y FERRETERIA en Mexico.

El usuario busco: "${rawQuery}"

Tu trabajo: para cada resultado, decide si es RELEVANTE para la busqueda del usuario.

SE PERMISIVO: Si el producto esta relacionado con construccion, ferreteria, herramientas o materiales, marcalo como relevante. Solo rechaza productos que CLARAMENTE no tienen nada que ver.

CONTEXTO DE AMBIGUEDAD (solo aplica cuando el termino es ambiguo):
- "cal" = cal hidratada, cal viva (albanileria). NO es calibre, "Cal King", California.
- "martillo" = herramienta manual. NO es martillo hidraulico de excavadora.
- "base" = base triturada (construccion). NO es base de maquillaje.
- "cable" = cable electrico. NO es cable USB o HDMI.

Resultados:
${itemList}

REGLAS:
1. Si el producto es de construccion, ferreteria, herramientas, plomeria, electricidad, pintura → relevant: true
2. Si el producto es del tipo que el usuario busco (ej: busco "cemento" y es cemento, mortero o mezcla) → relevant: true
3. Si el producto es de una categoria COMPLETAMENTE diferente (ropa, comida, electronica, cosmeticos) → relevant: false
4. Paginas de categoria de tienda (ej: "Cemento | Home Depot") → relevant: true (son utiles para el usuario)
5. En caso de duda, marca como relevant: true

Devuelve JSON:
{"results": [{"index": 1, "relevant": true}, {"index": 2, "relevant": false}]}`;

  try {
    const response = await geminiGenerateJson<AiFilterResult>(prompt, {
      temperature: 0,
      maxOutputTokens: 1024,
    });

    const validIndices = new Set<number>();
    if (Array.isArray(response?.results)) {
      for (const r of response.results) {
        if (r.relevant && typeof r.index === "number") {
          validIndices.add(r.index - 1); // Convert 1-based to 0-based
        }
      }
    }

    console.log(`[ai-filter] Query: "${rawQuery}" | ${items.length} items → ${validIndices.size} relevant`);
    return validIndices;
  } catch (err: any) {
    // If Gemini fails, return null to signal "use static filter instead"
    console.warn(`[ai-filter] Gemini filter failed, using static filter:`, err?.message);
    return null;
  }
}

function postFilterAndRank(params: {
  primarySite: string;
  items: GoogleItem[];
  plan: AssistantOutputV1 | null;
  ranking: AssistantOutputV1["ranking_rules"];
  limit: number;
  rawQuery?: string;
  applyStaticRelevance?: boolean; // Apply static relevance filter (when AI unavailable)
}) {
  const { primarySite, items, plan, ranking, limit, rawQuery, applyStaticRelevance } = params;

  const scored = items.map((it) => {
    const r = scoreItem({ primarySite, item: it, plan, ranking, rawQuery });
    return { it, score: r.score, flags: r.flags };
  });

  const filtered = scored.filter(({ it }) => {
    const link = (it.link || "").toString();
    if (!link) return false;

    // HARD FILTER: only allow results from approved store domains
    if (!isAllowedDomain(link)) return false;

    // Always remove PDFs
    if (isPdf(link)) return false;

    // Always remove search/listing pages — they're never useful
    if (ranking.demote_search_pages && looksLikeSearchOrQnA(primarySite, link, it.title)) return false;

    // Static relevance filter — applied when AI filter is unavailable or as pre-filter
    if (applyStaticRelevance && rawQuery) {
      if (!staticRelevanceFilter(rawQuery, it.title || "", it.snippet || "")) {
        return false;
      }
    }

    return true;
  });

  filtered.sort((a, b) => b.score - a.score);

  return filtered.slice(0, limit).map(({ it, score, flags }) => {
    const link = (it.link ?? "").toString();
    return {
      title: (it.title ?? "").toString(),
      link,
      snippet: (it.snippet ?? "").toString(),
      displayLink: (it.displayLink ?? "").toString(),
      image: extractImage(it),
      favicon: getFaviconFromUrl(link),
      score,
      flags,
    };
  });
}

/**
 * Queries enriquecidas para términos ambiguos en Mercado Libre.
 * Evita que "cal" devuelva "Hule Cal. 600" en vez de "Cal hidratada".
 */
const ML_ENRICHED_QUERIES: Record<string, string[]> = {
  cal: ["cal hidratada", "cal viva calidra", "cal para construccion 25kg"],
  base: ["base triturada construccion", "grava base compactacion"],
  malla: ["malla electrosoldada", "malla acero construccion"],
  block: ["block concreto construccion", "block hueco tabicon"],
  caja: ["caja chalupa electrica", "caja registro electrica"],
  llave: ["llave española herramienta", "juego llaves mixtas truper"],
  cable: ["cable electrico thw", "cable uso rudo electrico"],
  cinta: ["cinta masking pintor", "cinta aislante electrica"],
  tubo: ["tubo pvc hidraulico", "tubo cpvc agua caliente"],
  pala: ["pala cuadrada truper", "pala punta herramienta"],
};

/**
 * Ejecuta búsquedas por cada dominio de la tienda usando siteSearch,
 * mezcla resultados, deduplica por link y luego rankea globalmente.
 */
async function searchStoreAcrossSites(params: {
  finalQuery: string;
  sites: string[];
  limit: number;
  wide: boolean;
  storeId?: string;
  rawQuery?: string;
}) {
  const { finalQuery, sites, limit, storeId, rawQuery } = params;

  const want = 10; // Always request max (10) from CSE per call
  const all: GoogleItem[] = [];
  const seen = new Set<string>();

  const addItems = (items: GoogleItem[]) => {
    for (const it of items) {
      const link = (it.link || "").toString();
      if (!link) continue;
      if (seen.has(link)) continue;
      if (!isAllowedDomain(link)) continue;
      seen.add(link);
      all.push(it);
    }
  };

  for (const site of sites) {
    const resp = await googleCseSearch({ q: finalQuery, num: want, siteSearch: site });
    addItems(resp.items || []);

    // Mercado Libre: estrategia multi-paso para obtener PRODUCTOS (no listados)
    if (storeId === "mercado_libre") {
      const mlProductSite = "articulo.mercadolibre.com.mx";
      const mlGeneralSite = "mercadolibre.com.mx";

      // Helper: filtra solo URLs de productos individuales de ML (no listados)
      const addOnlyProducts = (items: GoogleItem[]) => {
        for (const it of items) {
          const link = (it.link || "").toLowerCase();
          // Bloquear listados y categorías
          if (link.includes("listado.mercadolibre")) continue;
          if (/mercadolibre\.com\.mx\/c\//.test(link)) continue;
          if (link.includes("/notas/") || link.includes("/opiniones/")) continue;
          addItems([it]);
        }
      };

      // Generar queries alternativas para ML
      const queries = new Set<string>();
      queries.add(finalQuery);
      if (rawQuery && rawQuery.trim() !== finalQuery) {
        queries.add(rawQuery.trim());
      }
      // Para términos ambiguos, usar queries específicas de construcción
      // en vez de genéricas como "cal construccion" (que devuelve "Hule Cal. 600")
      if (rawQuery) {
        const rq = rawQuery.trim().toLowerCase();
        const enriched = ML_ENRICHED_QUERIES[rq];
        if (enriched) {
          for (const eq of enriched) queries.add(eq);
        } else {
          queries.add(`${rawQuery.trim()} ferreteria`);
        }
      }

      // Paso 1: queries alternativas en articulo.mercadolibre — en paralelo
      const altQueries = [...queries].filter((q) => q !== finalQuery).slice(0, 3);
      const paso1Results = await Promise.all(
        altQueries.map((q) =>
          googleCseSearch({ q, num: want, siteSearch: mlProductSite }).catch(() => ({ items: [] }))
        )
      );
      for (const r of paso1Results) addItems(r.items || []);

      // Paso 2: dominio general (www.mercadolibre.com.mx) — en paralelo
      const enrichedOnly = rawQuery ? (ML_ENRICHED_QUERIES[rawQuery.trim().toLowerCase()] || []) : [];
      const generalQueries = enrichedOnly.length > 0 ? enrichedOnly : [finalQuery];
      const paso2Results = await Promise.all(
        generalQueries.slice(0, 3).map((q) =>
          googleCseSearch({ q, num: want, siteSearch: mlGeneralSite }).catch(() => ({ items: [] }))
        )
      );
      for (const r of paso2Results) addOnlyProducts(r.items || []);
    }

    if (all.length >= limit * 4) break;
  }

  return all;
}

export const GET = requestMiddleware(
  async (request) => {
    try {
      const { searchParams } = new URL(request.url);

      const query = (searchParams.get("query") ?? "").toString().trim();
      const limit = clampLimit(Number(searchParams.get("limit") ?? "7"));
      const storeIdParam = (searchParams.get("storeId") ?? "").toString().trim();

      // live=1 => modo amplio real
      const liveRequested = (searchParams.get("live") ?? "") === "1";

      if (!query) {
        return createErrorResponse({ status: 400, errorMessage: "Missing 'query' parameter" });
      }

      const origin = request.nextUrl.origin;

      const assistantPlan = await fetchAssistantPlan(origin, query);
      const normalizedQuery =
        (assistantPlan?.query_plan?.normalized_query || query).trim() || query;

      const baseRanking = normalizeRankingRules(assistantPlan?.ranking_rules);
      const ranking = applyWideMode(baseRanking, liveRequested);

      const selectedStores = storeIdParam
        ? STORES.filter((s) => s.storeId === storeIdParam)
        : STORES;

      const errors: Array<{ storeId?: string; message: string }> = [];

      // Step 1: Search all stores IN PARALLEL — major performance improvement
      const storeResults = await Promise.all(
        selectedStores.map(async (store) => {
          const primarySite = store.sites[0] || store.storeId;

          const finalQuery = assistantPlan
            ? buildFinalQuery({
                normalized: assistantPlan.query_plan.normalized_query || normalizedQuery,
                must: assistantPlan.query_plan.must_include || [],
                should: assistantPlan.query_plan.should_include || [],
                exclude: assistantPlan.query_plan.exclude || [],
                ranking,
                primarySite,
                siteOverrides: assistantPlan.query_plan.site_overrides || [],
              })
            : `${normalizedQuery} construccion ferreteria`;

          try {
            const merged = await searchStoreAcrossSites({
              finalQuery,
              sites: store.sites,
              limit,
              wide: liveRequested,
              storeId: store.storeId,
              rawQuery: query,
            });

            const ranked = postFilterAndRank({
              primarySite,
              items: merged,
              plan: assistantPlan,
              ranking,
              limit: 10,
              rawQuery: query,
            });

            return {
              result: {
                storeId: store.storeId,
                storeName: store.storeName,
                site: primarySite,
                finalQuery,
                items: ranked,
              } as StoreResult,
              error: null,
            };
          } catch (e: any) {
            return {
              result: {
                storeId: store.storeId,
                storeName: store.storeName,
                site: primarySite,
                finalQuery,
                items: [],
              } as StoreResult,
              error: typeof e?.message === "string" ? e.message : "Store search failed",
            };
          }
        })
      );

      const stores: StoreResult[] = storeResults.map((r) => {
        if (r.error) errors.push({ storeId: r.result.storeId, message: r.error });
        return r.result;
      });

      // Step 2: Relevance filtering
      // Strategy:
      //   - If Gemini is available (plan didn't fail): try AI filter → fallback to static
      //   - If Gemini is unavailable (plan already failed with 429): go straight to static filter
      const geminiAvailable = assistantPlan !== null; // If plan fetch succeeded, Gemini is likely working

      // Collect all items for filtering
      const allItemsForFilter: Array<{ title: string; link: string; snippet: string; storeIdx: number; itemIdx: number }> = [];
      for (let si = 0; si < stores.length; si++) {
        for (let ii = 0; ii < stores[si].items.length; ii++) {
          const it = stores[si].items[ii];
          allItemsForFilter.push({
            title: it.title,
            link: it.link,
            snippet: it.snippet,
            storeIdx: si,
            itemIdx: ii,
          });
        }
      }

      if (allItemsForFilter.length > 0) {
        let aiFilterSucceeded = false;

        // Try AI filter ONLY if Gemini seems available
        if (geminiAvailable) {
          try {
            const validIndices = await aiFilterResults(query, allItemsForFilter);
            if (validIndices && validIndices instanceof Set && validIndices.size > 0) {
              // Sanity check: if AI kept very few results, it was probably too aggressive
              // Fall back to static filter which is more permissive with related products
              const minExpected = Math.min(limit, Math.ceil(allItemsForFilter.length * 0.25));
              if (validIndices.size < minExpected) {
                console.warn(`[ai-filter] Too aggressive (${validIndices.size}/${allItemsForFilter.length}, need at least ${minExpected}), falling back to static`);
              } else {
                // AI filter worked — rebuild store items
                for (let si = 0; si < stores.length; si++) {
                  stores[si].items = stores[si].items.filter((_, ii) => {
                    const globalIdx = allItemsForFilter.findIndex(
                      (a) => a.storeIdx === si && a.itemIdx === ii
                    );
                    return validIndices.has(globalIdx);
                  }).slice(0, limit);
                }
                aiFilterSucceeded = true;
              }
            }
          } catch (err: any) {
            console.warn("[ai-filter] AI filter error:", err?.message);
          }
        } else {
          console.log("[filter] Skipping AI filter — Gemini unavailable (plan failed)");
        }

        // If AI filter didn't work, apply static relevance filter
        if (!aiFilterSucceeded) {
          console.log("[filter] Applying static relevance filter for query:", query);
          for (let si = 0; si < stores.length; si++) {
            const beforeCount = stores[si].items.length;
            stores[si].items = stores[si].items.filter((it) => {
              return staticRelevanceFilter(query, it.title, it.snippet);
            }).slice(0, limit);
            if (stores[si].items.length < beforeCount) {
              console.log(`[filter] ${stores[si].storeName}: ${beforeCount} → ${stores[si].items.length} items`);
            }
          }
        }
      }

      return createSuccessResponse({
        mode: "google_cse",
        query,
        normalizedQuery,
        limit,
        liveRequested,
        fetchedAt: new Date().toISOString(),
        stores,
        errors,
        assistantPlan: assistantPlan ?? null,
      });
    } catch (e: any) {
      return createErrorResponse({
        status: 500,
        errorMessage: typeof e?.message === "string" ? e.message : "prices/search failed",
      });
    }
  },
  false
);
