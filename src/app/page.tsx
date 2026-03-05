"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter } from "next/navigation";
import {
  Package,
  ShoppingCart,
  LayoutDashboard,
  Sparkles,
  Search,
  Loader2,
  HardHat,
  ArrowRight,
  Zap,
  Star,
  Shield,
  TrendingUp,
} from "lucide-react";
import { AnimateOnScroll } from "@/components/ui/animate-on-scroll";
import { FloatingTools, ConstructionScene } from "@/components/ui/interactive-tools";

/* ── Feature cards ─────────────────────────────────── */
const FEATURES = [
  {
    href: "/dashboard",
    requiresAuth: true,
    icon: LayoutDashboard,
    iconColor: "amber",
    badge: "Personal",
    title: "Dashboard",
    description: "Tu espacio personal. Accede rápido a tus búsquedas recientes, proyectos y recomendaciones.",
    cta: "Abrir",
    gradient: "from-amber-500/20 via-amber-600/5 to-transparent",
    border: "rgba(245,158,11,0.25)",
    glow: "rgba(245,158,11,0.15)",
    iconBg: "rgba(245,158,11,0.15)",
    iconBorder: "rgba(245,158,11,0.3)",
    iconGlow: "rgba(245,158,11,0.3)",
  },
  {
    href: "/materials",
    icon: Package,
    iconColor: "orange",
    badge: "Catálogo",
    title: "Materiales IA",
    description: "Fichas técnicas generadas con inteligencia artificial: usos, especificaciones y recomendaciones.",
    cta: "Explorar",
    gradient: "from-orange-500/15 via-orange-600/5 to-transparent",
    border: "rgba(251,146,60,0.25)",
    glow: "rgba(251,146,60,0.15)",
    iconBg: "rgba(251,146,60,0.15)",
    iconBorder: "rgba(251,146,60,0.3)",
    iconGlow: "rgba(251,146,60,0.3)",
  },
  {
    href: "/store-search",
    icon: Search,
    iconColor: "blue",
    badge: "Búsqueda",
    title: "Buscador",
    description: "Encuentra y compara precios en Home Depot, Mercado Libre y Amazon en tiempo real.",
    cta: "Buscar",
    gradient: "from-blue-500/15 via-blue-600/5 to-transparent",
    border: "rgba(59,130,246,0.25)",
    glow: "rgba(59,130,246,0.15)",
    iconBg: "rgba(59,130,246,0.15)",
    iconBorder: "rgba(59,130,246,0.3)",
    iconGlow: "rgba(59,130,246,0.3)",
  },
  {
    href: "/decision",
    icon: Sparkles,
    iconColor: "purple",
    badge: "IA Avanzada",
    title: "Asistente IA",
    description: "Responde preguntas sobre tu proyecto y recibe la recomendación perfecta con pros y contras.",
    cta: "Consultar",
    gradient: "from-purple-500/15 via-purple-600/5 to-transparent",
    border: "rgba(168,85,247,0.25)",
    glow: "rgba(168,85,247,0.15)",
    iconBg: "rgba(168,85,247,0.15)",
    iconBorder: "rgba(168,85,247,0.3)",
    iconGlow: "rgba(168,85,247,0.3)",
  },
];

/* ── Stats ─────────────────────────────────── */
const STATS = [
  { label: "Tiendas", value: "3+", icon: Zap, color: "text-amber-400" },
  { label: "Materiales", value: "IA", icon: Sparkles, color: "text-purple-400" },
  { label: "Gratis", value: "100%", icon: Star, color: "text-emerald-400" },
  { label: "Comparador", value: "Real-time", icon: TrendingUp, color: "text-blue-400" },
];

/* ── Why section ─────────────────────────────────── */
const WHY_ITEMS = [
  {
    icon: Sparkles,
    color: "purple",
    iconBg: "rgba(168,85,247,0.12)",
    iconBorder: "rgba(168,85,247,0.25)",
    title: "Powered by Gemini AI",
    description: "Generación de fichas técnicas, recomendaciones personalizadas y sugerencias de búsqueda con IA de última generación.",
  },
  {
    icon: ShoppingCart,
    color: "blue",
    iconBg: "rgba(59,130,246,0.12)",
    iconBorder: "rgba(59,130,246,0.25)",
    title: "Precios reales",
    description: "Conectamos directamente con Home Depot México, Mercado Libre y Amazon para darte precios y disponibilidad actualizados.",
  },
  {
    icon: Shield,
    color: "emerald",
    iconBg: "rgba(16,185,129,0.12)",
    iconBorder: "rgba(16,185,129,0.25)",
    title: "Sin costo",
    description: "Todas las funciones disponibles de forma gratuita. Regístrate para guardar tu historial de búsquedas.",
  },
];

/* ── Component ─────────────────────────────────── */
export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const go = (path: string, requiresAuth = false) => {
    if (requiresAuth && !user) {
      router.push("/login");
      return;
    }
    router.push(path);
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

  return (
    <div className="space-y-24 pb-16">
      <FloatingTools />

      {/* ══════════════════════════════════════════
          HERO SECTION
      ══════════════════════════════════════════ */}
      <section className="relative text-center pt-4 pb-12 overflow-hidden rounded-3xl">
        {/* Aurora blobs */}
        <div
          className="absolute inset-0 pointer-events-none rounded-3xl overflow-hidden"
          aria-hidden
        >
          <div
            style={{
              position: "absolute",
              width: "70%",
              height: "70%",
              top: "-20%",
              left: "-10%",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(245,158,11,0.18) 0%, transparent 70%)",
              filter: "blur(40px)",
              animation: "aurora-1 12s ease-in-out infinite",
            }}
          />
          <div
            style={{
              position: "absolute",
              width: "60%",
              height: "60%",
              top: "-10%",
              right: "-15%",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(168,85,247,0.12) 0%, transparent 70%)",
              filter: "blur(50px)",
              animation: "aurora-2 15s ease-in-out infinite",
            }}
          />
          <div
            style={{
              position: "absolute",
              width: "50%",
              height: "50%",
              bottom: "0%",
              left: "20%",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)",
              filter: "blur(60px)",
              animation: "aurora-3 18s ease-in-out infinite",
            }}
          />
          {/* Grid overlay */}
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: "linear-gradient(rgba(245,158,11,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.06) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />
          {/* Border glow */}
          <div
            className="absolute inset-0 rounded-3xl"
            style={{
              background: "linear-gradient(135deg, rgba(245,158,11,0.06), transparent 50%, rgba(168,85,247,0.04))",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          />
        </div>

        <div className="relative z-10 px-4">
          {/* Badge */}
          <AnimateOnScroll>
            <div
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-semibold tracking-widest uppercase mb-8"
              style={{
                background: "rgba(245,158,11,0.1)",
                border: "1px solid rgba(245,158,11,0.25)",
                color: "#f59e0b",
                backdropFilter: "blur(8px)",
              }}
            >
              <HardHat className="h-3.5 w-3.5" />
              Hub de Construcción Inteligente
            </div>
          </AnimateOnScroll>

          {/* Title */}
          <AnimateOnScroll delay={0.08}>
            <h1
              className="text-6xl md:text-8xl font-black mb-6 leading-[0.9] tracking-tight"
              style={{ animationFillMode: "both" }}
            >
              <span
                style={{
                  background: "linear-gradient(90deg, #fbbf24 0%, #fef3c7 35%, #fb923c 65%, #fbbf24 100%)",
                  backgroundSize: "300% auto",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  animation: "gradient-shift 6s ease infinite",
                  display: "block",
                }}
              >
                Tu Hub de
              </span>
              <span
                className="text-foreground"
                style={{ display: "block", opacity: 0.93 }}
              >
                Construcción
              </span>
            </h1>
          </AnimateOnScroll>

          {/* Subtitle */}
          <AnimateOnScroll delay={0.18}>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-10">
              Explora materiales con{" "}
              <span className="text-amber-400 font-semibold">inteligencia artificial</span>,
              compara precios en tiendas reales y recibe{" "}
              <span className="text-purple-400 font-semibold">recomendaciones personalizadas</span>{" "}
              para tus proyectos de construcción.
            </p>
          </AnimateOnScroll>

          {/* CTA buttons */}
          <AnimateOnScroll delay={0.26}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => go("/store-search")}
                className="group relative inline-flex items-center gap-2.5 rounded-2xl px-7 py-3.5 text-sm font-semibold text-white transition-all duration-300 active:scale-95"
                style={{
                  background: "linear-gradient(135deg, #d97706, #f59e0b, #ea580c)",
                  boxShadow: "0 4px 20px rgba(245,158,11,0.35), inset 0 1px 0 rgba(255,255,255,0.2)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 32px rgba(245,158,11,0.5), inset 0 1px 0 rgba(255,255,255,0.2)";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(245,158,11,0.35), inset 0 1px 0 rgba(255,255,255,0.2)";
                  (e.currentTarget as HTMLElement).style.transform = "";
                }}
              >
                {/* Shimmer */}
                <span
                  className="pointer-events-none absolute inset-0 rounded-2xl overflow-hidden"
                  aria-hidden
                >
                  <span
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "linear-gradient(110deg, transparent 25%, rgba(255,255,255,0.2) 50%, transparent 75%)",
                      backgroundSize: "200% 100%",
                      animation: "shimmer-sweep 2.5s ease-in-out infinite",
                    }}
                  />
                </span>
                <Search className="h-4 w-4 relative z-10" />
                <span className="relative z-10">Empezar a buscar</span>
              </button>

              <button
                onClick={() => go("/decision")}
                className="group inline-flex items-center gap-2.5 rounded-2xl px-7 py-3.5 text-sm font-semibold text-foreground/90 transition-all duration-300 active:scale-95"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  backdropFilter: "blur(8px)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(168,85,247,0.1)";
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(168,85,247,0.3)";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.1)";
                  (e.currentTarget as HTMLElement).style.transform = "";
                }}
              >
                <Sparkles className="h-4 w-4 text-purple-400" />
                Usar asistente IA
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          STATS STRIP
      ══════════════════════════════════════════ */}
      <AnimateOnScroll delay={0.1}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto">
          {STATS.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="rounded-2xl p-4 text-center"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  backdropFilter: "blur(8px)",
                  animationDelay: `${i * 0.06}s`,
                }}
              >
                <Icon className={`h-4 w-4 mx-auto mb-2 ${stat.color}`} />
                <div className="text-xl font-bold">{stat.value}</div>
                <div className="text-[11px] text-muted-foreground">{stat.label}</div>
              </div>
            );
          })}
        </div>
      </AnimateOnScroll>

      {/* ══════════════════════════════════════════
          FEATURE CARDS
      ══════════════════════════════════════════ */}
      <section>
        <AnimateOnScroll>
          <div className="text-center mb-12">
            <div className="section-badge mb-4">
              <Zap className="h-3 w-3" />
              Herramientas
            </div>
            <h2 className="text-4xl font-bold mb-3">Todo en un solo lugar</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Desde la búsqueda de materiales hasta la comparación de precios, con IA en cada paso.
            </p>
          </div>
        </AnimateOnScroll>

        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-5 max-w-7xl mx-auto">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <AnimateOnScroll key={f.href} delay={i * 0.1}>
                <button
                  className="group relative text-left w-full rounded-2xl p-6 transition-all duration-300 overflow-hidden"
                  style={{
                    background: "rgba(255,255,255,0.025)",
                    border: `1px solid rgba(255,255,255,0.07)`,
                    backdropFilter: "blur(8px)",
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.background = `linear-gradient(135deg, ${f.gradient.replace("from-", "").replace(" via-", ", ").replace(" to-transparent", ", transparent")})`;
                    el.style.borderColor = f.border;
                    el.style.boxShadow = `0 20px 48px rgba(0,0,0,0.3), 0 0 0 1px ${f.border}`;
                    el.style.transform = "translateY(-4px)";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.background = "rgba(255,255,255,0.025)";
                    el.style.borderColor = "rgba(255,255,255,0.07)";
                    el.style.boxShadow = "";
                    el.style.transform = "";
                  }}
                  onClick={() => go(f.href, f.requiresAuth)}
                >
                  {/* Badge */}
                  <div className="flex items-center justify-between mb-5">
                    <div
                      className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        background: f.iconBg,
                        border: `1px solid ${f.iconBorder}`,
                        boxShadow: `0 0 16px ${f.iconGlow}`,
                      }}
                    >
                      <Icon className="h-5 w-5" style={{ color: f.border.replace("0.25", "1") }} />
                    </div>
                    <span
                      className="text-[10px] font-semibold tracking-widest uppercase px-2.5 py-1 rounded-full"
                      style={{ background: f.iconBg, border: `1px solid ${f.iconBorder}`, color: f.border.replace("0.25", "0.9") }}
                    >
                      {f.badge}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-5">{f.description}</p>

                  <div
                    className="inline-flex items-center gap-1.5 text-sm font-semibold"
                    style={{ color: f.border.replace("0.25", "1") }}
                  >
                    {f.cta}
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              </AnimateOnScroll>
            );
          })}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          WHY SECTION
      ══════════════════════════════════════════ */}
      <section>
        <AnimateOnScroll>
          <div className="text-center mb-12">
            <div className="section-badge mb-4">
              <Star className="h-3 w-3" />
              ¿Por qué CLARIFICA?
            </div>
            <h2 className="text-4xl font-bold">La diferencia</h2>
          </div>
        </AnimateOnScroll>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {WHY_ITEMS.map((item, i) => {
            const Icon = item.icon;
            return (
              <AnimateOnScroll key={item.title} delay={i * 0.12}>
                <div
                  className="rounded-2xl p-6"
                  style={{
                    background: "rgba(255,255,255,0.025)",
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  <div
                    className="h-12 w-12 rounded-2xl flex items-center justify-center mb-5"
                    style={{ background: item.iconBg, border: `1px solid ${item.iconBorder}` }}
                  >
                    <Icon className="h-6 w-6" style={{ color: item.iconBorder.replace("0.25", "1") }} />
                  </div>
                  <h3 className="text-base font-bold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
              </AnimateOnScroll>
            );
          })}
        </div>
      </section>

      {/* Construction scene */}
      <ConstructionScene />
    </div>
  );
}

