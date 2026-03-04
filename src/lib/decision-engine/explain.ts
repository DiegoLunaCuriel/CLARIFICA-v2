// src/lib/decision-engine/explain.ts

import type { DecisionResult } from "@/types/decision";

export function explain(params: { intent: string; result: DecisionResult }): { explanation: string[] } {
  const { intent, result } = params;

  const bullets: string[] = [];

  if (intent?.trim()) bullets.push(`Tu intención: ${intent.trim()}.`);

  const rec = result?.recommended?.title;
  if (rec) bullets.push(`Recomendación principal: ${rec}.`);

  const specs = result?.recommended?.spec_suggestions || [];
  if (specs.length) bullets.push(`Criterios clave: ${specs.slice(0, 3).join(", ")}.`);

  return { explanation: bullets };
}
