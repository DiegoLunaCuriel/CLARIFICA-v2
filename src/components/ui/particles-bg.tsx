"use client";

import { useMemo } from "react";

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export function ParticlesBg({ count = 24 }: { count?: number }) {
  const particles = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: `${randomBetween(2, 98)}%`,
        top: `${randomBetween(5, 95)}%`,
        size: randomBetween(2, 5),
        duration: `${randomBetween(6, 14)}s`,
        delay: `${randomBetween(0, 8)}s`,
        opacity: randomBetween(0.15, 0.4),
      })),
    [count]
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute rounded-full bg-blue-400"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
            animation: `float-particle ${p.duration} ease-in-out ${p.delay} infinite`,
          }}
        />
      ))}
    </div>
  );
}
