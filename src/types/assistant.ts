export type AssistantOutputV1 = {
  version: "assist.v1";

  input: {
    raw_query: string;
    locale: "es-MX";
  };

  intent: {
    domain: "construction" | "home_improvement" | "general_shopping" | "unknown";
    product_type: string;            // ej. "cemento", "varilla", "impermeabilizante"
    use_case?: string;               // ej. "losa", "muros", "reparación grietas"
    confidence: number;              // 0..1
  };

  guidance: {
    headline: string;                // 1 línea (máx 80 chars)
    explanation: string;             // 1-3 líneas (máx 280 chars)
    do: string[];                    // bullets cortos
    avoid: string[];                 // bullets cortos
  };

  query_plan: {
    normalized_query: string;        // query mejorada para búsqueda
    must_include: string[];          // keywords obligatorias
    should_include: string[];        // keywords opcionales
    exclude: string[];               // keywords a excluir (anti-ruido)
    site_overrides?: Array<{
      storeId: string;               // "amazon" | "home_depot" | etc.
      query: string;                 // query específica por tienda
      note?: string;
    }>;
  };

  ranking_rules: {
    prefer_product_pages: boolean;   // true
    demote_search_pages: boolean;    // true
    demote_category_pages: boolean;  // true (opcional, depende)
    allow_blog_results: boolean;     // false por defecto
  };

  ui: {
    chips: Array<{
      label: string;                 // ej. "50 kg", "Portland", "gris"
      add_to_query: string;          // ej. "50 kg"
      type: "refine" | "exclude";
    }>;
  };

  safety: {
    policy: "ok";
    notes?: string[];
  };
};
