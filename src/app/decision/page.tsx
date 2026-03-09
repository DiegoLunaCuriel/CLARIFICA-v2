"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  RotateCcw,
  ExternalLink,
  Search,
  CheckCircle2,
  ShoppingBag,
  ThumbsUp,
  ThumbsDown,
  Lightbulb,
  Star,
  ChevronRight,
  ArrowRight,
  Package,
  Zap,
  Store,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTypingPlaceholder } from "@/components/ui/typing-effect";

/* ─────────────────────────────── Types ─────────────────────────────── */

type QuestionOption = { label: string; value: string; hint?: string };
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

/* ─────────────────────────── Framer variants ───────────────────────── */

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};

const slideInLeft = {
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

/* ─────────────────────── Static data (outside component) ───────────── */

const SUGGESTION_CHIPS = [
  { label: "Taladro percutor" },
  { label: "Cemento Portland" },
  { label: "Pintura interior" },
  { label: "Sierra circular" },
  { label: "Pala con cabo" },
];

const FEATURES = [
  { Icon: Store, label: "3 tiendas", sub: "MercadoLibre · Amazon · Home Depot" },
  { Icon: Sparkles, label: "IA Gemini", sub: "Análisis inteligente" },
  { Icon: Zap, label: "Pros & Contras", sub: "Por cada producto" },
];

const SEARCH_STEPS = [
  { label: "Perfil de búsqueda creado" },
  { label: "Consultando MercadoLibre..." },
  { label: "Consultando Amazon MX..." },
  { label: "Consultando Home Depot MX..." },
  { label: "Analizando resultados con IA..." },
];

/* ─────────────────────────────── Page ──────────────────────────────── */

export default function DecisionPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const autoSearchDone = useRef(false);

  const [query, setQuery] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState("");

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [productType, setProductType] = useState("");

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [history, setHistory] = useState<AnswerEntry[]>([]);

  const [results, setResults] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [tip, setTip] = useState("");

  const [searchStep, setSearchStep] = useState(0);
  const typingPlaceholder = useTypingPlaceholder();

  /* ── URL param auto-start ── */
  useEffect(() => {
    const q = searchParams?.get("q")?.trim();
    if (q && !autoSearchDone.current) {
      autoSearchDone.current = true;
      setQuery(q);
    }
  }, [searchParams]);

  useEffect(() => {
    if (autoSearchDone.current && query && phase === "idle") {
      handleSearchWithQuery(query);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  /* ── Searching step animation ── */
  useEffect(() => {
    if (phase !== "searching") { setSearchStep(0); return; }
    const timers = [
      setTimeout(() => setSearchStep(1), 700),
      setTimeout(() => setSearchStep(2), 1700),
      setTimeout(() => setSearchStep(3), 2700),
      setTimeout(() => setSearchStep(4), 3700),
    ];
    return () => timers.forEach(clearTimeout);
  }, [phase]);

  /* ── Step 1: Get questions ── */
  function handleSearch() { handleSearchWithQuery(query); }

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
        setError(data.error || "No pudimos generar preguntas. Intenta ser más específico.");
        setPhase("idle");
      } else {
        setPhase("asking");
      }
    } catch (e: unknown) {
      setError((e as Error)?.message || "Error inesperado");
      setPhase("idle");
    }
  }

  /* ── Answer a question ── */
  function handleAnswer(value: string, label: string) {
    const q = questions[currentIdx];
    if (!q) return;
    const newAnswers = { ...answers, [q.id]: value };
    const newHistory = [...history, { questionId: q.id, questionTitle: q.title, value, label }];
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
    const newHistory = [...history, { questionId: q.id, questionTitle: q.title, value: "any", label: "Omitido" }];
    setHistory(newHistory);
    const nextIdx = currentIdx + 1;
    if (nextIdx < questions.length) {
      setCurrentIdx(nextIdx);
    } else {
      doSearch(answers);
    }
  }

  /* ── Step 2: Search + analyze ── */
  async function doSearch(finalAnswers: Record<string, string>) {
    setPhase("searching");
    try {
      const res = await fetch("/next_api/decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "search", query: query.trim(), answers: finalAnswers }),
      });
      const data = await handleResponse(res);
      if (!data) return;
      setSearchQuery(data.searchQuery || "");
      setResults(data.results || []);
      setRecommendation(data.recommendation || "");
      setTip(data.tip || "");
      setPhase("done");
    } catch (e: unknown) {
      setError((e as Error)?.message || "Error al buscar productos");
      setPhase("done");
    }
  }

  async function handleResponse(res: Response) {
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("application/json")) {
      setError((await res.text()) || "Respuesta no-JSON del servidor");
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
  const visibleAnswers = history.filter((a) => a.value !== "any");

  /* ─────────────────────────────── Render ──────────────────────────── */

  return (
    <div className="max-w-2xl mx-auto pb-10">
      <AnimatePresence mode="wait">

        {/* ══════════════════════ IDLE ══════════════════════ */}
        {phase === "idle" && (
          <motion.div
            key="idle"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, y: -12, transition: { duration: 0.2 } }}
            className="space-y-8 pt-2"
          >
            {/* Header */}
            <motion.div variants={fadeUp} className="space-y-6">
              {/* Top border strip */}
              <div
                className="h-[3px] w-full"
                style={{ background: "linear-gradient(90deg, #a855f7, #f59e0b)" }}
              />

              <div className="flex items-start gap-4">
                {/* Icon */}
                <div
                  className="h-12 w-12 flex items-center justify-center shrink-0"
                  style={{
                    background: "#a855f7",
                    borderRadius: "4px",
                  }}
                >
                  <Sparkles className="h-6 w-6" style={{ color: "#0d0d0d" }} />
                </div>
                <div>
                  <h1
                    className="font-black text-3xl sm:text-4xl leading-none tracking-tight"
                    style={{ fontFamily: "'Syne', sans-serif" }}
                  >
                    Asistente de compra
                  </h1>
                  <p className="text-muted-foreground text-sm mt-2 leading-relaxed max-w-md">
                    Describe el producto que necesitas y la IA te ayuda a elegir el ideal
                    comparando precios en las mejores tiendas de México.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Search input */}
            <motion.div variants={fadeUp} className="space-y-3">
              <div
                className="flex items-center gap-2 px-4 py-2"
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "4px",
                }}
              >
                <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && query.trim()) handleSearch();
                  }}
                  placeholder={typingPlaceholder || "ej: taladro percutor profesional..."}
                  className="border-0 bg-transparent shadow-none text-sm focus-visible:ring-0 focus-visible:ring-offset-0 px-0 h-10"
                />
                <button
                  onClick={handleSearch}
                  disabled={!query.trim()}
                  className="shrink-0 flex items-center gap-1.5 px-4 py-2 text-sm font-semibold transition-all"
                  style={{
                    background: query.trim() ? "#f59e0b" : "var(--surface-2)",
                    color: query.trim() ? "#0d0d0d" : "#555",
                    borderRadius: "4px",
                    border: "none",
                    cursor: query.trim() ? "pointer" : "not-allowed",
                  }}
                >
                  Buscar
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

              {error && (
                <div
                  className="px-4 py-3 text-sm text-red-400"
                  style={{
                    background: "rgba(239,68,68,0.06)",
                    border: "1px solid rgba(239,68,68,0.18)",
                    borderRadius: "4px",
                  }}
                >
                  {error}
                </div>
              )}
            </motion.div>

            {/* Suggestion chips */}
            <motion.div variants={fadeUp} className="space-y-2">
              <p
                className="text-[10px] uppercase tracking-widest"
                style={{ fontFamily: "'JetBrains Mono', monospace", color: "#444" }}
              >
                Búsquedas frecuentes
              </p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTION_CHIPS.map((chip) => (
                  <button
                    key={chip.label}
                    onClick={() => {
                      setQuery(chip.label);
                      handleSearchWithQuery(chip.label);
                    }}
                    className="px-3 py-1.5 text-xs font-medium transition-all"
                    style={{
                      background: "var(--surface-2)",
                      border: "1px solid var(--border)",
                      borderRadius: "4px",
                      color: "#888",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "#f59e0b";
                      (e.currentTarget as HTMLElement).style.color = "#f59e0b";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                      (e.currentTarget as HTMLElement).style.color = "#888";
                    }}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Feature cards */}
            <motion.div variants={fadeUp}>
              <div
                className="grid grid-cols-3"
                style={{ border: "1px solid var(--border)", borderRadius: "4px", overflow: "hidden" }}
              >
                {FEATURES.map(({ Icon, label, sub }, idx) => (
                  <div
                    key={label}
                    className="p-4 text-center space-y-2"
                    style={{
                      background: "var(--surface-1)",
                      borderRight: idx < FEATURES.length - 1 ? "1px solid var(--border)" : "none",
                    }}
                  >
                    <div
                      className="h-8 w-8 mx-auto flex items-center justify-center"
                      style={{
                        background: "rgba(168,85,247,0.12)",
                        border: "1px solid rgba(168,85,247,0.2)",
                        borderRadius: "4px",
                      }}
                    >
                      <Icon className="h-4 w-4" style={{ color: "#a855f7" }} />
                    </div>
                    <p className="text-xs font-semibold">{label}</p>
                    <p className="text-[11px] text-muted-foreground leading-snug">{sub}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Cómo funciona */}
            <motion.div variants={fadeUp} className="space-y-4">
              <p
                className="text-[10px] uppercase tracking-widest"
                style={{ fontFamily: "'JetBrains Mono', monospace", color: "#444" }}
              >
                Cómo funciona
              </p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    step: "01",
                    title: "Describe lo que necesitas",
                    sub: "Escribe el producto o herramienta que buscas",
                    accentColor: "#f59e0b",
                  },
                  {
                    step: "02",
                    title: "La IA te hace preguntas",
                    sub: "Preguntas clave para entender tu caso específico",
                    accentColor: "#a855f7",
                  },
                  {
                    step: "03",
                    title: "Recibe recomendaciones",
                    sub: "Productos con pros, contras y precios comparados",
                    accentColor: "#10b981",
                  },
                ].map(({ step, title, sub, accentColor }) => (
                  <div
                    key={step}
                    className="p-4 space-y-2"
                    style={{
                      background: "var(--surface-1)",
                      border: "1px solid var(--border)",
                      borderTop: `3px solid ${accentColor}`,
                      borderRadius: "4px",
                    }}
                  >
                    <span
                      className="text-[10px] font-bold"
                      style={{ fontFamily: "'JetBrains Mono', monospace", color: accentColor }}
                    >
                      {step}
                    </span>
                    <p className="text-xs font-semibold leading-snug">{title}</p>
                    <p className="text-[11px] text-muted-foreground leading-snug">{sub}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* ══════════════════════ LOADING (getting questions) ══════════════════════ */}
        {phase === "loading" && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center justify-center py-32 space-y-6"
          >
            {/* Icon */}
            <div
              className="h-16 w-16 flex items-center justify-center"
              style={{ background: "#a855f7", borderRadius: "4px" }}
            >
              <Sparkles className="h-8 w-8" style={{ color: "#0d0d0d" }} />
            </div>

            <div className="text-center space-y-1.5">
              <p
                className="font-black text-xl"
                style={{ fontFamily: "'Syne', sans-serif" }}
              >
                Analizando tu búsqueda
              </p>
              <p className="text-sm text-muted-foreground">
                Generando preguntas para{" "}
                <span className="font-medium" style={{ color: "#f59e0b" }}>
                  &ldquo;{query}&rdquo;
                </span>
              </p>
            </div>

            <Loader2
              className="h-5 w-5 animate-spin"
              style={{ color: "#a855f7" }}
            />
          </motion.div>
        )}

        {/* ══════════════════════ ASKING ══════════════════════ */}
        {phase === "asking" && currentQuestion && (
          <motion.div
            key={`asking-${currentIdx}`}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-4"
          >
            {/* Top bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {productType && (
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider px-2 py-1"
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      background: "rgba(168,85,247,0.1)",
                      border: "1px solid rgba(168,85,247,0.2)",
                      color: "#a855f7",
                      borderRadius: "4px",
                    }}
                  >
                    {productType}
                  </span>
                )}
                <span
                  className="text-[10px] uppercase tracking-wider"
                  style={{ fontFamily: "'JetBrains Mono', monospace", color: "#555" }}
                >
                  {currentIdx + 1} / {questions.length}
                </span>
              </div>
              <button
                onClick={resetAll}
                className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors"
                style={{ background: "none", border: "none", cursor: "pointer" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.color = "#ebebeb";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.color = "#888";
                }}
              >
                <RotateCcw className="h-3 w-3" />
                Reiniciar
              </button>
            </div>

            {/* Progress bar */}
            <div
              className="h-1 overflow-hidden"
              style={{ background: "var(--surface-3)", borderRadius: "2px" }}
            >
              <motion.div
                className="h-full"
                style={{ background: "#a855f7", borderRadius: "2px" }}
                initial={{ width: `${(currentIdx / questions.length) * 100}%` }}
                animate={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>

            {/* Answer history */}
            {history.length > 0 && (
              <motion.div
                className="space-y-1"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                {history.map((a) => (
                  <motion.div
                    key={a.questionId}
                    variants={slideInLeft}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs text-muted-foreground"
                    style={{
                      background: "var(--surface-1)",
                      border: "1px solid var(--border)",
                      borderLeft: "2px solid #10b981",
                      borderRadius: "4px",
                    }}
                  >
                    <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                    <span className="truncate flex-1">{a.questionTitle}</span>
                    <span
                      className="text-[10px] font-medium px-1.5 py-0.5 shrink-0"
                      style={{
                        background: "var(--surface-3)",
                        border: "1px solid var(--border)",
                        borderRadius: "4px",
                      }}
                    >
                      {a.label}
                    </span>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Question card */}
            <div
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderTop: "3px solid #a855f7",
                borderRadius: "4px",
                overflow: "hidden",
              }}
            >
              <div className="p-5">
                <p className="font-semibold text-sm leading-snug mb-1">
                  {currentQuestion.title}
                </p>
                {currentQuestion.description && (
                  <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                    {currentQuestion.description}
                  </p>
                )}
                {!currentQuestion.description && <div className="mb-4" />}

                {/* Options */}
                <div className="space-y-2">
                  {currentQuestion.options.map((opt, idx) => (
                    <button
                      key={opt.value}
                      onClick={() => handleAnswer(opt.value, opt.label)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition-all"
                      style={{
                        background: "var(--surface-2)",
                        border: "1px solid var(--border)",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = "#a855f7";
                        (e.currentTarget as HTMLElement).style.borderLeft = "3px solid #a855f7";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                        (e.currentTarget as HTMLElement).style.borderLeft = "1px solid var(--border)";
                      }}
                    >
                      <span
                        className="h-6 w-6 flex items-center justify-center text-[10px] font-bold shrink-0"
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          background: "rgba(168,85,247,0.1)",
                          border: "1px solid rgba(168,85,247,0.2)",
                          color: "#a855f7",
                          borderRadius: "4px",
                        }}
                      >
                        {idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-sm">{opt.label}</span>
                        {opt.hint && (
                          <p className="text-xs text-muted-foreground mt-0.5">{opt.hint}</p>
                        )}
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </button>
                  ))}
                </div>

                {/* Skip */}
                <div
                  className="mt-4 pt-3"
                  style={{ borderTop: "1px solid var(--border)" }}
                >
                  <button
                    onClick={handleSkip}
                    className="text-xs text-muted-foreground transition-colors"
                    style={{ background: "none", border: "none", cursor: "pointer" }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.color = "#ebebeb";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.color = "#888";
                    }}
                  >
                    Omitir esta pregunta →
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ══════════════════════ SEARCHING ══════════════════════ */}
        {phase === "searching" && (
          <motion.div
            key="searching"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35 }}
            className="py-10 space-y-6"
          >
            {/* Header */}
            <div className="flex items-center gap-4">
              <div
                className="h-12 w-12 flex items-center justify-center shrink-0"
                style={{ background: "#f59e0b", borderRadius: "4px" }}
              >
                <ShoppingBag className="h-6 w-6" style={{ color: "#0d0d0d" }} />
              </div>
              <div>
                <p
                  className="font-black text-xl"
                  style={{ fontFamily: "'Syne', sans-serif" }}
                >
                  Buscando los mejores productos
                </p>
                <p className="text-sm text-muted-foreground">Comparando precios en tiempo real</p>
              </div>
            </div>

            {/* Steps panel */}
            <div
              className="space-y-0"
              style={{
                background: "var(--surface-1)",
                border: "1px solid var(--border)",
                borderRadius: "4px",
                overflow: "hidden",
              }}
            >
              {SEARCH_STEPS.map((step, i) => {
                const isDone = searchStep > i;
                const isActive = searchStep === i;
                return (
                  <motion.div
                    key={step.label}
                    initial={{ opacity: 0.2 }}
                    animate={{ opacity: searchStep >= i ? 1 : 0.25 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center gap-3 px-4 py-3"
                    style={{
                      borderBottom: i < SEARCH_STEPS.length - 1 ? "1px solid var(--border)" : "none",
                      borderLeft: isActive
                        ? "3px solid #f59e0b"
                        : isDone
                        ? "3px solid #10b981"
                        : "3px solid transparent",
                    }}
                  >
                    <div
                      className="h-6 w-6 flex items-center justify-center shrink-0"
                      style={{
                        background: isDone
                          ? "rgba(16,185,129,0.1)"
                          : isActive
                          ? "rgba(245,158,11,0.1)"
                          : "var(--surface-3)",
                        border: isDone
                          ? "1px solid rgba(16,185,129,0.25)"
                          : isActive
                          ? "1px solid rgba(245,158,11,0.25)"
                          : "1px solid var(--border)",
                        borderRadius: "4px",
                      }}
                    >
                      {isDone ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      ) : isActive ? (
                        <Loader2
                          className="h-3.5 w-3.5 animate-spin"
                          style={{ color: "#f59e0b" }}
                        />
                      ) : (
                        <span
                          className="text-[9px] font-bold"
                          style={{ fontFamily: "'JetBrains Mono', monospace", color: "#444" }}
                        >
                          {i + 1}
                        </span>
                      )}
                    </div>

                    <span
                      className="text-sm flex-1"
                      style={{
                        color: isDone ? "#555" : isActive ? "#ebebeb" : "#444",
                        fontWeight: isActive ? 500 : 400,
                      }}
                    >
                      {isDone ? step.label.replace("...", "") : step.label}
                    </span>

                    {isDone && (
                      <span className="text-xs text-emerald-500">✓</span>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Answer profile chips */}
            {visibleAnswers.length > 0 && (
              <div className="flex flex-wrap gap-2 items-center">
                <span
                  className="text-[10px] uppercase tracking-widest"
                  style={{ fontFamily: "'JetBrains Mono', monospace", color: "#444" }}
                >
                  Tu perfil:
                </span>
                {visibleAnswers.map((a) => (
                  <span
                    key={a.questionId}
                    className="text-[11px] px-2 py-1"
                    style={{
                      background: "rgba(168,85,247,0.08)",
                      border: "1px solid rgba(168,85,247,0.18)",
                      color: "#a855f7",
                      borderRadius: "4px",
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {a.label}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ══════════════════════ DONE (Results) ══════════════════════ */}
        {phase === "done" && (
          <motion.div
            key="done"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            {/* Error banner */}
            {error && (
              <motion.div
                variants={fadeUp}
                className="px-4 py-3 text-sm text-red-400"
                style={{
                  background: "rgba(239,68,68,0.06)",
                  border: "1px solid rgba(239,68,68,0.18)",
                  borderRadius: "4px",
                }}
              >
                {error}
              </motion.div>
            )}

            {/* Answer profile */}
            {visibleAnswers.length > 0 && (
              <motion.div variants={fadeUp} className="flex flex-wrap gap-2 items-center">
                <span
                  className="text-[10px] uppercase tracking-widest"
                  style={{ fontFamily: "'JetBrains Mono', monospace", color: "#555" }}
                >
                  Perfil:
                </span>
                {visibleAnswers.map((a) => (
                  <span
                    key={a.questionId}
                    className="text-[11px] px-2 py-1"
                    style={{
                      background: "rgba(168,85,247,0.08)",
                      border: "1px solid rgba(168,85,247,0.18)",
                      color: "#a855f7",
                      borderRadius: "4px",
                    }}
                  >
                    {a.label}
                  </span>
                ))}
              </motion.div>
            )}

            {/* AI Recommendation card */}
            {recommendation && (
              <motion.div variants={fadeUp}>
                <div
                  style={{
                    background: "var(--surface-1)",
                    border: "1px solid var(--border)",
                    borderLeft: "3px solid #f59e0b",
                    borderRadius: "4px",
                    overflow: "hidden",
                  }}
                >
                  <div className="p-4 flex items-start gap-3">
                    <div
                      className="h-8 w-8 flex items-center justify-center shrink-0"
                      style={{
                        background: "#f59e0b",
                        borderRadius: "4px",
                      }}
                    >
                      <Sparkles className="h-4 w-4" style={{ color: "#0d0d0d" }} />
                    </div>
                    <div>
                      <p
                        className="text-[10px] font-bold uppercase tracking-widest mb-1.5"
                        style={{ fontFamily: "'JetBrains Mono', monospace", color: "#f59e0b" }}
                      >
                        Recomendación IA
                      </p>
                      <p className="text-sm leading-relaxed">{recommendation}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Results header */}
            {results.length > 0 && (
              <motion.div variants={fadeUp} className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4" style={{ color: "#f59e0b" }} />
                  <span
                    className="text-sm font-semibold"
                    style={{ fontFamily: "'Syne', sans-serif" }}
                  >
                    {results.length} producto{results.length !== 1 ? "s" : ""} recomendado{results.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <button
                  onClick={resetAll}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors"
                  style={{ background: "none", border: "none", cursor: "pointer" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.color = "#ebebeb";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.color = "#888";
                  }}
                >
                  <RotateCcw className="h-3 w-3" />
                  Nueva búsqueda
                </button>
              </motion.div>
            )}

            {/* Product cards */}
            {results.length > 0 ? (
              <motion.div className="space-y-3" variants={staggerContainer}>
                {results.map((p, i) => (
                  <motion.div
                    key={i}
                    variants={fadeUp}
                    style={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderTop: (p.relevance ?? 0) >= 8 ? "3px solid #f59e0b" : "1px solid var(--border)",
                      borderRadius: "4px",
                      overflow: "hidden",
                    }}
                  >
                    <div className="p-4 flex gap-4">
                      {/* Product image */}
                      {p.image && (
                        <div
                          className="w-[68px] h-[68px] flex items-center justify-center shrink-0 overflow-hidden p-1.5"
                          style={{
                            background: "#fff",
                            border: "1px solid #e5e5e5",
                            borderRadius: "4px",
                          }}
                        >
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
                        <div className="flex items-start gap-2 justify-between">
                          <h4 className="font-semibold text-sm leading-snug line-clamp-2 flex-1">
                            {p.title}
                          </h4>
                          {(p.relevance ?? 0) > 0 && (
                            <div
                              className="flex items-center gap-1 shrink-0 px-1.5 py-0.5"
                              style={{
                                background: "rgba(245,158,11,0.08)",
                                border: "1px solid rgba(245,158,11,0.18)",
                                borderRadius: "4px",
                              }}
                            >
                              <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                              <span
                                className="text-[11px] font-bold text-amber-500"
                                style={{ fontFamily: "'JetBrains Mono', monospace" }}
                              >
                                {p.relevance}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Store */}
                        {p.source && (
                          <p
                            className="text-[11px] mt-0.5"
                            style={{
                              fontFamily: "'JetBrains Mono', monospace",
                              color: "#555",
                            }}
                          >
                            {p.source}
                          </p>
                        )}

                        {/* Snippet */}
                        {p.snippet && (
                          <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                            {p.snippet}
                          </p>
                        )}

                        {/* Pros & Cons */}
                        {((p.pros?.length ?? 0) > 0 || (p.cons?.length ?? 0) > 0) && (
                          <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1.5">
                            {(p.pros ?? []).map((pro, j) => (
                              <div
                                key={`pro-${j}`}
                                className="flex items-center gap-1 text-xs text-emerald-500"
                              >
                                <ThumbsUp className="h-2.5 w-2.5" />
                                <span>{pro}</span>
                              </div>
                            ))}
                            {(p.cons ?? []).map((con, j) => (
                              <div
                                key={`con-${j}`}
                                className="flex items-center gap-1 text-xs text-red-400"
                              >
                                <ThumbsDown className="h-2.5 w-2.5" />
                                <span>{con}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* CTA */}
                        <div className="mt-3">
                          <a
                            href={p.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 transition-all"
                            style={{
                              background: "var(--surface-2)",
                              border: "1px solid var(--border)",
                              borderRadius: "4px",
                              color: "#f59e0b",
                              textDecoration: "none",
                            }}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLElement).style.background = "rgba(245,158,11,0.08)";
                              (e.currentTarget as HTMLElement).style.borderColor = "rgba(245,158,11,0.3)";
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLElement).style.background = "var(--surface-2)";
                              (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                            }}
                          >
                            <ExternalLink className="h-3 w-3" />
                            Ver en {p.source || "tienda"}
                          </a>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              !error && (
                <motion.div
                  variants={fadeUp}
                  className="p-12 text-center"
                  style={{
                    background: "var(--surface-1)",
                    border: "1px solid var(--border)",
                    borderRadius: "4px",
                  }}
                >
                  <Package className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No se encontraron productos. Intenta con otro nombre.
                  </p>
                </motion.div>
              )
            )}

            {/* Buying tip */}
            {tip && (
              <motion.div variants={fadeUp}>
                <div
                  className="p-4 flex items-start gap-3"
                  style={{
                    background: "var(--surface-1)",
                    border: "1px solid var(--border)",
                    borderLeft: "3px solid #f59e0b",
                    borderRadius: "4px",
                  }}
                >
                  <Lightbulb className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    <span className="font-semibold" style={{ color: "#f59e0b" }}>
                      Consejo:{" "}
                    </span>
                    {tip}
                  </p>
                </div>
              </motion.div>
            )}

            {/* Search again */}
            <motion.div variants={fadeUp} className="flex justify-center pt-2">
              <button
                onClick={resetAll}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all"
                style={{
                  background: "var(--surface-1)",
                  border: "1px solid var(--border)",
                  borderRadius: "4px",
                  color: "#888",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "#f59e0b";
                  (e.currentTarget as HTMLElement).style.color = "#f59e0b";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                  (e.currentTarget as HTMLElement).style.color = "#888";
                }}
              >
                <Search className="h-4 w-4" />
                Buscar otro producto
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
