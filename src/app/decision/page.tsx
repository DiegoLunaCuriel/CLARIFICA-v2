"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  RotateCcw,
  ExternalLink,
  Search,
  CheckCircle2,
  Loader2,
  ShoppingBag,
  ThumbsUp,
  ThumbsDown,
  Lightbulb,
  Star,
} from "lucide-react";
import { AnimateOnScroll } from "@/components/ui/animate-on-scroll";
import { useTypingPlaceholder } from "@/components/ui/typing-effect";
import { BlockStacker } from "@/components/ui/block-stacker";

/* ── Types ─────────────────────────────────────────────── */

type QuestionOption = {
  label: string;
  value: string;
  hint?: string;
};

type Question = {
  id: string;
  title: string;
  description?: string;
  options: QuestionOption[];
};

type Product = {
  title: string;
  url: string;
  snippet?: string;
  source?: string;
  image?: string;
  pros?: string[];
  cons?: string[];
  relevance?: number;
};

type Phase = "idle" | "loading" | "asking" | "searching" | "done";

interface AnswerEntry {
  questionId: string;
  questionTitle: string;
  value: string;
  label: string;
}

/* ── Component ─────────────────────────────────────────── */

export default function DecisionPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const autoSearchDone = useRef(false);

  const [query, setQuery] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState("");

  // Questions from Gemini
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [productType, setProductType] = useState("");

  // Answers
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [history, setHistory] = useState<AnswerEntry[]>([]);

  // Final results + analysis
  const [results, setResults] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [tip, setTip] = useState("");

  // Auto-start search from ?q= param (e.g. from dashboard)
  useEffect(() => {
    const q = searchParams?.get("q")?.trim();
    if (q && !autoSearchDone.current) {
      autoSearchDone.current = true;
      setQuery(q);
    }
  }, [searchParams]);

  // When query is set from URL param, auto-trigger search
  useEffect(() => {
    if (autoSearchDone.current && query && phase === "idle") {
      handleSearchWithQuery(query);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  /* ── Step 1: Get questions from Gemini ── */
  function handleSearch() {
    handleSearchWithQuery(query);
  }

  async function handleSearchWithQuery(q: string) {
    if (!q.trim()) return;
    setPhase("loading");
    setError("");
    setQuestions([]);
    setCurrentIdx(0);
    setAnswers({});
    setHistory([]);
    setResults([]);
    setSearchQuery("");
    setProductType("");
    setRecommendation("");
    setTip("");

    try {
      const res = await fetch("/next_api/decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "questions", query: q.trim() }),
      });
      const data = await handleResponse(res);
      if (!data) return;

      setProductType(data.productType || "");
      const qs: Question[] = data.questions || [];
      setQuestions(qs);

      if (qs.length === 0) {
        setError(
          data.error ||
          "No pudimos generar preguntas. Intenta ser más específico."
        );
        setPhase("idle");
      } else {
        setPhase("asking");
      }
    } catch (e: any) {
      setError(e?.message || "Error inesperado");
      setPhase("idle");
    }
  }

  /* ── Answer a question ── */
  function handleAnswer(value: string, label: string) {
    const q = questions[currentIdx];
    if (!q) return;

    const newAnswers = { ...answers, [q.id]: value };
    const newHistory = [
      ...history,
      { questionId: q.id, questionTitle: q.title, value, label },
    ];

    setAnswers(newAnswers);
    setHistory(newHistory);

    const nextIdx = currentIdx + 1;
    if (nextIdx < questions.length) {
      setCurrentIdx(nextIdx);
    } else {
      doSearch(newAnswers);
    }
  }

  /* ── Skip question ── */
  function handleSkip() {
    const q = questions[currentIdx];
    if (!q) return;

    const newHistory = [
      ...history,
      { questionId: q.id, questionTitle: q.title, value: "any", label: "Omitido" },
    ];
    setHistory(newHistory);

    const nextIdx = currentIdx + 1;
    if (nextIdx < questions.length) {
      setCurrentIdx(nextIdx);
    } else {
      doSearch(answers);
    }
  }

  /* ── Step 2: Search with enriched query + Gemini analysis ── */
  async function doSearch(finalAnswers: Record<string, string>) {
    setPhase("searching");

    try {
      const res = await fetch("/next_api/decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "search",
          query: query.trim(),
          answers: finalAnswers,
        }),
      });
      const data = await handleResponse(res);
      if (!data) return;

      setSearchQuery(data.searchQuery || "");
      setResults(data.results || []);
      setRecommendation(data.recommendation || "");
      setTip(data.tip || "");
      setPhase("done");
    } catch (e: any) {
      setError(e?.message || "Error al buscar productos");
      setPhase("done");
    }
  }

  async function handleResponse(res: Response) {
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("application/json")) {
      const txt = await res.text();
      setError(txt || "Respuesta no-JSON del servidor");
      setPhase("idle");
      return null;
    }
    const data = await res.json();
    if (!res.ok) {
      setError(data?.error || `Error HTTP ${res.status}`);
      setPhase("idle");
      return null;
    }
    return data;
  }

  function resetAll() {
    autoSearchDone.current = false;
    router.replace("/decision", { scroll: false });
    setQuery("");
    setPhase("idle");
    setError("");
    setQuestions([]);
    setCurrentIdx(0);
    setProductType("");
    setAnswers({});
    setHistory([]);
    setResults([]);
    setSearchQuery("");
    setRecommendation("");
    setTip("");
  }

  const currentQuestion = questions[currentIdx] || null;
  const typingPlaceholder = useTypingPlaceholder();

  /* ── Render ── */
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="animate-in fade-in slide-in-from-bottom-3 duration-500">
        <div className="flex items-center gap-3">
          <div
            className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: "linear-gradient(135deg, rgba(168,85,247,0.2), rgba(139,92,246,0.1))",
              border: "1px solid rgba(168,85,247,0.25)",
              boxShadow: "0 0 16px rgba(168,85,247,0.12)",
            }}
          >
            <Sparkles className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Asistente de compra inteligente</h1>
            <p className="text-sm text-muted-foreground">
              Escribe el producto que buscas y te ayudo a encontrar el mejor para ti.
            </p>
          </div>
        </div>
      </div>

      {/* ── Search bar ── */}
      <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: "100ms", animationFillMode: "both" }}>
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && phase === "idle") handleSearch();
                }}
                placeholder={phase === "idle" ? typingPlaceholder || "ej: taladro, cemento..." : "Buscando..."}
                className="pl-10"
                disabled={phase !== "idle"}
              />
            </div>
            {phase === "idle" ? (
              <Button onClick={handleSearch} disabled={!query.trim()} className="bg-amber-600 hover:bg-amber-500 text-white">
                <Search className="h-4 w-4 mr-2" />
                Buscar
              </Button>
            ) : (
              <Button variant="outline" onClick={resetAll}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reiniciar
              </Button>
            )}
          </div>
          {error && (
            <div className="mt-3 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Block stacker game (idle, loading, searching) ── */}
      {(phase === "idle" || phase === "loading" || phase === "searching") && (
        <div className="relative">
          {/* Loading overlay badge */}
          {phase === "loading" && (
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-card/90 backdrop-blur-sm border rounded-full px-4 py-1.5 shadow-sm">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-xs text-muted-foreground">
                Analizando <span className="font-medium text-foreground">{query}</span>...
              </span>
            </div>
          )}

          {/* Searching overlay badge */}
          {phase === "searching" && (
            <div className="space-y-2">
              {history.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {history
                    .filter((a) => a.value !== "any")
                    .map((a) => (
                      <Badge key={a.questionId} variant="secondary">
                        {a.label}
                      </Badge>
                    ))}
                </div>
              )}
              <div className="relative">
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-card/90 backdrop-blur-sm border rounded-full px-4 py-1.5 shadow-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-xs text-muted-foreground">Buscando productos...</span>
                </div>
                <BlockStacker />
              </div>
            </div>
          )}

          {/* Game area (idle and loading) */}
          {phase !== "searching" && <BlockStacker />}
        </div>
      )}

      {/* ── Asking questions ── */}
      {phase === "asking" && (
        <div className="space-y-4">
          {/* Product type badge */}
          {productType && (
            <Badge variant="secondary" className="text-xs bg-amber-500/15 text-amber-300 border-amber-500/30">
              {productType}
            </Badge>
          )}

          {/* Previous answers */}
          {history.map((a) => (
            <div
              key={a.questionId}
              className="flex items-center gap-2 text-sm text-muted-foreground"
            >
              <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
              <span className="truncate">{a.questionTitle}</span>
              <Badge variant="outline" className="ml-auto shrink-0">
                {a.label}
              </Badge>
            </div>
          ))}

          {/* Current question */}
          {currentQuestion && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-1">
                  <p className="font-medium text-sm">{currentQuestion.title}</p>
                  <span className="text-xs text-muted-foreground ml-4 shrink-0">
                    {currentIdx + 1}/{questions.length}
                  </span>
                </div>
                {currentQuestion.description && (
                  <p className="text-xs text-muted-foreground mb-4">
                    {currentQuestion.description}
                  </p>
                )}

                <div className="space-y-2 mt-4">
                  {currentQuestion.options.map((opt, idx) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleAnswer(opt.value, opt.label)}
                      className="w-full flex items-start gap-3 rounded-xl border border-border/60 bg-background/80 px-4 py-3 text-left text-sm transition-all duration-200 cursor-pointer animate-in fade-in slide-in-from-left-4 group"
                      style={{
                        animationDelay: `${idx * 80}ms`,
                        animationFillMode: "both",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = "rgba(245,158,11,0.4)";
                        (e.currentTarget as HTMLElement).style.background = "rgba(245,158,11,0.06)";
                        (e.currentTarget as HTMLElement).style.transform = "translateX(2px)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = "";
                        (e.currentTarget as HTMLElement).style.background = "";
                        (e.currentTarget as HTMLElement).style.transform = "";
                      }}
                    >
                      <span
                        className="flex items-center justify-center h-6 w-6 rounded-lg text-xs font-bold shrink-0 transition-colors"
                        style={{
                          background: "rgba(245,158,11,0.12)",
                          color: "rgba(245,158,11,0.8)",
                          border: "1px solid rgba(245,158,11,0.2)",
                        }}
                      >
                        {idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{opt.label}</div>
                        {opt.hint && (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {opt.hint}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="mt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSkip}
                    className="text-muted-foreground"
                  >
                    Omitir
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ── Done: final results ── */}
      {phase === "done" && (
        <div className="space-y-4">
          {/* Answers summary */}
          {history.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Basado en tus respuestas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {history
                    .filter((a) => a.value !== "any")
                    .map((a) => (
                      <Badge key={a.questionId} variant="secondary">
                        {a.label}
                      </Badge>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI Recommendation */}
          {recommendation && (
            <div className="animate-in fade-in zoom-in-95 duration-500">
              <Card
                className="overflow-hidden"
                style={{
                  border: "1px solid rgba(245,158,11,0.3)",
                  background: "linear-gradient(135deg, rgba(245,158,11,0.06), rgba(251,146,60,0.03))",
                  boxShadow: "0 0 24px rgba(245,158,11,0.1)",
                }}
              >
                <div className="h-0.5" style={{ background: "linear-gradient(90deg, #f59e0b, #fb923c)" }} />
                <CardContent className="pt-5">
                  <div className="flex items-start gap-3">
                    <div
                      className="rounded-xl p-2 shrink-0"
                      style={{
                        background: "rgba(245,158,11,0.15)",
                        boxShadow: "0 0 12px rgba(245,158,11,0.2)",
                      }}
                    >
                      <Sparkles className="h-5 w-5 text-amber-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-amber-400 mb-1.5">
                        Recomendación del asistente
                      </p>
                      <p className="text-sm text-foreground leading-relaxed">{recommendation}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Product results */}
          {results.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <ShoppingBag className="h-4 w-4 text-amber-400" />
                {results.length} producto
                {results.length !== 1 ? "s" : ""} recomendado
                {results.length !== 1 ? "s" : ""}
              </div>

              {results.map((p, i) => (
                <AnimateOnScroll key={i} delay={i * 0.08}>
                  <Card
                    className="overflow-hidden hover:shadow-md hover:border-amber-500/30 transition-all"
                  >
                    <CardContent className="p-0">
                      <div className="flex items-start gap-4 p-4">
                        {/* Image */}
                        {p.image && (
                          <div className="w-20 h-20 rounded-md bg-white flex items-center justify-center shrink-0 p-1 overflow-hidden">
                            <img
                              src={p.image}
                              alt=""
                              className="max-w-full max-h-full object-contain"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                (e.target as HTMLImageElement).parentElement!.style.display = "none";
                              }}
                            />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          {/* Title + relevance */}
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-medium text-sm line-clamp-2">
                              {p.title}
                            </h4>
                            {(p.relevance ?? 0) > 0 && (
                              <div className="flex items-center gap-1 shrink-0">
                                <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                                <span className="text-xs font-medium text-amber-600">
                                  {p.relevance}/10
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Store */}
                          {p.source && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {p.source}
                            </p>
                          )}

                          {/* Why / snippet */}
                          {p.snippet && (
                            <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">
                              {p.snippet}
                            </p>
                          )}

                          {/* Pros and Cons */}
                          {((p.pros && p.pros.length > 0) || (p.cons && p.cons.length > 0)) && (
                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                              {(p.pros || []).map((pro, j) => (
                                <div
                                  key={`pro-${j}`}
                                  className="flex items-center gap-1 text-xs text-green-600"
                                >
                                  <ThumbsUp className="h-3 w-3" />
                                  <span>{pro}</span>
                                </div>
                              ))}
                              {(p.cons || []).map((con, j) => (
                                <div
                                  key={`con-${j}`}
                                  className="flex items-center gap-1 text-xs text-red-500"
                                >
                                  <ThumbsDown className="h-3 w-3" />
                                  <span>{con}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Link */}
                          <div className="mt-3">
                            <a
                              href={p.url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <Button variant="outline" size="sm" className="text-xs h-7">
                                <ExternalLink className="h-3 w-3 mr-1.5" />
                                Ver en {p.source || "tienda"}
                              </Button>
                            </a>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </AnimateOnScroll>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  No se encontraron productos. Intenta con otro nombre.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Buying tip */}
          {tip && (
            <Card className="bg-muted/50">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Consejo: </span>
                    {tip}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Search again */}
          <div className="flex justify-center pt-2">
            <Button variant="outline" onClick={resetAll}>
              <Search className="h-4 w-4 mr-2" />
              Buscar otro producto
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
