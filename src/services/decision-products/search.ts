// src/services/decision-products/search.ts

export interface DecisionProduct {
  title: string;
  url: string;
  price?: number;
  source: "amazon" | "home_depot" | "other";
  image?: string;
}

export async function searchDecisionProducts(_query: string): Promise<DecisionProduct[]> {
  // Sprint 2: aquí conectaremos Unwrangle y normalizaremos.
  // Por ahora: retorna vacío para no romper el MVP.
  return [];
}
