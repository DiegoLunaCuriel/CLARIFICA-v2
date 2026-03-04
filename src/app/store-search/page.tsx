"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
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
  Store,
  ImageOff,
  Package,
  Loader2,
} from "lucide-react";
import { AnimateOnScroll } from "@/components/ui/animate-on-scroll";

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
    assistantPlan?: {
      ui?: { chips?: string[] };
    } | null;
    errors?: Array<{ storeId?: string; message: string }>;
  };
  errorMessage?: string;
};

const STORES = [
  { storeId: "all", storeName: "Todas las tiendas" },
  { storeId: "home_depot", storeName: "Home Depot" },
  { storeId: "mercado_libre", storeName: "Mercado Libre" },
  { storeId: "amazon", storeName: "Amazon" },
];

/** Color/estilo por tienda para diferenciar visualmente */
const STORE_THEME: Record<string, { accent: string; bg: string; icon: string }> = {
  home_depot: { accent: "border-orange-400", bg: "bg-orange-50 dark:bg-orange-950/30", icon: "text-orange-500" },
  mercado_libre: { accent: "border-yellow-400", bg: "bg-yellow-50 dark:bg-yellow-950/30", icon: "text-yellow-500" },
  amazon: { accent: "border-blue-400", bg: "bg-blue-50 dark:bg-blue-950/30", icon: "text-blue-500" },
};

type UiState = "idle" | "loading" | "success" | "error";

function SkeletonCard() {
  return (
    <div className="border rounded-xl overflow-hidden bg-background animate-pulse">
      <div className="w-full aspect-[4/3] bg-muted" />
      <div className="p-3 space-y-2">
        <div className="h-4 w-4/5 bg-muted rounded" />
        <div className="h-3 w-2/5 bg-muted rounded" />
        <div className="h-3 w-full bg-muted rounded" />
        <div className="flex gap-2 pt-1">
          <div className="h-7 flex-1 bg-muted rounded" />
          <div className="h-7 flex-1 bg-muted rounded" />
        </div>
      </div>
    </div>
  );
}

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
      setChips(Array.isArray(data.assistantPlan?.ui?.chips) ? data.assistantPlan!.ui!.chips! : []);
      setUiState("success");
      if (storeId !== "all") setActiveTab(storeId);
      else setActiveTab("all");
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

  return (
    <div className="space-y-6">
      {/* ── Hero with construction BG ── */}
      <div className="relative -mx-4 -mt-4 overflow-hidden rounded-b-3xl sm:-mx-6 lg:-mx-8">
        {/* BG image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1400&q=80')" }}
        />
        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/70 to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-background/80" />
        {/* Amber ambient at bottom */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-amber-950/30 to-transparent" />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center gap-6 px-6 py-14 sm:py-16">
          <div className="flex items-center gap-2 rounded-full bg-amber-500/15 px-4 py-1.5 text-xs font-semibold tracking-widest text-amber-400 uppercase animate-in fade-in slide-in-from-bottom-3 duration-500">
            <Search className="h-3.5 w-3.5" />
            Buscador de productos
          </div>

          <div className="text-center space-y-2 max-w-xl animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: "100ms", animationFillMode: "both" }}>
            <h1 className="text-3xl sm:text-4xl font-bold">Encuentra lo que necesitas</h1>
            <p className="text-sm text-muted-foreground">
              Busca materiales y herramientas en tiendas reales de México.
              Comparamos Home Depot, Mercado Libre y Amazon por ti.
            </p>
          </div>

          {/* Search bar */}
          <div className="flex w-full max-w-2xl items-center gap-2 rounded-2xl border border-white/10 bg-background/60 p-2 backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: "200ms", animationFillMode: "both" }}>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  updateUrl({ query: e.target.value });
                }}
                placeholder="Ej. cemento 50kg, taladro, pintura exterior, cal..."
                className="pl-9 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
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
              <SelectTrigger className="w-40 border-0 bg-white/5">
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

            <Button onClick={fetchSearch} disabled={uiState === "loading"} className="shrink-0 rounded-xl">
              {uiState === "loading" ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  Buscando...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-1.5" />
                  Buscar
                </>
              )}
            </Button>
          </div>

          {/* Store chips */}
          <div className="flex flex-wrap justify-center gap-2">
            {STORES.map((s) => {
              const colors: Record<string, string> = {
                all: "bg-amber-500 text-black",
                home_depot: "border-orange-500 text-orange-400",
                mercado_libre: "border-yellow-500 text-yellow-400",
                amazon: "border-blue-500 text-blue-400",
              };
              const dots: Record<string, string> = {
                home_depot: "bg-orange-500",
                mercado_libre: "bg-yellow-500",
                amazon: "bg-blue-500",
              };
              const isActive = storeId === s.storeId;
              return (
                <button
                  key={s.storeId}
                  onClick={() => {
                    setStoreId(s.storeId);
                    updateUrl({ storeId: s.storeId });
                    setActiveTab(s.storeId === "all" ? "all" : s.storeId);
                  }}
                  className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${isActive
                      ? s.storeId === "all"
                        ? "bg-amber-500 text-black"
                        : `${colors[s.storeId]} bg-white/10`
                      : "border border-white/15 text-muted-foreground hover:border-white/30"
                    }`}
                >
                  {dots[s.storeId] && (
                    <span className={`h-2 w-2 rounded-full ${dots[s.storeId]}`} />
                  )}
                  {s.storeName}
                </button>
              );
            })}
          </div>

          {/* AI Chips */}
          {chips.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 items-center">
              <span className="text-xs text-muted-foreground/60">✨</span>
              {chips.slice(0, 8).map((c) => (
                <Badge
                  key={c}
                  variant="outline"
                  className="cursor-pointer border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-muted-foreground"
                  onClick={() => {
                    const nextQ = `${query.trim()} ${c}`.trim();
                    setQuery(nextQ);
                    updateUrl({ query: nextQ });
                  }}
                >
                  {c}
                </Badge>
              ))}
            </div>
          )}

          {error && (
            <div className="w-full max-w-2xl rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      {uiState === "idle" && (
        <div className="text-center py-16 text-muted-foreground">
          <Package className="h-14 w-14 mx-auto mb-4 opacity-20" />
          <p className="text-base">Escribe un producto y presiona <strong>Buscar</strong> para comenzar.</p>
          <p className="text-xs mt-1 opacity-70">Buscamos en Home Depot, Mercado Libre y Amazon M&eacute;xico.</p>
        </div>
      )}

      {uiState === "loading" && (
        <div className="space-y-6">
          {/* Loading skeleton per store */}
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-5 w-32 bg-muted rounded animate-pulse" />
                <div className="h-5 w-12 bg-muted rounded animate-pulse" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {Array.from({ length: 4 }).map((_, j) => (
                  <SkeletonCard key={j} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {uiState === "success" && stores.length > 0 && (
        <>
          {!anyResults && (
            <Card className="p-8 text-center text-muted-foreground">
              <Package className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No se encontraron resultados</p>
              <p className="text-sm mt-1">Intenta con otros t&eacute;rminos de b&uacute;squeda o una tienda diferente.</p>
            </Card>
          )}

          {anyResults && (
            <>
              {/* Result summary */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {totalResults} producto{totalResults !== 1 ? "s" : ""} encontrado{totalResults !== 1 ? "s" : ""}
                </p>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
                <TabsList className="flex flex-wrap h-auto gap-1 p-1">
                  <TabsTrigger value="all" className="text-sm">
                    Todas
                    <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0">
                      {totalResults}
                    </Badge>
                  </TabsTrigger>
                  {stores.map((s) => {
                    const theme = STORE_THEME[s.storeId];
                    return (
                      <TabsTrigger key={s.storeId} value={s.storeId} className="text-sm">
                        {s.storeName}
                        {s.items.length > 0 && (
                          <Badge
                            variant="secondary"
                            className={`ml-1.5 text-[10px] px-1.5 py-0 ${theme?.icon || ""}`}
                          >
                            {s.items.length}
                          </Badge>
                        )}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                <TabsContent value="all" className="space-y-8">
                  {stores.map((s) => (
                    <StoreBlock key={s.storeId} store={s} compareHref={compareHref} />
                  ))}
                </TabsContent>

                {stores.map((s) => (
                  <TabsContent key={s.storeId} value={s.storeId}>
                    <StoreBlock store={s} compareHref={compareHref} />
                  </TabsContent>
                ))}
              </Tabs>
            </>
          )}
        </>
      )}
    </div>
  );
}

/* ─── Product Card ─── */
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

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col group border-border/60 rounded-2xl"
      onMouseEnter={(e) => {
        const storeTheme = STORE_THEME[storeId];
        const borderMap: Record<string, string> = {
          home_depot: "rgba(249,115,22,0.5)",
          mercado_libre: "rgba(234,179,8,0.5)",
          amazon: "rgba(59,130,246,0.5)",
        };
        (e.currentTarget as HTMLElement).style.borderColor = borderMap[storeId] || "rgba(245,158,11,0.3)";
        (e.currentTarget as HTMLElement).style.boxShadow = `0 20px 40px -8px rgba(0,0,0,0.4)`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "";
        (e.currentTarget as HTMLElement).style.boxShadow = "";
      }}
    >
      {/* Image */}
      <div className="w-full aspect-[4/3] bg-white flex items-center justify-center overflow-hidden relative p-3">
        {item.image && !imgError ? (
          <img
            src={item.image}
            alt={item.title}
            className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-300"
            referrerPolicy="no-referrer"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex flex-col items-center gap-1 text-muted-foreground/40">
            <ImageOff className="h-8 w-8" />
          </div>
        )}
        {/* Store badge overlay */}
        {item.favicon && (
          <div className="absolute top-2 left-2 bg-background/90 backdrop-blur-sm rounded-full p-1 shadow-sm">
            <img
              src={item.favicon}
              alt=""
              className="h-4 w-4 rounded-full"
              loading="lazy"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 space-y-2 flex-1 flex flex-col">
        <div className="flex-1 min-h-0">
          <h4 className="font-medium text-[13px] leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {item.title}
          </h4>
          <p className="text-[11px] text-muted-foreground/70 mt-0.5 truncate">
            {item.displayLink}
          </p>
        </div>

        {item.snippet && (
          <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
            {item.snippet}
          </p>
        )}

        {/* Actions */}
        <div className="pt-2 flex gap-2 mt-auto">
          <a className="flex-1" href={item.link} target="_blank" rel="noreferrer">
            <Button
              variant="default"
              size="sm"
              className="w-full text-xs h-8 font-medium"
            >
              <ExternalLink className="h-3 w-3 mr-1.5" />
              Ver producto
            </Button>
          </a>
          <Link href={compareHref}>
            <Button variant="outline" size="sm" className="h-8 px-2.5" title="Comparar precios">
              <GitCompare className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}

/* ─── Store Section ─── */
function StoreBlock({
  store,
  compareHref,
}: {
  store: StoreResult;
  compareHref: (titleOrQuery: string) => string;
}) {
  const items = store.items || [];
  const theme = STORE_THEME[store.storeId] || { accent: "border-border", bg: "", icon: "" };

  return (
    <div className="space-y-3">
      {/* Store header */}
      <div className={`flex items-center justify-between border-l-4 ${theme.accent} pl-3 py-1`}>
        <div className="flex items-center gap-2">
          <Store className={`h-4 w-4 ${theme.icon}`} />
          <h3 className="font-semibold text-[15px]">{store.storeName}</h3>
        </div>
        <Badge variant="outline" className="text-[11px] font-normal">
          {items.length} resultado{items.length !== 1 ? "s" : ""}
        </Badge>
      </div>

      {items.length === 0 ? (
        <div className={`rounded-lg ${theme.bg} border border-dashed p-6 text-center`}>
          <p className="text-sm text-muted-foreground">
            Sin resultados en {store.storeName} para esta b&uacute;squeda.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {items.map((it, idx) => (
            <AnimateOnScroll key={`${store.storeId}-${idx}`} delay={idx * 0.06}>
              <ProductCard
                item={it}
                storeId={store.storeId}
                compareHref={compareHref(it.title)}
              />
            </AnimateOnScroll>
          ))}
        </div>
      )}
    </div>
  );
}
