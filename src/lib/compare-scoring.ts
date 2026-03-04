/**
 * Lógica de scoring y filtrado para el comparador de precios.
 * Extraída de compare/page.tsx para mantener el componente limpio.
 */

export type GoogleItem = {
  title: string;
  link: string;
  snippet: string;
  displayLink: string;
  image?: string | null;
  favicon?: string | null;
};

export type StoreBlock = {
  storeId: string;
  storeName: string;
  site: string;
  items: GoogleItem[];
};

export function normalizeTitle(t: string) {
  return (t || "").replace(/\s+/g, " ").trim();
}

export function domainFromUrl(urlStr: string) {
  try {
    const u = new URL(urlStr);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function safeLower(s: string) {
  return (s || "").toLowerCase();
}

function stripAccents(input: string) {
  return (input || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

const STOPWORDS = new Set([
  "de", "la", "el", "los", "las", "un", "una", "para", "y", "o", "en",
  "con", "sin", "por", "a", "al", "del", "the", "and", "or", "mx",
  "mexico", "méxico", "precio", "oferta", "promocion", "promoción",
  "envio", "envío",
]);

const MEASURE_TOKENS = [
  "kg", "kilos", "kilogramos", "g", "gr", "gramos", "lb", "lbs", "libras",
  "cm", "mm", "m", "mts", "metro", "metros", "pulg", "pulgadas", "in", "inch",
  "pzas", "pza", "pieza", "piezas", "l", "lt", "litro", "litros",
];

/**
 * Dominios de tiendas permitidos. Solo estos pueden aparecer en resultados.
 * Cualquier otro dominio (Instagram, blogs, Wikipedia, etc.) se descarta.
 */
const ALLOWED_STORE_DOMAINS = [
  "mercadolibre.com.mx",
  "homedepot.com.mx",
  "amazon.com.mx",
];

function isAllowedStoreDomain(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return ALLOWED_STORE_DOMAINS.some(
      (d) => hostname === d || hostname.endsWith(`.${d}`)
    );
  } catch {
    return false;
  }
}

/**
 * Señales positivas de construcción/ferretería.
 * Si un resultado no contiene NINGUNA de estas, es probable que sea irrelevante.
 */
const CONSTRUCTION_SIGNALS = [
  "construccion", "construcci", "ferreteria", "ferreter", "albanil", "albañil",
  "hidratada", "hidratado", "portland", "mortero", "mezcla", "concreto", "cemento",
  "saco", "bulto", "costal", "herramienta", "material", "obra",
  "pintura", "impermeabilizante", "tuberia", "plomeria", "electricidad",
  "truper", "pretul", "surtek", "dewalt", "milwaukee", "bosch", "makita", "stanley",
  "cemex", "holcim", "comex", "sika", "calidra",
  "homedepot", "home depot", "ferretero",
  "kg", "kilos",
];

const ULTRA_AMBIGUOUS_TERMS = [
  "cal", "base", "malla", "block", "caja", "llave", "cable",
  "cinta", "tubo", "pala", "rollo", "tapa", "placa",
];

function hasConstructionContext(title: string, snippet: string): boolean {
  const text = stripAccents(safeLower(`${title} ${snippet}`));
  return CONSTRUCTION_SIGNALS.some((sig) => text.includes(sig));
}

function looksLikeCategoryOrSearchPage(url: string, title: string) {
  const u = safeLower(url);
  const t = safeLower(title);

  if (u.includes("/b/") || u.includes("/search") || u.includes("s?k=") || u.includes("site-search")) return true;

  const genericSignals = [" - amazon", " - amazon.com", "amazon.com.mx", "home depot", "materiales", "categoría", "category", "búsqueda", "search"];
  const hasGeneric = genericSignals.some((g) => t.includes(g));

  if (hasGeneric && t.split(" ").length <= 4) return true;

  return false;
}

export function extractQueryTokens(rawQuery: string) {
  const q = stripAccents(safeLower(rawQuery)).replace(/[^\p{L}\p{N}\s.-]+/gu, " ");
  const parts = q.split(/\s+/).map((p) => p.trim()).filter(Boolean);

  const tokens: string[] = [];

  for (const p of parts) {
    const token = p.replace(/^[.-]+|[.-]+$/g, "");
    if (!token) continue;
    if (/^\d+(\.\d+)?$/.test(token)) continue;
    if (STOPWORDS.has(token)) continue;

    const tokenNoDigits = token.replace(/\d+/g, "");
    if (MEASURE_TOKENS.includes(tokenNoDigits)) continue;
    if (MEASURE_TOKENS.includes(token)) continue;

    let isMeasure = false;
    for (const mt of MEASURE_TOKENS) {
      if (token.endsWith(mt) && /^\d+/.test(token)) {
        isMeasure = true;
        break;
      }
    }
    if (isMeasure) continue;

    tokens.push(token);
  }

  return Array.from(new Set(tokens)).filter((t) => t.length >= 3);
}

function scoreItem(item: GoogleItem, tokens: string[], rawQuery: string) {
  const title = stripAccents(safeLower(item.title || ""));
  const snippet = stripAccents(safeLower(item.snippet || ""));
  const url = safeLower(item.link || "");

  let score = 0;
  let matched = 0;

  for (const tok of tokens) {
    const inTitle = title.includes(tok);
    const inSnippet = snippet.includes(tok);
    if (inTitle) score += 10;
    if (inSnippet) score += 4;
    if (inTitle || inSnippet) matched += 1;
  }

  const coverage = tokens.length ? matched / tokens.length : 0;
  if (coverage >= 1) score += 12;
  else if (coverage >= 0.75) score += 8;
  else if (coverage >= 0.5) score += 3;

  if (looksLikeCategoryOrSearchPage(url, item.title || "")) score -= 10;

  const rq = stripAccents(safeLower(rawQuery));
  if (rq.includes("cemento")) {
    const badSignals = ["mancuerna", "pesas", "gym", "gimnasio", "fitness", "set de pesas"];
    if (badSignals.some((b) => title.includes(b) || snippet.includes(b))) score -= 25;
  }

  // Heavy machinery / industrial equipment penalty
  // Users want hand tools and ferretería products, NOT heavy machinery
  const heavySignals = [
    "excavadora", "retroexcavadora", "demolicion", "hidraulico industrial",
    "maquinaria pesada", "bulldozer", "montacargas", "grua industrial",
    "rompedor hidraulico", "martillo hidraulico", "para excavadora",
    "pala mecanica", "miniexcavadora", "minicargador", "cargador frontal",
    "trascabo", "aplanadora",
  ];
  const combined = `${title} ${snippet}`;
  if (heavySignals.some((sig) => combined.includes(stripAccents(sig)))) score -= 40;

  // Construction context validation for ultra-ambiguous terms
  const rqTerms = stripAccents(safeLower(rawQuery)).split(/\s+/).filter(Boolean);
  const isAmbiguous = rqTerms.some((t) => ULTRA_AMBIGUOUS_TERMS.includes(t));
  if (isAmbiguous && !hasConstructionContext(item.title || "", item.snippet || "")) {
    score -= 60;
  }

  const host = domainFromUrl(item.link || "");
  if (host && (item.displayLink || "").includes(host)) score += 1;

  return score;
}

function passesHardFilter(item: GoogleItem, tokens: string[]) {
  if (!tokens.length) return true;

  const title = stripAccents(safeLower(item.title || ""));
  const snippet = stripAccents(safeLower(item.snippet || ""));

  const matches = tokens.filter((t) => title.includes(t) || snippet.includes(t));
  const coverage = matches.length / tokens.length;

  if (tokens.length <= 2) return matches.length >= 1;
  return coverage >= 0.5;
}

/**
 * Rankea y filtra los items de cada tienda según los tokens del query.
 */
export function rankStoreItems(
  stores: StoreBlock[],
  queryTokens: string[],
  query: string,
  limit: number
): StoreBlock[] {
  return stores.map((s) => {
    // First: hard domain filter — only keep results from allowed stores
    const domainFiltered = (Array.isArray(s.items) ? s.items : []).filter(
      (it) => isAllowedStoreDomain(it.link || "")
    );

    const scored = domainFiltered
      .map((it) => ({
        it,
        score: scoreItem(it, queryTokens, query),
        hardOk: passesHardFilter(it, queryTokens),
      }))
      .filter((x) => x.hardOk)
      .sort((a, b) => b.score - a.score)
      .map((x) => x.it);

    if (scored.length < Math.min(3, limit)) {
      const soft = domainFiltered
        .map((it) => ({ it, score: scoreItem(it, queryTokens, query) }))
        .sort((a, b) => b.score - a.score)
        .map((x) => x.it);

      const out: GoogleItem[] = [];
      const seen = new Set<string>();

      for (const it of scored) {
        const k = it.link || it.title;
        if (!k || seen.has(k)) continue;
        out.push(it);
        seen.add(k);
      }
      for (const it of soft) {
        if (out.length >= limit) break;
        const k = it.link || it.title;
        if (!k || seen.has(k)) continue;
        out.push(it);
        seen.add(k);
      }

      return { ...s, items: out.slice(0, limit) };
    }

    return { ...s, items: scored.slice(0, limit) };
  });
}
