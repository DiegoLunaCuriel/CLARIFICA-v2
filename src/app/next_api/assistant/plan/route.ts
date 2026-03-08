// src/app/next_api/assistant/plan/route.ts
import { requestMiddleware } from "@/lib/api-utils";
import { createErrorResponse, createSuccessResponse } from "@/lib/create-response";
import { ASSISTANT_PLAN_PROMPT } from "@/lib/ai/prompts/assistant-plan";
import { geminiGenerateJson } from "@/lib/ai/gemini-json";

export type AssistantOutputV1 = {
  version: "assist.v1";
  input: { raw_query: string; locale: "es-MX" };
  intent: {
    domain: string;
    product_type: string;
    use_case: string;
    confidence: number; // 0..1
  };
  guidance: {
    headline: string; // <= 80
    explanation: string; // <= 280
    do: string[];
    avoid: string[];
  };
  query_plan: {
    normalized_query: string;
    must_include: string[];
    should_include: string[];
    exclude: string[];
    site_overrides: Array<{
      site: string;
      must_include: string[];
      exclude: string[];
    }>;
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

function clamp01(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function ensureStringArray(v: any): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((x) => (typeof x === "string" ? x.trim() : ""))
    .filter(Boolean);
}

function sanitize(out: any, rawQuery: string): AssistantOutputV1 {
  const version: "assist.v1" = "assist.v1";

  const input = {
    raw_query: rawQuery,
    locale: "es-MX" as const,
  };

  const intent = {
    domain: typeof out?.intent?.domain === "string" ? out.intent.domain : "",
    product_type: typeof out?.intent?.product_type === "string" ? out.intent.product_type : "",
    use_case: typeof out?.intent?.use_case === "string" ? out.intent.use_case : "",
    confidence: clamp01(Number(out?.intent?.confidence)),
  };

  const guidanceHeadline = typeof out?.guidance?.headline === "string" ? out.guidance.headline : "";
  const guidanceExplanation =
    typeof out?.guidance?.explanation === "string" ? out.guidance.explanation : "";

  const guidance = {
    headline: guidanceHeadline.slice(0, 80),
    explanation: guidanceExplanation.slice(0, 280),
    do: ensureStringArray(out?.guidance?.do),
    avoid: ensureStringArray(out?.guidance?.avoid),
  };

  const site_overrides_raw = Array.isArray(out?.query_plan?.site_overrides)
    ? out.query_plan.site_overrides
    : [];

  const site_overrides = site_overrides_raw
    .map((s: any) => ({
      site: typeof s?.site === "string" ? s.site.trim() : "",
      must_include: ensureStringArray(s?.must_include),
      exclude: ensureStringArray(s?.exclude),
    }))
    .filter((s: any) => s.site);

  const query_plan = {
    normalized_query:
      typeof out?.query_plan?.normalized_query === "string"
        ? out.query_plan.normalized_query
        : "",
    must_include: ensureStringArray(out?.query_plan?.must_include),
    should_include: ensureStringArray(out?.query_plan?.should_include),
    exclude: ensureStringArray(out?.query_plan?.exclude),
    site_overrides,
  };

  const ranking_rules = {
    prefer_product_pages: Boolean(out?.ranking_rules?.prefer_product_pages),
    demote_search_pages: Boolean(out?.ranking_rules?.demote_search_pages),
    demote_category_pages: Boolean(out?.ranking_rules?.demote_category_pages),
    allow_blog_results: Boolean(out?.ranking_rules?.allow_blog_results),
  };

  const ui = { chips: ensureStringArray(out?.ui?.chips) };

  const safety = {
    policy: "ok" as const,
    notes: ensureStringArray(out?.safety?.notes),
  };

  return {
    version,
    input,
    intent,
    guidance,
    query_plan,
    ranking_rules,
    ui,
    safety,
  };
}

/**
 * Mapa de términos ambiguos / cortos que necesitan expansión en contexto de construcción.
 * Clave: término (lowercase). Valor: cómo expandirlo para buscar correctamente.
 */
const AMBIGUOUS_TERM_MAP: Record<string, {
  normalized: string;           // Query expandida para CSE
  must_include: string[];       // Términos que DEBEN aparecer
  should_include: string[];     // Sinónimos / términos relacionados
  exclude: string[];            // Términos a excluir (desambiguación)
  chips: string[];              // Sugerencias UI
}> = {
  cal: {
    normalized: "cal hidratada construccion",
    must_include: [],
    should_include: ["cal hidratada", "cal viva", "calidra", "albañileria", "construccion", "saco"],
    exclude: [],
    chips: ["Hidratada", "Cal viva", "Saco 25kg", "Para aplanado"],
  },
  malla: {
    normalized: "malla electrosoldada",
    must_include: [],
    should_include: ["electrosoldada", "6x6", "acero", "construccion", "castillo", "refuerzo"],
    exclude: [],
    chips: ["Electrosoldada 6x6", "Para castillo", "Galvanizada"],
  },
  base: {
    normalized: "base triturada construccion",
    must_include: [],
    should_include: ["triturada", "grava", "compactacion", "cimentacion", "relleno", "material"],
    exclude: [],
    chips: ["Triturada", "Para compactación", "Grava"],
  },
  cable: {
    normalized: "cable electrico thw",
    must_include: [],
    should_include: ["electrico", "calibre", "thw", "cobre", "condumex", "instalacion"],
    exclude: [],
    chips: ["Calibre 12", "Calibre 14", "THW", "Duplex"],
  },
  caja: {
    normalized: "caja electrica chalupa",
    must_include: [],
    should_include: ["chalupa", "registro", "electrica", "cuadrada", "octagonal", "sobreponer"],
    exclude: [],
    chips: ["Chalupa", "Cuadrada", "Octagonal", "De registro"],
  },
  llave: {
    normalized: "llave herramienta ferreteria",
    must_include: [],
    should_include: ["española", "allen", "stilson", "perica", "mixta", "juego de llaves"],
    exclude: [],
    chips: ["Española", "Allen", "Stilson", "Perica"],
  },
  block: {
    normalized: "block concreto tabicon",
    must_include: [],
    should_include: ["concreto", "cemento", "tabicon", "muro", "construccion", "15x20x40"],
    exclude: [],
    chips: ["15x20x40", "Ligero", "Pesado"],
  },
};

function makeFallbackPlan(rawQuery: string): AssistantOutputV1 {
  const q = rawQuery.trim();
  const qLower = q.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // Check if the query matches an ambiguous term that needs special handling
  const ambiguousMatch = Object.entries(AMBIGUOUS_TERM_MAP).find(
    ([term]) => qLower === term || qLower.startsWith(term + " ") || qLower.endsWith(" " + term)
  );

  // This is a construction/ferretería platform — ALL fallbacks are construction-focused
  const domain = "construccion";
  const product_type = q;

  // Exclude universal non-construction terms
  const exclude = [
    "preguntas",
    "questions",
    "/ask/",
    "\"/s?\"",
    "\"s?k=\"",
    "manual de usuario",
    "pdf",
    "wikipedia",
    "definición",
    "qué es",
    "deporte",
    "juguete",
    "mueble",
    "decoracion",
    "cocina",
    "ropa",
    "moda",
    // Maquinaria pesada / industrial — siempre excluir
    "excavadora",
    "retroexcavadora",
    "maquinaria pesada",
    "demolicion",
    "refacciones",
    "para excavadora",
    "repuesto maquinaria",
    "bulldozer",
    "montacargas",
    "grua",
  ];

  // Product-specific excludes for ambiguous terms
  if (qLower.includes("pala")) {
    exclude.push("padel", "tenis", "ping pong", "juego", "retroexcavadora", "mecanica");
  }
  if (qLower.includes("cemento")) {
    exclude.push("urban", "mesa", "silla", "maceta", "base de cemento");
  }
  if (qLower.includes("cinta")) {
    exclude.push("cassette", "pelicula", "VHS", "musica", "video");
  }
  if (qLower.includes("tubo")) {
    exclude.push("ensayo", "laboratorio", "youtube");
  }
  if (qLower.includes("martillo")) {
    exclude.push("hidraulico", "demolicion", "para excavadora", "rompedor", "maquinaria");
  }
  if (qLower.includes("sierra")) {
    exclude.push("aserradero", "forestal", "industrial");
  }
  if (qLower.includes("compactador") || qLower.includes("rodillo")) {
    exclude.push("vial", "asfaltadora", "maquinaria pesada");
  }

  // If we have an ambiguous term match, use its specialized config
  if (ambiguousMatch) {
    const [, config] = ambiguousMatch;
    exclude.push(...config.exclude);

    return {
      version: "assist.v1",
      input: { raw_query: q, locale: "es-MX" },
      intent: {
        domain,
        product_type,
        use_case: "construccion",
        confidence: 0.7,
      },
      guidance: {
        headline: "Buscando en tiendas de construcción",
        explanation: "Término expandido para encontrar el producto correcto de construcción y ferretería.",
        do: ["Especifica medida, presentación o tipo si aplica."],
        avoid: ["Usar términos demasiado genéricos."],
      },
      query_plan: {
        normalized_query: config.normalized,
        must_include: config.must_include,
        should_include: [...config.should_include, "herramienta", "material", "construccion"],
        exclude,
        site_overrides: [],
      },
      ranking_rules: {
        prefer_product_pages: true,
        demote_search_pages: true,
        demote_category_pages: true,
        allow_blog_results: false,
      },
      ui: { chips: config.chips },
      safety: { policy: "ok", notes: ["ambiguous term expansion applied"] },
    };
  }

  // Construction-contextual normalized query — specialize for hand tools
  const isHandTool = ["martillo", "pala", "sierra", "taladro", "desarmador",
    "pinza", "llave", "nivel", "cuchara", "llana", "flexometro", "segueta"].some(
    (t) => qLower.includes(t)
  );
  const normalizedQuery = isHandTool
    ? `${q} herramienta manual ferreteria`
    : `${q} construccion ferreteria`;

  // Construction-related should_include
  const should_include = isHandTool
    ? ["herramienta", "ferreteria", "manual"]
    : ["herramienta", "material", "construccion"];

  // Product-specific chips
  let chips: string[] = [];
  if (qLower.includes("cemento")) chips = ["Saco 50kg", "Portland gris", "Cemento blanco", "Mortero"];
  else if (qLower.includes("pala")) chips = ["Cuadrada", "Redonda punta", "Cuchara albañil"];
  else if (qLower.includes("pintura")) chips = ["Vinílica", "Esmalte", "Impermeabilizante"];
  else if (qLower.includes("taladro")) chips = ["Inalámbrico", "Rotomartillo", "Percutor"];

  return {
    version: "assist.v1",
    input: { raw_query: q, locale: "es-MX" },
    intent: {
      domain,
      product_type,
      use_case: "construccion",
      confidence: 0.65,
    },
    guidance: {
      headline: "Buscando en tiendas de construcción",
      explanation: "Filtros aplicados para priorizar productos de construcción y ferretería en tiendas mexicanas.",
      do: ["Especifica medida, modelo o presentación (kg, ml, pulgadas) si aplica."],
      avoid: ["Usar términos demasiado genéricos si buscas un SKU específico."],
    },
    query_plan: {
      normalized_query: normalizedQuery,
      must_include: [q],
      should_include,
      exclude,
      site_overrides: [],
    },
    ranking_rules: {
      prefer_product_pages: true,
      demote_search_pages: true,
      demote_category_pages: true,
      allow_blog_results: false,
    },
    ui: { chips },
    safety: { policy: "ok", notes: ["fallback plan with construction context"] },
  };
}

// Non-construction domains that indicate the plan is off-topic
const NON_CONSTRUCTION_DOMAINS = [
  "deporte", "fitness", "moda", "ropa", "cocina", "gastronomia",
  "juguete", "electrónica", "musica", "entretenimiento", "belleza",
  "salud", "medicina", "educacion", "oficina", "papeleria",
];

function isPlanMismatch(rawQuery: string, plan: AssistantOutputV1): boolean {
  const domain = (plan.intent.domain || "").toLowerCase();
  const ptype = (plan.intent.product_type || "").toLowerCase();
  const normalized = (plan.query_plan.normalized_query || "").toLowerCase();

  // If product_type is empty but query exists, it's suspicious
  if (!ptype.trim() && rawQuery.trim()) return true;

  // If domain is clearly non-construction, it's a mismatch
  for (const bad of NON_CONSTRUCTION_DOMAINS) {
    if (domain.includes(bad)) return true;
  }

  // If the normalized query contains non-construction terms and no construction terms
  const hasConstructionContext =
    normalized.includes("construc") ||
    normalized.includes("ferreter") ||
    normalized.includes("herramient") ||
    normalized.includes("material") ||
    normalized.includes("plomer") ||
    normalized.includes("electric") ||
    normalized.includes("pintura") ||
    domain.includes("construc") ||
    domain.includes("ferreter") ||
    domain.includes("herramient") ||
    domain.includes("material") ||
    domain.includes("plomer");

  // If no construction context at all, force fallback
  if (!hasConstructionContext) return true;

  return false;
}

export const GET = requestMiddleware(
  async (request) => {
    try {
      const sp = request.nextUrl.searchParams;
      const q = (sp.get("query") ?? sp.get("q") ?? "").toString().trim();

      if (!q) {
        return createErrorResponse({ status: 400, errorMessage: "Missing 'query' parameter" });
      }

      const prompt = ASSISTANT_PLAN_PROMPT.replace("{{QUERY}}", q);

      let raw: any;
      try {
        raw = await geminiGenerateJson<any>(prompt, { temperature: 0.2 });
      } catch {
        raw = null;
      }

      let output = raw ? sanitize(raw, q) : makeFallbackPlan(q);

      // Si el plan "alucina", usamos fallback determinístico
      if (isPlanMismatch(q, output)) {
        output = makeFallbackPlan(q);
        output.safety.notes = ["Gemini intent mismatch; fallback aplicado"];
      }

      // Normalized query nunca vacío
      if (!output.query_plan.normalized_query) {
        output.query_plan.normalized_query = q;
      }

      return createSuccessResponse(output);
    } catch (e: any) {
      return createErrorResponse({
        status: 500,
        errorMessage: typeof e?.message === "string" ? e.message : "Assistant plan failed",
      });
    }
  },
  false
);
