"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Sparkles,
  ShoppingCart,
  Package,
  Lightbulb,
  Clock,
  ArrowRight,
  X,
  CalendarDays,
  User,
  Loader2,
  ChevronRight,
} from "lucide-react";

/* ── Constants ──────────────────────────────────────────── */

const LS_KEY = "clarifica_recent_searches";
const MAX_RECENT = 8;

const TIPS = [
  {
    title: "Cemento Portland",
    text: "Para mezclas de uso general, la proporción clásica es 1:2:3 (cemento, arena, grava). Siempre agrega agua poco a poco.",
  },
  {
    title: "Impermeabilizante",
    text: "Aplica impermeabilizante en temporada de secas. La superficie debe estar limpia, seca y libre de polvo para mejor adherencia.",
  },
  {
    title: "Brocas",
    text: "Usa brocas para concreto (punta de carburo) en muros y brocas HSS en metal. Nunca uses brocas de madera en concreto.",
  },
  {
    title: "Pintura vinílica",
    text: "Rinde más si aplicas primero un sellador. En exteriores, elige pintura 100% acrílica para mayor durabilidad.",
  },
  {
    title: "Herramienta eléctrica",
    text: "Las herramientas de 20V ofrecen el mejor balance entre potencia y peso. Busca combos que incluyan 2 baterías.",
  },
  {
    title: "Tubería PVC",
    text: "El PVC hidráulico (blanco) es para agua potable. El PVC sanitario (gris/naranja) es para drenaje. No los mezcles.",
  },
  {
    title: "Adhesivos",
    text: "El pegazulejo gris es para interiores y pisos. Usa pegazulejo blanco flexible para exteriores y fachadas.",
  },
  {
    title: "Compra inteligente",
    text: "Compara siempre el precio por unidad (kg, litro, metro). A veces la presentación grande no es la más económica.",
  },
  {
    title: "Seguridad en obra",
    text: "Nunca trabajes sin lentes de seguridad al cortar o perforar. Un par de lentes cuesta menos que una visita al doctor.",
  },
  {
    title: "Cinta métrica",
    text: "Mide dos veces, corta una. Para mediciones largas, usa flexómetro de 8m con freno. Para precisión, usa nivel láser.",
  },
];

/* ── Helpers ─────────────────────────────────────────────── */

type RecentSearch = {
  query: string;
  destination: "store-search" | "decision" | "compare";
  timestamp: number;
};

function getRecentSearches(): RecentSearch[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

function saveSearch(query: string, destination: RecentSearch["destination"]) {
  if (typeof window === "undefined" || !query.trim()) return;
  try {
    const current = getRecentSearches();
    const filtered = current.filter(
      (s) => !(s.query.toLowerCase() === query.toLowerCase() && s.destination === destination)
    );
    const updated: RecentSearch[] = [
      { query: query.trim(), destination, timestamp: Date.now() },
      ...filtered,
    ].slice(0, MAX_RECENT);
    localStorage.setItem(LS_KEY, JSON.stringify(updated));
  } catch { }
}

function clearRecentSearches() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(LS_KEY);
  } catch { }
}

function getDailyTip() {
  const now = new Date();
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000
  );
  return TIPS[dayOfYear % TIPS.length];
}

function getDestinationLabel(dest: RecentSearch["destination"]): string {
  switch (dest) {
    case "store-search": return "Buscador";
    case "decision": return "Asistente";
    case "compare": return "Comparador";
  }
}

function getDestinationColor(dest: RecentSearch["destination"]): string {
  switch (dest) {
    case "store-search": return "bg-blue-500/15 text-blue-400 border-blue-500/30";
    case "decision": return "bg-purple-500/15 text-purple-400 border-purple-500/30";
    case "compare": return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
  }
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
}

/* ── Quick Action Card ───────────────────────────────────── */

function ActionCard({
  icon,
  iconStyle,
  topBarColor,
  title,
  description,
  placeholder,
  value,
  onChange,
  onSubmit,
  delay = 0,
}: {
  icon: React.ReactNode;
  iconStyle: React.CSSProperties;
  topBarColor: string;
  title: string;
  description: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  delay?: number;
}) {
  return (
    <div
      className="rounded-2xl p-5 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 duration-500"
      style={{
        background: "rgba(255,255,255,0.025)",
        border: "1px solid rgba(255,255,255,0.07)",
        backdropFilter: "blur(8px)",
        animationDelay: `${delay}ms`,
        animationFillMode: "both",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
        (e.currentTarget as HTMLElement).style.borderColor = topBarColor.replace("1)", "0.3)");
        (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.025)";
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)";
        (e.currentTarget as HTMLElement).style.transform = "";
      }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div
          className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
          style={iconStyle}
        >
          {icon}
        </div>
        <div>
          <p className="font-semibold text-sm">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <form
        onSubmit={(e) => { e.preventDefault(); onSubmit(); }}
        className="flex gap-2"
      >
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 rounded-xl px-3 py-2 text-sm outline-none transition-all"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "inherit",
          }}
          onFocus={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = topBarColor.replace("1)", "0.4)");
            (e.currentTarget as HTMLElement).style.boxShadow = `0 0 0 3px ${topBarColor.replace("1)", "0.08)"}`;
          }}
          onBlur={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)";
            (e.currentTarget as HTMLElement).style.boxShadow = "";
          }}
        />
        <button
          type="submit"
          className="rounded-xl px-3 py-2 text-white text-sm font-semibold transition-all active:scale-95 shrink-0"
          style={{
            background: topBarColor.replace("1)", "0.9)"),
            boxShadow: "0 2px 12px " + topBarColor.replace("1)", "0.3)"),
          }}
        >
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}

/* ── Component ───────────────────────────────────────────── */

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [storeQuery, setStoreQuery] = useState("");
  const [aiQuery, setAiQuery] = useState("");
  const [compareQuery, setCompareQuery] = useState("");

  const tip = getDailyTip();

  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  const goWithSearch = useCallback(
    (query: string, destination: RecentSearch["destination"]) => {
      if (!query.trim()) {
        router.push(`/${destination}`);
        return;
      }
      saveSearch(query, destination);
      const paramName = destination === "decision" ? "q" : "query";
      router.push(`/${destination}?${paramName}=${encodeURIComponent(query.trim())}`);
    },
    [router]
  );

  const handleClearRecent = () => {
    clearRecentSearches();
    setRecentSearches([]);
  };

  const handleRecentClick = (s: RecentSearch) => {
    saveSearch(s.query, s.destination);
    const paramName = s.destination === "decision" ? "q" : "query";
    router.push(`/${s.destination}?${paramName}=${encodeURIComponent(s.query)}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div
          className="h-12 w-12 rounded-2xl flex items-center justify-center"
          style={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)" }}
        >
          <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  const today = new Date().toLocaleDateString("es-MX", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-in fade-in slide-in-from-bottom-3 duration-500">
        <div>
          <h1 className="text-2xl font-bold">
            {getGreeting()},{" "}
            <span
              style={{
                background: "linear-gradient(90deg, #fbbf24, #fb923c)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {user.email?.split("@")[0] || "usuario"}
            </span>
          </h1>
          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5" />
            <span className="capitalize">{today}</span>
          </div>
        </div>
        <div
          className="self-start sm:self-auto flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium"
          style={{
            background: "rgba(245,158,11,0.1)",
            border: "1px solid rgba(245,158,11,0.25)",
            color: "#f59e0b",
          }}
        >
          <User className="h-3 w-3" />
          {user.email}
        </div>
      </div>

      {/* ── Quick actions ── */}
      <div className="grid gap-4 md:grid-cols-3">
        <ActionCard
          icon={<Search className="h-5 w-5 text-blue-400" />}
          iconStyle={{ background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.25)" }}
          topBarColor="rgba(59,130,246,1)"
          title="Buscador de tiendas"
          description="MercadoLibre, Amazon, Home Depot"
          placeholder="ej: taladro inalámbrico"
          value={storeQuery}
          onChange={setStoreQuery}
          onSubmit={() => goWithSearch(storeQuery, "store-search")}
          delay={100}
        />
        <ActionCard
          icon={<Sparkles className="h-5 w-5 text-purple-400" />}
          iconStyle={{ background: "rgba(168,85,247,0.12)", border: "1px solid rgba(168,85,247,0.25)" }}
          topBarColor="rgba(168,85,247,1)"
          title="Asistente IA"
          description="Recomendaciones con pros y contras"
          placeholder="ej: sierra para madera"
          value={aiQuery}
          onChange={setAiQuery}
          onSubmit={() => goWithSearch(aiQuery, "decision")}
          delay={200}
        />
        <ActionCard
          icon={<ShoppingCart className="h-5 w-5 text-emerald-400" />}
          iconStyle={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)" }}
          topBarColor="rgba(16,185,129,1)"
          title="Comparador"
          description="Compara precios entre tiendas"
          placeholder="ej: cemento portland 50kg"
          value={compareQuery}
          onChange={setCompareQuery}
          onSubmit={() => goWithSearch(compareQuery, "compare")}
          delay={300}
        />
      </div>

      {/* ── Bottom row ── */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent searches */}
        <div
          className="rounded-2xl animate-in fade-in slide-in-from-bottom-4 duration-500"
          style={{
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.07)",
            backdropFilter: "blur(8px)",
            animationDelay: "400ms",
            animationFillMode: "both",
          }}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <p className="text-sm font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Búsquedas recientes
            </p>
            {recentSearches.length > 0 && (
              <button
                onClick={handleClearRecent}
                className="text-xs text-muted-foreground hover:text-red-400 transition-colors flex items-center gap-1"
              >
                <X className="h-3 w-3" /> Limpiar
              </button>
            )}
          </div>
          <div className="p-3">
            {recentSearches.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                Tus búsquedas aparecerán aquí.
              </p>
            ) : (
              <div className="space-y-0.5">
                {recentSearches.map((s, i) => (
                  <button
                    key={`${s.query}-${s.destination}-${i}`}
                    type="button"
                    onClick={() => handleRecentClick(s)}
                    className="w-full flex items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition-all"
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; }}
                  >
                    <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="flex-1 truncate">{s.query}</span>
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full shrink-0 font-medium"
                      style={{
                        background: getDestinationColor(s.destination).includes("blue") ? "rgba(59,130,246,0.12)" : getDestinationColor(s.destination).includes("purple") ? "rgba(168,85,247,0.12)" : "rgba(16,185,129,0.12)",
                        border: getDestinationColor(s.destination).includes("blue") ? "1px solid rgba(59,130,246,0.3)" : getDestinationColor(s.destination).includes("purple") ? "1px solid rgba(168,85,247,0.3)" : "1px solid rgba(16,185,129,0.3)",
                        color: getDestinationColor(s.destination).includes("blue") ? "#60a5fa" : getDestinationColor(s.destination).includes("purple") ? "#c084fc" : "#34d399",
                      }}
                    >
                      {getDestinationLabel(s.destination)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: "500ms", animationFillMode: "both" }}>
          {/* Daily tip */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: "linear-gradient(135deg, rgba(245,158,11,0.08), rgba(251,146,60,0.04))",
              border: "1px solid rgba(245,158,11,0.22)",
            }}
          >
            <div className="h-0.5" style={{ background: "linear-gradient(90deg, #f59e0b, #fb923c)" }} />
            <div className="p-5 flex items-start gap-3">
              <div
                className="rounded-xl p-2 shrink-0"
                style={{
                  background: "rgba(245,158,11,0.15)",
                  border: "1px solid rgba(245,158,11,0.25)",
                  boxShadow: "0 0 12px rgba(245,158,11,0.15)",
                }}
              >
                <Lightbulb className="h-4 w-4 text-amber-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-amber-400 mb-1 tracking-wider uppercase">
                  Tip del día — {tip.title}
                </p>
                <p className="text-sm text-foreground/80 leading-relaxed">{tip.text}</p>
              </div>
            </div>
          </div>

          {/* Materials link */}
          <button
            onClick={() => router.push("/materials")}
            className="group w-full rounded-2xl p-5 text-left flex items-center gap-4 transition-all duration-200"
            style={{
              background: "rgba(255,255,255,0.025)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(251,146,60,0.25)";
              (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.025)";
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)";
              (e.currentTarget as HTMLElement).style.transform = "";
            }}
          >
            <div
              className="rounded-xl p-2.5 shrink-0"
              style={{ background: "rgba(251,146,60,0.12)", border: "1px solid rgba(251,146,60,0.25)" }}
            >
              <Package className="h-5 w-5 text-orange-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">Biblioteca de materiales</p>
              <p className="text-xs text-muted-foreground">Fichas técnicas, usos y recomendaciones con IA</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 group-hover:text-orange-400 transition-all" />
          </button>
        </div>
      </div>
    </div>
  );
}


