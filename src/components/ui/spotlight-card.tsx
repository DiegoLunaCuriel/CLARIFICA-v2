"use client";

import { useRef, useState, type ReactNode, type MouseEvent } from "react";
import { cn } from "@/lib/utils";

interface SpotlightCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  glowColor?: string;
}

export function SpotlightCard({
  children,
  className,
  onClick,
  glowColor = "rgba(245,158,11,0.14)",
}: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-2xl cursor-pointer",
        "transition-all duration-300",
        className
      )}
      style={{
        background: isHovered ? "rgba(255,255,255,0.045)" : "rgba(255,255,255,0.025)",
        border: `1px solid ${isHovered ? "rgba(245,158,11,0.25)" : "rgba(255,255,255,0.07)"}`,
        backdropFilter: "blur(8px)",
        boxShadow: isHovered
          ? `0 20px 56px rgba(0,0,0,0.4), 0 0 0 1px rgba(245,158,11,0.15), 0 -4px 16px ${glowColor}`
          : "none",
        transform: isHovered ? "translateY(-3px)" : "none",
        transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
      }}
    >
      {/* Top amber border gradient on hover */}
      <div
        className="pointer-events-none absolute top-0 left-0 right-0 h-px z-20"
        style={{
          opacity: isHovered ? 1 : 0,
          background: "linear-gradient(90deg, transparent, rgba(245,158,11,0.8), transparent)",
          transition: "opacity 0.3s",
        }}
      />
      {/* Spotlight overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(450px circle at ${pos.x}px ${pos.y}px, ${glowColor}, transparent 65%)`,
          transition: "opacity 0.2s",
        }}
      />
      {children}
    </div>
  );
}
