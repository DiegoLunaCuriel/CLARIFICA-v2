// src/lib/ai/prompts/decision-explain.ts

import type { DecisionResult } from "@/types/decision";

export function decisionExplainPrompt(params: {
  intent: string;
  result: DecisionResult;
}) {
  const { intent, result } = params;

  const title = result.recommended?.title ?? "Sin recomendación definitiva";
  const summary = result.recommended?.summary ?? "No hay resumen disponible.";

  const specSuggestions = (result.recommended?.spec_suggestions ?? []).join(" | ");
  const warnings = (result.recommended?.checks_and_warnings ?? []).join(" | ");

  return `
Eres un asistente técnico para ayudar a decidir herramientas y materiales de construcción.

El usuario pidió: "${intent}"

La recomendación calculada es:
- Opción recomendada: ${title}
- Resumen: ${summary}
- Especificaciones sugeridas: ${specSuggestions || "N/A"}
- Advertencias: ${warnings || "N/A"}

Tarea:
Devuelve una lista de 5 a 8 bullets claros, prácticos y no redundantes explicando POR QUÉ esa opción es adecuada y qué debe cuidar el usuario.

Reglas:
- No inventes marcas, precios ni enlaces.
- Si falta información en el resultado, enfócate en criterios generales y en qué validar antes de comprar/usar.
- No repitas el resumen literalmente.

Formato de salida: JSON estricto:
{ "bullets": string[] }
`.trim();
}
