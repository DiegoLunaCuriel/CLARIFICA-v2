import { NextResponse } from "next/server";
import { googleCseSearch } from "@/lib/search/google-cse";
import { normalizeCseItems } from "@/services/product-search/normalize";
import { rankEvidence } from "@/services/product-search/rank";
import { geminiGenerateJson } from "@/lib/ai/gemini-json";
import {
  generateQuestions,
  buildSearchQuery,
  buildFallbackQuery,
} from "@/lib/decision-engine-v2/analyze";

/* ──────────────────────────────────────────────────────────
   POST /next_api/decision

   STEP 1  (action = "questions")
     → Gemini generates smart questions
   STEP 2  (action = "search")
     → CSE search → filter listings → verify URLs → Gemini analysis
   ────────────────────────────────────────────────────────── */

const MX_STORES = [
  "mercadolibre.com.mx",
  "amazon.com.mx",
  "homedepot.com.mx",
];

/** Verifica que la URL pertenezca a una tienda permitida. */
function isAllowedStoreDomain(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return MX_STORES.some(
      (d) => hostname === d || hostname.endsWith(`.${d}`)
    );
  } catch {
    return false;
  }
}

/* ── URL classification ── */

function isDefinitelyListing(url: string, title: string): boolean {
  const u = (url || "").toLowerCase();
  const t = (title || "").toLowerCase();

  // URL patterns that are 100% search/listing pages
  if (u.includes("listado.mercadolibre")) return true;
  if (/homedepot\.com\.mx\/s\//.test(u)) return true;
  if (/amazon\.com\.mx\/s[?/]/.test(u)) return true;
  if (/amazon\.com\.mx\/s\?k=/.test(u)) return true;
  if (u.includes("/search?") || u.includes("/buscar?")) return true;
  if (u.includes("/b/") && u.includes("amazon")) return true;

  // MercadoLibre search: mercadolibre.com.mx/keyword (no /MLM-)
  if (
    /mercadolibre\.com\.mx\/[a-z0-9][\w-]*$/i.test(u) &&
    !/\/MLM-\d+/i.test(u) &&
    !u.includes("/p/")
  ) return true;

  // Title patterns that indicate search pages
  if (/^resultados?\s+(para|de|por)\b/i.test(t)) return true;
  if (/resultados\b.*home depot/i.test(t)) return true;

  return false;
}

/* ── Verify URL is active with HEAD request (fast, parallel) ── */

async function isUrlActive(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000); // 4s timeout

    const res = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Contrulink/1.0)",
      },
    });

    clearTimeout(timeout);

    // 200 = OK, 301/302 = redirect (still valid)
    // 404, 410 = dead page
    if (res.status === 404 || res.status === 410) return false;
    // Amazon sometimes returns 503 for bot detection but page works in browser
    // So only reject definitive 404/410
    return true;
  } catch {
    // Network error or timeout — assume it's OK (don't penalize slow sites)
    return true;
  }
}

async function filterActiveUrls<T extends { url: string }>(
  items: T[]
): Promise<T[]> {
  if (items.length === 0) return [];

  console.log(`[decision] Verifying ${items.length} URLs...`);

  const checks = await Promise.all(
    items.map(async (item) => {
      const active = await isUrlActive(item.url);
      if (!active) console.log(`[decision]   DEAD URL: ${item.url}`);
      return { item, active };
    })
  );

  const active = checks.filter(({ active }) => active).map(({ item }) => item);
  console.log(`[decision] Active URLs: ${active.length}/${items.length}`);
  return active;
}

/* ── Gemini analysis ── */

/* Gemini refers to products by INDEX (1-based), never by URL.
   This prevents Gemini from inventing/modifying URLs. */

type AnalyzedProduct = {
  index: number;       // 1-based reference to the product list
  why: string;
  pros: string[];
  cons: string[];
  relevance: number;
};

type GeminiAnalysis = {
  recommendation: string;
  products: AnalyzedProduct[];
  tip: string;
};

function buildAnalysisPrompt(
  query: string,
  answers: Record<string, string>,
  products: Array<{ title: string; url: string; snippet?: string; source?: string }>
): string {
  const answerLines = Object.entries(answers)
    .filter(([, v]) => v && v !== "any")
    .map(([k, v]) => `- ${k}: ${v.replace(/_/g, " ")}`)
    .join("\n");

  const productLines = products
    .map((p, i) => `${i + 1}. "${p.title}" — ${p.source || "?"}\n   ${p.snippet || ""}`)
    .join("\n");

  return `Eres un experto asesor de CONSTRUCCION y FERRETERIA en Mexico.
El usuario busca: "${query}"
${answerLines ? `\nSus preferencias:\n${answerLines}` : ""}

Estos son productos REALES encontrados en tiendas mexicanas. Tu tarea es analizarlos y recomendar los mejores para el usuario.

Productos encontrados:
${productLines}

Tu trabajo:
1. De los productos listados, identifica cuales son "${query}" o variantes del mismo (rotomartillo es un tipo de taladro, cemento gris y cemento blanco son tipos de cemento, etc.).
2. Prioriza los que coincidan con las preferencias del usuario, pero NO descartes variantes cercanas.
3. Analiza pros, contras de cada uno.
4. Selecciona los MEJORES 4 a 6 productos.
5. Da una recomendacion general y un consejo de compra.

REGLAS:
- DEBES devolver entre 4 y 6 productos en el array "products". NUNCA devuelvas solo 1 o 2.
- Solo devuelve products: [] si absolutamente NINGUNO es "${query}".
- Un "rotomartillo" SI es un "taladro". Un "taladro percutor" SI es un "taladro". NO los descartes.
- Refiere a cada producto por su NUMERO (index) — es el numero de la lista de arriba (1, 2, 3...)
- CADA producto DEBE tener TODOS estos campos: index, why, pros (array), cons (array), relevance (numero)
- relevance: 1-10 (10 = coincide perfecto, 7 = buen match, 4 = variante aceptable)

Devuelve JSON con EXACTAMENTE esta estructura:
{
  "recommendation": "Recomendacion general (max 200 chars)",
  "products": [
    { "index": 1, "why": "razon (max 100 chars)", "pros": ["ventaja 1", "ventaja 2"], "cons": ["desventaja 1"], "relevance": 8 },
    { "index": 2, "why": "razon", "pros": ["ventaja"], "cons": ["desventaja"], "relevance": 7 },
    { "index": 3, "why": "razon", "pros": ["ventaja"], "cons": ["desventaja"], "relevance": 6 },
    { "index": 4, "why": "razon", "pros": ["ventaja"], "cons": ["desventaja"], "relevance": 5 }
  ],
  "tip": "Consejo de compra (max 150 chars)"
}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const action = String(body?.action || "questions");
    const query = String(body?.query || "").trim();

    if (!query) {
      return NextResponse.json(
        { error: "query is required" },
        { status: 400 }
      );
    }

    // ═══════════════════════════════════════════════════════
    // STEP 1: Generate questions
    // ═══════════════════════════════════════════════════════
    if (action === "questions") {
      const result = await generateQuestions(query);

      if (result.questions.length === 0) {
        return NextResponse.json({
          action: "questions",
          productType: result.productType,
          questions: [],
          error:
            "No pudimos generar preguntas. Intenta ser mas especifico (ej: 'taladro inalambrico' en vez de solo 'taladro').",
        });
      }

      return NextResponse.json({
        action: "questions",
        productType: result.productType,
        questions: result.questions.map((q) => ({
          id: q.id,
          title: q.title,
          description: q.description,
          type: "single",
          options: q.options,
        })),
      });
    }

    // ═══════════════════════════════════════════════════════
    // STEP 2: Search + Verify + Gemini Analysis
    // ═══════════════════════════════════════════════════════
    if (action === "search") {
      const answers: Record<string, string> = body?.answers || {};
      const searchQuery = buildSearchQuery(query, answers);
      const fallbackQuery = buildFallbackQuery(query);
      console.log("[decision] enriched search query:", searchQuery);
      console.log("[decision] fallback query:", fallbackQuery);

      // 2a. Search in parallel across Mexican stores
      const searchAcrossStores = async (q: string) => {
        const storePromises = MX_STORES.map((site) =>
          googleCseSearch(q, { num: 10, siteSearch: site }).catch(
            (err) => {
              console.warn(`[decision] Search failed for ${site}:`, err?.message);
              return [];
            }
          )
        );
        return Promise.all(storePromises);
      };

      const storeResults = await searchAcrossStores(searchQuery);

      // Merge and deduplicate
      const seen = new Set<string>();
      const allRaw: Array<{ title: string; url: string; snippet?: string; source?: string; image?: string }> = [];

      const mergeResults = (results: Awaited<ReturnType<typeof searchAcrossStores>>) => {
        for (const items of results) {
          const normalized = normalizeCseItems(items);
          for (const item of normalized) {
            if (!item.url || seen.has(item.url)) continue;
            if (!isAllowedStoreDomain(item.url)) continue;
            seen.add(item.url);
            allRaw.push(item);
          }
        }
      };

      mergeResults(storeResults);
      console.log(`[decision] Results from enriched query: ${allRaw.length}`);

      // 2a-bis. If too few results, try again with the simpler fallback query
      if (allRaw.length < 6 && fallbackQuery !== searchQuery) {
        console.log("[decision] Too few results, trying fallback query...");
        const fallbackResults = await searchAcrossStores(fallbackQuery);
        mergeResults(fallbackResults);
        console.log(`[decision] Total after fallback: ${allRaw.length}`);
      }

      const withImages = allRaw.filter((p) => p.image);
      console.log(`[decision] Results with images: ${withImages.length}/${allRaw.length}`);
      for (const p of allRaw.slice(0, 5)) {
        console.log(`[decision]   - "${p.title.slice(0, 60)}" img=${p.image ? "YES" : "NO"} url=${p.url.slice(0, 80)}`);
      }

      // 2b. Remove ONLY definite listing/search pages (relaxed filter)
      const filtered = allRaw.filter(
        (p) => !isDefinitelyListing(p.url, p.title)
      );
      console.log(`[decision] After removing listings: ${filtered.length}`);

      // 2c. Rank by relevance
      const ranked = rankEvidence(filtered, searchQuery);
      // Take top 15 candidates for URL verification (more candidates for Gemini to filter)
      const candidates = ranked.slice(0, 15);

      // 2d. Verify URLs are active (parallel HEAD requests)
      const activeResults = await filterActiveUrls(candidates);

      // Take top 10 active results — give Gemini more options to pick from
      const topResults = activeResults.slice(0, 10);
      console.log(`[decision] Active results for analysis: ${topResults.length}`);

      // 2e. Send to Gemini for analysis
      let analysis: GeminiAnalysis | null = null;

      if (topResults.length > 0) {
        try {
          const analysisPrompt = buildAnalysisPrompt(query, answers, topResults);
          analysis = await geminiGenerateJson<GeminiAnalysis>(analysisPrompt, {
            maxOutputTokens: 8192,
            temperature: 0.4,
            thinkingBudget: 1024,
          });
          console.log("[decision] Gemini analysis done, products:", analysis?.products?.length || 0);
        } catch (err) {
          console.error("[decision] Gemini analysis failed:", err);
        }
      }

      // 2f. Build response — merge Gemini analysis with ORIGINAL search data
      if (analysis && Array.isArray(analysis.products) && analysis.products.length > 0) {
        const analyzedResults = analysis.products
          .map((ap) => {
            // Default relevance to 6 if Gemini included the product but didn't specify
            const relevance = typeof ap.relevance === "number" ? ap.relevance : 6;
            if (relevance < 3) return null;

            const idx = (ap.index ?? 0) - 1;
            const original = topResults[idx];
            if (!original) return null;

            return {
              title: original.title,
              url: original.url,
              source: original.source,
              snippet: ap.why || original.snippet,
              image: original.image,
              pros: ap.pros || [],
              cons: ap.cons || [],
              relevance,
            };
          })
          .filter(Boolean)
          .sort((a, b) => (b!.relevance || 0) - (a!.relevance || 0));

        console.log(`[decision] Gemini selected ${analyzedResults.length} relevant products`);

        // If Gemini found relevant products, return them
        if (analyzedResults.length > 0) {
          return NextResponse.json({
            action: "search",
            searchQuery,
            recommendation: analysis.recommendation || "",
            tip: analysis.tip || "",
            results: analyzedResults.slice(0, 6),
          });
        }

        // Gemini found NO relevant products — use topResults as fallback
        console.log("[decision] Gemini found 0 relevant products — falling back to raw results");
        if (topResults.length > 0) {
          return NextResponse.json({
            action: "search",
            searchQuery,
            recommendation: analysis.recommendation || `Estos son los resultados más cercanos para "${query}".`,
            tip: analysis.tip || "Revisa los productos disponibles y compara precios entre tiendas.",
            results: topResults.slice(0, 6).map((p) => ({
              title: p.title,
              url: p.url,
              source: p.source,
              snippet: p.snippet,
              image: p.image,
              pros: [],
              cons: [],
              relevance: 5,
            })),
          });
        }
      }

      // Fallback: no Gemini analysis — return search results directly
      if (topResults.length > 0) {
        return NextResponse.json({
          action: "search",
          searchQuery,
          recommendation: "",
          tip: "",
          results: topResults.slice(0, 6).map((p) => ({
            title: p.title,
            url: p.url,
            source: p.source,
            snippet: p.snippet,
            image: p.image,
            pros: [],
            cons: [],
            relevance: 0,
          })),
        });
      }

      // No results at all
      return NextResponse.json({
        action: "search",
        searchQuery,
        recommendation: `No encontramos resultados para "${query}". Intenta con un término diferente.`,
        tip: "Prueba con palabras clave más específicas o generales.",
        results: [],
      });
    }

    return NextResponse.json(
      { error: `Unknown action: ${action}` },
      { status: 400 }
    );
  } catch (err: any) {
    console.error("Decision route error:", err);
    return NextResponse.json(
      { error: err?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
