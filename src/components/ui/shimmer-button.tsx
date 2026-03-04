"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ShimmerButtonProps {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  variant?: "amber" | "ghost";
}

export function ShimmerButton({
  children,
  className,
  disabled,
  onClick,
  variant = "amber",
}: ShimmerButtonProps) {
  const isGhost = variant === "ghost";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "group relative inline-flex items-center justify-center overflow-hidden rounded-xl",
        "px-4 py-2.5 text-sm font-semibold",
        "transition-all duration-200 active:scale-95",
        "disabled:opacity-40 disabled:pointer-events-none",
        isGhost
          ? "text-foreground/80 hover:text-foreground"
          : "text-white",
        className
      )}
      style={
        isGhost
          ? {
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
            backdropFilter: "blur(8px)",
          }
          : {
            background: "linear-gradient(135deg, #d97706, #f59e0b, #ea580c)",
            boxShadow: disabled
              ? undefined
              : "0 2px 16px rgba(245,158,11,0.3), inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -1px 0 rgba(0,0,0,0.1)",
          }
      }
      onMouseEnter={(e) => {
        if (disabled) return;
        const el = e.currentTarget as HTMLElement;
        if (isGhost) {
          el.style.background = "rgba(255,255,255,0.07)";
          el.style.borderColor = "rgba(255,255,255,0.16)";
        } else {
          el.style.boxShadow = "0 6px 28px rgba(245,158,11,0.5), inset 0 1px 0 rgba(255,255,255,0.18)";
          el.style.transform = "translateY(-1px)";
        }
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        if (isGhost) {
          el.style.background = "rgba(255,255,255,0.04)";
          el.style.borderColor = "rgba(255,255,255,0.1)";
        } else {
          el.style.boxShadow = "0 2px 16px rgba(245,158,11,0.3), inset 0 1px 0 rgba(255,255,255,0.18)";
          el.style.transform = "";
        }
      }}
    >
      {/* Shimmer overlay */}
      {!isGhost && (
        <span
          className="pointer-events-none absolute inset-0"
          aria-hidden
          style={{
            background:
              "linear-gradient(110deg, transparent 20%, rgba(255,255,255,0.22) 50%, transparent 80%)",
            backgroundSize: "200% 100%",
            animation: "shimmer-sweep 2.5s ease-in-out infinite",
          }}
        />
      )}
      {/* Top light edge */}
      {!isGhost && (
        <span
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          aria-hidden
          style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)" }}
        />
      )}
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  );
}
