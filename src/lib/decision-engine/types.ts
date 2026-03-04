// src/lib/decision-engine/types.ts

import type {
  DecisionAnswers,
  DecisionQuestion,
  DecisionResult,
} from "@/types/decision";

export interface ClassifiedIntent {
  category: string;
  confidence: number; // 0..1
  normalized_intent: string;
  keywords: string[];
  intent_family?: string;
}

export interface NextQuestionsInput {
  category: string;
  answers: DecisionAnswers;
}

export interface RecommendInput {
  category: string;
  intent: string;
  answers: DecisionAnswers;
}

export interface ExplainInput {
  intent: string;
  result: DecisionResult;
}

export type { DecisionAnswers, DecisionQuestion, DecisionResult };
