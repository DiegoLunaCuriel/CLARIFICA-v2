export type SavedComparison = {
  id: string;
  savedAt: string; // ISO
  query: string;
  liveEnabled: boolean;
  mode: string;
  preferredCurrency?: string;
  rows: Array<{
    storeId: string;
    storeName: string;
    title: string;
    price: number;
    currency: string;
    url: string;
    confidence: number;
    source?: string;
  }>;
};

const KEY = "savedComparisons:v1";
const MAX_ITEMS = 30;

function safeParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function getLocalStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function makeId(): string {
  // randomUUID es lo ideal, pero no siempre está disponible
  const c = (globalThis as any)?.crypto;
  if (c?.randomUUID) return c.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function listSavedComparisons(): SavedComparison[] {
  const ls = getLocalStorage();
  if (!ls) return [];

  const data = safeParse<SavedComparison[]>(ls.getItem(KEY));
  if (!Array.isArray(data)) return [];

  // Sanitiza entradas mínimas para no romper UI si algo raro se guardó
  return data
    .filter((x) => x && typeof x === "object")
    .map((x) => ({
      id: String((x as any).id ?? ""),
      savedAt: String((x as any).savedAt ?? ""),
      query: String((x as any).query ?? ""),
      liveEnabled: Boolean((x as any).liveEnabled),
      mode: String((x as any).mode ?? "unknown"),
      preferredCurrency:
        typeof (x as any).preferredCurrency === "string"
          ? (x as any).preferredCurrency
          : undefined,
      rows: Array.isArray((x as any).rows) ? ((x as any).rows as any[]) : [],
    }))
    .filter((x) => x.id && x.query);
}

export function saveComparison(
  item: Omit<SavedComparison, "id" | "savedAt">
): SavedComparison {
  const ls = getLocalStorage();
  if (!ls) {
    throw new Error("localStorage no disponible");
  }

  const existing = listSavedComparisons();

  const saved: SavedComparison = {
    id: makeId(),
    savedAt: new Date().toISOString(),
    ...item,
  };

  const next = [saved, ...existing].slice(0, MAX_ITEMS);
  ls.setItem(KEY, JSON.stringify(next));
  return saved;
}

export function deleteSavedComparison(id: string): void {
  const ls = getLocalStorage();
  if (!ls) return;

  const existing = listSavedComparisons();
  const next = existing.filter((x) => x.id !== id);
  ls.setItem(KEY, JSON.stringify(next));
}

export function clearSavedComparisons(): void {
  const ls = getLocalStorage();
  if (!ls) return;

  ls.removeItem(KEY);
}
