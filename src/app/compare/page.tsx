"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingCart, Search, ExternalLink, Loader2 } from "lucide-react";
import { AnimateOnScroll } from "@/components/ui/animate-on-scroll";
import {
  type StoreBlock,
  type GoogleItem,
  normalizeTitle,
  domainFromUrl,
  extractQueryTokens,
  rankStoreItems,
} from "@/lib/compare-scoring";

type ApiResponse = {
  success: boolean;
  data?: {
    mode: string;
    query: string;
    limit: number;
    liveRequested: boolean;
    fetchedAt: string;
    stores: StoreBlock[];
    errors?: any[];
  };
  errorMessage?: string;
};

function StoreSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-28 mt-1" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="w-20 h-20 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default function ComparePage() {
  const sp = useSearchParams();

  const initialQuery = (sp.get("query") ?? "").toString().trim();
  const initialLimit = Number(sp.get("limit") ?? "5") || 5;

  const [query, setQuery] = useState(initialQuery);
  const [limit, setLimit] = useState(Math.max(1, Math.min(10, initialLimit)));

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
    } catch (e: any) {
      setStores([]);
      setError(typeof e?.message === "string" ? e.message : "Error de red/servidor");
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

  // Client-side re-ranking
  const queryTokens = useMemo(() => extractQueryTokens(query), [query]);

  const improvedStores = useMemo(
    () => rankStoreItems(stores, queryTokens, query, limit),
    [stores, queryTokens, query, limit]
  );

  const totalResults = improvedStores.reduce((sum, s) => sum + (s.items?.length || 0), 0);

  const STORE_COLORS: Record<string, { top: string; label: string }> = {
    home_depot: { top: "#f97316", label: "text-orange-400" },
    mercado_libre: { top: "#eab308", label: "text-yellow-400" },
    amazon: { top: "#3b82f6", label: "text-blue-400" },
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="animate-in fade-in slide-in-from-bottom-3 duration-500">
        <div className="flex items-center gap-3">
          <div
            className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: "linear-gradient(135deg, rgba(59,130,246,0.2), rgba(99,102,241,0.1))",
              border: "1px solid rgba(59,130,246,0.25)",
              boxShadow: "0 0 16px rgba(59,130,246,0.12)",
            }}
          >
            <ShoppingCart className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Comparador de precios</h1>
            <p className="text-sm text-muted-foreground">
              Compara productos de diferentes tiendas y encuentra el mejor precio
            </p>
          </div>
        </div>
      </div>

      {/* Controles de búsqueda */}
      <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: "100ms", animationFillMode: "both" }}>
        <CardContent className="pt-6">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Producto</label>
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder='Ej. "cemento 50kg" o "varilla 3/8"'
                onKeyDown={(e) => {
                  if (e.key === "Enter") void runSearch();
                }}
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Por tienda</label>
              <Input
                type="number"
                min={1}
                max={10}
                value={limit}
                className="w-20"
                onChange={(e) => {
                  const v = Math.max(1, Math.min(10, Number(e.target.value || "5")));
                  setLimit(v);
                }}
              />
            </div>

            <div className="flex items-end gap-2">
              <Button onClick={() => void runSearch()} disabled={loading || !query.trim()}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Buscando...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Buscar
                  </>
                )}
              </Button>

              <Button
                variant="outline"
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
            </div>
          </div>

          {error && (
            <div className="mt-3 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Estado idle */}
      {!hasSearched && !loading && (
        <div className="text-center py-16">
          <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">
            Escribe un producto y haz clic en <span className="font-medium">Buscar</span> para comparar precios entre tiendas.
          </p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="grid lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <StoreSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Resultados */}
      {!loading && hasSearched && (
        <>
          {totalResults > 0 && (
            <p className="text-sm text-muted-foreground">
              {totalResults} resultado{totalResults !== 1 ? "s" : ""} en {improvedStores.filter(s => s.items.length > 0).length} tienda{improvedStores.filter(s => s.items.length > 0).length !== 1 ? "s" : ""}
            </p>
          )}

          <div className="grid lg:grid-cols-2 gap-6">
            {improvedStores.map((s, idx) => {
              const storeColor = STORE_COLORS[s.storeId];
              return (
                <AnimateOnScroll key={s.storeId} delay={idx * 0.1}>
                  <Card className="overflow-hidden">
                    <div
                      className="h-0.5 w-full"
                      style={{ background: storeColor?.top || "rgba(245,158,11,0.4)" }}
                    />
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className={`text-lg ${storeColor?.label || ""}`}>{s.storeName}</CardTitle>
                          <p className="text-xs text-muted-foreground">{s.site}</p>
                        </div>
                        <Badge variant="secondary">
                          {s.items.length} resultado{s.items.length !== 1 ? "s" : ""}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3">
                      {(s.items || []).length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">
                          Sin resultados relevantes.
                        </p>
                      ) : (
                        s.items.map((it: GoogleItem, idx: number) => {
                          const title = normalizeTitle(it.title);
                          const host = it.displayLink || domainFromUrl(it.link);
                          const img = it.image || "";
                          const fav = it.favicon || "";

                          return (
                            <div
                              key={`${s.storeId}-${idx}`}
                              className="border border-border/50 rounded-xl p-3 flex gap-3 transition-all duration-200 hover:border-amber-500/30"
                              style={{
                                background: "rgba(255,255,255,0.02)",
                              }}
                              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(245,158,11,0.04)"; }}
                              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)"; }}
                            >
                              <div className="w-20 h-20 rounded-md bg-white flex items-center justify-center overflow-hidden shrink-0 p-1">
                                {img ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={img}
                                    alt={title}
                                    className="max-w-full max-h-full object-contain"
                                    loading="lazy"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : fav ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={fav}
                                    alt={host}
                                    className="w-10 h-10 object-contain opacity-80"
                                    loading="lazy"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <ShoppingCart className="h-6 w-6 text-muted-foreground/40" />
                                )}
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  {fav && (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={fav}
                                      alt={host}
                                      className="w-4 h-4"
                                      loading="lazy"
                                      referrerPolicy="no-referrer"
                                    />
                                  )}
                                  <span className="text-xs text-muted-foreground truncate">{host}</span>
                                </div>

                                <h4 className="font-medium text-sm leading-snug mt-1 line-clamp-2">{title}</h4>

                                {it.snippet && (
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                    {it.snippet}
                                  </p>
                                )}

                                <div className="mt-2">
                                  <a href={it.link} target="_blank" rel="noreferrer">
                                    <Button variant="outline" size="sm" className="text-xs h-7">
                                      <ExternalLink className="h-3 w-3 mr-1.5" />
                                      Ver en tienda
                                    </Button>
                                  </a>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </CardContent>
                  </Card>
                </AnimateOnScroll>
              );
            })}
          </div>

          {totalResults === 0 && !error && (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  No se encontraron resultados. Intenta con otro término de búsqueda.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
