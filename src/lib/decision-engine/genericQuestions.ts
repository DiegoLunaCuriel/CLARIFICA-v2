// src/lib/decision-engine/genericQuestions.ts

import type { DecisionQuestion } from "@/types/decision";

export function genericQuestionsForCategory(category: string, answers: Record<string, any>): DecisionQuestion[] {
  const qs: DecisionQuestion[] = [];

  // Limpieza / químicos
  if (category === "cleaning") {
    if (!answers.surface) {
      qs.push({
        id: "surface",
        title: "¿Qué superficie vas a limpiar?",
        type: "single",
        required: true,
        options: [
          { label: "Metal", value: "metal" },
          { label: "Plástico", value: "plastic" },
          { label: "Piso (cerámica/cemento)", value: "floor" },
          { label: "Madera", value: "wood" },
          { label: "Otra", value: "other" },
        ],
      });
    }

    if (!answers.soil_type) {
      qs.push({
        id: "soil_type",
        title: "¿Qué quieres remover?",
        type: "single",
        required: true,
        options: [
          { label: "Grasa pesada", value: "heavy_grease" },
          { label: "Grasa ligera", value: "light_grease" },
          { label: "Aceite", value: "oil" },
          { label: "Suciedad general", value: "general" },
        ],
      });
    }

    if (!answers.application) {
      qs.push({
        id: "application",
        title: "¿Cómo prefieres aplicarlo?",
        type: "single",
        required: true,
        options: [
          { label: "Spray", value: "spray" },
          { label: "Líquido", value: "liquid" },
          { label: "Gel", value: "gel" },
          { label: "Me da igual", value: "either" },
        ],
      });
    }

    return qs.slice(0, 4);
  }

  // Default genérico para categorías sin plantilla
  if (!answers.clarify) {
    qs.push({
      id: "clarify",
      title: "Para recomendar mejor, ¿qué necesitas hacer exactamente?",
      description: "Describe la tarea y el material/superficie si aplica.",
      type: "text",
      required: true,
      placeholder: "Ej: limpiar grasa en metal, quitar óxido, pegar azulejo, etc.",
    });
  }

  return qs.slice(0, 2);
}
