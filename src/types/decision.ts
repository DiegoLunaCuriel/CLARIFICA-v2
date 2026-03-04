export type DecisionQuestionType = "single" | "number" | "text";

export type DecisionOption = {
  label: string;
  value: string | number;
  hint?: string;
};

export type DecisionQuestion = {
  id: string;
  title: string;
  description?: string;
  type: DecisionQuestionType;
  required?: boolean;
  options?: DecisionOption[]; // para "single"
  min?: number;              // para "number"
  max?: number;              // para "number"
  placeholder?: string;      // para "text"/"number"
};

export type DecisionAnswers = Record<string, any>;

export type DecisionResult = {
  confidence: number;
  recommended?: {
    title: string;
    summary?: string;
    spec_suggestions?: string[];
    checks_and_warnings?: string[];
  };
  alternatives?: Array<{
    id: string;
    title: string;
    summary?: string;
    tradeoffs?: string[];
  }>;
};
export type EvidenceProduct = {
  title: string;
  url: string;
  snippet?: string;
  source?: string;
  image?: string;
};
