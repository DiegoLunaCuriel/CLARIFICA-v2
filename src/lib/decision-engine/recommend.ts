// src/lib/decision-engine/recommend.ts

import type { DecisionResult } from "@/types/decision";

export type RecommendInput = {
  category: string;
  intent: string;
  answers: Record<string, any>;
};

export function recommend(input: RecommendInput): DecisionResult {
  const { category, intent, answers } = input;

  // MVP: recomendación básica por familia/categoría
  // (Luego la conectamos con Google CSE + ranking)

  if (category === "drill_concrete" || answers?.base_material === "concrete" || answers?.base_material === "masonry") {
    return {
      confidence: 0.75,
      recommended: {
        title: "Rotomartillo (percusión) + broca para concreto",
        summary:
          "Para concreto/ladrillo conviene un rotomartillo o taladro con percusión. Elige broca de carburo y diámetro acorde al taquete.",
        spec_suggestions: [
          "Percusión/impacto para mampostería",
          "Mandril 1/2\" si usarás brocas grandes",
          "Si es inalámbrico, 18V/20V y 2 baterías para trabajo frecuente",
        ],
        checks_and_warnings: [
          "Usa lentes y mascarilla (polvo).",
          "No uses broca para madera en concreto.",
        ],
      },
      alternatives: [
        {
          id: "alt-1",
          title: "Taladro con percusión (trabajo ligero)",
          summary: "Adecuado si el diámetro es pequeño y el uso es ocasional.",
        },
      ],
    };
  }

  // Fallback genérico
  return {
    confidence: 0.35,
    recommended: {
      title: "Necesito un poco más de información",
      summary:
        "Aún no tengo suficiente detalle para recomendar un producto específico. Responde las preguntas o describe la tarea con más contexto.",
    },
  };
}
