// src/lib/decision-engine/index.ts

import type { DecisionAnswers, DecisionQuestion, DecisionResult } from "@/types/decision";

import { classifyIntent } from "./classifyIntent";
import { classifyIntentGemini } from "./classifyIntentGemini";
import { buildAiQuestionPlan } from "./aiQuestionPlan";
import { nextQuestions } from "./nextQuestions";
import { explain } from "./explain";
import { UNKNOWN_CATEGORY } from "./categories";
import { genericQuestionsForCategory } from "./genericQuestions";

import { googleCseSearch, normalizeCseItems } from "@/lib/search/google-cse";

type EvidenceItem = {
  title: string;
  url: string;
  snippet?: string;
  source?: string;
  image?: string;
};

type EngineOutput = {
  category: string;
  confidence: number;
  questions: DecisionQuestion[];
  result?: DecisionResult;
  explanation?: string[];
  evidence?: EvidenceItem[];
  meta?: Record<string, any>;
};

function genericClarifyQuestion(): DecisionQuestion[] {
  return [
    {
      id: "clarify",
      title: "Para recomendar mejor, ¿qué necesitas hacer exactamente?",
      description:
        "Ej: cortar, sujetar, medir, pegar, pintar, limpiar grasa, aflojar/apretar tuercas, etc.",
      type: "text",
      required: true,
      placeholder: "Describe la tarea (y material/superficie si aplica)…",
    },
  ];
}

function buildCseQuery(params: {
  intent: string;
  category: string;
  answers: Record<string, any>;
}) {
  const { intent, category, answers } = params;
  const parts: string[] = [(intent || "").trim()];

  if (category === "drill_concrete") {
    parts.push("rotomartillo");
    parts.push("broca concreto");
  }
  if (category === "pliers_grip_cut") parts.push("pinzas");
  if (category === "paint_coating") parts.push("pintura");
  if (category === "cleaning") parts.push("desengrasante");

  if (answers.base_material) parts.push(String(answers.base_material));
  if (answers.surface) parts.push(String(answers.surface));
  if (answers.location) parts.push(String(answers.location));
  if (answers.power_source) parts.push(String(answers.power_source));
  if (answers.hole_diameter_mm != null) parts.push(`${answers.hole_diameter_mm}mm`);

  return parts.filter(Boolean).join(" ").slice(0, 180);
}

export async function runDecisionEngine(params: {
  intent: string;
  answers?: DecisionAnswers;
}): Promise<EngineOutput> {
  const intent = (params.intent || "").trim();
  const answers = (params.answers || {}) as Record<string, any>;

  // ── 1) Clasificación HÍBRIDA: Gemini primero, keyword fallback ──
  let classifierUsed = "keyword";
  let classified = classifyIntent(intent); // keyword siempre como base

  try {
    const geminiResult = await classifyIntentGemini(intent);

    // Si Gemini tiene buena confianza, usarlo
    if (geminiResult.confidence >= 0.5 && geminiResult.category !== UNKNOWN_CATEGORY) {
      classified = geminiResult;
      classifierUsed = "gemini";
    }
    // Si keyword también es unknown pero Gemini al menos tiene algo
    else if (classified.category === UNKNOWN_CATEGORY && geminiResult.category !== UNKNOWN_CATEGORY) {
      classified = geminiResult;
      classifierUsed = "gemini_low";
    }
  } catch {
    // Gemini falló silenciosamente, usamos keyword
  }

  const intentFamily = (classified.intent_family || "unknown") as any;

  // ── 2) Preguntas por familia (si la clasificación las tiene) ──
  const familyQuestions = nextQuestions({ intent_family: intentFamily, answers });
  if (familyQuestions.length > 0) {
    return {
      category: classified.category,
      confidence: classified.confidence,
      questions: familyQuestions,
      meta: {
        classifier: classifierUsed,
        intent_family: intentFamily,
        questions_source: "family",
      },
    };
  }

  // ── 3) Si ambos clasificadores devuelven unknown → preguntas IA dinámicas ──
  if (classified.category === UNKNOWN_CATEGORY) {
    try {
      const aiPlan = await buildAiQuestionPlan(intent);
      if (aiPlan.questions.length > 0) {
        return {
          category: aiPlan.category || UNKNOWN_CATEGORY,
          confidence: aiPlan.confidence,
          questions: aiPlan.questions,
          meta: {
            classifier: "ai_plan",
            intent_family: aiPlan.intent_family,
            questions_source: "ai_generated",
          },
        };
      }
    } catch {
      // AI plan falló, usamos clarificación genérica
    }

    return {
      category: classified.category,
      confidence: classified.confidence,
      questions: genericClarifyQuestion(),
      meta: { classifier: classifierUsed, intent_family: "unknown", questions_source: "unknown" },
    };
  }

  // ── 4) Fallback por categoría (para categorías sin familia definida) ──
  const fallbackQs = genericQuestionsForCategory(classified.category, answers);
  if (fallbackQs.length > 0) {
    return {
      category: classified.category,
      confidence: classified.confidence,
      questions: fallbackQs,
      meta: {
        classifier: classifierUsed,
        intent_family: intentFamily,
        questions_source: "category_fallback",
      },
    };
  }

  // ── 5) Todas las preguntas respondidas → buscar evidencia con CSE ──
  let evidence: EvidenceItem[] = [];
  let result: DecisionResult = { confidence: Math.max(0.35, classified.confidence) };

  try {
    const query = buildCseQuery({ intent, category: classified.category, answers });
    const items = await googleCseSearch(query, { num: 8 });
    evidence = normalizeCseItems(items);

    if (evidence.length > 0) {
      const top = evidence[0];
      result = {
        confidence: Math.max(0.5, classified.confidence),
        recommended: {
          title: top.title,
          summary: top.snippet || "Resultado encontrado.",
          spec_suggestions: [
            "Valida compatibilidad con tu uso/material.",
            "Revisa medidas/capacidad antes de comprar.",
            "Confirma garantía y disponibilidad.",
          ],
          checks_and_warnings: [
            "Verifica que el resultado sea el producto (no solo un artículo informativo).",
            "Compara al menos 2-3 opciones antes de decidir.",
          ],
        },
        alternatives: evidence.slice(1, 6).map((x, idx) => ({
          id: `alt-${idx + 1}`,
          title: x.title,
          summary: x.snippet,
          tradeoffs: x.source ? [`Fuente: ${x.source}`] : undefined,
        })),
      };
    } else {
      return {
        category: classified.category,
        confidence: classified.confidence,
        questions: genericClarifyQuestion(),
        meta: {
          classifier: classifierUsed,
          intent_family: intentFamily,
          questions_source: "no_cse_results",
        },
      };
    }
  } catch {
    return {
      category: classified.category,
      confidence: classified.confidence,
      questions: genericClarifyQuestion(),
      meta: {
        classifier: classifierUsed,
        intent_family: intentFamily,
        questions_source: "cse_error",
      },
    };
  }

  const exp = explain({ intent, result });

  return {
    category: classified.category,
    confidence: result.confidence,
    questions: [],
    result,
    explanation: exp.explanation,
    evidence,
    meta: {
      classifier: classifierUsed,
      intent_family: intentFamily,
      questions_source: "none_cse",
    },
  };
}
