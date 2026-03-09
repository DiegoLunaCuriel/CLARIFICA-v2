'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import { useEffect, useState, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
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
    <div
      style={{
        background: 'var(--surface-1)',
        border: '1px solid var(--border)',
        borderRadius: '4px',
        overflow: 'hidden',
      }}
    >
      <div
        className="w-full h-44 animate-pulse"
        style={{ background: 'var(--surface-3)' }}
      />
      <div className="p-4 space-y-2">
        <div
          className="h-4 w-3/4 rounded animate-pulse"
          style={{ background: 'var(--surface-3)' }}
        />
        <div
          className="h-3 w-1/3 rounded animate-pulse"
          style={{ background: 'var(--surface-3)' }}
        />
        <div
          className="h-3 w-1/2 rounded animate-pulse mt-3"
          style={{ background: 'var(--surface-3)' }}
        />
      </div>
    </div>
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
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#f59e0b' }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div>
        {/* Top accent line */}
        <div
          className="h-[3px] mb-5"
          style={{ background: 'linear-gradient(90deg, #f59e0b, transparent)', borderRadius: '2px' }}
        />
        <div className="flex items-start gap-4">
          <div
            className="h-12 w-12 flex items-center justify-center shrink-0"
            style={{ background: '#f59e0b', borderRadius: '4px' }}
          >
            <Package className="h-6 w-6" style={{ color: '#0d0d0d' }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1
                className="font-black text-3xl leading-none tracking-tight"
                style={{ fontFamily: "'Syne', sans-serif" }}
              >
                Biblioteca de materiales
              </h1>
              {isGenerating && (
                <span
                  className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-1"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    background: 'rgba(245,158,11,0.1)',
                    border: '1px solid rgba(245,158,11,0.2)',
                    color: '#f59e0b',
                    borderRadius: '4px',
                  }}
                >
                  <Loader2 className="h-2.5 w-2.5 animate-spin" />
                  Generando con IA...
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Fichas técnicas, usos y recomendaciones asistidas por inteligencia artificial
            </p>
          </div>
        </div>
      </div>

      {/* ── Search controls ── */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <div
            className="flex-1 flex items-center gap-2 px-3 py-2"
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '4px',
            }}
          >
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <Input
              placeholder="Buscar materiales..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              disabled={loadingMaterials || isGenerating}
              className="border-0 bg-transparent shadow-none text-sm focus-visible:ring-0 focus-visible:ring-offset-0 px-0 h-8"
            />
            <button
              onClick={handleSearch}
              disabled={loadingMaterials || isGenerating}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 transition-all shrink-0"
              style={{
                background: '#f59e0b',
                color: '#0d0d0d',
                borderRadius: '4px',
                border: 'none',
                cursor: loadingMaterials || isGenerating ? 'not-allowed' : 'pointer',
                opacity: loadingMaterials || isGenerating ? 0.5 : 1,
              }}
            >
              <Search className="h-3.5 w-3.5" />
              Buscar
            </button>
          </div>

          <Select value={selectedCategory} onValueChange={setSelectedCategory} disabled={loadingMaterials || isGenerating}>
            <SelectTrigger
              className="w-full sm:w-[200px] text-sm"
              style={{
                background: 'var(--surface-1)',
                border: '1px solid var(--border)',
                borderRadius: '4px',
              }}
            >
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

        <p
          className="text-[11px]"
          style={{ fontFamily: "'JetBrains Mono', monospace", color: '#555' }}
        >
          Si no hay resultados, el sistema generará una ficha con IA y la guardará para futuras búsquedas.
        </p>
      </div>

      {/* ── Content grid ── */}
      {loadingMaterials ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <MaterialSkeleton key={i} />
          ))}
        </div>
      ) : materials.length === 0 ? (
        <div
          className="text-center py-20"
          style={{
            background: 'var(--surface-1)',
            border: '1px solid var(--border)',
            borderRadius: '4px',
          }}
        >
          <Package className="h-10 w-10 mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.1)' }} />
          <p className="text-sm text-muted-foreground">
            {searchTerm.trim()
              ? 'No se encontraron materiales. Generando con IA...'
              : 'Escribe un término para buscar materiales.'}
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {materials.map((material, idx) => (
            <AnimateOnScroll key={material.id} delay={idx * 0.05}>
              <div
                className="cursor-pointer transition-all"
                style={{
                  background: 'var(--surface-1)',
                  border: '1px solid var(--border)',
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = '#f59e0b';
                  (e.currentTarget as HTMLElement).style.borderTop = '3px solid #f59e0b';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
                  (e.currentTarget as HTMLElement).style.borderTop = '1px solid var(--border)';
                }}
                onClick={() => setSelectedMaterial(material)}
              >
                {/* Image area */}
                {material.thumbnail_url ? (
                  <div
                    className="w-full h-44 flex items-center justify-center p-3 overflow-hidden"
                    style={{ background: '#fff' }}
                  >
                    <img
                      src={material.thumbnail_url}
                      alt={material.name}
                      className="max-w-full max-h-full object-contain"
                      loading="lazy"
                    />
                  </div>
                ) : generatingIds.has(material.id) ? (
                  <div
                    className="w-full h-44 flex flex-col items-center justify-center gap-2"
                    style={{ background: 'var(--surface-3)' }}
                  >
                    <Loader2 className="h-6 w-6 animate-spin" style={{ color: '#f59e0b' }} />
                    <span
                      className="text-[10px]"
                      style={{ fontFamily: "'JetBrains Mono', monospace", color: '#555' }}
                    >
                      Generando imagen...
                    </span>
                  </div>
                ) : (
                  <div
                    className="w-full h-44 flex items-center justify-center"
                    style={{ background: 'var(--surface-2)' }}
                  >
                    <Package className="h-12 w-12" style={{ color: 'rgba(245,158,11,0.15)' }} />
                  </div>
                )}

                {/* Card content */}
                <div className="p-4 space-y-2.5">
                  <div>
                    <p className="font-semibold text-sm leading-snug">{material.name}</p>
                    <span
                      className="inline-block text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 mt-1"
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        background: 'rgba(245,158,11,0.08)',
                        border: '1px solid rgba(245,158,11,0.18)',
                        color: '#f59e0b',
                        borderRadius: '4px',
                      }}
                    >
                      {getCategoryName(material.category_id)}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Unidad</span>
                      <span className="font-medium">{material.unit_of_measurement}</span>
                    </div>
                    {material.average_price_per_unit != null && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Precio prom.</span>
                        <span
                          className="font-bold"
                          style={{ fontFamily: "'JetBrains Mono', monospace", color: '#f59e0b' }}
                        >
                          ${material.average_price_per_unit}/{material.unit_of_measurement}
                        </span>
                      </div>
                    )}
                    {material.description && (
                      <p className="text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                        {material.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </AnimateOnScroll>
          ))}
        </div>
      )}

      {/* ── Detail Dialog ── */}
      <Dialog open={!!selectedMaterial} onOpenChange={() => setSelectedMaterial(null)}>
        <DialogContent
          className="max-w-3xl max-h-[85vh] overflow-y-auto"
          style={{
            background: 'var(--surface-1)',
            border: '1px solid var(--border)',
            borderRadius: '4px',
          }}
        >
          <DialogHeader>
            <DialogTitle
              className="font-black text-2xl"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              {selectedMaterial?.name}
            </DialogTitle>

            <DialogDescription asChild>
              <div className="flex flex-wrap gap-2 pt-2">
                <span
                  className="text-[10px] font-bold uppercase tracking-wider px-2 py-1"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    background: 'rgba(245,158,11,0.08)',
                    border: '1px solid rgba(245,158,11,0.18)',
                    color: '#f59e0b',
                    borderRadius: '4px',
                  }}
                >
                  {selectedMaterial ? getCategoryName(selectedMaterial.category_id) : 'Sin categoría'}
                </span>

                {selectedMaterial?.unit_of_measurement && (
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider px-2 py-1"
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      background: 'var(--surface-3)',
                      border: '1px solid var(--border)',
                      color: '#888',
                      borderRadius: '4px',
                    }}
                  >
                    Unidad: {selectedMaterial.unit_of_measurement}
                  </span>
                )}

                {selectedMaterial?.average_price_per_unit != null && (
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider px-2 py-1"
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      background: 'var(--surface-3)',
                      border: '1px solid var(--border)',
                      color: '#888',
                      borderRadius: '4px',
                    }}
                  >
                    ${selectedMaterial.average_price_per_unit}/{selectedMaterial.unit_of_measurement}
                  </span>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>

          {selectedMaterial && (
            <div className="space-y-5 mt-2">

              {/* Descripción */}
              <section
                className="p-4"
                style={{
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  borderLeft: '3px solid #f59e0b',
                  borderRadius: '4px',
                }}
              >
                <p
                  className="text-[10px] font-bold uppercase tracking-wider mb-2"
                  style={{ fontFamily: "'JetBrains Mono', monospace", color: '#f59e0b' }}
                >
                  Descripción
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {selectedMaterial.description || 'Sin descripción disponible'}
                </p>
              </section>

              {/* Usos + Recomendaciones */}
              <div className="grid md:grid-cols-2 gap-4">
                <section
                  className="p-4"
                  style={{
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    borderLeft: '3px solid #38bdf8',
                    borderRadius: '4px',
                  }}
                >
                  <p
                    className="text-[10px] font-bold uppercase tracking-wider mb-2"
                    style={{ fontFamily: "'JetBrains Mono', monospace", color: '#38bdf8' }}
                  >
                    Usos comunes
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {selectedMaterial.common_uses || '—'}
                  </p>
                </section>

                <section
                  className="p-4"
                  style={{
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    borderLeft: '3px solid #10b981',
                    borderRadius: '4px',
                  }}
                >
                  <p
                    className="text-[10px] font-bold uppercase tracking-wider mb-2"
                    style={{ fontFamily: "'JetBrains Mono', monospace", color: '#10b981' }}
                  >
                    Recomendaciones de uso
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {selectedMaterial.usage_recommendations || '—'}
                  </p>
                </section>
              </div>

              {/* Especificaciones técnicas */}
              {selectedMaterial.technical_specs && (
                <section className="space-y-3">
                  <p
                    className="text-[10px] font-bold uppercase tracking-wider"
                    style={{ fontFamily: "'JetBrains Mono', monospace", color: '#f97316' }}
                  >
                    Especificaciones técnicas
                  </p>

                  <div
                    style={{
                      background: 'var(--surface-2)',
                      border: '1px solid var(--border)',
                      borderRadius: '4px',
                      overflow: 'hidden',
                    }}
                  >
                    {Object.entries(selectedMaterial.technical_specs).map(([k, v], idx, arr) => (
                      <div
                        key={k}
                        className="grid md:grid-cols-3 gap-3 px-4 py-3"
                        style={{
                          borderBottom: idx < arr.length - 1 ? '1px solid var(--border)' : 'none',
                        }}
                      >
                        <div className="text-xs font-semibold">{formatLabel(k)}</div>
                        <div className="md:col-span-2 text-xs text-muted-foreground whitespace-pre-wrap break-words">
                          {formatValue(v)}
                        </div>
                      </div>
                    ))}
                  </div>

                  <p
                    className="text-[10px]"
                    style={{ fontFamily: "'JetBrains Mono', monospace", color: '#555' }}
                  >
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
