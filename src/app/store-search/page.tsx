"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Search,
  ExternalLink,
  GitCompare,
  ImageOff,
  Package,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* ─────────────────────────── Types ─────────────────────────── */

type GoogleItem = {
  title: string;
  link: string;
  snippet: string;
  displayLink: string;
  image?: string | null;
  favicon?: string | null;
  score?: number;
  flags?: string[];
};

type StoreResult = {
  storeId: string;
  storeName: string;
  site: string;
  finalQuery?: string;
  items: GoogleItem[];
};

type ApiResponse = {
  success: boolean;
  data?: {
    mode?: string;
    fetchedAt?: string;
    normalizedQuery?: string;
    stores?: StoreResult[];
    assistantPlan?: { ui?: { chips?: string[] } } | null;
    errors?: Array<{ storeId?: string; message: string }>;
  };
  errorMessage?: string;
};

/* ─────────────────────────── Constants ─────────────────────── */

const STORES = [
  { storeId: "all", storeName: "Todas las tiendas" },
  { storeId: "home_depot", storeName: "Home Depot" },
  { storeId: "mercado_libre", storeName: "Mercado Libre" },
  { storeId: "amazon", storeName: "Amazon" },
];

const STORE_THEME = {
  home_depot: {
    color: "#f97316",
    glow: "rgba(249,115,22,0.15)",
    border: "rgba(249,115,22,0.28)",
    headerBg: "rgba(249,115,22,0.06)",
  },
  mercado_libre: {
    color: "#eab308",
    glow: "rgba(234,179,8,0.15)",
    border: "rgba(234,179,8,0.28)",
    headerBg: "rgba(234,179,8,0.06)",
  },
  amazon: {
    color: "#3b82f6",
    glow: "rgba(59,130,246,0.15)",
    border: "rgba(59,130,246,0.28)",
    headerBg: "rgba(59,130,246,0.06)",
  },
} as const;

type StoreThemeKey = keyof typeof STORE_THEME;

type UiState = "idle" | "loading" | "success" | "error";

/* ─────────────────────── Framer variants ───────────────────── */

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
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

/* ──────────────────────── Skeleton card ────────────────────── */

function SkeletonCard({ accentColor }: { accentColor?: string }) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "var(--card)",
        border: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      {accentColor && (
        <div
          className="h-[2px]"
          style={{ background: `linear-gradient(90deg, ${accentColor}, transparent 80%)` }}
        />
      )}
      <div className="animate-pulse">
        <div
          className="w-full aspect-[4/3]"
          style={{ background: "rgba(255,255,255,0.04)" }}
        />
        <div className="p-3 space-y-2.5">
          <div className="h-4 w-4/5 rounded-lg" style={{ background: "rgba(255,255,255,0.05)" }} />
          <div className="h-3 w-2/5 rounded-lg" style={{ background: "rgba(255,255,255,0.04)" }} />
          <div className="h-3 w-full rounded-lg" style={{ background: "rgba(255,255,255,0.04)" }} />
          <div className="h-8 w-full rounded-xl mt-1" style={{ background: "rgba(255,255,255,0.05)" }} />
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────── Product card ─────────────────────── */

function ProductCard({
  item,
  storeId,
  compareHref,
}: {
  item: GoogleItem;
  storeId: string;
  compareHref: string;
}) {
  const [imgError, setImgError] = useState(false);
  const theme = STORE_THEME[storeId as StoreThemeKey];

  return (
    <motion.div
      className="rounded-2xl overflow-hidden flex flex-col"
      style={{
        background: "var(--card)",
        border: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
      }}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{
        y: -4,
        boxShadow: theme
          ? `0 12px 40px ${theme.glow}`
          : "0 12px 40px rgba(245,158,11,0.12)",
        borderColor: theme?.border || "rgba(245,158,11,0.3)",
        transition: { duration: 0.2 },
      }}
    >
      {/* Store accent top bar */}
      {theme && (
        <div
          className="h-[2px] shrink-0"
          style={{
            background: `linear-gradient(90deg, ${theme.color}, transparent 80%)`,
          }}
        />
      )}

      {/* Image area */}
      <div className="w-full aspect-[4/3] bg-white flex items-center justify-center overflow-hidden relative p-3">
        {item.image && !imgError ? (
          <img
            src={item.image}
            alt={item.title}
            className="max-w-full max-h-full object-contain transition-transform duration-300 hover:scale-105"
            referrerPolicy="no-referrer"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex items-center text-muted-foreground/25">
            <ImageOff className="h-10 w-10" />
          </div>
        )}
        {item.favicon && (
          <div
            className="absolute top-2 left-2 rounded-full p-1 shadow-sm"
            style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
          >
            <img
              src={item.favicon}
              alt=""
              className="h-4 w-4 rounded-full"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 space-y-2 flex-1 flex flex-col">
        <div className="flex-1">
          <h4 className="font-medium text-[13px] leading-snug line-clamp-2">{item.title}</h4>
          <p className="text-[11px] text-muted-foreground/60 mt-0.5 truncate">
            {item.displayLink}
          </p>
        </div>
        {item.snippet && (
          <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
            {item.snippet}
          </p>
        )}
        <div className="pt-1.5 flex gap-2 mt-auto">
          <a className="flex-1" href={item.link} target="_blank" rel="noreferrer">
            <Button
              size="sm"
              className="w-full text-xs h-8 rounded-xl font-medium"
              style={
                theme
                  ? {
                      background: `${theme.color}18`,
                      border: `1px solid ${theme.border}`,
                      color: theme.color,
                    }
                  : {}
              }
            >
              <ExternalLink className="h-3 w-3 mr-1.5" />
              Ver producto
            </Button>
          </a>
          <Link href={compareHref}>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2.5 rounded-xl"
              title="Comparar precios"
              style={{ borderColor: "rgba(255,255,255,0.1)" }}
            >
              <GitCompare className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

/* ──────────────────────── Store block ──────────────────────── */

function StoreBlock({
  store,
  compareHref,
}: {
  store: StoreResult;
  compareHref: (title: string) => string;
}) {
  const items = store.items || [];
  const theme = STORE_THEME[store.storeId as StoreThemeKey];

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Store header */}
      <div
        className="flex items-center justify-between px-4 py-3 rounded-2xl"
        style={{
          background: theme?.headerBg || "rgba(255,255,255,0.03)",
          border: `1px solid ${theme?.border || "rgba(255,255,255,0.07)"}`,
        }}
      >
        <div className="flex items-center gap-2.5">
          {theme && (
            <div
              className="h-3 w-3 rounded-full shrink-0"
              style={{
                background: theme.color,
                boxShadow: `0 0 8px ${theme.color}`,
              }}
            />
          )}
          <span
            className="font-semibold text-sm"
            style={{ color: theme?.color || "inherit" }}
          >
            {store.storeName}
          </span>
        </div>
        <Badge
          variant="secondary"
          className="text-[11px] font-normal"
        >
          {items.length} resultado{items.length !== 1 ? "s" : ""}
        </Badge>
      </div>

      {items.length === 0 ? (
        <div
          className="rounded-2xl px-6 py-8 text-center"
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px dashed rgba(255,255,255,0.07)",
          }}
        >
          <p className="text-sm text-muted-foreground">
            Sin resultados en {store.storeName} para esta búsqueda.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {items.map((item, idx) => (
            <ProductCard
              key={`${store.storeId}-${idx}`}
              item={item}
              storeId={store.storeId}
              compareHref={compareHref(item.title)}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}

/* ───────────────────────────── Page ────────────────────────── */

export default function StoreSearchPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams?.get("query") ?? "");
  const [storeId, setStoreId] = useState(searchParams?.get("storeId") ?? "all");
  const [limit] = useState(Number(searchParams?.get("limit") ?? "7") || 7);
  const [live] = useState(searchParams?.get("live") === "1");

  const [uiState, setUiState] = useState<UiState>("idle");
  const [stores, setStores] = useState<StoreResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [chips, setChips] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>("all");

  const updateUrl = (next: { query?: string; storeId?: string }) => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    if (next.query !== undefined) {
      const q = next.query.trim();
      if (q) params.set("query", q);
      else params.delete("query");
    }
    if (next.storeId !== undefined) {
      if (next.storeId && next.storeId !== "all") params.set("storeId", next.storeId);
      else params.delete("storeId");
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  };

  const endpointUrl = useMemo(() => {
    const params = new URLSearchParams();
    params.set("query", query.trim());
    if (storeId !== "all") params.set("storeId", storeId);
    params.set("limit", String(limit));
    if (live) params.set("live", "1");
    return `/next_api/prices/search?${params.toString()}`;
  }, [query, storeId, limit, live]);

  const compareHref = (titleOrQuery: string) => {
    const q = (titleOrQuery || "").trim() || query.trim();
    return `/compare?query=${encodeURIComponent(q)}`;
  };

  const fetchSearch = async () => {
    const q = query.trim();
    if (!q) return;
    setUiState("loading");
    setError(null);

    try {
      const res = await fetch(endpointUrl, {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      const json = (await res.json()) as ApiResponse;

      if (!res.ok || !json?.success) {
        setStores([]);
        setChips([]);
        setUiState("error");
        setError(json?.errorMessage || `Error HTTP ${res.status}`);
        return;
      }

      const data = json.data || {};
      setStores(Array.isArray(data.stores) ? data.stores : []);
      setChips(
        Array.isArray(data.assistantPlan?.ui?.chips)
          ? data.assistantPlan!.ui!.chips!
          : []
      );
      setUiState("success");
      setActiveTab(storeId !== "all" ? storeId : "all");
    } catch {
      setStores([]);
      setChips([]);
      setUiState("error");
      setError("Error de red o del servidor.");
    }
  };

  useEffect(() => {
    if ((searchParams?.get("query") ?? "").trim()) {
      fetchSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const anyResults = stores.some((s) => (s.items?.length ?? 0) > 0);
  const totalResults = stores.reduce((sum, s) => sum + (s.items?.length ?? 0), 0);

  /* ─── Render ─── */

  return (
    <div className="space-y-6">
      {/* ════════════════════ HERO ════════════════════ */}
      <div className="relative -mx-4 -mt-4 overflow-hidden rounded-b-3xl sm:-mx-6 lg:-mx-8">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1400&q=80')",
          }}
        />
        {/* Dark overlays */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.93) 0%, rgba(0,0,0,0.78) 50%, var(--background) 100%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to right, rgba(0,0,0,0.65), transparent, rgba(0,0,0,0.65))",
          }}
        />
        {/* Amber bottom glow */}
        <div
          className="absolute inset-x-0 bottom-0 h-28"
          style={{
            background:
              "linear-gradient(to top, rgba(245,158,11,0.07), transparent)",
          }}
        />

        {/* Content */}
        <motion.div
          className="relative z-10 flex flex-col items-center gap-5 px-6 py-16 sm:py-20"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {/* Pill badge */}
          <motion.div
            variants={fadeUp}
            className="flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold tracking-widest uppercase"
            style={{
              background: "rgba(245,158,11,0.12)",
              border: "1px solid rgba(245,158,11,0.25)",
              color: "#f59e0b",
              backdropFilter: "blur(8px)",
            }}
          >
            <Search className="h-3.5 w-3.5" />
            Buscador de productos
          </motion.div>

          {/* Title */}
          <motion.div variants={fadeUp} className="text-center space-y-2 max-w-xl">
            <h1
              className="text-3xl sm:text-4xl font-bold leading-tight"
              style={{
                background:
                  "linear-gradient(135deg, #f8fafc 30%, rgba(245,158,11,0.85) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Encuentra lo que necesitas
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Busca materiales y herramientas en tiendas reales de México.
              Comparamos Home Depot, Mercado Libre y Amazon por ti.
            </p>
          </motion.div>

          {/* Search bar */}
          <motion.div variants={fadeUp} className="w-full max-w-2xl">
            <div
              className="flex items-center gap-2 rounded-2xl p-2"
              style={{
                background: "rgba(0,0,0,0.55)",
                border: "1px solid rgba(255,255,255,0.12)",
                backdropFilter: "blur(14px)",
              }}
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    updateUrl({ query: e.target.value });
                  }}
                  placeholder="Ej. cemento 50kg, taladro, pintura exterior, cal..."
                  className="pl-9 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-[15px]"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") fetchSearch();
                  }}
                />
              </div>

              <Select
                value={storeId}
                onValueChange={(v) => {
                  setStoreId(v);
                  updateUrl({ storeId: v });
                  setActiveTab(v === "all" ? "all" : v);
                }}
              >
                <SelectTrigger className="w-40 border-0 bg-white/5 rounded-xl shrink-0">
                  <SelectValue placeholder="Tienda" />
                </SelectTrigger>
                <SelectContent>
                  {STORES.map((s) => (
                    <SelectItem key={s.storeId} value={s.storeId}>
                      {s.storeName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                onClick={fetchSearch}
                disabled={uiState === "loading" || !query.trim()}
                className="shrink-0 rounded-xl h-10 px-5 font-semibold"
                style={{
                  background:
                    query.trim()
                      ? "linear-gradient(135deg, #d97706, #b45309)"
                      : undefined,
                  boxShadow: query.trim()
                    ? "0 4px 16px rgba(217,119,6,0.3)"
                    : undefined,
                }}
              >
                {uiState === "loading" ? (
                  <>
                    <motion.div
                      className="h-4 w-4 rounded-full border-2 border-white border-t-transparent mr-1.5"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    Buscando...
                  </>
                ) : (
                  <>
                    Buscar
                    <ArrowRight className="h-4 w-4 ml-1.5" />
                  </>
                )}
              </Button>
            </div>
          </motion.div>

          {/* Store filter chips */}
          <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-2">
            {STORES.map((s) => {
              const isActive = storeId === s.storeId;
              const theme = STORE_THEME[s.storeId as StoreThemeKey];
              return (
                <motion.button
                  key={s.storeId}
                  onClick={() => {
                    setStoreId(s.storeId);
                    updateUrl({ storeId: s.storeId });
                    setActiveTab(s.storeId === "all" ? "all" : s.storeId);
                  }}
                  className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium cursor-pointer"
                  style={
                    isActive
                      ? s.storeId === "all"
                        ? {
                            background: "rgba(245,158,11,0.9)",
                            border: "1px solid rgba(245,158,11,0.9)",
                            color: "#000",
                            boxShadow: "0 0 20px rgba(245,158,11,0.3)",
                          }
                        : {
                            background: theme?.headerBg,
                            border: `1px solid ${theme?.border}`,
                            color: theme?.color,
                            boxShadow: `0 0 16px ${theme?.glow}`,
                          }
                      : {
                          background: "rgba(255,255,255,0.05)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          color: "var(--muted-foreground)",
                        }
                  }
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {theme && (
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ background: theme.color }}
                    />
                  )}
                  {s.storeName}
                </motion.button>
              );
            })}
          </motion.div>

          {/* AI refinement chips */}
          {chips.length > 0 && (
            <motion.div
              variants={fadeUp}
              className="flex flex-wrap justify-center gap-2 items-center"
            >
              <Sparkles className="h-3.5 w-3.5 text-purple-400/60" />
              {chips.slice(0, 8).map((c) => (
                <motion.button
                  key={c}
                  onClick={() => {
                    const nextQ = `${query.trim()} ${c}`.trim();
                    setQuery(nextQ);
                    updateUrl({ query: nextQ });
                  }}
                  className="text-xs px-2.5 py-1 rounded-full cursor-pointer"
                  style={{
                    background: "rgba(168,85,247,0.08)",
                    border: "1px solid rgba(168,85,247,0.2)",
                    color: "rgba(168,85,247,0.8)",
                  }}
                  whileHover={{ background: "rgba(168,85,247,0.15)", scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {c}
                </motion.button>
              ))}
            </motion.div>
          )}

          {/* Error */}
          {error && uiState === "error" && (
            <motion.div
              variants={fadeUp}
              className="w-full max-w-2xl rounded-xl px-4 py-3 text-sm text-red-400"
              style={{
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.2)",
              }}
            >
              {error}
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* ════════════════════ RESULTS AREA ════════════════════ */}
      <AnimatePresence mode="wait">

        {/* ── Idle ── */}
        {uiState === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-10 py-6"
          >
            {/* ── Store showcase: floating animated cards ── */}
            <div className="grid grid-cols-3 gap-4">
              {(
                [
                  {
                    id: "home_depot" as StoreThemeKey,
                    name: "Home Depot",
                    items: [
                      { label: "Cemento gris 50 kg", price: "$189" },
                      { label: "Varilla corrugada 3/8\"", price: "$96" },
                      { label: "Block de concreto 15×20×40", price: "$14" },
                    ],
                  },
                  {
                    id: "mercado_libre" as StoreThemeKey,
                    name: "Mercado Libre",
                    items: [
                      { label: "Taladro percutor 850W", price: "$1,299" },
                      { label: "Pintura vinílica blanca 4 L", price: "$340" },
                      { label: "Manguera de jardín 30 m", price: "$419" },
                    ],
                  },
                  {
                    id: "amazon" as StoreThemeKey,
                    name: "Amazon México",
                    items: [
                      { label: "Multímetro digital", price: "$289" },
                      { label: "Cable THW calibre 12", price: "$529" },
                      { label: "Juego de llaves allen", price: "$175" },
                    ],
                  },
                ] as const
              ).map(({ id, name, items }, idx) => {
                const theme = STORE_THEME[id];
                return (
                  <motion.div
                    key={id}
                    animate={{ y: [0, -9, 0] }}
                    transition={{
                      duration: 3.2 + idx * 0.8,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: idx * 0.45,
                    }}
                    className="rounded-2xl overflow-hidden flex flex-col"
                    style={{
                      border: `1px solid ${theme.border}`,
                      background: "rgba(255,255,255,0.01)",
                    }}
                  >
                    {/* Card header */}
                    <div
                      className="px-4 py-3 flex items-center gap-2"
                      style={{
                        background: theme.headerBg,
                        borderBottom: `1px solid ${theme.border}`,
                      }}
                    >
                      <motion.div
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ background: theme.color }}
                        animate={{ opacity: [0.6, 1, 0.6] }}
                        transition={{ duration: 1.8, repeat: Infinity, delay: idx * 0.3 }}
                      />
                      <span className="text-sm font-semibold" style={{ color: theme.color }}>
                        {name}
                      </span>
                    </div>
                    {/* Product rows */}
                    <div className="p-3 space-y-2 flex-1">
                      {items.map((item, i) => (
                        <motion.div
                          key={i}
                          className="flex items-center gap-2.5 rounded-lg px-2.5 py-2"
                          style={{
                            background: i === 0 ? `${theme.color}08` : "transparent",
                            border: i === 0 ? `1px solid ${theme.color}15` : "1px solid transparent",
                          }}
                          animate={{ opacity: [0.55, 0.9, 0.55] }}
                          transition={{
                            duration: 2.4,
                            repeat: Infinity,
                            delay: i * 0.35 + idx * 0.2,
                          }}
                        >
                          <div
                            className="h-7 w-7 rounded-md shrink-0"
                            style={{ background: `${theme.color}12` }}
                          />
                          <div className="flex-1 min-w-0">
                            <div
                              className="h-2 rounded-full mb-1"
                              style={{
                                width: `${70 + i * 8}%`,
                                background: `${theme.color}20`,
                              }}
                            />
                            <div
                              className="h-1.5 rounded-full"
                              style={{
                                width: "45%",
                                background: "rgba(255,255,255,0.06)",
                              }}
                            />
                          </div>
                          <span
                            className="text-xs font-mono font-semibold shrink-0"
                            style={{ color: theme.color }}
                          >
                            {item.price}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* ── Cómo funciona ── */}
            <div className="space-y-4">
              <p
                className="text-center text-xs font-medium uppercase tracking-widest"
                style={{ color: "rgba(255,255,255,0.2)" }}
              >
                Cómo funciona
              </p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    emoji: "✍️",
                    title: "Escribe el producto",
                    sub: "Indica qué material o herramienta necesitas",
                    delay: 0.05,
                  },
                  {
                    emoji: "🏪",
                    title: "Buscamos en 3 tiendas",
                    sub: "Home Depot, Mercado Libre y Amazon simultáneamente",
                    delay: 0.15,
                  },
                  {
                    emoji: "💡",
                    title: "Compara y elige",
                    sub: "Ve precios, fotos y enlaces a cada tienda",
                    delay: 0.25,
                  },
                ].map(({ emoji, title, sub, delay }, idx) => (
                  <motion.div
                    key={title}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay, duration: 0.5 }}
                    className="rounded-xl p-4 text-center space-y-2"
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <motion.div
                      className="text-2xl select-none"
                      animate={{ scale: [1, 1.18, 1] }}
                      transition={{ duration: 2.8, repeat: Infinity, delay: idx * 0.6 }}
                    >
                      {emoji}
                    </motion.div>
                    <p className="text-xs font-semibold">{title}</p>
                    <p className="text-xs leading-snug" style={{ color: "rgba(255,255,255,0.38)" }}>
                      {sub}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* ── Prompt text ── */}
            <div className="text-center">
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
                Escribe un producto y presiona{" "}
                <span style={{ color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>Buscar</span> para comenzar.
              </p>
            </div>
          </motion.div>
        )}

        {/* ── Loading ── */}
        {uiState === "loading" && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-8"
          >
            {(Object.entries(STORE_THEME) as [StoreThemeKey, typeof STORE_THEME[StoreThemeKey]][]).map(
              ([sid, theme]) => {
                const storeName =
                  STORES.find((s) => s.storeId === sid)?.storeName || sid;
                return (
                  <div key={sid} className="space-y-4">
                    {/* Skeleton header */}
                    <div
                      className="flex items-center gap-2.5 px-4 py-3 rounded-2xl"
                      style={{ background: theme.headerBg, border: `1px solid ${theme.border}` }}
                    >
                      <motion.div
                        className="h-3 w-3 rounded-full"
                        style={{ background: theme.color }}
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                      <span className="text-sm font-semibold" style={{ color: theme.color }}>
                        {storeName}
                      </span>
                    </div>
                    {/* Skeleton cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {Array.from({ length: 4 }).map((_, j) => (
                        <SkeletonCard key={j} accentColor={theme.color} />
                      ))}
                    </div>
                  </div>
                );
              }
            )}
          </motion.div>
        )}

        {/* ── Success ── */}
        {uiState === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            {!anyResults ? (
              <div
                className="rounded-2xl p-12 text-center"
                style={{
                  background: "var(--card)",
                  border: "1px solid rgba(255,255,255,0.05)",
                }}
              >
                <Package className="h-11 w-11 mx-auto mb-3 text-muted-foreground/25" />
                <p className="font-medium text-muted-foreground">No se encontraron resultados</p>
                <p className="text-sm mt-1 text-muted-foreground/60">
                  Intenta con otros términos o una tienda diferente.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {totalResults} producto{totalResults !== 1 ? "s" : ""} encontrado
                    {totalResults !== 1 ? "s" : ""}
                  </p>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                  <TabsList
                    className="flex flex-wrap h-auto gap-1 p-1 rounded-2xl w-fit"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <TabsTrigger
                      value="all"
                      className="rounded-xl text-xs data-[state=active]:bg-amber-500 data-[state=active]:text-black data-[state=active]:shadow-none"
                    >
                      Todas
                      <span
                        className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-md"
                        style={{ background: "rgba(255,255,255,0.1)" }}
                      >
                        {totalResults}
                      </span>
                    </TabsTrigger>
                    {stores.map((s) => {
                      const theme = STORE_THEME[s.storeId as StoreThemeKey];
                      return (
                        <TabsTrigger
                          key={s.storeId}
                          value={s.storeId}
                          className="rounded-xl text-xs data-[state=active]:shadow-none"
                          style={{}}
                        >
                          {theme && (
                            <span
                              className="h-1.5 w-1.5 rounded-full mr-1.5"
                              style={{ background: theme.color }}
                            />
                          )}
                          {s.storeName}
                          {s.items.length > 0 && (
                            <span
                              className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-md"
                              style={{ background: "rgba(255,255,255,0.08)" }}
                            >
                              {s.items.length}
                            </span>
                          )}
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>

                  <TabsContent value="all" className="space-y-8 mt-0">
                    {stores.map((s) => (
                      <StoreBlock key={s.storeId} store={s} compareHref={compareHref} />
                    ))}
                  </TabsContent>

                  {stores.map((s) => (
                    <TabsContent key={s.storeId} value={s.storeId} className="mt-0">
                      <StoreBlock store={s} compareHref={compareHref} />
                    </TabsContent>
                  ))}
                </Tabs>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
