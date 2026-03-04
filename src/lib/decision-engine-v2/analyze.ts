import { geminiGenerateJson } from "@/lib/ai/gemini-json";

/* ── Types ────────────────────────────────────────────── */

export interface QuestionOption {
  label: string;
  value: string;
  hint?: string;
}

export interface GeneratedQuestion {
  id: string;
  title: string;
  description?: string;
  options: QuestionOption[];
}

export interface QuestionsResult {
  productType: string;
  questions: GeneratedQuestion[];
}

/* ── Prompt ───────────────────────────────────────────── */

function buildQuestionsPrompt(query: string): string {
  return `
CONTEXTO: Esta es una plataforma de MATERIALES DE CONSTRUCCION y FERRETERIA en Mexico.
Todos los productos son del ambito de construccion, remodelacion, plomeria, electricidad, pintura, herramientas manuales y electricas, etc.
Si el nombre del producto es ambiguo (ej: "pala", "cinta", "tubo", "manguera"), SIEMPRE asume que se refiere al producto de CONSTRUCCION o FERRETERIA.
Por ejemplo: "pala" = pala de albañil/construccion, "cinta" = cinta de aislar/medir, "tubo" = tuberia PVC/cobre.

Eres un asesor experto en materiales de construccion, herramientas y ferreteria en Mexico y Latinoamerica.

El usuario quiere comprar: "${query}"

TAREA:
Genera entre 3 y 5 preguntas que ayuden a determinar EXACTAMENTE que producto de construccion/ferreteria necesita el usuario.
Las preguntas deben cubrir los ejes de decision mas importantes para "${query}" en el contexto de CONSTRUCCION.

EJEMPLOS DE EJES SEGUN PRODUCTO:
- Taladro: tipo (percutor, rotomartillo, atornillador), fuente de energia (bateria, cable), voltaje, uso (hogar, profesional)
- Cemento: tipo (portland, mortero, pegablock), resistencia, uso (cimentacion, acabado, pegar block)
- Pintura: tipo (vinilica, esmalte, impermeabilizante), acabado (mate, satinado, brillante), superficie (interior, exterior, metal)
- Sierra: tipo (circular, caladora, de mesa, de inglete), material a cortar, fuente de energia
- Pala: tipo (cuadrada, redonda, cuchara de albañil, pala carbonera), uso (excavacion, mezcla, limpieza)
- Cinta: tipo (aislar, medir, ducto, masking), medida, uso

REGLAS:
- Cada pregunta debe tener entre 2 y 4 opciones concretas y reales del mercado.
- Las opciones deben ser mutuamente excluyentes cuando sea posible.
- Incluye un "hint" breve en cada opcion para que el usuario entienda la diferencia.
- NO preguntes por presupuesto ni precio.
- NO preguntes por marca (eso lo decide la busqueda).
- Ordena las preguntas de mas general a mas especifica.
- Los IDs de pregunta deben ser snake_case unicos.
- Los values de opciones deben ser strings cortos en snake_case.
- Idioma: espanol.

JSON de salida (estricto):
{
  "productType": "nombre descriptivo del producto de construccion",
  "questions": [
    {
      "id": "tipo_producto",
      "title": "Que tipo de [producto] necesitas?",
      "description": "Contexto breve.",
      "options": [
        { "label": "Opcion 1", "value": "valor_1", "hint": "Descripcion breve" },
        { "label": "Opcion 2", "value": "valor_2", "hint": "Descripcion breve" }
      ]
    }
  ]
}
`.trim();
}

/* ── Build enriched search query ─────────────────────── */

/**
 * Builds a search query enriched with user answers.
 * IMPORTANT: Does NOT add generic "construccion ferreteria" terms because
 * searches are already restricted to construction stores via site: operator.
 * Adding too many terms dilutes the search and returns irrelevant results.
 */
export function buildSearchQuery(
  originalQuery: string,
  answers: Record<string, string>
): string {
  // Track all words already in the query to avoid duplicates
  const usedWords = new Set(
    originalQuery.toLowerCase().split(/\s+/).filter(Boolean)
  );
  const parts = [originalQuery];

  // Add user answer words that aren't already in the query
  for (const [key, value] of Object.entries(answers)) {
    if (!value || value === "any") continue;
    const readable = value.replace(/_/g, " ");
    // Add only NEW words from this answer
    const newWords = readable
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w && !usedWords.has(w));
    if (newWords.length > 0) {
      parts.push(newWords.join(" "));
      newWords.forEach((w) => usedWords.add(w));
    }
  }

  return parts.join(" ");
}

/**
 * Builds a simpler "fallback" query using just the original product name.
 * Used when the enriched query returns too few results.
 */
export function buildFallbackQuery(originalQuery: string): string {
  return originalQuery;
}

/* ── Fallback questions for common construction products ── */

const FALLBACK_QUESTIONS: Record<string, GeneratedQuestion[]> = {
  pala: [
    {
      id: "tipo_pala",
      title: "¿Qué tipo de pala necesitas?",
      description: "Las palas de construcción varían según el trabajo a realizar.",
      options: [
        { label: "Pala cuadrada", value: "cuadrada", hint: "Para mezclar, cargar arena, grava o cemento" },
        { label: "Pala redonda (punta)", value: "redonda", hint: "Para excavar y hacer zanjas" },
        { label: "Cuchara de albañil", value: "cuchara_albanil", hint: "Para aplicar mezcla y acabados" },
        { label: "Pala carbonera", value: "carbonera", hint: "Para mover materiales ligeros a granel" },
      ],
    },
    {
      id: "uso_pala",
      title: "¿Para qué tipo de trabajo la usarás?",
      options: [
        { label: "Excavación y zanjas", value: "excavacion", hint: "Trabajo pesado en tierra" },
        { label: "Mezcla de cemento", value: "mezcla", hint: "Revolver y preparar mezclas" },
        { label: "Carga de materiales", value: "carga", hint: "Mover arena, grava, escombro" },
        { label: "Albañilería y acabados", value: "albanileria", hint: "Aplicar mezcla en muros y pisos" },
      ],
    },
    {
      id: "material_mango",
      title: "¿Qué material de mango prefieres?",
      options: [
        { label: "Mango de madera", value: "madera", hint: "Económico y tradicional" },
        { label: "Mango de fibra de vidrio", value: "fibra_vidrio", hint: "Más resistente y duradero" },
        { label: "Mango metálico", value: "metalico", hint: "Para trabajo pesado industrial" },
      ],
    },
  ],
  taladro: [
    {
      id: "tipo_taladro",
      title: "¿Qué tipo de taladro necesitas?",
      description: "Depende del material que vas a perforar.",
      options: [
        { label: "Taladro/atornillador", value: "atornillador", hint: "Para madera, tablaroca y tornillos" },
        { label: "Rotomartillo", value: "rotomartillo", hint: "Para concreto, ladrillo y piedra" },
        { label: "Taladro percutor", value: "percutor", hint: "Versátil: madera, metal y mampostería ligera" },
      ],
    },
    {
      id: "fuente_energia",
      title: "¿Con cable o inalámbrico?",
      options: [
        { label: "Inalámbrico (batería)", value: "inalambrico", hint: "Portátil, ideal para trabajo en obra" },
        { label: "Con cable (eléctrico)", value: "cable", hint: "Más potencia constante, sin preocupación de carga" },
      ],
    },
    {
      id: "nivel_uso",
      title: "¿Para qué nivel de uso?",
      options: [
        { label: "Uso doméstico/hogar", value: "hogar", hint: "Reparaciones y proyectos caseros" },
        { label: "Uso profesional/obra", value: "profesional", hint: "Trabajo diario intensivo" },
      ],
    },
  ],
  cemento: [
    {
      id: "tipo_cemento",
      title: "¿Qué tipo de cemento necesitas?",
      description: "Cada tipo tiene un uso específico en construcción.",
      options: [
        { label: "Cemento Portland (gris)", value: "portland_gris", hint: "Uso general: cimentación, muros, losas" },
        { label: "Cemento blanco", value: "blanco", hint: "Para acabados finos y decorativos" },
        { label: "Mortero / pegablock", value: "mortero", hint: "Para pegar block, tabique o adoquín" },
        { label: "Cemento de fraguado rápido", value: "fraguado_rapido", hint: "Para reparaciones urgentes" },
      ],
    },
    {
      id: "uso_cemento",
      title: "¿Para qué lo vas a usar?",
      options: [
        { label: "Cimentación y estructura", value: "cimentacion", hint: "Bases, zapatas, trabes" },
        { label: "Pegar block o tabique", value: "pegar_block", hint: "Levantar muros" },
        { label: "Acabados y aplanados", value: "acabados", hint: "Recubrimientos de muros y pisos" },
        { label: "Reparaciones menores", value: "reparaciones", hint: "Parches, grietas, baches" },
      ],
    },
    {
      id: "presentacion",
      title: "¿Qué presentación necesitas?",
      options: [
        { label: "Saco de 50 kg", value: "50kg", hint: "Presentación estándar" },
        { label: "Saco de 25 kg", value: "25kg", hint: "Más manejable para trabajos menores" },
        { label: "A granel / tonelada", value: "granel", hint: "Para obras grandes" },
      ],
    },
  ],
  pintura: [
    {
      id: "tipo_pintura",
      title: "¿Qué tipo de pintura necesitas?",
      options: [
        { label: "Pintura vinílica (acrílica)", value: "vinilica", hint: "Para muros interiores y exteriores" },
        { label: "Esmalte", value: "esmalte", hint: "Para metal, madera y superficies que necesiten resistencia" },
        { label: "Impermeabilizante", value: "impermeabilizante", hint: "Para techos y azoteas" },
        { label: "Primer / sellador", value: "primer", hint: "Base para mejorar adherencia" },
      ],
    },
    {
      id: "superficie",
      title: "¿En qué superficie la aplicarás?",
      options: [
        { label: "Interior (muros)", value: "interior", hint: "Paredes y techos interiores" },
        { label: "Exterior (fachada)", value: "exterior", hint: "Fachadas expuestas al sol y lluvia" },
        { label: "Metal o herrería", value: "metal", hint: "Puertas, ventanas, rejas" },
        { label: "Techo / azotea", value: "techo", hint: "Impermeabilización de techos" },
      ],
    },
    {
      id: "acabado",
      title: "¿Qué acabado prefieres?",
      options: [
        { label: "Mate", value: "mate", hint: "Sin brillo, disimula imperfecciones" },
        { label: "Satinado", value: "satinado", hint: "Brillo suave, fácil de limpiar" },
        { label: "Brillante", value: "brillante", hint: "Alto brillo, para acabados llamativos" },
      ],
    },
  ],
  sierra: [
    {
      id: "tipo_sierra",
      title: "¿Qué tipo de sierra necesitas?",
      options: [
        { label: "Sierra circular", value: "circular", hint: "Cortes rectos en madera, melamina, triplay" },
        { label: "Sierra caladora", value: "caladora", hint: "Cortes curvos y en figuras" },
        { label: "Sierra de inglete", value: "inglete", hint: "Cortes angulares precisos para marcos y molduras" },
        { label: "Sierra reciproca", value: "reciproca", hint: "Demolición y cortes en espacios reducidos" },
      ],
    },
    {
      id: "fuente_energia_sierra",
      title: "¿Con cable o inalámbrica?",
      options: [
        { label: "Inalámbrica (batería)", value: "inalambrica", hint: "Portátil para trabajo en obra" },
        { label: "Con cable (eléctrica)", value: "cable", hint: "Potencia constante para trabajo continuo" },
      ],
    },
  ],
};

/* Generic fallback for any product not in the map */
const GENERIC_FALLBACK: GeneratedQuestion[] = [
  {
    id: "nivel_uso",
    title: "¿Para qué nivel de uso lo necesitas?",
    description: "Esto nos ayuda a encontrar el producto adecuado.",
    options: [
      { label: "Uso doméstico / hogar", value: "hogar", hint: "Proyectos caseros y reparaciones" },
      { label: "Uso profesional / obra", value: "profesional", hint: "Trabajo diario intensivo" },
    ],
  },
  {
    id: "preferencia_calidad",
    title: "¿Qué prefieres?",
    options: [
      { label: "Económico", value: "economico", hint: "Buena relación calidad-precio" },
      { label: "Alta calidad / durabilidad", value: "alta_calidad", hint: "Mayor inversión pero más duradero" },
    ],
  },
];

function getFallbackQuestions(query: string): GeneratedQuestion[] {
  const qLower = query.toLowerCase().trim();

  // Check exact match first, then partial match
  for (const [key, questions] of Object.entries(FALLBACK_QUESTIONS)) {
    if (qLower === key || qLower.includes(key)) {
      return questions;
    }
  }

  // Return generic questions for unknown products
  return GENERIC_FALLBACK;
}

/* ── Sanitize ────────────────────────────────────────── */

function sanitize(raw: QuestionsResult): QuestionsResult {
  const questions = (raw.questions || []).slice(0, 5).map((q) => ({
    id: q.id || `q_${Math.random().toString(36).slice(2, 8)}`,
    title: q.title || "",
    description: q.description,
    options: (q.options || []).map((opt) => ({
      label: opt.label || "",
      value: opt.value || "",
      hint: opt.hint,
    })),
  }));

  return {
    productType: raw.productType || "producto",
    questions,
  };
}

/* ── Main function ───────────────────────────────────── */

export async function generateQuestions(
  query: string
): Promise<QuestionsResult> {
  const prompt = buildQuestionsPrompt(query);

  try {
    const raw = await geminiGenerateJson<QuestionsResult>(prompt, {
      maxOutputTokens: 4096,
    });
    console.log("[analyze] Gemini questions:", JSON.stringify(raw, null, 2));
    const result = sanitize(raw);

    // Validate quality: need at least 2 questions, each with at least 2 options with non-empty values
    const validQuestions = result.questions.filter(
      (q) => q.title && q.options.filter((o) => o.label && o.value).length >= 2
    );

    if (validQuestions.length >= 2) {
      return { productType: result.productType, questions: validQuestions };
    }

    // Gemini returned too few valid questions — use fallback
    console.warn(`[analyze] Gemini returned ${validQuestions.length} valid questions (need >=2), using fallback`);
    return {
      productType: result.productType || query,
      questions: getFallbackQuestions(query),
    };
  } catch (err) {
    console.error("generateQuestions Gemini error:", err);
    // Use fallback questions instead of returning empty
    return {
      productType: query,
      questions: getFallbackQuestions(query),
    };
  }
}
