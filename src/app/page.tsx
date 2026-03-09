"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter } from "next/navigation";
import {
  Package,
  ShoppingCart,
  LayoutDashboard,
  Sparkles,
  Search,
  Loader2,
  ArrowUpRight,
  Zap,
  Store,
} from "lucide-react";
import { motion, useInView } from "framer-motion";

/* ── Feature cards ── */
const FEATURES = [
  {
    num: "01",
    href: "/dashboard",
    requiresAuth: true,
    icon: LayoutDashboard,
    badge: "Personal",
    title: "Dashboard",
    description: "Tu espacio personal. Accede rápido a búsquedas recientes, proyectos y recomendaciones guardadas.",
    cta: "Abrir panel",
    accentColor: "#f5a400",
    accentRgb: "245,164,0",
  },
  {
    num: "02",
    href: "/materials",
    icon: Package,
    badge: "Catálogo",
    title: "Materiales IA",
    description: "Fichas técnicas generadas con inteligencia artificial: usos, especificaciones y recomendaciones de compra.",
    cta: "Explorar catálogo",
    accentColor: "#ff6600",
    accentRgb: "255,102,0",
  },
  {
    num: "03",
    href: "/store-search",
    icon: Search,
    badge: "Búsqueda",
    title: "Buscador",
    description: "Encuentra y compara precios en Home Depot, Mercado Libre y Amazon México en tiempo real.",
    cta: "Buscar materiales",
    accentColor: "#00cfff",
    accentRgb: "0,207,255",
  },
  {
    num: "04",
    href: "/decision",
    icon: Sparkles,
    badge: "IA Avanzada",
    title: "Asistente IA",
    description: "Responde preguntas sobre tu proyecto y recibe la recomendación perfecta con pros, contras y precio.",
    cta: "Consultar asistente",
    accentColor: "#a855f7",
    accentRgb: "168,85,247",
  },
];

const STATS = [
  { value: 3, suffix: "+", label: "Tiendas conectadas" },
  { value: 100, suffix: "%", label: "Gratuito" },
  { value: 24, suffix: "/7", label: "Disponibilidad" },
  { value: 50, suffix: "k+", label: "Productos indexados" },
];

const WHY_ITEMS = [
  {
    icon: Sparkles,
    iconColor: "#a855f7",
    iconBg: "rgba(168,85,247,0.1)",
    title: "Powered by Gemini AI",
    description: "Fichas técnicas, recomendaciones personalizadas y sugerencias de búsqueda con la IA más avanzada de Google.",
  },
  {
    icon: Store,
    iconColor: "#00cfff",
    iconBg: "rgba(0,207,255,0.1)",
    title: "Precios reales",
    description: "Conectamos con Home Depot México, Mercado Libre y Amazon para precios y disponibilidad en tiempo real.",
  },
  {
    icon: Zap,
    iconColor: "#00c56e",
    iconBg: "rgba(0,197,110,0.1)",
    title: "Sin costo",
    description: "Todas las funciones disponibles de forma gratuita. Regístrate para guardar tu historial de búsquedas.",
  },
];

/* ── Animated counter ── */
function AnimatedCounter({ value, suffix }: { value: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 1000;
    const steps = 40;
    const step = value / steps;
    let current = 0;
    let count = 0;
    const timer = setInterval(() => {
      count++;
      current = Math.min(current + step, value);
      setDisplay(Math.round(current));
      if (count >= steps) clearInterval(timer);
    }, duration / steps);
    return () => clearInterval(timer);
  }, [inView, value]);

  return (
    <span ref={ref}>
      {inView ? display : 0}{suffix}
    </span>
  );
}

/* ── Main component ── */
export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const go = (path: string, requiresAuth = false) => {
    if (requiresAuth && !user) { router.push("/login"); return; }
    router.push(path);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-5 w-5 animate-spin" style={{ color: "var(--amber)" }} />
      </div>
    );
  }

  return (
    <div>
      {/* ══════════════════════════════════════
          HERO
      ══════════════════════════════════════ */}
      <section className="relative min-h-[85vh] flex flex-col justify-center px-4 pt-16 pb-20 overflow-hidden">

        {/* Blueprint grid background */}
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden
          style={{
            backgroundImage: `
              linear-gradient(rgba(245,164,0,0.04) 1px, transparent 1px),
              linear-gradient(90deg, rgba(245,164,0,0.04) 1px, transparent 1px)
            `,
            backgroundSize: "64px 64px",
            maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 80%)",
            WebkitMaskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 80%)",
          }}
        />

        {/* Amber glow blob */}
        <div
          className="absolute pointer-events-none"
          aria-hidden
          style={{
            top: "10%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "600px",
            height: "300px",
            background: "radial-gradient(ellipse, rgba(245,164,0,0.08) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />

        <div className="relative z-10 max-w-6xl mx-auto w-full">
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center gap-3 mb-8"
          >
            <div
              className="h-px flex-1 max-w-12"
              style={{ background: "var(--amber)" }}
            />
            <span
              className="text-[11px] tracking-[0.2em] uppercase font-medium"
              style={{ fontFamily: "'JetBrains Mono', monospace", color: "var(--amber)" }}
            >
              Hub de Construcción · México
            </span>
          </motion.div>

          {/* Main title — massive, Syne */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <h1
              className="font-black leading-[0.9] tracking-[-0.04em] mb-8 whitespace-nowrap"
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: "clamp(48px, 10vw, 160px)",
              }}
            >
              <motion.span
                initial={{ clipPath: "polygon(0 100%, 100% 100%, 100% 100%, 0 100%)", opacity: 0 }}
                animate={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)", opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                style={{ color: "var(--amber)" }}
              >
                CLAR
              </motion.span>
              <motion.span
                initial={{ clipPath: "polygon(0 100%, 100% 100%, 100% 100%, 0 100%)", opacity: 0 }}
                animate={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)", opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                style={{ color: "var(--foreground)" }}
              >
                IFICA
              </motion.span>
            </h1>
          </motion.div>

          {/* Subtitle + CTA row */}
          <div className="flex flex-col lg:flex-row items-start lg:items-end gap-8 lg:gap-16">
            <motion.div
              className="flex-1 max-w-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <p
                className="text-base md:text-lg leading-relaxed mb-6"
                style={{ color: "var(--muted-foreground)", fontFamily: "'DM Sans', sans-serif" }}
              >
                Explora materiales con{" "}
                <span style={{ color: "var(--amber)", fontWeight: 600 }}>inteligencia artificial</span>,
                compara precios en tiendas reales y recibe{" "}
                <span style={{ color: "#a855f7", fontWeight: 600 }}>recomendaciones personalizadas</span>{" "}
                para tus proyectos.
              </p>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                {/* Primary CTA */}
                <button
                  onClick={() => go("/store-search")}
                  className="group relative inline-flex items-center gap-2.5 px-6 py-3.5 text-sm font-bold transition-all duration-150 active:scale-95 overflow-hidden btn-shimmer"
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    background: "var(--amber)",
                    color: "#080807",
                    border: "none",
                    borderRadius: "2px",
                    letterSpacing: "-0.01em",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "#ffc030";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "var(--amber)";
                  }}
                >
                  <Search className="h-4 w-4" style={{ strokeWidth: 2 }} />
                  Empezar a buscar
                  <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>

                {/* Secondary CTA */}
                <button
                  onClick={() => go("/decision")}
                  className="group inline-flex items-center gap-2.5 px-6 py-3.5 text-sm font-semibold transition-all duration-150 active:scale-95"
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    background: "transparent",
                    color: "var(--foreground)",
                    border: "1px solid var(--border-strong)",
                    borderRadius: "2px",
                    letterSpacing: "-0.01em",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(245,164,0,0.4)";
                    (e.currentTarget as HTMLElement).style.background = "rgba(245,164,0,0.05)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--border-strong)";
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                  }}
                >
                  <Sparkles className="h-4 w-4" style={{ color: "#a855f7", strokeWidth: 2 }} />
                  Usar asistente IA
                </button>
              </div>
            </motion.div>

            {/* Floating store cards */}
            <motion.div
              className="flex gap-3 flex-wrap"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              {[
                { name: "Home Depot", color: "#ff6600", rgb: "255,102,0", price: "$189" },
                { name: "Mercado Libre", color: "#f5a400", rgb: "245,164,0", price: "$159" },
                { name: "Amazon MX", color: "#00cfff", rgb: "0,207,255", price: "$175" },
              ].map((s, i) => (
                <motion.div
                  key={s.name}
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 3 + i * 0.8, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }}
                  style={{
                    background: "var(--surface-1)",
                    border: `1px solid rgba(${s.rgb}, 0.25)`,
                    borderTop: `2px solid ${s.color}`,
                    borderRadius: "2px",
                    padding: "10px 14px",
                    minWidth: "120px",
                  }}
                >
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="h-2 w-2 rounded-full shrink-0" style={{ background: s.color }} />
                    <span className="text-[11px] font-semibold" style={{ color: s.color, fontFamily: "'DM Sans', sans-serif" }}>
                      {s.name}
                    </span>
                  </div>
                  <div
                    className="text-xs font-bold"
                    style={{ fontFamily: "'JetBrains Mono', monospace", color: "var(--foreground)" }}
                  >
                    {s.price}
                  </div>
                  <div className="text-[10px] mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                    Cemento 50kg
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          STATS
      ══════════════════════════════════════ */}
      <section
        className="border-y"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="grid grid-cols-2 md:grid-cols-4">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              className="flex flex-col items-center justify-center py-10 px-4 text-center"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
              style={{
                borderRight: i < STATS.length - 1 ? "1px solid var(--border)" : "none",
              }}
            >
              <span
                className="text-4xl md:text-5xl font-black leading-none mb-2"
                style={{ fontFamily: "'Syne', sans-serif", color: "var(--amber)" }}
              >
                <AnimatedCounter value={stat.value} suffix={stat.suffix} />
              </span>
              <span
                className="text-[11px] uppercase tracking-[0.12em] font-medium"
                style={{ fontFamily: "'JetBrains Mono', monospace", color: "var(--muted-foreground)" }}
              >
                {stat.label}
              </span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════
          FEATURE CARDS
      ══════════════════════════════════════ */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-14">
            <motion.p
              className="text-[11px] tracking-[0.2em] uppercase mb-3 font-medium"
              style={{ fontFamily: "'JetBrains Mono', monospace", color: "var(--amber)" }}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              // Herramientas
            </motion.p>
            <motion.h2
              className="text-4xl md:text-5xl font-black tracking-[-0.03em] leading-none"
              style={{ fontFamily: "'Syne', sans-serif" }}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.05 }}
            >
              Todo en un solo lugar
            </motion.h2>
          </div>

          {/* Feature grid */}
          <div
            className="grid sm:grid-cols-2 xl:grid-cols-4 border"
            style={{ borderColor: "var(--border)", borderRadius: "2px", overflow: "hidden" }}
          >
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.button
                  key={f.href}
                  className="group relative text-left w-full p-7 flex flex-col"
                  style={{
                    background: "var(--surface-1)",
                    borderRight: i < FEATURES.length - 1 ? "1px solid var(--border)" : "none",
                    minHeight: "300px",
                    outline: "none",
                  }}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-30px" }}
                  transition={{ duration: 0.45, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "var(--surface-2)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "var(--surface-1)";
                  }}
                  onClick={() => go(f.href, f.requiresAuth)}
                >
                  {/* Number */}
                  <span
                    className="text-xs block mb-5 opacity-60"
                    style={{ fontFamily: "'JetBrains Mono', monospace", color: f.accentColor }}
                  >
                    {f.num}
                  </span>

                  {/* Icon box */}
                  <div
                    className="h-11 w-11 flex items-center justify-center mb-4"
                    style={{
                      background: `rgba(${f.accentRgb}, 0.12)`,
                      border: `1px solid rgba(${f.accentRgb}, 0.25)`,
                      borderRadius: "2px",
                    }}
                  >
                    <Icon className="h-5 w-5" style={{ color: f.accentColor, strokeWidth: 1.8 }} />
                  </div>

                  {/* Badge */}
                  <span
                    className="inline-block text-[9px] font-bold uppercase tracking-[0.12em] px-2 py-0.5 mb-4"
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      color: f.accentColor,
                      border: `1px solid rgba(${f.accentRgb}, 0.3)`,
                      borderRadius: "2px",
                      background: `rgba(${f.accentRgb}, 0.06)`,
                    }}
                  >
                    {f.badge}
                  </span>

                  <h3
                    className="text-xl font-bold mb-2.5 tracking-[-0.02em]"
                    style={{ fontFamily: "'Syne', sans-serif" }}
                  >
                    {f.title}
                  </h3>

                  <p
                    className="text-sm leading-relaxed flex-1"
                    style={{ color: "var(--muted-foreground)", fontFamily: "'DM Sans', sans-serif" }}
                  >
                    {f.description}
                  </p>

                  {/* CTA */}
                  <div
                    className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.08em]"
                    style={{ fontFamily: "'DM Sans', sans-serif", color: f.accentColor }}
                  >
                    {f.cta}
                    <ArrowUpRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </div>

                  {/* Bottom accent on hover */}
                  <div
                    className="absolute bottom-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    style={{ background: f.accentColor }}
                  />
                </motion.button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          WHY SECTION
      ══════════════════════════════════════ */}
      <section
        className="py-24 px-4 border-t"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="max-w-5xl mx-auto">
          <div className="mb-16">
            <motion.p
              className="text-[11px] tracking-[0.2em] uppercase mb-3 font-medium"
              style={{ fontFamily: "'JetBrains Mono', monospace", color: "var(--amber)" }}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              // ¿Por qué CLARIFICA?
            </motion.p>
            <motion.h2
              className="text-4xl md:text-5xl font-black tracking-[-0.03em]"
              style={{ fontFamily: "'Syne', sans-serif" }}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.05 }}
            >
              La diferencia
            </motion.h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {WHY_ITEMS.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  className="flex flex-col gap-5 p-6"
                  style={{
                    background: "var(--surface-1)",
                    border: "1px solid var(--border)",
                    borderRadius: "2px",
                  }}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-30px" }}
                  transition={{ duration: 0.45, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div
                    className="h-10 w-10 flex items-center justify-center"
                    style={{ background: item.iconBg, borderRadius: "2px", border: `1px solid rgba(${item.iconColor === "#a855f7" ? "168,85,247" : item.iconColor === "#00cfff" ? "0,207,255" : "0,197,110"},0.2)` }}
                  >
                    <Icon className="h-5 w-5" style={{ color: item.iconColor, strokeWidth: 1.8 }} />
                  </div>

                  <div>
                    <h3
                      className="text-base font-bold mb-2 tracking-[-0.02em]"
                      style={{ fontFamily: "'Syne', sans-serif" }}
                    >
                      {item.title}
                    </h3>
                    <p
                      className="text-sm leading-relaxed"
                      style={{ color: "var(--muted-foreground)", fontFamily: "'DM Sans', sans-serif" }}
                    >
                      {item.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          CTA SECTION
      ══════════════════════════════════════ */}
      <section
        className="py-24 px-4 border-t"
        style={{ borderColor: "var(--border)" }}
      >
        <motion.div
          className="max-w-4xl mx-auto relative overflow-hidden"
          style={{
            background: "var(--surface-1)",
            border: "1px solid var(--border)",
            borderRadius: "2px",
          }}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Warning stripe header */}
          <div
            className="h-1.5 w-full warning-stripe"
          />

          <div className="p-12 md:p-16 text-center relative">
            {/* Amber radial glow */}
            <div
              className="absolute inset-0 pointer-events-none"
              aria-hidden
              style={{
                background: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(245,164,0,0.07) 0%, transparent 70%)",
              }}
            />

            <div className="relative">
              <p
                className="text-[11px] tracking-[0.2em] uppercase mb-5 font-medium"
                style={{ fontFamily: "'JetBrains Mono', monospace", color: "var(--amber)" }}
              >
                // Gratis · Sin registro requerido
              </p>

              <h2
                className="text-3xl md:text-4xl font-black tracking-[-0.03em] mb-4"
                style={{ fontFamily: "'Syne', sans-serif" }}
              >
                Empieza a construir con inteligencia
              </h2>

              <p
                className="text-sm mb-8 max-w-sm mx-auto leading-relaxed"
                style={{ color: "var(--muted-foreground)", fontFamily: "'DM Sans', sans-serif" }}
              >
                Busca materiales, compara precios y obtén recomendaciones de IA — todo gratis.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => go("/store-search")}
                  className="btn-shimmer group inline-flex items-center gap-2.5 px-7 py-3.5 text-sm font-bold transition-all duration-150 active:scale-95"
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    background: "var(--amber)",
                    color: "#080807",
                    border: "none",
                    borderRadius: "2px",
                    letterSpacing: "-0.01em",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#ffc030"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--amber)"; }}
                >
                  <Search className="h-4 w-4" style={{ strokeWidth: 2 }} />
                  Buscar materiales gratis
                  <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>

                <button
                  onClick={() => go("/materials")}
                  className="group inline-flex items-center gap-2.5 px-6 py-3.5 text-sm font-semibold transition-all duration-150 active:scale-95"
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    background: "transparent",
                    color: "var(--foreground)",
                    border: "1px solid var(--border-strong)",
                    borderRadius: "2px",
                    letterSpacing: "-0.01em",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(245,164,0,0.4)";
                    (e.currentTarget as HTMLElement).style.background = "rgba(245,164,0,0.05)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--border-strong)";
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                  }}
                >
                  <Package className="h-4 w-4" style={{ color: "#ff6600", strokeWidth: 1.8 }} />
                  Ver catálogo
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
