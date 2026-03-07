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
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

const slideInLeft = {
  hidden: { opacity: 0, x: -14 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

/* ─────────────────────── Static data (outside component) ───────────── */

const SUGGESTION_CHIPS = [
  { label: "Taladro percutor", emoji: "🔩" },
  { label: "Cemento Portland", emoji: "🧱" },
  { label: "Pintura interior", emoji: "🎨" },
  { label: "Sierra circular", emoji: "⚙️" },
  { label: "Pala con cabo", emoji: "⛏️" },
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
            exit={{ opacity: 0, y: -16, transition: { duration: 0.25 } }}
            className="space-y-7 pt-2"
          >
            {/* Hero section */}
            <motion.div variants={fadeUp} className="text-center space-y-5">
              {/* Icon with glow */}
              <div className="relative mx-auto w-fit">
                <div
                  className="absolute inset-0 rounded-3xl blur-3xl opacity-50"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(168,85,247,0.7) 0%, rgba(245,158,11,0.4) 60%, transparent 100%)",
                  }}
                />
                <motion.div
                  className="relative h-20 w-20 rounded-3xl mx-auto flex items-center justify-center"
                  style={{
                    background:
                      "linear-gradient(145deg, rgba(168,85,247,0.22) 0%, rgba(245,158,11,0.14) 100%)",
                    border: "1px solid rgba(168,85,247,0.28)",
                    boxShadow:
                      "0 0 40px rgba(168,85,247,0.18), inset 0 1px 0 rgba(255,255,255,0.08)",
                  }}
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <motion.div
                    animate={{ rotate: [0, 8, -8, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Sparkles className="h-9 w-9 text-purple-300" />
                  </motion.div>
                </motion.div>
              </div>

              {/* Heading */}
              <div className="space-y-2">
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
                  <span
                    style={{
                      background: "linear-gradient(135deg, #f8fafc 20%, rgba(245,158,11,0.85) 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    Asistente de compra
                  </span>
                  <br />
                  <span
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(168,85,247,0.9) 0%, rgba(245,158,11,0.85) 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    inteligente
                  </span>
                </h1>
                <p className="text-muted-foreground text-sm max-w-sm mx-auto leading-relaxed">
                  Describe el producto que necesitas y la IA te ayuda a elegir el ideal comparando precios en las mejores tiendas de México.
                </p>
              </div>
            </motion.div>

            {/* Search input */}
            <motion.div variants={fadeUp}>
              <div
                className="rounded-2xl p-[2px]"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(168,85,247,0.35) 0%, rgba(245,158,11,0.25) 50%, rgba(168,85,247,0.15) 100%)",
                  boxShadow: "0 0 48px rgba(168,85,247,0.07)",
                }}
              >
                <div
                  className="rounded-2xl flex items-center gap-2 px-4 py-2"
                  style={{
                    background: "var(--card)",
                    border: "1px solid rgba(255,255,255,0.04)",
                  }}
                >
                  <Search className="h-5 w-5 text-muted-foreground shrink-0" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && query.trim()) handleSearch();
                    }}
                    placeholder={typingPlaceholder || "ej: taladro percutor profesional..."}
                    className="border-0 bg-transparent shadow-none text-[15px] focus-visible:ring-0 focus-visible:ring-offset-0 px-0 h-11"
                  />
                  <Button
                    onClick={handleSearch}
                    disabled={!query.trim()}
                    className="shrink-0 rounded-xl h-9 px-4 text-sm font-semibold"
                    style={{
                      background: query.trim()
                        ? "linear-gradient(135deg, #d97706, #b45309)"
                        : undefined,
                      boxShadow: query.trim()
                        ? "0 4px 16px rgba(217,119,6,0.35)"
                        : undefined,
                    }}
                  >
                    Buscar
                    <ArrowRight className="h-4 w-4 ml-1.5" />
                  </Button>
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 rounded-xl px-4 py-3 text-sm text-red-400"
                  style={{
                    background: "rgba(239,68,68,0.08)",
                    border: "1px solid rgba(239,68,68,0.2)",
                  }}
                >
                  {error}
                </motion.div>
              )}
            </motion.div>

            {/* Suggestion chips */}
            <motion.div variants={fadeUp} className="space-y-3">
              <p className="text-xs text-muted-foreground text-center">Búsquedas frecuentes</p>
              <motion.div
                className="flex flex-wrap gap-2 justify-center"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                {SUGGESTION_CHIPS.map((chip) => (
                  <motion.button
                    key={chip.label}
                    variants={fadeUp}
                    onClick={() => {
                      setQuery(chip.label);
                      handleSearchWithQuery(chip.label);
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "var(--muted-foreground)",
                    }}
                    whileHover={{
                      scale: 1.04,
                      backgroundColor: "rgba(245,158,11,0.1)",
                      borderColor: "rgba(245,158,11,0.32)",
                      color: "#f59e0b",
                    }}
                    whileTap={{ scale: 0.96 }}
                  >
                    <span className="text-sm">{chip.emoji}</span>
                    {chip.label}
                  </motion.button>
                ))}
              </motion.div>
            </motion.div>

            {/* Feature cards */}
            <motion.div variants={fadeUp}>
              <div className="grid grid-cols-3 gap-3">
                {FEATURES.map(({ Icon, label, sub }) => (
                  <div
                    key={label}
                    className="rounded-xl p-3.5 text-center space-y-1.5"
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <div
                      className="h-8 w-8 rounded-lg mx-auto flex items-center justify-center"
                      style={{
                        background: "rgba(245,158,11,0.1)",
                        border: "1px solid rgba(245,158,11,0.15)",
                      }}
                    >
                      <Icon className="h-4 w-4 text-amber-500" />
                    </div>
                    <p className="text-xs font-semibold">{label}</p>
                    <p className="text-xs text-muted-foreground leading-snug">{sub}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* ── Cómo funciona: animated process flow ── */}
            <motion.div variants={fadeUp} className="space-y-5">
              <p
                className="text-center text-xs font-medium uppercase tracking-widest"
                style={{ color: "rgba(255,255,255,0.2)" }}
              >
                Cómo funciona
              </p>

              {/* Step cards with animated connector lines */}
              <div className="relative">
                {/* Connector line */}
                <div
                  className="absolute top-10 left-0 right-0 h-px hidden sm:block"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent 5%, rgba(245,158,11,0.18) 30%, rgba(168,85,247,0.18) 70%, transparent 95%)",
                  }}
                />
                <div className="grid grid-cols-3 gap-4 relative">
                  {[
                    {
                      emoji: "🔍",
                      step: "01",
                      title: "Describe lo que necesitas",
                      sub: "Escribe el producto o herramienta que buscas",
                      color: "rgba(245,158,11,0.7)",
                      bg: "rgba(245,158,11,0.08)",
                      border: "rgba(245,158,11,0.18)",
                    },
                    {
                      emoji: "🤖",
                      step: "02",
                      title: "La IA te hace preguntas",
                      sub: "Preguntas clave para entender tu caso específico",
                      color: "rgba(168,85,247,0.7)",
                      bg: "rgba(168,85,247,0.08)",
                      border: "rgba(168,85,247,0.18)",
                    },
                    {
                      emoji: "📦",
                      step: "03",
                      title: "Recibe recomendaciones",
                      sub: "Productos ideales para ti con pros, contras y precios",
                      color: "rgba(34,197,94,0.7)",
                      bg: "rgba(34,197,94,0.08)",
                      border: "rgba(34,197,94,0.18)",
                    },
                  ].map(({ emoji, step, title, sub, color, bg, border }, idx) => (
                    <motion.div
                      key={step}
                      className="rounded-xl p-4 text-center space-y-2.5 flex flex-col items-center"
                      style={{ background: bg, border: `1px solid ${border}` }}
                      animate={{ y: [0, -5, 0] }}
                      transition={{
                        duration: 3 + idx * 0.6,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: idx * 0.4,
                      }}
                    >
                      {/* Step badge + emoji */}
                      <div className="relative">
                        <motion.div
                          className="text-2xl select-none"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2.5, repeat: Infinity, delay: idx * 0.7 }}
                        >
                          {emoji}
                        </motion.div>
                        <div
                          className="absolute -top-1 -right-3 text-[9px] font-bold px-1 rounded"
                          style={{ background: color, color: "#000" }}
                        >
                          {step}
                        </div>
                      </div>
                      <p className="text-xs font-semibold leading-snug">{title}</p>
                      <p
                        className="text-[11px] leading-snug"
                        style={{ color: "rgba(255,255,255,0.38)" }}
                      >
                        {sub}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* ══════════════════════ LOADING (getting questions) ══════════════════════ */}
        {phase === "loading" && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center justify-center py-28 space-y-7"
          >
            {/* Pulsing orb */}
            <div className="relative">
              <motion.div
                className="h-24 w-24 rounded-full"
                style={{
                  background:
                    "radial-gradient(circle at 38% 38%, rgba(168,85,247,0.6) 0%, rgba(245,158,11,0.3) 55%, transparent 80%)",
                  boxShadow: "0 0 60px rgba(168,85,247,0.25)",
                }}
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.75, 1, 0.75],
                  boxShadow: [
                    "0 0 40px rgba(168,85,247,0.2)",
                    "0 0 70px rgba(168,85,247,0.35)",
                    "0 0 40px rgba(168,85,247,0.2)",
                  ],
                }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="h-9 w-9 text-purple-300" />
              </div>
            </div>

            <div className="text-center space-y-2">
              <p className="font-semibold text-xl">Analizando tu búsqueda</p>
              <p className="text-sm text-muted-foreground">
                Generando preguntas inteligentes para{" "}
                <span className="text-foreground font-medium">
                  &ldquo;{query}&rdquo;
                </span>
              </p>
            </div>

            {/* Bouncing dots */}
            <div className="flex items-center gap-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="h-2 w-2 rounded-full"
                  style={{ background: "rgba(245,158,11,0.8)" }}
                  animate={{ opacity: [0.25, 1, 0.25], y: [0, -6, 0] }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    delay: i * 0.18,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* ══════════════════════ ASKING ══════════════════════ */}
        {phase === "asking" && currentQuestion && (
          <motion.div
            key={`asking-${currentIdx}`}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-5"
          >
            {/* Top bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {productType && (
                  <Badge
                    className="text-xs border"
                    style={{
                      background: "rgba(245,158,11,0.12)",
                      color: "#fbbf24",
                      borderColor: "rgba(245,158,11,0.25)",
                    }}
                  >
                    {productType}
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">
                  Pregunta {currentIdx + 1} de {questions.length}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetAll}
                className="text-xs text-muted-foreground h-7 px-2.5 rounded-lg hover:text-foreground"
              >
                <RotateCcw className="h-3 w-3 mr-1.5" />
                Reiniciar
              </Button>
            </div>

            {/* Progress bar */}
            <div
              className="h-1.5 rounded-full overflow-hidden"
              style={{ background: "rgba(255,255,255,0.06)" }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: "linear-gradient(90deg, #a855f7, #f59e0b)",
                }}
                initial={{ width: `${(currentIdx / questions.length) * 100}%` }}
                animate={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
                transition={{ duration: 0.55, ease: "easeOut" }}
              />
            </div>

            {/* Answer history */}
            {history.length > 0 && (
              <motion.div
                className="space-y-1.5"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                {history.map((a) => (
                  <motion.div
                    key={a.questionId}
                    variants={slideInLeft}
                    className="flex items-center gap-2.5 rounded-xl px-3.5 py-2 text-xs text-muted-foreground"
                    style={{
                      background: "rgba(255,255,255,0.025)",
                      border: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span className="truncate flex-1">{a.questionTitle}</span>
                    <Badge
                      variant="secondary"
                      className="text-[10px] h-5 shrink-0"
                    >
                      {a.label}
                    </Badge>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Question card */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: "var(--card)",
                border: "1px solid rgba(168,85,247,0.18)",
                boxShadow:
                  "0 0 50px rgba(168,85,247,0.05), 0 2px 8px rgba(0,0,0,0.25)",
              }}
            >
              {/* Accent line */}
              <div
                className="h-[2px]"
                style={{
                  background:
                    "linear-gradient(90deg, #a855f7, #f59e0b, transparent)",
                }}
              />

              <div className="p-6">
                <p className="font-semibold text-[15px] leading-snug mb-1">
                  {currentQuestion.title}
                </p>
                {currentQuestion.description && (
                  <p className="text-xs text-muted-foreground mb-5 leading-relaxed">
                    {currentQuestion.description}
                  </p>
                )}
                {!currentQuestion.description && <div className="mb-5" />}

                {/* Options */}
                <motion.div
                  className="space-y-2"
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                >
                  {currentQuestion.options.map((opt, idx) => (
                    <motion.button
                      key={opt.value}
                      variants={fadeUp}
                      onClick={() => handleAnswer(opt.value, opt.label)}
                      className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm cursor-pointer group"
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.07)",
                      }}
                      whileHover={{
                        x: 5,
                        backgroundColor: "rgba(245,158,11,0.07)",
                        borderColor: "rgba(245,158,11,0.32)",
                        transition: { duration: 0.15 },
                      }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {/* Number badge */}
                      <span
                        className="h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                        style={{
                          background: "rgba(245,158,11,0.12)",
                          color: "rgba(245,158,11,0.9)",
                          border: "1px solid rgba(245,158,11,0.2)",
                        }}
                      >
                        {idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <span className="font-medium">{opt.label}</span>
                        {opt.hint && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {opt.hint}
                          </p>
                        )}
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-60 transition-opacity shrink-0" />
                    </motion.button>
                  ))}
                </motion.div>

                {/* Skip */}
                <div
                  className="mt-5 pt-4"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSkip}
                    className="text-xs text-muted-foreground h-7 px-2 hover:text-foreground"
                  >
                    Omitir esta pregunta →
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ══════════════════════ SEARCHING ══════════════════════ */}
        {phase === "searching" && (
          <motion.div
            key="searching"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="py-10 space-y-8"
          >
            {/* Animated header */}
            <div className="text-center space-y-4">
              <div className="relative mx-auto w-fit">
                <motion.div
                  className="h-20 w-20 rounded-full"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(245,158,11,0.55) 0%, rgba(251,146,60,0.25) 60%, transparent 80%)",
                    boxShadow: "0 0 50px rgba(245,158,11,0.2)",
                  }}
                  animate={{
                    scale: [1, 1.12, 1],
                    opacity: [0.7, 1, 0.7],
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <ShoppingBag className="h-8 w-8 text-amber-400" />
                </div>
              </div>
              <div>
                <p className="font-semibold text-xl">Buscando los mejores productos</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Comparando precios en tiempo real
                </p>
              </div>
            </div>

            {/* Steps panel */}
            <div
              className="rounded-2xl p-5 space-y-3.5"
              style={{
                background: "var(--card)",
                border: "1px solid rgba(255,255,255,0.06)",
                boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
              }}
            >
              {SEARCH_STEPS.map((step, i) => {
                const isDone = searchStep > i;
                const isActive = searchStep === i;
                return (
                  <motion.div
                    key={step.label}
                    initial={{ opacity: 0, x: -12 }}
                    animate={
                      searchStep >= i
                        ? { opacity: 1, x: 0 }
                        : { opacity: 0.2, x: -8 }
                    }
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="flex items-center gap-3"
                  >
                    {/* Step indicator */}
                    <div
                      className="h-7 w-7 rounded-full flex items-center justify-center shrink-0"
                      style={{
                        background: isDone
                          ? "rgba(16,185,129,0.15)"
                          : isActive
                          ? "rgba(245,158,11,0.15)"
                          : "rgba(255,255,255,0.03)",
                        border: isDone
                          ? "1px solid rgba(16,185,129,0.3)"
                          : isActive
                          ? "1px solid rgba(245,158,11,0.3)"
                          : "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      {isDone ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      ) : isActive ? (
                        <motion.div
                          className="h-3.5 w-3.5 rounded-full border-2 border-t-transparent"
                          style={{ borderColor: "rgba(245,158,11,0.8)", borderTopColor: "transparent" }}
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                        />
                      ) : (
                        <span className="text-[10px] text-muted-foreground">{i + 1}</span>
                      )}
                    </div>

                    <span
                      className="text-sm"
                      style={{
                        color: isDone
                          ? "var(--muted-foreground)"
                          : isActive
                          ? "var(--foreground)"
                          : "var(--muted-foreground)",
                        fontWeight: isActive ? 500 : 400,
                      }}
                    >
                      {isDone ? step.label.replace("...", "") : step.label}
                    </span>

                    {isDone && (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.7 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="ml-auto text-xs text-emerald-500"
                      >
                        ✓
                      </motion.span>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Answer profile chips */}
            {visibleAnswers.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center">
                <span className="text-xs text-muted-foreground self-center">Tu perfil:</span>
                {visibleAnswers.map((a) => (
                  <Badge
                    key={a.questionId}
                    className="text-xs border"
                    style={{
                      background: "rgba(168,85,247,0.1)",
                      color: "#c084fc",
                      borderColor: "rgba(168,85,247,0.2)",
                    }}
                  >
                    {a.label}
                  </Badge>
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
            {/* Error banner (if search failed) */}
            {error && (
              <motion.div
                variants={fadeUp}
                className="rounded-xl px-4 py-3 text-sm text-red-400"
                style={{
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.2)",
                }}
              >
                {error}
              </motion.div>
            )}

            {/* Answer profile */}
            {visibleAnswers.length > 0 && (
              <motion.div variants={fadeUp} className="flex flex-wrap gap-2 items-center">
                <span className="text-xs text-muted-foreground">Perfil de búsqueda:</span>
                {visibleAnswers.map((a) => (
                  <Badge
                    key={a.questionId}
                    className="text-xs border"
                    style={{
                      background: "rgba(168,85,247,0.1)",
                      color: "#c084fc",
                      borderColor: "rgba(168,85,247,0.2)",
                    }}
                  >
                    {a.label}
                  </Badge>
                ))}
              </motion.div>
            )}

            {/* AI Recommendation card */}
            {recommendation && (
              <motion.div variants={fadeUp}>
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{
                    border: "1px solid rgba(245,158,11,0.22)",
                    background:
                      "linear-gradient(135deg, rgba(245,158,11,0.07) 0%, rgba(251,146,60,0.04) 100%)",
                    boxShadow:
                      "0 0 40px rgba(245,158,11,0.07), inset 0 1px 0 rgba(245,158,11,0.07)",
                  }}
                >
                  <div
                    className="h-px"
                    style={{
                      background:
                        "linear-gradient(90deg, transparent 0%, #f59e0b 30%, #fb923c 70%, transparent 100%)",
                    }}
                  />
                  <div className="p-5 flex items-start gap-4">
                    <div
                      className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        background: "rgba(245,158,11,0.14)",
                        border: "1px solid rgba(245,158,11,0.22)",
                        boxShadow: "0 0 20px rgba(245,158,11,0.12)",
                      }}
                    >
                      <Sparkles className="h-5 w-5 text-amber-400" />
                    </div>
                    <div>
                      <p
                        className="text-[11px] font-bold uppercase tracking-widest mb-2"
                        style={{ color: "rgba(245,158,11,0.75)" }}
                      >
                        Recomendación del Asistente IA
                      </p>
                      <p className="text-sm leading-relaxed">{recommendation}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Results header */}
            {results.length > 0 && (
              <motion.div
                variants={fadeUp}
                className="flex items-center justify-between pt-1"
              >
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-amber-400" />
                  <span className="text-sm font-semibold">
                    {results.length} producto{results.length !== 1 ? "s" : ""} recomendado{results.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetAll}
                  className="text-xs text-muted-foreground h-7 px-2.5 rounded-lg"
                >
                  <RotateCcw className="h-3 w-3 mr-1.5" />
                  Nueva búsqueda
                </Button>
              </motion.div>
            )}

            {/* Product cards */}
            {results.length > 0 ? (
              <motion.div className="space-y-3" variants={staggerContainer}>
                {results.map((p, i) => (
                  <motion.div
                    key={i}
                    variants={fadeUp}
                    className="rounded-2xl overflow-hidden"
                    style={{
                      background: "var(--card)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
                      transition: "border-color 0.2s, box-shadow 0.2s, transform 0.2s",
                    }}
                    whileHover={{
                      y: -2,
                      boxShadow: "0 6px 28px rgba(245,158,11,0.1)",
                      borderColor: "rgba(245,158,11,0.24)",
                      transition: { duration: 0.2 },
                    }}
                  >
                    {/* Top relevance accent */}
                    {(p.relevance ?? 0) >= 8 && (
                      <div
                        className="h-[2px]"
                        style={{
                          background:
                            "linear-gradient(90deg, #f59e0b, #fb923c, transparent)",
                        }}
                      />
                    )}
                    <div className="p-4 flex gap-4">
                      {/* Product image */}
                      {p.image && (
                        <div
                          className="w-[72px] h-[72px] rounded-xl bg-white flex items-center justify-center shrink-0 overflow-hidden p-1.5"
                          style={{ border: "1px solid rgba(0,0,0,0.08)" }}
                        >
                          <img
                            src={p.image}
                            alt=""
                            className="max-w-full max-h-full object-contain"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.target as HTMLImageElement).parentElement!.style.display =
                                "none";
                            }}
                          />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        {/* Title + relevance score */}
                        <div className="flex items-start gap-2 justify-between">
                          <h4 className="font-semibold text-sm leading-snug line-clamp-2 flex-1">
                            {p.title}
                          </h4>
                          {(p.relevance ?? 0) > 0 && (
                            <div
                              className="flex items-center gap-1 shrink-0 rounded-lg px-2 py-0.5"
                              style={{
                                background: "rgba(245,158,11,0.1)",
                                border: "1px solid rgba(245,158,11,0.2)",
                              }}
                            >
                              <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                              <span className="text-xs font-bold text-amber-500">
                                {p.relevance}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Store */}
                        {p.source && (
                          <p className="text-xs text-muted-foreground mt-0.5">{p.source}</p>
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

                        {/* CTA button */}
                        <div className="mt-3">
                          <a href={p.url} target="_blank" rel="noreferrer">
                            <Button
                              size="sm"
                              className="h-7 text-xs rounded-lg font-medium"
                              style={{
                                background: "rgba(245,158,11,0.1)",
                                border: "1px solid rgba(245,158,11,0.22)",
                                color: "#f59e0b",
                              }}
                            >
                              <ExternalLink className="h-3 w-3 mr-1.5" />
                              Ver en {p.source || "tienda"}
                            </Button>
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
                  className="rounded-2xl p-12 text-center"
                  style={{
                    background: "var(--card)",
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <Package className="h-11 w-11 text-muted-foreground/30 mx-auto mb-3" />
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
                  className="rounded-2xl p-4 flex items-start gap-3"
                  style={{
                    background: "rgba(245,158,11,0.04)",
                    border: "1px solid rgba(245,158,11,0.1)",
                  }}
                >
                  <Lightbulb className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    <span className="font-semibold" style={{ color: "rgba(245,158,11,0.8)" }}>
                      Consejo:{" "}
                    </span>
                    {tip}
                  </p>
                </div>
              </motion.div>
            )}

            {/* Bottom search again */}
            <motion.div variants={fadeUp} className="flex justify-center pt-2">
              <Button
                variant="outline"
                onClick={resetAll}
                className="rounded-xl"
                style={{ borderColor: "rgba(255,255,255,0.1)" }}
              >
                <Search className="h-4 w-4 mr-2" />
                Buscar otro producto
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
