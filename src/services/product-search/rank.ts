import type { EvidenceProduct } from "./normalize";

// Diccionario de sinónimos para materiales de construcción en español
const SYNONYMS: Record<string, string[]> = {
  cemento: ["concreto", "hormigón", "cementante"],
  concreto: ["cemento", "hormigón", "cementante"],
  hormigón: ["cemento", "concreto"],
  varilla: ["varilla corrugada", "acero de refuerzo", "fierro"],
  tubería: ["tubo", "caño", "tubos"],
  tubo: ["tubería", "caño", "tuberías"],
  lámina: ["hoja", "placa", "láminas"],
  pintura: ["recubrimiento", "esmalte", "barniz"],
  taladro: ["rotomartillo", "perforadora", "drill"],
  rotomartillo: ["taladro", "perforadora", "martillo perforador"],
  tornillo: ["tornillos", "perno", "tirafondo"],
  taquete: ["ancla", "anclaje", "taquetes"],
  sellador: ["sellante", "silicón", "silicona"],
  pegamento: ["adhesivo", "cola", "pegafix"],
  impermeabilizante: ["impermeabilizante acrílico", "membrana", "sellador de techo"],
  mortero: ["mezcla", "repello", "cementante"],
  block: ["bloque", "tabicón", "tabique"],
  tabique: ["ladrillo", "block", "bloque"],
  arena: ["arena sílica", "gravilla"],
  grava: ["gravilla", "piedra triturada"],
  cal: ["cal hidratada", "cal viva", "calidra", "hidróxido de calcio"],
  malla: ["malla electrosoldada", "malla de acero", "armex"],
  cable: ["cable eléctrico", "cable thw", "cable calibre"],
  llave: ["llave española", "llave allen", "llave stilson", "llave perica"],
};

// Patrones que indican contenido informativo (no producto)
const BLOG_PATTERNS = [
  /\bcómo\s+(hacer|elegir|seleccionar|instalar|usar)/i,
  /\b(guía|tutorial|consejos|tips)\b/i,
  /\b(blog|artículo|noticias|nota)\b/i,
  /\bqué\s+es\b/i,
  /\bwikipedia\b/i,
  /\byoutube\.com\b/i,
];

// Patrones que indican un precio en el texto
const PRICE_PATTERN = /\$\s?\d[\d,.]*/;

// Marcas conocidas de materiales/herramientas
const KNOWN_BRANDS = [
  "cemex", "holcim", "comex", "berel", "sika", "truper", "pretul",
  "dewalt", "milwaukee", "bosch", "makita", "stanley", "surtek",
  "irwin", "knipex", "ridgid", "black\\+decker", "dremel",
  "petróleos", "henkel", "3m", "gorilla", "loctite",
];
const brandsRegex = new RegExp(`\\b(${KNOWN_BRANDS.join("|")})\\b`, "i");

function expandWithSynonyms(words: string[]): string[] {
  const expanded = new Set(words);
  for (const w of words) {
    const syns = SYNONYMS[w.toLowerCase()];
    if (syns) {
      for (const s of syns) {
        expanded.add(s.toLowerCase());
      }
    }
  }
  return Array.from(expanded);
}

// Non-construction terms that indicate irrelevant results
const NON_CONSTRUCTION_TERMS = [
  /\bpadel\b/i, /\btenis\b/i, /\bfutbol\b/i, /\bdeporte\b/i,
  /\bgym\b/i, /\bfitness\b/i, /\bjuguete\b/i, /\bcocina\b/i,
  /\bropa\b/i, /\bmoda\b/i, /\bbelleza\b/i, /\bmaquillaje\b/i,
  /\bmascotas?\b/i, /\bjardin(eria|ería)?\b/i,
];

/** Dominios de tiendas permitidos — todo lo demás se descarta. */
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

function scoreOne(p: EvidenceProduct, query: string) {
  const queryWords = query.toLowerCase().split(/\s+/g).filter(Boolean);
  // Remove context words from scoring to focus on actual product terms
  const productWords = queryWords.filter(
    (w) => !["construccion", "ferreteria", "herramienta", "material"].includes(w)
  );
  const expandedWords = expandWithSynonyms(productWords.length > 0 ? productWords : queryWords);

  const t = (p.title || "").toLowerCase();
  const s = (p.snippet || "").toLowerCase();
  const u = (p.url || "").toLowerCase();
  let score = 0;

  // Full query match in title (using product words, not context words)
  const productQuery = productWords.join(" ");
  if (productQuery && t.includes(productQuery)) score += 8;

  // Word-by-word matches
  let titleHits = 0;
  for (const w of expandedWords) {
    if (t.includes(w)) {
      score += 3;
      titleHits++;
    }
    if (s.includes(w)) score += 1;
  }

  // Coverage bonus: percentage of query words matched
  const coverage = titleHits / Math.max(productWords.length || 1, 1);
  if (coverage >= 0.8) score += 6;
  else if (coverage >= 0.5) score += 3;

  // Price visible in snippet (likely product page)
  if (PRICE_PATTERN.test(s) || PRICE_PATTERN.test(t)) score += 4;

  // Known brand bonus
  if (brandsRegex.test(t) || brandsRegex.test(s)) score += 2;

  // Blog/informational penalty
  for (const pat of BLOG_PATTERNS) {
    if (pat.test(t) || pat.test(s)) {
      score -= 5;
      break;
    }
  }

  // Non-construction product penalty
  const combined = `${t} ${s}`;
  for (const pat of NON_CONSTRUCTION_TERMS) {
    if (pat.test(combined)) {
      score -= 15;
      break;
    }
  }

  // ── Heavy machinery / industrial equipment penalty ──
  const heavySignals = [
    "excavadora", "retroexcavadora", "demolicion", "hidraulico industrial",
    "maquinaria pesada", "bulldozer", "montacargas", "grua industrial",
    "rompedor hidraulico", "martillo hidraulico", "para excavadora",
    "pala mecanica", "miniexcavadora", "minicargador", "cargador frontal",
    "trascabo", "aplanadora",
  ];
  if (heavySignals.some((sig) => combined.includes(sig))) {
    score -= 40;
  }

  // ── URL-based scoring (much stronger now) ──

  // LISTING / SEARCH PAGE PENALTIES (heavy)
  // MercadoLibre listing pages
  if (u.includes("listado.mercadolibre")) score -= 20;
  // Generic search/category URL patterns
  if (/\/(category|search|buscar|resultados|tag|c\/)\b/i.test(u)) score -= 15;
  // Amazon search pages
  if (u.includes("/s?") || u.includes("s?k=")) score -= 15;
  // Generic listing indicators in URL
  if (u.includes("/listing") || u.includes("/lista")) score -= 10;

  // PRODUCT PAGE BOOSTS (strong)
  // MercadoLibre product pages (articulo.mercadolibre or /MLM-\d+)
  if (/\/mlm-\d+/i.test(u)) score += 15;
  if (u.includes("articulo.mercadolibre")) score += 10;
  // Amazon product pages
  if (u.includes("/dp/") || u.includes("/gp/product/")) score += 12;
  // Home Depot product pages
  if (/homedepot\.com\.mx.*\/p\//.test(u) || /homedepot\.com\.mx.*\/\d{6,}/.test(u)) score += 12;
  // Generic product URL patterns
  if (/\/(product|producto|item)\b/i.test(u)) score += 5;

  return score;
}

/**
 * Ranks products by relevance and filters out listing/search pages.
 * Products with very low scores (non-construction or listing pages) are removed.
 */
export function rankEvidence(products: EvidenceProduct[], query: string): EvidenceProduct[] {
  // Hard domain filter — only keep results from approved stores
  const domainOk = products.filter((p) => isAllowedStoreDomain(p.url || ""));

  const scored = domainOk.map((p) => ({ product: p, score: scoreOne(p, query) }));

  // Filter out items with very negative scores (clearly irrelevant)
  const filtered = scored.filter(({ score }) => score > -10);

  // Sort by score descending
  filtered.sort((a, b) => b.score - a.score);

  return filtered.map(({ product }) => product);
}
