"use client";

/**
 * Blueprint-style grid background with floating construction SVG icons.
 * Pure CSS + inline SVG — no external images needed.
 */
export function BlueprintBg({ className }: { className?: string }) {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className ?? ""}`} aria-hidden>
      {/* Grid pattern */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(180, 130, 60, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(180, 130, 60, 0.04) 1px, transparent 1px),
            linear-gradient(rgba(180, 130, 60, 0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(180, 130, 60, 0.02) 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px, 80px 80px, 20px 20px, 20px 20px",
        }}
      />
      {/* Radial fade at edges */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at center, transparent 30%, var(--background) 75%)",
        }}
      />
    </div>
  );
}

/* ── Construction SVG icons that float in the background ── */

const TOOLS = [
  // Hammer
  { x: "8%",  y: "15%", size: 38, delay: "0s",  dur: "12s", rotate: -15, icon: "hammer" },
  // Wrench
  { x: "85%", y: "12%", size: 32, delay: "2s",  dur: "14s", rotate: 20,  icon: "wrench" },
  // Hard hat
  { x: "72%", y: "70%", size: 36, delay: "4s",  dur: "11s", rotate: 0,   icon: "hardhat" },
  // Brick
  { x: "15%", y: "75%", size: 34, delay: "1s",  dur: "13s", rotate: 10,  icon: "brick" },
  // Saw
  { x: "45%", y: "85%", size: 30, delay: "3s",  dur: "15s", rotate: -10, icon: "saw" },
  // Ruler
  { x: "92%", y: "45%", size: 28, delay: "5s",  dur: "10s", rotate: 45,  icon: "ruler" },
  // Drill
  { x: "5%",  y: "48%", size: 33, delay: "2.5s", dur: "12s", rotate: -25, icon: "drill" },
  // Gear
  { x: "55%", y: "8%",  size: 26, delay: "6s",  dur: "16s", rotate: 0,   icon: "gear" },
];

function ToolIcon({ icon, size }: { icon: string; size: number }) {
  const s = `${size}`;
  const props = { width: s, height: s, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.2", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

  switch (icon) {
    case "hammer":
      return (
        <svg {...props}>
          <path d="M15 12l-8.5 8.5a2.12 2.12 0 01-3-3L12 9" />
          <path d="M17.64 15L22 10.64" />
          <path d="M20.91 11.7l-1.25-1.25a.47.47 0 00-.67 0L14.3 15.1" />
          <path d="M14 7l-1.1-1.1a2.12 2.12 0 010-3L15 1l6 6-2 2.1a2.12 2.12 0 01-3 0L15 8" />
        </svg>
      );
    case "wrench":
      return (
        <svg {...props}>
          <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
        </svg>
      );
    case "hardhat":
      return (
        <svg {...props}>
          <path d="M2 18a1 1 0 001 1h18a1 1 0 001-1v-2a1 1 0 00-1-1H3a1 1 0 00-1 1v2z" />
          <path d="M10 15V6.5a3.5 3.5 0 117 0V15" />
          <path d="M5 15v-1a7 7 0 0114 0v1" />
        </svg>
      );
    case "brick":
      return (
        <svg {...props}>
          <rect x="1" y="4" width="22" height="7" rx="1" />
          <rect x="1" y="13" width="22" height="7" rx="1" />
          <line x1="12" y1="4" x2="12" y2="11" />
          <line x1="7" y1="13" x2="7" y2="20" />
          <line x1="17" y1="13" x2="17" y2="20" />
        </svg>
      );
    case "saw":
      return (
        <svg {...props}>
          <path d="M12 6l-8 8h16z" />
          <path d="M12 2v4" />
          <path d="M4 14v6a2 2 0 002 2h12a2 2 0 002-2v-6" />
        </svg>
      );
    case "ruler":
      return (
        <svg {...props}>
          <path d="M3 5v14a2 2 0 002 2h14" />
          <path d="M3 9h4" />
          <path d="M3 13h2" />
          <path d="M3 17h4" />
          <path d="M3 5h4" />
          <path d="M9 3v4" />
          <path d="M13 3v2" />
          <path d="M17 3v4" />
          <path d="M21 3H5a2 2 0 00-2 2" />
        </svg>
      );
    case "drill":
      return (
        <svg {...props}>
          <path d="M14 12l-8.5 8.5a2.12 2.12 0 01-3-3L11 9" />
          <path d="M15 13l4-4" />
          <path d="M20 8l-1-1" />
          <path d="M14 4l6 6" />
          <circle cx="17" cy="7" r="1" />
        </svg>
      );
    case "gear":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
        </svg>
      );
    default:
      return null;
  }
}

export function ConstructionIcons() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {TOOLS.map((t, i) => (
        <div
          key={i}
          className="absolute text-amber-400/[0.07]"
          style={{
            left: t.x,
            top: t.y,
            transform: `rotate(${t.rotate}deg)`,
            animation: `float-particle ${t.dur} ease-in-out ${t.delay} infinite`,
          }}
        >
          <ToolIcon icon={t.icon} size={t.size} />
        </div>
      ))}
    </div>
  );
}
