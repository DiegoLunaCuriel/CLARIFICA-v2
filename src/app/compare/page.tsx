"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  ShoppingCart,
  Search,
  ExternalLink,
  ArrowUpRight,
  Package,
  ImageOff,
  Loader2,
  TrendingDown,
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

const STORE_COLORS: Record<string, { color: string; rgb: string }> = {
  home_depot: { color: "#ff6600", rgb: "255,102,0" },
  mercado_libre: { color: "#f5a400", rgb: "245,164,0" },
  amazon: { color: "#00cfff", rgb: "0,207,255" },
};

/* ──────────────────── Skeleton components ──────────────────── */

function SkeletonRow() {
  return (
    <div className="flex gap-3 p-3 animate-pulse">
      <div className="w-16 h-16 rounded shrink-0" style={{ background: "var(--surface-3)" }} />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-full rounded" style={{ background: "var(--surface-3)" }} />
        <div className="h-2.5 w-3/4 rounded" style={{ background: "var(--surface-2)" }} />
        <div className="h-6 w-24 rounded mt-1" style={{ background: "var(--surface-2)" }} />
      </div>
    </div>
  );
}

function SkeletonStoreCard({ color }: { color?: string }) {
  return (
    <div
      className="overflow-hidden"
      style={{
        background: "var(--surface-1)",
        border: "1px solid var(--border)",
        borderRadius: "2px",
        borderLeft: color ? `3px solid ${color}` : undefined,
      }}
    >
      <div className="p-4" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="h-4 w-32 rounded animate-pulse" style={{ background: "var(--surface-3)" }} />
      </div>
      <div>
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
    <div
      className="flex gap-3 p-3 transition-colors duration-150"
      style={{
        borderTop: index > 0 ? "1px solid var(--border)" : "none",
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--surface-2)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; }}
    >
      {/* Product image */}
      <div
        className="w-16 h-16 bg-white flex items-center justify-center overflow-hidden shrink-0 p-1.5"
        style={{ borderRadius: "2px" }}
      >
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
            className="w-7 h-7 object-contain opacity-70"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          <ImageOff className="h-5 w-5" style={{ color: "#bbb", strokeWidth: 1.5 }} />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 mb-1">
          {fav && (
            <img src={fav} alt={host} className="w-3 h-3" loading="lazy" referrerPolicy="no-referrer" />
          )}
          <span
            className="text-[10px] truncate"
            style={{ fontFamily: "'JetBrains Mono', monospace", color: "var(--muted-foreground)" }}
          >
            {host}
          </span>
        </div>

        <h4
          className="font-medium text-[13px] leading-snug line-clamp-2"
          style={{ fontFamily: "'DM Sans', sans-serif", letterSpacing: "-0.01em" }}
        >
          {title}
        </h4>

        {item.snippet && (
          <p
            className="text-xs mt-1 line-clamp-1 leading-relaxed"
            style={{ color: "var(--muted-foreground)", fontFamily: "'DM Sans', sans-serif" }}
          >
            {item.snippet}
          </p>
        )}

        <div className="mt-2">
          <a href={item.link} target="_blank" rel="noreferrer">
            <button
              className="text-xs h-7 px-3 flex items-center gap-1.5 font-semibold transition-all duration-150"
              style={{
                background: theme ? `rgba(${theme.rgb}, 0.08)` : "var(--surface-2)",
                border: `1px solid ${theme ? `rgba(${theme.rgb}, 0.22)` : "var(--border)"}`,
                color: theme ? theme.color : "var(--foreground)",
                borderRadius: "2px",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              <ExternalLink className="h-3 w-3" style={{ strokeWidth: 2 }} />
              Ver en tienda
            </button>
          </a>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────── Store card ───────────────────────── */

function StoreCard({ store, index }: { store: StoreBlock; index: number }) {
  const theme = STORE_COLORS[store.storeId];
  const items = store.items || [];

  return (
    <motion.div
      className="overflow-hidden"
      style={{
        background: "var(--surface-1)",
        border: "1px solid var(--border)",
        borderRadius: "2px",
        borderLeft: theme ? `3px solid ${theme.color}` : undefined,
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Store header */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-2.5">
          <div className="h-2 w-2 rounded-full shrink-0" style={{ background: theme?.color }} />
          <div>
            <h3
              className="font-semibold text-sm tracking-[-0.01em]"
              style={{ color: theme?.color || "var(--foreground)", fontFamily: "'DM Sans', sans-serif" }}
            >
              {store.storeName}
            </h3>
            <p
              className="text-[10px] mt-0.5"
              style={{ fontFamily: "'JetBrains Mono', monospace", color: "var(--muted-foreground)" }}
            >
              {store.site}
            </p>
          </div>
        </div>
        <span
          className="text-[10px] px-2 py-0.5"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            color: "var(--muted-foreground)",
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            borderRadius: "2px",
          }}
        >
          {items.length} resultados
        </span>
      </div>

      {items.length === 0 ? (
        <div className="py-10 text-center">
          <Package className="h-7 w-7 mx-auto mb-2" style={{ color: "var(--muted-foreground)", strokeWidth: 1.5 }} />
          <p className="text-sm" style={{ color: "var(--muted-foreground)", fontFamily: "'DM Sans', sans-serif" }}>
            Sin resultados relevantes.
          </p>
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
      setError(typeof (e as Error)?.message === "string" ? (e as Error).message : "Error de red/servidor");
    } finally {
      setLoading(false);
    }
  }, [endpointUrl, query]);

  useEffect(() => {
    if (initialQuery) { setQuery(initialQuery); void runSearch(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const queryTokens = useMemo(() => extractQueryTokens(query), [query]);
  const improvedStores = useMemo(
    () => rankStoreItems(stores, queryTokens, query, limit),
    [stores, queryTokens, query, limit]
  );

  const totalResults = improvedStores.reduce((sum, s) => sum + (s.items?.length || 0), 0);
  const storesWithResults = improvedStores.filter((s) => s.items.length > 0).length;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">

      {/* ════════════════════ HEADER ════════════════════ */}
      <div
        className="relative overflow-hidden"
        style={{
          background: "var(--surface-1)",
          border: "1px solid var(--border)",
          borderRadius: "2px",
          borderTop: "3px solid #00cfff",
        }}
      >
        {/* Grid bg */}
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden
          style={{
            backgroundImage: `
              linear-gradient(rgba(0,207,255,0.04) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,207,255,0.04) 1px, transparent 1px)
            `,
            backgroundSize: "32px 32px",
            maskImage: "radial-gradient(ellipse 100% 100% at 0% 0%, black 20%, transparent 80%)",
            WebkitMaskImage: "radial-gradient(ellipse 100% 100% at 0% 0%, black 20%, transparent 80%)",
          }}
        />

        <div className="relative p-6 md:p-10">
          <div className="flex items-center gap-3 mb-5">
            <div
              className="h-10 w-10 flex items-center justify-center shrink-0"
              style={{
                background: "rgba(0,207,255,0.1)",
                border: "1px solid rgba(0,207,255,0.22)",
                borderRadius: "2px",
              }}
            >
              <ShoppingCart className="h-5 w-5" style={{ color: "#00cfff", strokeWidth: 1.8 }} />
            </div>
            <p
              className="text-[10px] tracking-[0.18em] uppercase font-medium"
              style={{ fontFamily: "'JetBrains Mono', monospace", color: "#00cfff" }}
            >
              // Comparador de precios
            </p>
          </div>

          <h1
            className="text-3xl md:text-4xl font-black tracking-[-0.03em] mb-2"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            Comparador de precios
          </h1>
          <p
            className="text-sm mb-7 max-w-lg"
            style={{ fontFamily: "'DM Sans', sans-serif", color: "var(--muted-foreground)" }}
          >
            Compara el mismo producto entre Home Depot, Mercado Libre y Amazon México y encuentra el mejor precio.
          </p>

          {/* Search bar */}
          <div
            className="flex items-center gap-2 p-1.5 max-w-2xl"
            style={{
              background: "var(--background)",
              border: "1px solid var(--border-strong)",
              borderRadius: "2px",
            }}
          >
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                style={{ color: "var(--muted-foreground)", strokeWidth: 2 }}
              />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder='Ej. "cemento 50kg" o "varilla 3/8"'
                className="pl-9 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-sm h-10"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
                onKeyDown={(e) => { if (e.key === "Enter") void runSearch(); }}
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {hasSearched && (
                <button
                  className="h-9 px-3 text-xs font-medium transition-all duration-150"
                  style={{
                    color: "var(--muted-foreground)",
                    border: "1px solid var(--border)",
                    borderRadius: "2px",
                    background: "transparent",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                  onClick={() => { setQuery(""); setStores([]); setError(null); setHasSearched(false); }}
                  disabled={loading}
                >
                  Limpiar
                </button>
              )}
              <button
                onClick={() => void runSearch()}
                disabled={loading || !query.trim()}
                className="h-9 px-5 text-sm font-bold flex items-center gap-2 transition-all duration-150 active:scale-95 disabled:opacity-40 btn-shimmer"
                style={{
                  background: query.trim() ? "#00cfff" : "var(--surface-3)",
                  color: query.trim() ? "#080807" : "var(--muted-foreground)",
                  border: "none",
                  borderRadius: "2px",
                  fontFamily: "'DM Sans', sans-serif",
                  letterSpacing: "-0.01em",
                }}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>Comparar <ArrowUpRight className="h-4 w-4" /></>
                )}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div
              className="mt-4 px-4 py-3 text-sm max-w-2xl"
              style={{
                background: "rgba(255,59,48,0.06)",
                border: "1px solid rgba(255,59,48,0.22)",
                borderRadius: "2px",
                color: "#ff3b30",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {error}
            </div>
          )}
        </div>
      </div>

      {/* ════════════════════ RESULTS ════════════════════ */}
      <AnimatePresence mode="wait">

        {/* ── Idle ── */}
        {!hasSearched && !loading && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Price comparison table */}
            {(() => {
              const TABLE_STORES = [
                { name: "Home Depot", color: "#ff6600", rgb: "255,102,0" },
                { name: "Mercado Libre", color: "#f5a400", rgb: "245,164,0" },
                { name: "Amazon MX", color: "#00cfff", rgb: "0,207,255" },
              ];
              const TABLE_ROWS = [
                { product: "Cemento gris 50 kg",       prices: ["$189", "$210", "$225"], best: 0 },
                { product: 'Varilla corrugada 3/8"',   prices: ["$96",  "$88",  "$105"], best: 1 },
                { product: "Pintura vinílica 4 L",     prices: ["$340", "$298", "$320"], best: 1 },
                { product: "Taladro percutor 850 W",   prices: ["$1,450","$1,299","$1,380"], best: 1 },
                { product: "Cable THW calibre 12",     prices: ["$529", "$480", "$495"], best: 1 },
              ];
              return (
                <div style={{ background: "var(--surface-1)", border: "1px solid var(--border)", borderRadius: "2px", overflow: "hidden" }}>
                  <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" as React.CSSProperties["WebkitOverflowScrolling"] }}>
                    <div style={{ minWidth: "560px" }}>
                      {/* Header row */}
                      <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1fr 1fr 1fr", borderBottom: "1px solid var(--border)" }}>
                        <div className="px-4 py-3">
                          <span className="text-[10px] uppercase tracking-widest" style={{ fontFamily: "'JetBrains Mono', monospace", color: "var(--muted-foreground)" }}>
                            Producto
                          </span>
                        </div>
                        {TABLE_STORES.map((s) => (
                          <div key={s.name} className="px-4 py-3 flex items-center gap-1.5" style={{ borderLeft: "1px solid var(--border)", borderTop: `3px solid ${s.color}`, background: `rgba(${s.rgb},0.06)` }}>
                            <div className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: s.color }} />
                            <span className="text-[10px] uppercase tracking-widest font-bold whitespace-nowrap" style={{ fontFamily: "'JetBrains Mono', monospace", color: s.color }}>
                              {s.name}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Data rows */}
                      {TABLE_ROWS.map(({ product, prices, best }, rowIdx) => (
                        <div key={rowIdx} style={{ display: "grid", gridTemplateColumns: "1.8fr 1fr 1fr 1fr", borderTop: "1px solid var(--border)", background: rowIdx % 2 === 1 ? "rgba(255,255,255,0.015)" : "transparent" }}>
                          <div className="px-4 py-3 flex items-center gap-2.5">
                            <span className="text-[10px] shrink-0 tabular-nums" style={{ fontFamily: "'JetBrains Mono', monospace", color: "var(--muted-foreground)", opacity: 0.5 }}>
                              {String(rowIdx + 1).padStart(2, "0")}
                            </span>
                            <span className="text-xs truncate" style={{ fontFamily: "'DM Sans', sans-serif", color: "var(--foreground)" }}>{product}</span>
                          </div>
                          {prices.map((price, pi) => {
                            const isBest = pi === best;
                            const sc = TABLE_STORES[pi];
                            return (
                              <div key={pi} className="px-4 py-3 flex items-center gap-1.5" style={{ borderLeft: "1px solid var(--border)", background: isBest ? `rgba(${sc.rgb},0.07)` : "transparent" }}>
                                <span className="text-sm font-bold" style={{ fontFamily: "'JetBrains Mono', monospace", color: isBest ? sc.color : "var(--muted-foreground)" }}>
                                  {price}
                                </span>
                                {isBest && (
                                  <span className="text-[8px] px-1 py-0.5 font-bold shrink-0" style={{ background: `rgba(${sc.rgb},0.15)`, color: sc.color, borderRadius: "3px", fontFamily: "'JetBrains Mono', monospace" }}>
                                    ↓ MIN
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Footer note */}
                  <div className="px-4 py-2.5 flex items-center gap-1.5" style={{ borderTop: "1px solid var(--border)", background: "var(--surface-2)" }}>
                    <TrendingDown className="h-3 w-3 shrink-0" style={{ color: "var(--muted-foreground)", strokeWidth: 1.8 }} />
                    <span className="text-[10px]" style={{ fontFamily: "'JetBrains Mono', monospace", color: "var(--muted-foreground)" }}>
                      Precios de ejemplo — busca tu producto para ver precios reales en tiempo real
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Why compare */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { num: "01", icon: TrendingDown, title: "Ahorra hasta 30%", sub: "El mismo producto puede costar muy diferente según la tienda", color: "#00c56e" },
                { num: "02", icon: Search, title: "Búsqueda simultánea", sub: "Consultamos las 3 tiendas al mismo tiempo, en segundos", color: "#00cfff" },
                { num: "03", icon: ShoppingCart, title: "Sin saltar entre tabs", sub: "Ve todo en un solo lugar y elige la mejor opción", color: "var(--amber)" },
              ].map(({ num, icon: Icon, title, sub, color }) => (
                <div
                  key={num}
                  className="p-5"
                  style={{ background: "var(--surface-1)", border: "1px solid var(--border)", borderRadius: "2px" }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className="h-7 w-7 flex items-center justify-center"
                      style={{ background: `rgba(${color === "#00c56e" ? "0,197,110" : color === "#00cfff" ? "0,207,255" : "245,164,0"},0.1)`, borderRadius: "2px" }}
                    >
                      <Icon className="h-3.5 w-3.5" style={{ color, strokeWidth: 1.8 }} />
                    </div>
                    <span className="text-xs" style={{ fontFamily: "'JetBrains Mono', monospace", color }}>{num}</span>
                  </div>
                  <p className="text-sm font-semibold mb-1 tracking-[-0.01em]" style={{ fontFamily: "'Syne', sans-serif" }}>{title}</p>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--muted-foreground)", fontFamily: "'DM Sans', sans-serif" }}>{sub}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Loading ── */}
        {loading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-5"
          >
            <div className="flex flex-col items-center gap-3 py-8">
              <div
                className="h-14 w-14 flex items-center justify-center"
                style={{
                  background: "rgba(0,207,255,0.1)",
                  border: "1px solid rgba(0,207,255,0.22)",
                  borderRadius: "2px",
                }}
              >
                <Loader2 className="h-7 w-7 animate-spin" style={{ color: "#00cfff" }} />
              </div>
              <div className="text-center">
                <p className="font-bold tracking-[-0.02em]" style={{ fontFamily: "'Syne', sans-serif" }}>Comparando precios</p>
                <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)", fontFamily: "'DM Sans', sans-serif" }}>
                  Buscando <span className="font-semibold">&ldquo;{query}&rdquo;</span> en 3 tiendas...
                </p>
              </div>
            </div>
            <div className="grid lg:grid-cols-2 gap-4">
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
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {totalResults > 0 && (
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" style={{ color: "#00cfff", strokeWidth: 1.8 }} />
                <p
                  className="text-sm"
                  style={{ fontFamily: "'JetBrains Mono', monospace", color: "var(--muted-foreground)" }}
                >
                  {totalResults} resultado{totalResults !== 1 ? "s" : ""} en{" "}
                  {storesWithResults} tienda{storesWithResults !== 1 ? "s" : ""}
                </p>
              </div>
            )}

            {totalResults > 0 ? (
              <div className="grid lg:grid-cols-2 gap-4">
                {improvedStores.map((s, idx) => (
                  <StoreCard key={s.storeId} store={s} index={idx} />
                ))}
              </div>
            ) : (
              !error && (
                <div
                  className="p-12 text-center"
                  style={{ background: "var(--surface-1)", border: "1px solid var(--border)", borderRadius: "2px" }}
                >
                  <Package className="h-10 w-10 mx-auto mb-3" style={{ color: "var(--muted-foreground)", strokeWidth: 1.5 }} />
                  <p className="font-semibold tracking-[-0.01em]" style={{ fontFamily: "'Syne', sans-serif" }}>
                    No se encontraron resultados.
                  </p>
                  <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)", fontFamily: "'DM Sans', sans-serif" }}>
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
