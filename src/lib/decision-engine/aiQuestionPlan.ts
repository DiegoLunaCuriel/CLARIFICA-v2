import { geminiGenerateJson } from "@/lib/ai/gemini-json";
import type { DecisionQuestion } from "@/types/decision";

type AiQuestionPlan = {
  intent_family: "drill" | "pliers" | "paint" | "fastener" | "cement" | "unknown";
  category: string; // ej "tools_hand", "tools_power", "materials_cement", etc.
  confidence: number; // 0..1
  query_terms: string[]; // para Google CSE
  questions: DecisionQuestion[];
};

type AiPlanResponse = Partial<AiQuestionPlan>;

function buildPrompt(intent: string) {
  return `
Eres un asistente de decisión para ferretería/construcción.
Genera preguntas útiles y específicas para decidir el producto correcto.

Intención del usuario:
"${intent}"

Devuelve SOLO JSON válido con este formato:

{
  "intent_family": "drill|pliers|paint|fastener|cement|unknown",
  "category": "string_corta",
  "confidence": 0.0,
  "query_terms": ["..."],
  "questions": [
    {
      "id": "string_snake_case",
      "title": "pregunta",
      "description": "opcional",
      "type": "single|number|text",
      "required": true,
      "options": [{"label":"", "value":"", "hint":"opcional"}]
    }
  ]
}

Reglas:
- 3 a 6 preguntas máximo.
- NO preguntes por batería/cable a menos que sea herramienta eléctrica.
- Para pinzas: pregunta tipo (punta larga, corte, perico, presión), uso (electricidad/plomería/mecánica), tamaño, uso rudo.
- Para taladro: material a perforar, diámetro, frecuencia, cable/batería, impacto.
- Para pintura: interior/exterior, superficie, acabado, m2/litros.
- Para tornillería/taquetes: material base, carga, diámetro, largo.
- Para cemento: uso (losa/mortero/repello), resistencia, condiciones.
- Si no es claro, intent_family="unknown" y 1 pregunta de aclaración tipo text.

`.trim();
}

// Guardrails / validador simple
function sanitizePlan(raw: AiPlanResponse): AiQuestionPlan {
  const intent_family = (raw.intent_family ?? "unknown") as AiQuestionPlan["intent_family"];
  const confidenceNum = Number(raw.confidence);
  const confidence = Number.isFinite(confidenceNum) ? Math.max(0.1, Math.min(0.99, confidenceNum)) : 0.2;

  const query_terms = Array.isArray(raw.query_terms)
    ? raw.query_terms.map((x) => String(x)).filter(Boolean).slice(0, 8)
    : [];

  const questionsRaw = Array.isArray(raw.questions) ? raw.questions : [];
  const questions: DecisionQuestion[] = questionsRaw
    .map((q: any) => {
      const type = q?.type === "number" || q?.type === "text" ? q.type : "single";
      const options =
        type === "single" && Array.isArray(q?.options)
          ? q.options.slice(0, 8).map((o: any) => ({
              label: String(o?.label ?? ""),
              value: typeof o?.value === "number" ? o.value : String(o?.value ?? ""),
              hint: o?.hint ? String(o.hint) : undefined,
            }))
          : undefined;

      return {
        id: String(q?.id ?? "detail"),
        title: String(q?.title ?? "Pregunta"),
        description: q?.description ? String(q.description) : undefined,
        type,
        required: Boolean(q?.required ?? true),
        options,
        min: typeof q?.min === "number" ? q.min : undefined,
        max: typeof q?.max === "number" ? q.max : undefined,
        placeholder: q?.placeholder ? String(q.placeholder) : undefined,
      } as DecisionQuestion;
    })
    .slice(0, 6);

  // Fallback si la IA se equivoca
  const safeQuestions =
    questions.length > 0
      ? questions
      : [
          {
            id: "clarify",
            title: "No identifiqué la herramienta/material. ¿Qué necesitas hacer?",
            type: "text" as any,
            required: true,
            placeholder: "Describe la tarea (ej. sujetar cables, cortar, fijar, medir, etc.)",
          },
        ];

  return {
    intent_family,
    category: String(raw.category ?? "unknown"),
    confidence,
    query_terms,
    questions: safeQuestions,
  };
}

export async function buildAiQuestionPlan(intent: string): Promise<AiQuestionPlan> {
  const prompt = buildPrompt(intent);
  const raw = await geminiGenerateJson<AiPlanResponse>(prompt);
  return sanitizePlan(raw);
}
