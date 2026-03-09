"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Input } from "@/components/ui/input";
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
  ArrowUpRight,
  Sparkles,
  Loader2,
  Zap,
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
  home_depot: { color: "#ff6600", rgb: "255,102,0", label: "HD" },
  mercado_libre: { color: "#f5a400", rgb: "245,164,0", label: "ML" },
  amazon: { color: "#00cfff", rgb: "0,207,255", label: "AMZ" },
} as const;

type StoreThemeKey = keyof typeof STORE_THEME;
type UiState = "idle" | "loading" | "success" | "error";

/* ──────────────────────── Skeleton card ────────────────────── */

function SkeletonCard({ accentColor }: { accentColor?: string }) {
  return (
    <div
      className="overflow-hidden"
      style={{
        background: "var(--surface-1)",
        border: "1px solid var(--border)",
        borderRadius: "2px",
        borderTop: accentColor ? `2px solid ${accentColor}` : undefined,
      }}
    >
      <div className="animate-pulse">
        <div className="w-full aspect-[4/3]" style={{ background: "var(--surface-3)" }} />
        <div className="p-3 space-y-2">
          <div className="h-3 w-4/5 rounded" style={{ background: "var(--surface-3)" }} />
          <div className="h-2.5 w-2/5 rounded" style={{ background: "var(--surface-2)" }} />
          <div className="h-6 w-full rounded mt-2" style={{ background: "var(--surface-2)" }} />
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
      className="flex flex-col overflow-hidden group cursor-pointer"
      style={{
        background: "var(--surface-1)",
        border: "1px solid var(--border)",
        borderRadius: "2px",
        borderTop: theme ? `2px solid ${theme.color}` : undefined,
      }}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{ duration: 0.35 }}
      whileHover={{ y: -2, borderColor: theme ? `rgba(${theme.rgb},0.4)` : undefined }}
    >
      {/* Image */}
      <div className="w-full aspect-[4/3] bg-white flex items-center justify-center overflow-hidden relative p-3">
        {item.image && !imgError ? (
          <img
            src={item.image}
            alt={item.title}
            className="max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-105"
            referrerPolicy="no-referrer"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex items-center" style={{ color: "#ccc" }}>
            <ImageOff className="h-8 w-8" style={{ strokeWidth: 1.5 }} />
          </div>
        )}
        {item.favicon && (
          <div
            className="absolute top-2 left-2 p-1"
            style={{ background: "rgba(0,0,0,0.6)", borderRadius: "2px" }}
          >
            <img
              src={item.favicon}
              alt=""
              className="h-3 w-3"
              loading="lazy"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 space-y-2 flex-1 flex flex-col">
        <div className="flex-1">
          <h4
            className="font-semibold text-[13px] leading-snug line-clamp-2"
            style={{ fontFamily: "'DM Sans', sans-serif", letterSpacing: "-0.01em" }}
          >
            {item.title}
          </h4>
          <p
            className="text-[10px] mt-0.5 truncate"
            style={{ fontFamily: "'JetBrains Mono', monospace", color: "var(--muted-foreground)" }}
          >
            {item.displayLink}
          </p>
        </div>
        {item.snippet && (
          <p
            className="text-[11px] line-clamp-2 leading-relaxed"
            style={{ color: "var(--muted-foreground)", fontFamily: "'DM Sans', sans-serif" }}
          >
            {item.snippet}
          </p>
        )}
        <div className="pt-1 flex gap-2 mt-auto">
          <a className="flex-1" href={item.link} target="_blank" rel="noreferrer">
            <button
              className="w-full text-xs h-8 flex items-center justify-center gap-1.5 font-semibold transition-all duration-150"
              style={{
                background: theme ? `rgba(${theme.rgb}, 0.08)` : "var(--surface-2)",
                border: `1px solid ${theme ? `rgba(${theme.rgb}, 0.25)` : "var(--border)"}`,
                color: theme ? theme.color : "var(--foreground)",
                borderRadius: "2px",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              <ExternalLink className="h-3 w-3" style={{ strokeWidth: 2 }} />
              Ver producto
            </button>
          </a>
          <Link href={compareHref}>
            <button
              className="h-8 w-8 flex items-center justify-center transition-all duration-150"
              style={{
                border: "1px solid var(--border)",
                borderRadius: "2px",
                color: "var(--muted-foreground)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(245,164,0,0.4)";
                (e.currentTarget as HTMLElement).style.color = "var(--amber)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                (e.currentTarget as HTMLElement).style.color = "var(--muted-foreground)";
              }}
              title="Comparar precios"
            >
              <GitCompare className="h-3.5 w-3.5" style={{ strokeWidth: 1.8 }} />
            </button>
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
      className="space-y-3"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* Store header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{
          background: "var(--surface-1)",
          border: "1px solid var(--border)",
          borderLeft: theme ? `3px solid ${theme.color}` : undefined,
          borderRadius: "2px",
        }}
      >
        <div className="flex items-center gap-2.5">
          <div className="h-2 w-2 rounded-full shrink-0" style={{ background: theme?.color }} />
          <span
            className="font-semibold text-sm"
            style={{ color: theme?.color || "var(--foreground)", fontFamily: "'DM Sans', sans-serif" }}
          >
            {store.storeName}
          </span>
        </div>
        <span
          className="text-[10px] px-2 py-0.5"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            borderRadius: "2px",
            color: "var(--muted-foreground)",
          }}
        >
          {items.length} resultado{items.length !== 1 ? "s" : ""}
        </span>
      </div>

      {items.length === 0 ? (
        <div
          className="px-6 py-8 text-center"
          style={{
            background: "var(--surface-1)",
            border: "1px dashed var(--border)",
            borderRadius: "2px",
          }}
        >
          <p className="text-sm" style={{ color: "var(--muted-foreground)", fontFamily: "'DM Sans', sans-serif" }}>
            Sin resultados en {store.storeName}.
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
      if (q) params.set("query", q); else params.delete("query");
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
        setStores([]); setChips([]); setUiState("error");
        setError(json?.errorMessage || `Error HTTP ${res.status}`);
        return;
      }

      const data = json.data || {};
      setStores(Array.isArray(data.stores) ? data.stores : []);
      setChips(Array.isArray(data.assistantPlan?.ui?.chips) ? data.assistantPlan!.ui!.chips! : []);
      setUiState("success");
      setActiveTab(storeId !== "all" ? storeId : "all");
    } catch {
      setStores([]); setChips([]); setUiState("error");
      setError("Error de red o del servidor.");
    }
  };

  useEffect(() => {
    if ((searchParams?.get("query") ?? "").trim()) { fetchSearch(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const anyResults = stores.some((s) => (s.items?.length ?? 0) > 0);
  const totalResults = stores.reduce((sum, s) => sum + (s.items?.length ?? 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* ════════════════════ HEADER ════════════════════ */}
      <div
        className="relative overflow-hidden"
        style={{
          background: "var(--surface-1)",
          border: "1px solid var(--border)",
          borderRadius: "2px",
          borderTop: "3px solid var(--amber)",
        }}
      >
        {/* Blueprint grid */}
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden
          style={{
            backgroundImage: `
              linear-gradient(rgba(245,164,0,0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(245,164,0,0.05) 1px, transparent 1px)
            `,
            backgroundSize: "32px 32px",
            maskImage: "radial-gradient(ellipse 100% 100% at 0% 0%, black 30%, transparent 100%)",
            WebkitMaskImage: "radial-gradient(ellipse 100% 100% at 0% 0%, black 30%, transparent 100%)",
          }}
        />

        <div className="relative p-6 md:p-10">
          <p
            className="text-[10px] tracking-[0.18em] uppercase mb-3 font-medium"
            style={{ fontFamily: "'JetBrains Mono', monospace", color: "var(--amber)" }}
          >
            // Buscador de productos
          </p>
          <h1
            className="text-3xl md:text-4xl font-black tracking-[-0.03em] mb-2"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            Encuentra lo que necesitas
          </h1>
          <p
            className="text-sm mb-7 max-w-lg"
            style={{ fontFamily: "'DM Sans', sans-serif", color: "var(--muted-foreground)" }}
          >
            Busca materiales y herramientas en Home Depot, Mercado Libre y Amazon México simultáneamente.
          </p>

          {/* Search bar */}
          <div className="max-w-2xl space-y-2">
            <div
              className="flex items-center gap-2 p-1.5"
              style={{
                background: "var(--background)",
                border: "1px solid var(--border-strong)",
                borderRadius: "2px",
              }}
            >
              <div className="relative flex-1 min-w-0">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                  style={{ color: "var(--muted-foreground)", strokeWidth: 2 }}
                />
                <Input
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); updateUrl({ query: e.target.value }); }}
                  placeholder="Ej. cemento 50kg, taladro..."
                  className="pl-9 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-sm h-11"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                  onKeyDown={(e) => { if (e.key === "Enter") fetchSearch(); }}
                />
              </div>

              {/* Select — solo desktop */}
              <div className="hidden sm:block shrink-0">
                <Select
                  value={storeId}
                  onValueChange={(v) => {
                    setStoreId(v);
                    updateUrl({ storeId: v });
                    setActiveTab(v === "all" ? "all" : v);
                  }}
                >
                  <SelectTrigger
                    className="w-36 h-9 text-sm"
                    style={{
                      background: "var(--surface-2)",
                      border: "1px solid var(--border)",
                      borderRadius: "2px",
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    <SelectValue placeholder="Tienda" />
                  </SelectTrigger>
                  <SelectContent>
                    {STORES.map((s) => (
                      <SelectItem key={s.storeId} value={s.storeId} style={{ fontFamily: "'DM Sans', sans-serif" }}>
                        {s.storeName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <button
                onClick={fetchSearch}
                disabled={uiState === "loading" || !query.trim()}
                className="shrink-0 h-11 px-4 sm:px-5 text-sm font-bold flex items-center gap-2 transition-all duration-150 active:scale-95 disabled:opacity-40 btn-shimmer"
                style={{
                  background: query.trim() ? "var(--amber)" : "var(--surface-3)",
                  color: query.trim() ? "#080807" : "var(--muted-foreground)",
                  border: "none",
                  borderRadius: "2px",
                  fontFamily: "'DM Sans', sans-serif",
                  letterSpacing: "-0.01em",
                }}
              >
                {uiState === "loading" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <><span className="hidden sm:inline">Buscar</span><ArrowUpRight className="h-4 w-4" /></>
                )}
              </button>
            </div>

            {/* Select — solo mobile (fila completa) */}
            <div className="sm:hidden">
              <Select
                value={storeId}
                onValueChange={(v) => {
                  setStoreId(v);
                  updateUrl({ storeId: v });
                  setActiveTab(v === "all" ? "all" : v);
                }}
              >
                <SelectTrigger
                  className="w-full h-10 text-sm"
                  style={{
                    background: "var(--surface-2)",
                    border: "1px solid var(--border)",
                    borderRadius: "2px",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  <SelectValue placeholder="Tienda" />
                </SelectTrigger>
                <SelectContent>
                  {STORES.map((s) => (
                    <SelectItem key={s.storeId} value={s.storeId} style={{ fontFamily: "'DM Sans', sans-serif" }}>
                      {s.storeName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Store filter pills */}
          <div className="flex flex-wrap gap-2 mt-4">
            {STORES.map((s) => {
              const isActive = storeId === s.storeId;
              const theme = STORE_THEME[s.storeId as StoreThemeKey];
              return (
                <button
                  key={s.storeId}
                  onClick={() => {
                    setStoreId(s.storeId);
                    updateUrl({ storeId: s.storeId });
                    setActiveTab(s.storeId === "all" ? "all" : s.storeId);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all duration-150"
                  style={{
                    background: isActive ? (theme ? `rgba(${theme.rgb}, 0.1)` : "rgba(245,164,0,0.1)") : "transparent",
                    border: isActive ? `1px solid ${theme ? theme.color : "var(--amber)"}` : "1px solid var(--border)",
                    color: isActive ? (theme ? theme.color : "var(--amber)") : "var(--muted-foreground)",
                    borderRadius: "2px",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  {theme && <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: theme.color }} />}
                  {s.storeName}
                </button>
              );
            })}
          </div>

          {/* AI chips */}
          {chips.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center mt-3">
              <Sparkles className="h-3.5 w-3.5" style={{ color: "#a855f7", strokeWidth: 1.8 }} />
              {chips.slice(0, 8).map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    const nextQ = `${query.trim()} ${c}`.trim();
                    setQuery(nextQ);
                    updateUrl({ query: nextQ });
                  }}
                  className="text-xs px-2.5 py-1 transition-all duration-150"
                  style={{
                    background: "rgba(168,85,247,0.07)",
                    border: "1px solid rgba(168,85,247,0.2)",
                    color: "#a855f7",
                    borderRadius: "2px",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  + {c}
                </button>
              ))}
            </div>
          )}

          {/* Error */}
          {error && uiState === "error" && (
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
        {uiState === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Category quick-access */}
            <div className="space-y-3">
              <p className="text-[10px] uppercase tracking-widest" style={{ fontFamily: "'JetBrains Mono', monospace", color: "var(--muted-foreground)" }}>
                Explorar por categoría
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "Construcción", color: "#ff6600", rgb: "255,102,0" },
                  { label: "Herramientas eléctricas", color: "var(--amber)", rgb: "245,164,0" },
                  { label: "Plomería", color: "#00cfff", rgb: "0,207,255" },
                  { label: "Pintura y acabados", color: "#a855f7", rgb: "168,85,247" },
                  { label: "Material eléctrico", color: "#f5a400", rgb: "245,164,0" },
                  { label: "Madera y tableros", color: "#00c56e", rgb: "0,197,110" },
                  { label: "Seguridad industrial", color: "#ff6600", rgb: "255,102,0" },
                  { label: "Jardinería", color: "#00c56e", rgb: "0,197,110" },
                ].map(({ label, color, rgb }) => (
                  <button
                    key={label}
                    onClick={() => setQuery(label)}
                    className="px-3 py-1.5 text-xs font-medium transition-all duration-150"
                    style={{
                      background: `rgba(${rgb}, 0.06)`,
                      border: `1px solid rgba(${rgb}, 0.18)`,
                      color,
                      borderRadius: "2px",
                      fontFamily: "'DM Sans', sans-serif",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = `rgba(${rgb}, 0.14)`; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = `rgba(${rgb}, 0.06)`; }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Store lanes */}
            <div className="grid grid-cols-3 gap-3">
              {([
                {
                  id: "home_depot" as StoreThemeKey,
                  name: "Home Depot",
                  site: "homedepot.com.mx",
                  tags: ["Materiales", "Ferretería", "Construcción", "Plomería", "Eléctrico"],
                  highlight: "Gran variedad en tienda física",
                },
                {
                  id: "mercado_libre" as StoreThemeKey,
                  name: "Mercado Libre",
                  site: "mercadolibre.com.mx",
                  tags: ["Herramientas", "Pintura", "Jardín", "Seguridad", "Madera"],
                  highlight: "Mejores precios online",
                },
                {
                  id: "amazon" as StoreThemeKey,
                  name: "Amazon MX",
                  site: "amazon.com.mx",
                  tags: ["Eléctrico", "Multímetros", "Cables", "Iluminación", "Smart home"],
                  highlight: "Envío rápido Prime",
                },
              ] as const).map(({ id, name, site, tags, highlight }) => {
                const theme = STORE_THEME[id];
                return (
                  <div
                    key={id}
                    style={{
                      border: "1px solid var(--border)",
                      borderTop: `3px solid ${theme.color}`,
                      borderRadius: "2px",
                      background: "var(--surface-1)",
                      overflow: "hidden",
                    }}
                  >
                    {/* Store header */}
                    <div className="px-4 py-4">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="h-2 w-2 rounded-full shrink-0" style={{ background: theme.color }} />
                        <span className="font-bold text-sm" style={{ color: theme.color, fontFamily: "'Syne', sans-serif" }}>{name}</span>
                      </div>
                      <span className="text-[10px]" style={{ fontFamily: "'JetBrains Mono', monospace", color: "var(--muted-foreground)" }}>{site}</span>
                    </div>
                    {/* Tags */}
                    <div className="px-4 pb-3 flex flex-wrap gap-1.5">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] px-2 py-0.5"
                          style={{
                            background: `rgba(${theme.rgb}, 0.07)`,
                            border: `1px solid rgba(${theme.rgb}, 0.16)`,
                            color: theme.color,
                            borderRadius: "2px",
                            fontFamily: "'DM Sans', sans-serif",
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    {/* Highlight strip */}
                    <div className="px-4 py-2.5" style={{ borderTop: "1px solid var(--border)", background: "var(--surface-2)" }}>
                      <span className="text-[10px]" style={{ fontFamily: "'JetBrains Mono', monospace", color: "var(--muted-foreground)" }}>
                        {highlight}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* How it works */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Search, num: "01", title: "Escribe el producto", sub: "Indica qué material o herramienta necesitas", color: "var(--amber)" },
                { icon: Zap, num: "02", title: "Buscamos en 3 tiendas", sub: "Home Depot, Mercado Libre y Amazon simultáneamente", color: "#00cfff" },
                { icon: GitCompare, num: "03", title: "Compara y elige", sub: "Ve precios, fotos y enlaces directos a cada tienda", color: "#00c56e" },
              ].map(({ icon: Icon, num, title, sub, color }) => (
                <div
                  key={num}
                  className="p-5"
                  style={{
                    background: "var(--surface-1)",
                    border: "1px solid var(--border)",
                    borderRadius: "2px",
                  }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <div
                      className="h-8 w-8 flex items-center justify-center"
                      style={{ background: `rgba(${color === "var(--amber)" ? "245,164,0" : color === "#00cfff" ? "0,207,255" : "0,197,110"},0.1)`, borderRadius: "2px" }}
                    >
                      <Icon className="h-4 w-4" style={{ color, strokeWidth: 1.8 }} />
                    </div>
                    <span className="text-xs" style={{ fontFamily: "'JetBrains Mono', monospace", color }}>
                      {num}
                    </span>
                  </div>
                  <p className="text-sm font-semibold mb-1 tracking-[-0.01em]" style={{ fontFamily: "'Syne', sans-serif" }}>{title}</p>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--muted-foreground)", fontFamily: "'DM Sans', sans-serif" }}>{sub}</p>
                </div>
              ))}
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
            className="space-y-6"
          >
            {(Object.entries(STORE_THEME) as [StoreThemeKey, typeof STORE_THEME[StoreThemeKey]][]).map(([sid, theme]) => {
              const storeName = STORES.find((s) => s.storeId === sid)?.storeName || sid;
              return (
                <div key={sid} className="space-y-3">
                  <div
                    className="flex items-center gap-2.5 px-4 py-3"
                    style={{
                      background: "var(--surface-1)",
                      border: "1px solid var(--border)",
                      borderLeft: `3px solid ${theme.color}`,
                      borderRadius: "2px",
                    }}
                  >
                    <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: theme.color }} />
                    <span className="text-sm font-semibold" style={{ color: theme.color, fontFamily: "'DM Sans', sans-serif" }}>
                      {storeName}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {Array.from({ length: 4 }).map((_, j) => (
                      <SkeletonCard key={j} accentColor={theme.color} />
                    ))}
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}

        {/* ── Success ── */}
        {uiState === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-5"
          >
            {!anyResults ? (
              <div
                className="p-12 text-center"
                style={{
                  background: "var(--surface-1)",
                  border: "1px solid var(--border)",
                  borderRadius: "2px",
                }}
              >
                <Package className="h-10 w-10 mx-auto mb-3" style={{ color: "var(--muted-foreground)", strokeWidth: 1.5 }} />
                <p className="font-semibold tracking-[-0.01em]" style={{ fontFamily: "'Syne', sans-serif" }}>No se encontraron resultados</p>
                <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)", fontFamily: "'DM Sans', sans-serif" }}>
                  Intenta con otros términos o una tienda diferente.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <p
                    className="text-sm"
                    style={{ fontFamily: "'JetBrains Mono', monospace", color: "var(--muted-foreground)" }}
                  >
                    {totalResults} resultado{totalResults !== 1 ? "s" : ""} encontrado{totalResults !== 1 ? "s" : ""}
                  </p>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
                  <TabsList
                    className="flex flex-wrap h-auto gap-1 p-1 w-fit"
                    style={{
                      background: "var(--surface-1)",
                      border: "1px solid var(--border)",
                      borderRadius: "2px",
                    }}
                  >
                    <TabsTrigger
                      value="all"
                      className="text-xs data-[state=active]:shadow-none px-3 py-1.5"
                      style={{ borderRadius: "2px", fontFamily: "'DM Sans', sans-serif" }}
                    >
                      Todas
                      <span
                        className="ml-1.5 text-[10px] px-1.5 py-0.5"
                        style={{ background: "var(--surface-2)", borderRadius: "2px", fontFamily: "'JetBrains Mono', monospace" }}
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
                          className="text-xs data-[state=active]:shadow-none px-3 py-1.5"
                          style={{ borderRadius: "2px", fontFamily: "'DM Sans', sans-serif" }}
                        >
                          {theme && <span className="h-1.5 w-1.5 rounded-full mr-1.5 shrink-0" style={{ background: theme.color }} />}
                          {s.storeName}
                          {s.items.length > 0 && (
                            <span
                              className="ml-1.5 text-[10px] px-1.5 py-0.5"
                              style={{ background: "var(--surface-2)", borderRadius: "2px", fontFamily: "'JetBrains Mono', monospace" }}
                            >
                              {s.items.length}
                            </span>
                          )}
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>

                  <TabsContent value="all" className="space-y-6 mt-0">
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
