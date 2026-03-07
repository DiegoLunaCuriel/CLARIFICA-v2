"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingCart,
  Search,
  ExternalLink,
  ArrowRight,
  Package,
  ImageOff,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  type StoreBlock,
  type GoogleItem,
  normalizeTitle,
  domainFromUrl,
  extractQueryTokens,
  rankStoreItems,
} from "@/lib/compare-scoring";

/* ─────────────────────────── Types ─────────────────────────── */

type ApiResponse = {
  success: boolean;
  data?: {
    mode: string;
    query: string;
    limit: number;
    liveRequested: boolean;
    fetchedAt: string;
    stores: StoreBlock[];
    errors?: unknown[];
  };
  errorMessage?: string;
};

/* ─────────────────────────── Constants ─────────────────────── */

const STORE_COLORS: Record<string, { color: string; glow: string; border: string; headerBg: string }> = {
  home_depot: {
    color: "#f97316",
    glow: "rgba(249,115,22,0.15)",
    border: "rgba(249,115,22,0.28)",
    headerBg: "rgba(249,115,22,0.07)",
  },
  mercado_libre: {
    color: "#eab308",
    glow: "rgba(234,179,8,0.15)",
    border: "rgba(234,179,8,0.28)",
    headerBg: "rgba(234,179,8,0.07)",
  },
  amazon: {
    color: "#3b82f6",
    glow: "rgba(59,130,246,0.15)",
    border: "rgba(59,130,246,0.28)",
    headerBg: "rgba(59,130,246,0.07)",
  },
};

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
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

/* ──────────────────── Skeleton components ──────────────────── */

function SkeletonRow() {
  return (
    <div className="flex gap-3 p-3 animate-pulse">
      <div
        className="w-20 h-20 rounded-xl shrink-0"
        style={{ background: "rgba(255,255,255,0.05)" }}
      />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-full rounded-lg" style={{ background: "rgba(255,255,255,0.06)" }} />
        <div className="h-3 w-3/4 rounded-lg" style={{ background: "rgba(255,255,255,0.04)" }} />
        <div className="h-3 w-1/2 rounded-lg" style={{ background: "rgba(255,255,255,0.04)" }} />
        <div className="h-7 w-28 rounded-xl mt-1" style={{ background: "rgba(255,255,255,0.05)" }} />
      </div>
    </div>
  );
}

function SkeletonStoreCard({ color }: { color?: string }) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "var(--card)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {color && (
        <div
          className="h-[2px]"
          style={{ background: `linear-gradient(90deg, ${color}, transparent 80%)` }}
        />
      )}
      <div className="p-4 space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="h-5 w-32 rounded-lg animate-pulse" style={{ background: "rgba(255,255,255,0.06)" }} />
          <div className="h-5 w-16 rounded-lg animate-pulse" style={{ background: "rgba(255,255,255,0.05)" }} />
        </div>
        <div className="h-3 w-24 rounded-lg animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />
      </div>
      <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    </div>
  );
}

/* ───────────────────────── Product row ─────────────────────── */

function ProductRow({
  item,
  storeId,
  index,
}: {
  item: GoogleItem;
  storeId: string;
  index: number;
}) {
  const [imgError, setImgError] = useState(false);
  const theme = STORE_COLORS[storeId];
  const title = normalizeTitle(item.title);
  const host = item.displayLink || domainFromUrl(item.link);
  const img = item.image || "";
  const fav = item.favicon || "";

  return (
    <motion.div
      className="flex gap-3 p-3 group cursor-default"
      style={{
        borderTop: index > 0 ? "1px solid rgba(255,255,255,0.04)" : "none",
        transition: "background 0.15s",
      }}
      initial={{ opacity: 0, x: -12 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-10px" }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ backgroundColor: "rgba(255,255,255,0.02)" }}
    >
      {/* Product image */}
      <div className="w-[72px] h-[72px] rounded-xl bg-white flex items-center justify-center overflow-hidden shrink-0 p-1.5">
        {img && !imgError ? (
          <img
            src={img}
            alt={title}
            className="max-w-full max-h-full object-contain"
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
          />
        ) : fav ? (
          <img
            src={fav}
            alt={host}
            className="w-10 h-10 object-contain opacity-80"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          <ImageOff className="h-6 w-6 text-muted-foreground/30" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        {/* Host + favicon */}
        <div className="flex items-center gap-1.5 mb-1">
          {fav && (
            <img
              src={fav}
              alt={host}
              className="w-3.5 h-3.5"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          )}
          <span className="text-[11px] text-muted-foreground/60 truncate">{host}</span>
        </div>

        <h4 className="font-medium text-sm leading-snug line-clamp-2">{title}</h4>

        {item.snippet && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
            {item.snippet}
          </p>
        )}

        <div className="mt-2">
          <a href={item.link} target="_blank" rel="noreferrer">
            <Button
              size="sm"
              className="text-xs h-7 rounded-lg font-medium"
              style={
                theme
                  ? {
                      background: `${theme.color}16`,
                      border: `1px solid ${theme.border}`,
                      color: theme.color,
                    }
                  : {}
              }
            >
              <ExternalLink className="h-3 w-3 mr-1.5" />
              Ver en tienda
            </Button>
          </a>
        </div>
      </div>
    </motion.div>
  );
}

/* ──────────────────────── Store card ───────────────────────── */

function StoreCard({ store, index }: { store: StoreBlock; index: number }) {
  const theme = STORE_COLORS[store.storeId];
  const items = store.items || [];

  return (
    <motion.div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "var(--card)",
        border: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
      }}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: index * 0.1,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{
        boxShadow: theme
          ? `0 8px 32px ${theme.glow}`
          : "0 8px 32px rgba(0,0,0,0.3)",
        borderColor: theme?.border || "rgba(255,255,255,0.1)",
        transition: { duration: 0.2 },
      }}
    >
      {/* Colored top bar */}
      {theme && (
        <div
          className="h-[3px]"
          style={{
            background: `linear-gradient(90deg, ${theme.color}, ${theme.color}80, transparent)`,
          }}
        />
      )}

      {/* Store header */}
      <div
        className="px-4 pt-4 pb-3 flex items-center justify-between"
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          background: theme?.headerBg || "transparent",
        }}
      >
        <div>
          <h3
            className="font-bold text-base"
            style={{ color: theme?.color || "inherit" }}
          >
            {store.storeName}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">{store.site}</p>
        </div>
        <Badge
          variant="secondary"
          className="text-[11px] font-normal shrink-0"
        >
          {items.length} resultado{items.length !== 1 ? "s" : ""}
        </Badge>
      </div>

      {/* Product rows */}
      {items.length === 0 ? (
        <div className="py-10 text-center">
          <Package className="h-8 w-8 mx-auto mb-2 text-muted-foreground/25" />
          <p className="text-sm text-muted-foreground">Sin resultados relevantes.</p>
        </div>
      ) : (
        <div>
          {items.map((item, idx) => (
            <ProductRow
              key={`${store.storeId}-${idx}`}
              item={item}
              storeId={store.storeId}
              index={idx}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}

/* ───────────────────────────── Page ────────────────────────── */

export default function ComparePage() {
  const sp = useSearchParams();

  const initialQuery = (sp.get("query") ?? "").toString().trim();
  const initialLimit = Number(sp.get("limit") ?? "5") || 5;

  const [query, setQuery] = useState(initialQuery);
  const [limit] = useState(Math.max(1, Math.min(10, initialLimit)));

  const [loading, setLoading] = useState(false);
  const [stores, setStores] = useState<StoreBlock[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const endpointUrl = useMemo(() => {
    const p = new URLSearchParams();
    p.set("query", query.trim() || "cemento 50kg");
    p.set("limit", String(limit));
    return `/next_api/prices/search?${p.toString()}`;
  }, [query, limit]);

  const runSearch = useCallback(async () => {
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const res = await fetch(endpointUrl, {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      const json = (await res.json()) as ApiResponse;

      if (!res.ok || !json?.success) {
        setStores([]);
        setError(json?.errorMessage || `Error HTTP ${res.status}`);
        return;
      }
      setStores(Array.isArray(json.data?.stores) ? json.data!.stores : []);
    } catch (e: unknown) {
      setStores([]);
      setError(
        typeof (e as Error)?.message === "string"
          ? (e as Error).message
          : "Error de red/servidor"
      );
    } finally {
      setLoading(false);
    }
  }, [endpointUrl, query]);

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      void runSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const queryTokens = useMemo(() => extractQueryTokens(query), [query]);
  const improvedStores = useMemo(
    () => rankStoreItems(stores, queryTokens, query, limit),
    [stores, queryTokens, query, limit]
  );

  const totalResults = improvedStores.reduce(
    (sum, s) => sum + (s.items?.length || 0),
    0
  );
  const storesWithResults = improvedStores.filter((s) => s.items.length > 0).length;

  /* ─── Render ─── */

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-10">

      {/* ════════════════════ HERO ════════════════════ */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="text-center space-y-6 pt-2"
      >
        {/* Icon with glow */}
        <motion.div variants={fadeUp} className="relative mx-auto w-fit">
          <div
            className="absolute inset-0 rounded-3xl blur-3xl opacity-40"
            style={{
              background:
                "radial-gradient(circle, rgba(59,130,246,0.7) 0%, rgba(99,102,241,0.4) 60%, transparent 100%)",
            }}
          />
          <motion.div
            className="relative h-20 w-20 rounded-3xl mx-auto flex items-center justify-center"
            style={{
              background:
                "linear-gradient(145deg, rgba(59,130,246,0.22) 0%, rgba(99,102,241,0.14) 100%)",
              border: "1px solid rgba(59,130,246,0.28)",
              boxShadow:
                "0 0 40px rgba(59,130,246,0.18), inset 0 1px 0 rgba(255,255,255,0.08)",
            }}
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <ShoppingCart className="h-9 w-9 text-blue-300" />
          </motion.div>
        </motion.div>

        {/* Heading */}
        <motion.div variants={fadeUp} className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
            <span
              style={{
                background: "linear-gradient(135deg, #f8fafc 20%, rgba(99,102,241,0.9) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Comparador
            </span>{" "}
            <span
              style={{
                background:
                  "linear-gradient(135deg, rgba(59,130,246,0.9) 0%, rgba(99,102,241,0.85) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              de precios
            </span>
          </h1>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto leading-relaxed">
            Compara productos entre Home Depot, Mercado Libre y Amazon México y encuentra el mejor precio.
          </p>
        </motion.div>

        {/* Search bar */}
        <motion.div variants={fadeUp} className="max-w-xl mx-auto">
          <div
            className="rounded-2xl p-[2px]"
            style={{
              background:
                "linear-gradient(135deg, rgba(59,130,246,0.35) 0%, rgba(99,102,241,0.25) 50%, rgba(59,130,246,0.15) 100%)",
              boxShadow: "0 0 48px rgba(59,130,246,0.06)",
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
                placeholder='Ej. "cemento 50kg" o "varilla 3/8"'
                className="border-0 bg-transparent shadow-none text-[15px] focus-visible:ring-0 focus-visible:ring-offset-0 px-0 h-11"
                onKeyDown={(e) => {
                  if (e.key === "Enter") void runSearch();
                }}
              />
              <div className="flex items-center gap-2 shrink-0">
                {hasSearched && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 px-3 rounded-xl text-xs text-muted-foreground"
                    onClick={() => {
                      setQuery("");
                      setStores([]);
                      setError(null);
                      setHasSearched(false);
                    }}
                    disabled={loading}
                  >
                    Limpiar
                  </Button>
                )}
                <Button
                  onClick={() => void runSearch()}
                  disabled={loading || !query.trim()}
                  className="rounded-xl h-9 px-4 text-sm font-semibold shrink-0"
                  style={{
                    background: query.trim()
                      ? "linear-gradient(135deg, #2563eb, #1d4ed8)"
                      : undefined,
                    boxShadow: query.trim()
                      ? "0 4px 16px rgba(37,99,235,0.35)"
                      : undefined,
                  }}
                >
                  {loading ? (
                    <motion.div
                      className="h-4 w-4 rounded-full border-2 border-white border-t-transparent"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                  ) : (
                    <>
                      Buscar
                      <ArrowRight className="h-4 w-4 ml-1.5" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Error */}
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
      </motion.div>

      {/* ════════════════════ RESULTS AREA ════════════════════ */}
      <AnimatePresence mode="wait">

        {/* ── Idle ── */}
        {!hasSearched && !loading && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-10 py-6"
          >
            {/* ── Comparison showcase: 3 store panels side by side ── */}
            <div className="grid grid-cols-3 gap-4">
              {(
                [
                  {
                    id: "home_depot" as keyof typeof STORE_COLORS,
                    name: "Home Depot",
                    badge: "Gran variedad",
                    rows: [
                      { w1: "78%", w2: "52%", price: "$189" },
                      { w1: "62%", w2: "40%", price: "$1,450" },
                      { w1: "85%", w2: "58%", price: "$96" },
                    ],
                  },
                  {
                    id: "mercado_libre" as keyof typeof STORE_COLORS,
                    name: "Mercado Libre",
                    badge: "Más económico",
                    rows: [
                      { w1: "70%", w2: "48%", price: "$159" },
                      { w1: "55%", w2: "36%", price: "$1,280" },
                      { w1: "80%", w2: "52%", price: "$82" },
                    ],
                  },
                  {
                    id: "amazon" as keyof typeof STORE_COLORS,
                    name: "Amazon México",
                    badge: "Envío rápido",
                    rows: [
                      { w1: "74%", w2: "50%", price: "$175" },
                      { w1: "60%", w2: "44%", price: "$1,390" },
                      { w1: "76%", w2: "46%", price: "$91" },
                    ],
                  },
                ] as const
              ).map(({ id, name, badge, rows }, idx) => {
                const sc = STORE_COLORS[id];
                return (
                  <motion.div
                    key={id}
                    animate={{ y: [0, -8, 0] }}
                    transition={{
                      duration: 3.4 + idx * 0.7,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: idx * 0.5,
                    }}
                    className="rounded-2xl overflow-hidden flex flex-col"
                    style={{ border: `1px solid ${sc.border}` }}
                  >
                    {/* Colored top bar */}
                    <div style={{ height: 3, background: sc.color }} />
                    {/* Header */}
                    <div
                      className="px-3.5 py-3 flex items-center justify-between"
                      style={{ background: sc.headerBg, borderBottom: `1px solid ${sc.border}` }}
                    >
                      <div className="flex items-center gap-2">
                        <motion.div
                          className="h-2 w-2 rounded-full"
                          style={{ background: sc.color }}
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 1.8, repeat: Infinity, delay: idx * 0.25 }}
                        />
                        <span className="text-xs font-semibold" style={{ color: sc.color }}>
                          {name}
                        </span>
                      </div>
                      <span
                        className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                        style={{
                          background: `${sc.color}15`,
                          border: `1px solid ${sc.color}25`,
                          color: sc.color,
                        }}
                      >
                        {badge}
                      </span>
                    </div>
                    {/* Skeleton rows */}
                    <div className="p-3 space-y-2 flex-1 bg-transparent">
                      {rows.map((row, i) => (
                        <motion.div
                          key={i}
                          className="flex items-center gap-2 rounded-lg px-2 py-1.5"
                          style={{
                            background: i === 0 ? `${sc.color}08` : "transparent",
                          }}
                          animate={{ opacity: [0.5, 0.85, 0.5] }}
                          transition={{
                            duration: 2.2,
                            repeat: Infinity,
                            delay: i * 0.4 + idx * 0.15,
                          }}
                        >
                          <div
                            className="h-6 w-6 rounded shrink-0"
                            style={{ background: `${sc.color}10` }}
                          />
                          <div className="flex-1 space-y-1 min-w-0">
                            <div
                              className="h-1.5 rounded-full"
                              style={{ width: row.w1, background: `${sc.color}20` }}
                            />
                            <div
                              className="h-1.5 rounded-full"
                              style={{ width: row.w2, background: "rgba(255,255,255,0.06)" }}
                            />
                          </div>
                          <span
                            className="text-xs font-mono font-bold shrink-0"
                            style={{ color: sc.color }}
                          >
                            {row.price}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* ── Why compare ── */}
            <div className="space-y-4">
              <p
                className="text-center text-xs font-medium uppercase tracking-widest"
                style={{ color: "rgba(255,255,255,0.2)" }}
              >
                Por qué comparar precios
              </p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    emoji: "💰",
                    title: "Ahorra hasta 30%",
                    sub: "El mismo producto puede costar muy diferente según la tienda",
                    delay: 0.05,
                  },
                  {
                    emoji: "⚡",
                    title: "Búsqueda simultánea",
                    sub: "Consultamos las 3 tiendas al mismo tiempo, en segundos",
                    delay: 0.15,
                  },
                  {
                    emoji: "🎯",
                    title: "Sin saltar entre tabs",
                    sub: "Ve todo en un solo lugar y elige la mejor opción",
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
                      background: "rgba(59,130,246,0.03)",
                      border: "1px solid rgba(59,130,246,0.08)",
                    }}
                  >
                    <motion.div
                      className="text-2xl select-none"
                      animate={{ scale: [1, 1.16, 1] }}
                      transition={{ duration: 2.8, repeat: Infinity, delay: idx * 0.55 }}
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
                Escribe un producto y haz clic en{" "}
                <span style={{ color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>Buscar</span>{" "}
                para comparar precios.
              </p>
            </div>
          </motion.div>
        )}

        {/* ── Loading ── */}
        {loading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            {/* Animated header */}
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="relative">
                <motion.div
                  className="h-16 w-16 rounded-full"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(59,130,246,0.5) 0%, rgba(99,102,241,0.2) 60%, transparent 80%)",
                    boxShadow: "0 0 40px rgba(59,130,246,0.2)",
                  }}
                  animate={{ scale: [1, 1.12, 1], opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <ShoppingCart className="h-7 w-7 text-blue-400" />
                </div>
              </div>
              <div className="text-center">
                <p className="font-semibold text-lg">Comparando precios</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Buscando{" "}
                  <span className="text-foreground font-medium">&ldquo;{query}&rdquo;</span>{" "}
                  en 3 tiendas...
                </p>
              </div>
              {/* Bouncing dots */}
              <div className="flex items-center gap-2">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="h-2 w-2 rounded-full"
                    style={{ background: "rgba(59,130,246,0.8)" }}
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
            </div>

            {/* Skeleton store cards */}
            <div className="grid lg:grid-cols-2 gap-5">
              {Object.entries(STORE_COLORS).map(([sid, theme]) => (
                <SkeletonStoreCard key={sid} color={theme.color} />
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Results ── */}
        {!loading && hasSearched && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-5"
          >
            {/* Summary */}
            {totalResults > 0 && (
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-blue-400" />
                <p className="text-sm text-muted-foreground">
                  {totalResults} resultado{totalResults !== 1 ? "s" : ""} en{" "}
                  {storesWithResults} tienda{storesWithResults !== 1 ? "s" : ""}
                </p>
              </div>
            )}

            {/* Store cards grid */}
            {totalResults > 0 ? (
              <div className="grid lg:grid-cols-2 gap-5">
                {improvedStores.map((s, idx) => (
                  <StoreCard key={s.storeId} store={s} index={idx} />
                ))}
              </div>
            ) : (
              !error && (
                <div
                  className="rounded-2xl p-12 text-center"
                  style={{
                    background: "var(--card)",
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <Package className="h-11 w-11 mx-auto mb-3 text-muted-foreground/25" />
                  <p className="font-medium text-muted-foreground">
                    No se encontraron resultados.
                  </p>
                  <p className="text-sm mt-1 text-muted-foreground/60">
                    Intenta con otro término de búsqueda.
                  </p>
                </div>
              )
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
