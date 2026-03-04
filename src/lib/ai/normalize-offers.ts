export type Offer = {
  storeId: string;
  storeName: string;
  title: string;
  price: number;
  currency: string;
  url: string;
  confidence: number;
  source?: "mock" | "live";
};

export async function normalizeOffersWithAI(offers: Offer[]): Promise<Offer[]> {
  // Placeholder: aquí después llamas OpenAI para:
  // - normalizar unidades (kg, pieza, m2)
  // - mejorar match / score
  // Por ahora, regresamos igual.
  return offers;
}
