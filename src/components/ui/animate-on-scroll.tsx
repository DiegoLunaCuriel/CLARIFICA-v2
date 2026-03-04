"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AnimateOnScrollProps {
  children: ReactNode;
  /** Stagger delay in seconds (converted to ms internally) */
  delay?: number;
  direction?: "up" | "left" | "right" | "down";
  className?: string;
  once?: boolean;
}

/**
 * Lightweight scroll-triggered entrance animation using IntersectionObserver
 * + tw-animate-css utility classes. No framer-motion needed.
 */
export function AnimateOnScroll({
  children,
  delay = 0,
  direction = "up",
  className,
  once = true,
}: AnimateOnScrollProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (once) observer.unobserve(el);
        } else if (!once) {
          setVisible(false);
        }
      },
      { rootMargin: "-40px", threshold: 0.05 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [once]);

  const directionClass = {
    up: "translate-y-6",
    down: "-translate-y-6",
    left: "-translate-x-6",
    right: "translate-x-6",
  }[direction];

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-500 ease-out",
        visible
          ? "opacity-100 translate-x-0 translate-y-0"
          : `opacity-0 ${directionClass}`,
        className
      )}
      style={{ transitionDelay: `${delay * 1000}ms` }}
    >
      {children}
    </div>
  );
}
