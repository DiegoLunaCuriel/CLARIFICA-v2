// src/lib/decision-engine/classifyIntent.ts

import { DECISION_CATEGORIES, UNKNOWN_CATEGORY } from "./categories";
import type { ClassifiedIntent } from "./types";

function normalize(text: string): string {
  return (text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}


function inferFamilyFromCategory(category: string): string {
  if (category === "drill_concrete" || category === "drill_wood_metal") return "power_drill";
  if (category === "power_cut") return "power_cut";
  if (category === "pliers_grip_cut") return "manual_cut_grip";
  if (category === "manual_drive") return "manual_drive";
  if (category === "measuring") return "measuring";
  if (category === "fasteners") return "fastening";
  if (category === "paint_coating") return "paint_coating";
  if (category === "paint_tools") return "paint_application";
  if (category === "adhesive_sealant") return "adhesive_sealant";
  if (category === "cement_mortar") return "cement_mortar";
  if (category === "plumbing") return "plumbing";
  if (category === "electrical") return "electrical";

  return "unknown";
}


export function classifyIntent(intent: string): ClassifiedIntent {
  const normalized_intent = normalize(intent);

  let bestId = UNKNOWN_CATEGORY;
  let bestScore = 0;

  for (const c of DECISION_CATEGORIES) {
    let score = 0;
    for (const kw of c.keywords) {
      const k = normalize(kw);
      if (k && normalized_intent.includes(k)) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      bestId = c.id;
    }
  }

  const category = bestScore > 0 ? bestId : UNKNOWN_CATEGORY;
  const confidence = Math.max(0.2, Math.min(0.85, bestScore / 6));

  const keywords =
    category === UNKNOWN_CATEGORY
      ? []
      : (DECISION_CATEGORIES.find((x) => x.id === category)?.keywords ?? []).slice(0, 8);

  const intent_family = inferFamilyFromCategory(category);

  return {
    category,
    confidence,
    normalized_intent,
    keywords,
    intent_family,
  };
}
