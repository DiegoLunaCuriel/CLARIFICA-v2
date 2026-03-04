'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import { useEffect, useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Package, Loader2 } from 'lucide-react';
import { AnimateOnScroll } from '@/components/ui/animate-on-scroll';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';

interface Material {
  id: number;
  name: string;
  description?: string;
  category_id: number;
  unit_of_measurement: string;
  thumbnail_url?: string | null;
  technical_specs?: any;
  common_uses?: string | null;
  usage_recommendations?: string | null;
  average_price_per_unit?: number | null;
}

interface Category {
  id: number;
  name: string;
  description?: string;
}

type LookupResponse = {
  source: 'db' | 'ai';
  material: Material;
};

function MaterialSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-0">
        <Skeleton className="w-full h-48 rounded-none rounded-t-xl" />
        <div className="p-4 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-2/3" />
      </CardContent>
    </Card>
  );
}

export default function MaterialsPage() {
  const { isLoading } = useAuth();

  const [materials, setMaterials] = useState<Material[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const [loadingMaterials, setLoadingMaterials] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingIds, setGeneratingIds] = useState<Set<number>>(new Set());
  const thumbnailsQueued = useRef<Set<number>>(new Set());

  const formatLabel = (key: string) =>
    key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());

  const formatValue = (val: any) => {
    if (val === null || val === undefined) return '—';
    if (typeof val === 'boolean') return val ? 'Sí' : 'No';
    if (typeof val === 'number') return String(val);
    if (Array.isArray(val)) return val.length ? val.join(', ') : '—';
    if (typeof val === 'object') return JSON.stringify(val, null, 2);
    return String(val);
  };

  useEffect(() => {
    if (isLoading) return;
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  useEffect(() => {
    if (isLoading) return;
    fetchMaterials({ triggerAiOnEmpty: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, selectedCategory]);

  const fetchCategories = async () => {
    try {
      const data = await api.get('/material-categories');
      setCategories(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Error al cargar categorías');
      setCategories([]);
    }
  };

  const fetchMaterials = async (opts?: { triggerAiOnEmpty?: boolean }) => {
    const triggerAiOnEmpty = opts?.triggerAiOnEmpty ?? false;

    try {
      setLoadingMaterials(true);

      const params: any = { limit: '50', offset: '0' };
      if (selectedCategory !== 'all') params.category_id = selectedCategory;

      const term = searchTerm.trim();
      if (term) params.search = term;

      const data = await api.get('/materials', params);
      const list = Array.isArray(data) ? (data as Material[]) : [];

      setMaterials(list);

      // Trigger AI generation if no material NAME matches the search term
      // (description-only matches don't count — the user wants a specific material)
      if (triggerAiOnEmpty && term) {
        const termLower = term.toLowerCase();
        const hasNameMatch = list.some((m) =>
          m.name.toLowerCase().includes(termLower)
        );
        if (!hasNameMatch) {
          await lookupAndOpenMaterial(term);
        }
      }

      return list;
    } catch {
      toast.error('Error al cargar materiales');
      setMaterials([]);
      return [];
    } finally {
      setLoadingMaterials(false);
    }
  };

  const lookupAndOpenMaterial = async (term: string) => {
    try {
      setIsGenerating(true);

      const res = await fetch(`/next_api/materials/lookup?query=${encodeURIComponent(term)}`, {
        method: 'GET',
        cache: 'no-store',
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.success) {
        const msg =
          json?.errorMessage ||
          (typeof json?.message === 'string' ? json.message : '') ||
          'Error al generar material con IA';
        throw new Error(msg);
      }

      const payload = json.data as LookupResponse;

      setMaterials((prev) => {
        const exists = prev.some((m) => m.id === payload.material.id);
        if (exists) return prev;
        return [payload.material, ...prev];
      });

      setSelectedMaterial(payload.material);

      if (payload.source === 'ai') {
        toast.success('Material generado y guardado en la base de datos');
      }
    } catch (e: any) {
      toast.error(typeof e?.message === 'string' ? e.message : 'Error en la búsqueda con IA');
    } finally {
      setIsGenerating(false);
    }
  };

  /* ── Thumbnail generation (lazy, sequential) ── */

  const generateThumbnail = useCallback(async (material: Material) => {
    if (material.thumbnail_url || thumbnailsQueued.current.has(material.id)) return;
    thumbnailsQueued.current.add(material.id);
    setGeneratingIds((prev) => new Set(prev).add(material.id));

    try {
      const res = await fetch('/next_api/materials/generate-thumbnail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          materialId: material.id,
          name: material.name,
          description: material.description || '',
        }),
      });
      const data = await res.json().catch(() => null);

      if (data?.success && data.thumbnail_url) {
        setMaterials((prev) =>
          prev.map((m) =>
            m.id === material.id ? { ...m, thumbnail_url: data.thumbnail_url } : m
          )
        );
      }
    } catch {
      // Silently fail — thumbnail is not critical
    } finally {
      setGeneratingIds((prev) => {
        const next = new Set(prev);
        next.delete(material.id);
        return next;
      });
    }
  }, []);

  useEffect(() => {
    if (loadingMaterials || materials.length === 0) return;

    const withoutThumbnail = materials
      .filter((m) => !m.thumbnail_url && !thumbnailsQueued.current.has(m.id))
      .slice(0, 10);

    if (withoutThumbnail.length === 0) return;

    let cancelled = false;

    (async () => {
      for (const m of withoutThumbnail) {
        if (cancelled) break;
        await generateThumbnail(m);
        // Small delay between requests to avoid rate limits
        await new Promise((r) => setTimeout(r, 500));
      }
    })();

    return () => { cancelled = true; };
  }, [loadingMaterials, materials, generateThumbnail]);

  const handleSearch = async () => {
    await fetchMaterials({ triggerAiOnEmpty: true });
  };

  const getCategoryName = (categoryId: number) => {
    const category = categories.find((c) => c.id === categoryId);
    return category?.name || 'Sin categoría';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-in fade-in slide-in-from-bottom-3 duration-500">
        <div className="flex items-center gap-3">
          <div
            className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: "linear-gradient(135deg, rgba(245,158,11,0.2), rgba(251,146,60,0.1))",
              border: "1px solid rgba(245,158,11,0.25)",
              boxShadow: "0 0 16px rgba(245,158,11,0.12)",
            }}
          >
            <Package className="h-5 w-5 text-amber-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">Biblioteca de materiales</h1>
              {isGenerating && (
                <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30">Generando con IA…</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Fichas técnicas, usos y recomendaciones asistidas por inteligencia artificial
            </p>
          </div>
        </div>
      </div>

      {/* Controles de búsqueda */}
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: "100ms", animationFillMode: "both" }}>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 flex gap-2">
            <Input
              placeholder="Buscar materiales..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              disabled={loadingMaterials || isGenerating}
            />
            <Button onClick={handleSearch} disabled={loadingMaterials || isGenerating}>
              <Search className="h-4 w-4 mr-2" />
              Buscar
            </Button>
          </div>

          <Select value={selectedCategory} onValueChange={setSelectedCategory} disabled={loadingMaterials || isGenerating}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Todas las categorías" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <p className="text-sm text-muted-foreground">
          Si no hay resultados, el sistema generará una ficha con IA y la guardará para futuras búsquedas.
        </p>
      </div>

      {/* Contenido */}
      {loadingMaterials ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <MaterialSkeleton key={i} />
          ))}
        </div>
      ) : materials.length === 0 ? (
        <div className="text-center py-16">
          <Package className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">
            {searchTerm.trim()
              ? 'No se encontraron materiales. Generando con IA…'
              : 'Escribe un término para buscar materiales.'}
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {materials.map((material, idx) => (
            <AnimateOnScroll key={material.id} delay={idx * 0.05}>
              <Card
                className="cursor-pointer group overflow-hidden transition-all duration-300 hover:-translate-y-1"
                style={{
                  borderColor: "rgba(255,255,255,0.08)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 16px 40px -8px rgba(0,0,0,0.4), 0 0 0 1px rgba(245,158,11,0.2)";
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(245,158,11,0.3)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "";
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)";
                }}
                onClick={() => setSelectedMaterial(material)}
              >
                <CardHeader className="p-0">
                  {material.thumbnail_url ? (
                    <div className="w-full h-48 bg-white flex items-center justify-center p-3 overflow-hidden">
                      <img
                        src={material.thumbnail_url}
                        alt={material.name}
                        className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>
                  ) : generatingIds.has(material.id) ? (
                    <div className="w-full h-48 bg-muted flex flex-col items-center justify-center gap-2">
                      <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
                      <span className="text-xs text-muted-foreground">Generando imagen…</span>
                    </div>
                  ) : (
                    <div
                      className="w-full h-48 flex items-center justify-center"
                      style={{
                        background: "linear-gradient(135deg, rgba(245,158,11,0.06), rgba(251,146,60,0.04))",
                      }}
                    >
                      <Package className="h-14 w-14 text-amber-500/25" />
                    </div>
                  )}
                  <div className="p-4">
                    <CardTitle className="text-base">{material.name}</CardTitle>
                    <CardDescription className="mt-1">
                      <Badge className="text-[11px] bg-amber-500/10 text-amber-400 border-amber-500/25">
                        {getCategoryName(material.category_id)}
                      </Badge>
                    </CardDescription>
                  </div>
                </CardHeader>

                <CardContent className="pt-0 px-4 pb-4">
                  <div className="space-y-1.5 text-sm">
                    <div>
                      <span className="text-muted-foreground">Unidad:</span>{" "}
                      <span className="font-medium">{material.unit_of_measurement}</span>
                    </div>
                    {material.average_price_per_unit != null && (
                      <div>
                        <span className="text-muted-foreground">Precio prom.:</span>{" "}
                        <span className="font-semibold text-amber-400">${material.average_price_per_unit}/{material.unit_of_measurement}</span>
                      </div>
                    )}
                    {material.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{material.description}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </AnimateOnScroll>
          ))}
        </div>
      )}

      {/* Dialog de detalle */}
      <Dialog open={!!selectedMaterial} onOpenChange={() => setSelectedMaterial(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">{selectedMaterial?.name}</DialogTitle>

            <DialogDescription className="flex flex-wrap gap-2 pt-2">
              <Badge variant="secondary">
                {selectedMaterial ? getCategoryName(selectedMaterial.category_id) : 'Sin categoría'}
              </Badge>

              {selectedMaterial?.unit_of_measurement && (
                <Badge variant="outline">Unidad: {selectedMaterial.unit_of_measurement}</Badge>
              )}

              {selectedMaterial?.average_price_per_unit != null && (
                <Badge variant="outline">
                  Precio prom.: ${selectedMaterial.average_price_per_unit}/{selectedMaterial.unit_of_measurement}
                </Badge>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedMaterial && (
            <div className="space-y-6">
              <section className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <span className="h-1 w-4 rounded-full bg-amber-500 inline-block" />
                  Descripción
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {selectedMaterial.description || 'Sin descripción disponible'}
                </p>
              </section>

              <section className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <span className="h-1 w-4 rounded-full bg-blue-500 inline-block" />
                    Usos comunes
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {selectedMaterial.common_uses || '—'}
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <span className="h-1 w-4 rounded-full bg-emerald-500 inline-block" />
                    Recomendaciones de uso
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {selectedMaterial.usage_recommendations || '—'}
                  </p>
                </div>
              </section>

              {selectedMaterial.technical_specs && (
                <section className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <span className="h-1 w-4 rounded-full bg-orange-500 inline-block" />
                    Especificaciones técnicas
                  </h4>

                  <div className="rounded-md border bg-muted/30">
                    <div className="grid grid-cols-1 divide-y">
                      {Object.entries(selectedMaterial.technical_specs).map(([k, v]) => (
                        <div key={k} className="grid md:grid-cols-3 gap-3 p-3">
                          <div className="text-sm font-medium">{formatLabel(k)}</div>
                          <div className="md:col-span-2 text-sm text-muted-foreground whitespace-pre-wrap break-words">
                            {formatValue(v)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Nota: los valores pueden variar según marca/proveedor y ficha técnica.
                  </p>
                </section>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
