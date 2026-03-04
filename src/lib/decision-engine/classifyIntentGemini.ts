// src/lib/decision-engine/classifyIntentGemini.ts

import { DECISION_CATEGORIES, UNKNOWN_CATEGORY } from "./categories";
import type { ClassifiedIntent } from "./types";
import { geminiGenerateJson } from "@/lib/ai/gemini-json";

type GeminiClassifyResponse = {
  category?: string;
  intent_family?: string;
  confidence?: number;
  keywords?: string[];
};

function normalize(text: string): string {
  return (text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}

function buildPrompt(intent: string) {
  const categories = DECISION_CATEGORIES.map((c) => ({
    id: c.id,
    label: c.label,
    keywords: c.keywords.slice(0, 12),
  }));

  return `
Eres un clasificador de intención para un asistente de decisión de ferretería/construcción.

Tarea:
- Elegir UNA "category" de la lista o "unknown".
- Elegir UNA "intent_family" (familia) que define qué preguntas hacer.

Intención del usuario:
"${intent}"

Categorías disponibles (elige una por id):
${JSON.stringify(categories, null, 2)}

Familias permitidas (elige una):
- power_drill (taladro/rotomartillo/atornillador)
- power_cut (corte eléctrico)
- manual_cut_grip (pinzas/alicates/corte manual/sujeción)
- manual_drive (destornilladores/llaves)
- measuring (medición)
- fastening (tornillos/taquetes/anclajes)
- paint_coating (pintura/recubrimientos)
- paint_application (brocha/rodillo/pistola)
- adhesive_sealant (adhesivos/selladores)
- cement_mortar (cemento/morteros)
- plumbing (plomería)
- electrical (eléctrico)
- unknown

Reglas:
- Responde SOLO JSON válido.
- Si no hay match claro, usa "unknown" en ambos.
- confidence de 0 a 1.
- keywords: 3 a 8 palabras relevantes.

Formato exacto:
{
  "category": "<id|unknown>",
  "intent_family": "power_drill|power_cut|manual_cut_grip|manual_drive|measuring|fastening|paint_coating|paint_application|adhesive_sealant|cement_mortar|plumbing|electrical|unknown",
  "confidence": 0.0,
  "keywords": ["..."]
}
`.trim();
}

export async function classifyIntentGemini(intent: string): Promise<ClassifiedIntent> {
  const normalized_intent = normalize(intent);

  try {
    const prompt = buildPrompt(intent);

    const data = await geminiGenerateJson<GeminiClassifyResponse>(prompt);

    const category = String(data?.category || UNKNOWN_CATEGORY);
    const intent_family = String(data?.intent_family || "unknown");

    const confidenceRaw = Number(data?.confidence);
    const confidence =
      Number.isFinite(confidenceRaw) ? Math.max(0.1, Math.min(0.99, confidenceRaw)) : 0.2;

    const keywords = Array.isArray(data?.keywords)
      ? data.keywords.map((k) => String(k)).filter(Boolean).slice(0, 12)
      : [];

    const validCategory =
      category === UNKNOWN_CATEGORY || DECISION_CATEGORIES.some((c) => c.id === category);

    return {
      category: validCategory ? category : UNKNOWN_CATEGORY,
      confidence,
      normalized_intent,
      keywords,
      intent_family,
    };
  } catch {
    return {
      category: UNKNOWN_CATEGORY,
      confidence: 0.2,
      normalized_intent,
      keywords: [],
      intent_family: "unknown",
    };
  }
}
