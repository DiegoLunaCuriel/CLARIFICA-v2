import CrudOperations from "@/lib/crud-operations";
import { createErrorResponse, createSuccessResponse } from "@/lib/create-response";
import { requestMiddleware } from "@/lib/api-utils";
import { geminiGenerateJson } from "@/lib/ai/gemini-json";

type GeneratedMaterial = {
  name: string;
  description: string;
  unit_of_measurement: string;
  common_uses: string;
  usage_recommendations: string;
  technical_specs: Record<string, any>;
  average_price_per_unit: number | null;
  thumbnail_url: string | null;
  category_name: string;
};

async function getOrCreateCategoryId(categoryName: string, writeToken: string): Promise<number | null> {
  const categoriesCrud = new CrudOperations("material_categories", writeToken);

  const cats = await categoriesCrud.findMany({}, { limit: 200, offset: 0 });
  const target = (categoryName || "General").trim().toLowerCase();

  const existing = Array.isArray(cats)
    ? cats.find((c: any) => (c?.name ?? "").toString().trim().toLowerCase() === target)
    : null;

  if (existing?.id) return Number(existing.id);

  const created = await categoriesCrud.create({
    name: (categoryName || "General").trim(),
    description: "Categoría generada automáticamente",
  });

  return created?.id ? Number(created.id) : null;
}

export const GET = requestMiddleware(async (request, params: any) => {
  try {
    const sp = request.nextUrl.searchParams;
    const query = (sp.get("query") ?? "").toString().trim();

    if (!query) {
      return createErrorResponse({ errorMessage: "Missing 'query' parameter", status: 400 });
    }

    // Read token (anon o user) - para lecturas públicas
    const readToken = params?.token || process.env.POSTGREST_API_KEY || "";

    // Write token (service role) - para bypass RLS al cachear resultados IA
    const writeToken =
      process.env.POSTGREST_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      "";

    if (!writeToken) {
      return createErrorResponse({
        errorMessage:
          "Missing POSTGREST_SERVICE_ROLE_KEY / SUPABASE_SERVICE_ROLE_KEY. Needed to bypass RLS for AI caching.",
        status: 500,
      });
    }

    const materialsCrudRead = new CrudOperations("materials", readToken);
    const materialsCrudWrite = new CrudOperations("materials", writeToken);

    // 1) Buscar en BD
    const data = await materialsCrudRead.findMany({}, { limit: 800, offset: 0 });
    const q = query.toLowerCase();

    // Only match by NAME (not description) — searching "arena" shouldn't return "Cemento"
    // just because cement's description mentions sand/arena
    const best = Array.isArray(data)
      ? data.find((m: any) => (m?.name ?? "").toString().toLowerCase() === q) ||
        data.find((m: any) => (m?.name ?? "").toString().toLowerCase().includes(q))
      : null;

    if (best) {
      return createSuccessResponse({ source: "db", material: best });
    }

    // 2) No existe: generar con Gemini (JSON)
    const prompt =
      `Material: "${query}".\n` +
      `Devuelve SOLO JSON válido con estas llaves EXACTAS:\n` +
      `{\n` +
      `  "name": string,\n` +
      `  "description": string,\n` +
      `  "unit_of_measurement": string,\n` +
      `  "common_uses": string,\n` +
      `  "usage_recommendations": string,\n` +
      `  "technical_specs": object,\n` +
      `  "average_price_per_unit": number|null,\n` +
      `  "thumbnail_url": string|null,\n` +
      `  "category_name": string\n` +
      `}\n` +
      `Reglas:\n` +
      `- Español.\n` +
      `- Sin marcas específicas.\n` +
      `- Si no sabes el precio, null.\n` +
      `- category_name: categoría general.\n`;

    const generated = await geminiGenerateJson<GeneratedMaterial>(prompt, { temperature: 0, thinkingBudget: 1024 });

    if (!generated?.name || !generated?.description || !generated?.unit_of_measurement) {
      return createErrorResponse({
        errorMessage: "Gemini returned incomplete material JSON",
        status: 502,
      });
    }

    const categoryId = await getOrCreateCategoryId(generated.category_name || "General", writeToken);

    const created = await materialsCrudWrite.create({
      name: generated.name,
      description: generated.description,
      unit_of_measurement: generated.unit_of_measurement,
      common_uses: generated.common_uses,
      usage_recommendations: generated.usage_recommendations,
      technical_specs: generated.technical_specs ?? {},
      average_price_per_unit: generated.average_price_per_unit,
      thumbnail_url: generated.thumbnail_url,
      category_id: categoryId,
    });

    return createSuccessResponse({ source: "ai", material: created });
  } catch (e: any) {
    console.error("[materials/lookup] error:", e);
    return createErrorResponse({
      errorMessage: typeof e?.message === "string" ? e.message : "Lookup failed",
      status: 500,
    });
  }
}, false);
