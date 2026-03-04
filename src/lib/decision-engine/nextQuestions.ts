// src/lib/decision-engine/nextQuestions.ts

import type { DecisionQuestion } from "@/types/decision";
import type { IntentFamily } from "./families";
import { getFamilyQuestions } from "./families";

export type NextQuestionsInput = {
  intent_family: IntentFamily;
  answers: Record<string, any>;
};

export function nextQuestions(input: NextQuestionsInput): DecisionQuestion[] {
  return getFamilyQuestions(input.intent_family, input.answers);
}
