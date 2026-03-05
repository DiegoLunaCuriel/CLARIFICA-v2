"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   PART A â€” CARTOON SVG COMPONENTS (redesigned, detailed, chunky)
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

/* â”€â”€ FLOATING TOOL SVGS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

function CartoonHammer({ size = 140 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <defs>
        <linearGradient id="hSteel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#D4E2F0" />
          <stop offset="50%" stopColor="#9BB0C4" />
          <stop offset="100%" stopColor="#6F8CA2" />
        </linearGradient>
        <linearGradient id="hWood" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#9A6B30" />
          <stop offset="35%" stopColor="#C8873A" />
          <stop offset="65%" stopColor="#D4994A" />
          <stop offset="100%" stopColor="#9A6B30" />
        </linearGradient>
      </defs>
      {/* Handle — long, centered */}
      <rect x="37" y="28" width="6" height="50" rx="2.5" fill="url(#hWood)" />
      <rect x="39" y="28" width="2" height="50" rx="1" fill="#E0B060" opacity="0.25" />
      {/* Rubber grip */}
      <rect x="36" y="70" width="8" height="8" rx="2.5" fill="#1A1A2E" stroke="#2A2A44" strokeWidth="0.5" />
      <line x1="37" y1="73" x2="43" y2="73" stroke="#333355" strokeWidth="0.5" />
      <line x1="37" y1="75" x2="43" y2="75" stroke="#333355" strokeWidth="0.5" />
      {/* Head block — small, symmetrical */}
      <rect x="25" y="10" width="30" height="16" rx="3" fill="url(#hSteel)" stroke="#5A7A94" strokeWidth="1" />
      {/* Top sheen */}
      <rect x="27" y="11" width="26" height="4" rx="2" fill="white" opacity="0.18" />
      {/* Left striking face */}
      <rect x="19" y="8" width="9" height="20" rx="3" fill="#8FAFC5" stroke="#5A7A94" strokeWidth="0.8" />
      <rect x="20" y="9" width="2" height="18" rx="1" fill="white" opacity="0.12" />
      {/* Right striking face — mirror */}
      <rect x="52" y="8" width="9" height="20" rx="3" fill="#8FAFC5" stroke="#5A7A94" strokeWidth="0.8" />
      <rect x="58" y="9" width="2" height="18" rx="1" fill="white" opacity="0.12" />
      {/* Collar — centered */}
      <rect x="36" y="8" width="8" height="20" rx="2" fill="#7A96B0" stroke="#5A7A94" strokeWidth="0.5" />
      {/* Metallic reflection */}
      <ellipse cx="40" cy="18" rx="12" ry="2.5" fill="white" opacity="0.06" />
    </svg>
  );
}

function CartoonWrench({ size = 140 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <defs>
        <linearGradient id="wMetal" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#A8B8C8" />
          <stop offset="50%" stopColor="#C8D8E8" />
          <stop offset="100%" stopColor="#98A8B8" />
        </linearGradient>
        <linearGradient id="wGrip" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#EF4444" />
          <stop offset="100%" stopColor="#B91C1C" />
        </linearGradient>
      </defs>
      {/* Fixed jaw */}
      <path d="M14 3 L28 3 L28 20 L14 20 Z" fill="url(#wMetal)" stroke="#6A8090" strokeWidth="1" />
      {/* Movable jaw */}
      <path d="M7 3 L14 3 L14 20 L7 20 Z" fill="#95A5B5" stroke="#6A8090" strokeWidth="1" />
      {/* Jaw opening */}
      <rect x="13.5" y="7" width="1" height="9" fill="#0A1520" opacity="0.8" />
      {/* Teeth */}
      <line x1="8" y1="7" x2="13" y2="7" stroke="#6A7A8A" strokeWidth="0.6" />
      <line x1="8" y1="10" x2="13" y2="10" stroke="#6A7A8A" strokeWidth="0.6" />
      <line x1="8" y1="13" x2="13" y2="13" stroke="#6A7A8A" strokeWidth="0.6" />
      {/* Adjustment wheel */}
      <circle cx="21" cy="22" r="5" fill="#7A8A9C" stroke="#5A6A7C" strokeWidth="0.8" />
      <circle cx="21" cy="22" r="2.5" fill="#5A6A78" />
      <line x1="21" y1="17.5" x2="21" y2="19" stroke="#4A5A68" strokeWidth="0.6" />
      <line x1="21" y1="25" x2="21" y2="26.5" stroke="#4A5A68" strokeWidth="0.6" />
      {/* Jaw highlight */}
      <rect x="16" y="4" width="2.5" height="15" rx="1" fill="white" opacity="0.2" />
      {/* Shaft */}
      <rect x="17" y="26" width="8" height="28" rx="3" fill="url(#wMetal)" />
      <rect x="19" y="26" width="2.5" height="28" rx="1" fill="white" opacity="0.15" />
      {/* Grip */}
      <rect x="14" y="52" width="14" height="24" rx="6" fill="url(#wGrip)" />
      <rect x="17" y="52" width="3.5" height="24" rx="1.5" fill="#FC8181" opacity="0.2" />
      <line x1="15" y1="58" x2="27" y2="58" stroke="#991B1B" strokeWidth="0.7" opacity="0.4" />
      <line x1="15" y1="62" x2="27" y2="62" stroke="#991B1B" strokeWidth="0.7" opacity="0.4" />
      <line x1="15" y1="66" x2="27" y2="66" stroke="#991B1B" strokeWidth="0.7" opacity="0.4" />
      <line x1="15" y1="70" x2="27" y2="70" stroke="#991B1B" strokeWidth="0.7" opacity="0.4" />
    </svg>
  );
}

function CartoonDrill({ size = 150 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <defs>
        <linearGradient id="dBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="40%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#D4960C" />
        </linearGradient>
        <linearGradient id="dBit" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#A0B0C0" />
          <stop offset="50%" stopColor="#D0DCE8" />
          <stop offset="100%" stopColor="#8898A8" />
        </linearGradient>
      </defs>
      {/* Main body */}
      <path d="M12 18 Q10 18 10 22 L10 40 Q10 44 14 44 L48 44 Q52 44 52 40 L52 22 Q52 18 48 18 Z"
        fill="url(#dBody)" stroke="#B8860B" strokeWidth="0.8" />
      <path d="M14 19 L48 19 Q50 19 50 22 L50 27 L12 27 L12 22 Q12 19 14 19 Z"
        fill="white" opacity="0.2" />
      {/* Pistol grip */}
      <path d="M20 44 L18 48 L16 66 Q15 72 20 72 L38 72 Q43 72 42 66 L40 48 L38 44 Z"
        fill="#1E293B" stroke="#0F172A" strokeWidth="0.8" />
      <path d="M22 46 L21 62" stroke="#334155" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
      {/* Battery */}
      <rect x="16" y="66" width="26" height="10" rx="3" fill="#2D3A4A" stroke="#1E293B" strokeWidth="0.8" />
      <rect x="18" y="68" width="7" height="2.5" rx="1" fill="#475569" opacity="0.35" />
      {/* Trigger */}
      <path d="M28 46 Q30 52 34 50 Q36 48 34 44" fill="#3D4D5D" stroke="#2D3D4D" strokeWidth="0.6" />
      {/* Chuck */}
      <rect x="52" y="26" width="10" height="12" rx="4" fill="#8A9AAC" stroke="#6A7A8C" strokeWidth="0.8" />
      <line x1="54" y1="27" x2="54" y2="37" stroke="#5A6A7C" strokeWidth="0.5" />
      <line x1="57" y1="27" x2="57" y2="37" stroke="#5A6A7C" strokeWidth="0.5" />
      <line x1="60" y1="27" x2="60" y2="37" stroke="#5A6A7C" strokeWidth="0.5" />
      {/* Drill bit */}
      <rect x="62" y="30" width="16" height="4" rx="1.5" fill="url(#dBit)" />
      <path d="M78 30 L80 32 L78 34" fill="#90A0B0" />
      <line x1="65" y1="30" x2="67" y2="34" stroke="#7888A0" strokeWidth="0.6" />
      <line x1="69" y1="30" x2="71" y2="34" stroke="#7888A0" strokeWidth="0.6" />
      <line x1="73" y1="30" x2="75" y2="34" stroke="#7888A0" strokeWidth="0.6" />
      {/* Direction switch */}
      <rect x="22" y="22" width="6" height="4" rx="1.5" fill="#EF4444" />
      {/* Vents */}
      <rect x="34" y="24" width="8" height="1.2" rx="0.6" fill="#B8860B" opacity="0.4" />
      <rect x="34" y="28" width="8" height="1.2" rx="0.6" fill="#B8860B" opacity="0.4" />
      <rect x="34" y="32" width="8" height="1.2" rx="0.6" fill="#B8860B" opacity="0.4" />
      {/* LED */}
      <circle cx="50" cy="26" r="1.5" fill="#4ADE80" opacity="0.7" />
      {/* Sheen */}
      <rect x="14" y="20" width="34" height="2.5" rx="1.5" fill="white" opacity="0.12" />
    </svg>
  );
}

function CartoonPliers({ size = 140 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <defs>
        <linearGradient id="pJaw" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#B0BCC8" />
          <stop offset="50%" stopColor="#8A9AAA" />
          <stop offset="100%" stopColor="#6A7A8A" />
        </linearGradient>
        <linearGradient id="pGrip" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#EF4444" />
          <stop offset="50%" stopColor="#DC2626" />
          <stop offset="100%" stopColor="#991B1B" />
        </linearGradient>
      </defs>
      {/* Left jaw */}
      <path d="M30 6 Q24 10 25 20 L36 22 L36 12 Z" fill="url(#pJaw)" stroke="#4A5A6A" strokeWidth="1" strokeLinejoin="round" />
      {/* Right jaw */}
      <path d="M44 6 Q50 10 49 20 L38 22 L38 12 Z" fill="url(#pJaw)" stroke="#4A5A6A" strokeWidth="1" strokeLinejoin="round" />
      {/* Jaw tips */}
      <path d="M30 6 L33 2 L36 6" fill="#7A8A9A" stroke="#4A5A6A" strokeWidth="0.6" />
      <path d="M38 6 L41 2 L44 6" fill="#7A8A9A" stroke="#4A5A6A" strokeWidth="0.6" />
      {/* Teeth */}
      <path d="M31 14 L32 12 L33 14 L34 12 L35 14" stroke="#3A4A5A" strokeWidth="0.6" fill="none" />
      <path d="M39 14 L40 12 L41 14 L42 12 L43 14" stroke="#3A4A5A" strokeWidth="0.6" fill="none" />
      {/* Wire-cutter */}
      <path d="M35 18 Q37 16 39 18" fill="#2A3A4A" />
      {/* Jaw highlights */}
      <path d="M31 8 L34 14" stroke="#C0CCD8" strokeWidth="0.8" opacity="0.25" strokeLinecap="round" />
      <path d="M43 8 L40 14" stroke="#C0CCD8" strokeWidth="0.8" opacity="0.25" strokeLinecap="round" />
      {/* Pivot bolt */}
      <circle cx="37" cy="25" r="5" fill="#3A4A5A" />
      <circle cx="37" cy="25" r="3" fill="#5A6A7A" />
      <circle cx="37" cy="25" r="1" fill="#3A4A5A" />
      <circle cx="36" cy="24" r="0.6" fill="white" opacity="0.2" />
      {/* Left handle */}
      <path d="M27 28 Q24 32 22 42 L18 66 Q17 72 20 74 Q24 76 26 72 L32 44 Q33 36 32 30 Z" fill="url(#pGrip)" stroke="#7F1D1D" strokeWidth="0.8" />
      <path d="M28 30 Q25 36 23 44 L20 64" fill="none" stroke="#F87171" strokeWidth="1.5" opacity="0.2" strokeLinecap="round" />
      <line x1="20" y1="58" x2="26" y2="54" stroke="#7F1D1D" strokeWidth="0.6" opacity="0.4" />
      <line x1="19.5" y1="62" x2="25.5" y2="58" stroke="#7F1D1D" strokeWidth="0.6" opacity="0.4" />
      <line x1="19" y1="66" x2="25" y2="62" stroke="#7F1D1D" strokeWidth="0.6" opacity="0.4" />
      {/* Right handle */}
      <path d="M47 28 Q50 32 52 42 L56 66 Q57 72 54 74 Q50 76 48 72 L42 44 Q41 36 42 30 Z" fill="url(#pGrip)" stroke="#7F1D1D" strokeWidth="0.8" />
      <path d="M46 30 Q49 36 51 44 L54 64" fill="none" stroke="#F87171" strokeWidth="1.5" opacity="0.2" strokeLinecap="round" />
      <line x1="48" y1="54" x2="54" y2="58" stroke="#7F1D1D" strokeWidth="0.6" opacity="0.4" />
      <line x1="48.5" y1="58" x2="54.5" y2="62" stroke="#7F1D1D" strokeWidth="0.6" opacity="0.4" />
      <line x1="49" y1="62" x2="55" y2="66" stroke="#7F1D1D" strokeWidth="0.6" opacity="0.4" />
    </svg>
  );
}

function CartoonSaw({ size = 150 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.6} viewBox="0 0 100 60" fill="none">
      <defs>
        <linearGradient id="sBlade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E0E8F0" />
          <stop offset="40%" stopColor="#C0CCD8" />
          <stop offset="100%" stopColor="#95A5B5" />
        </linearGradient>
        <linearGradient id="sHandle" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FB923C" />
          <stop offset="50%" stopColor="#F97316" />
          <stop offset="100%" stopColor="#C2410C" />
        </linearGradient>
      </defs>
      {/* Blade */}
      <path d="M30 16 L94 12 L96 22 L30 32 Z" fill="url(#sBlade)" />
      <path d="M30 16 L94 12 L94 15 L30 21 Z" fill="white" opacity="0.15" />
      <path d="M30 16 L94 12 L94 13.5 L30 17.5 Z" fill="#8898A8" opacity="0.4" />
      {/* Teeth */}
      <path d="M32 32 L34 37 L36 32 L38 37 L40 32 L42 37 L44 32 L46 37 L48 32 L50 37 L52 32 L54 37 L56 32 L58 37 L60 32 L62 37 L64 32 L66 36 L68 32 L70 36 L72 31 L74 35 L76 31 L78 35 L80 30 L82 34 L84 30 L86 33 L88 29 L90 32 L92 28 L94 30 L96 22 L30 32 Z"
        fill="#8898A8" />
      {/* D-Handle */}
      <path d="M4 10 Q2 10 2 14 L2 38 Q2 42 6 42 L30 42 Q34 42 34 38 L34 14 Q34 10 30 10 Z"
        fill="url(#sHandle)" stroke="#9A3412" strokeWidth="0.8" />
      <path d="M6 11 L28 11 Q32 11 32 14 L32 17 L4 17 L4 14 Q4 11 6 11 Z"
        fill="white" opacity="0.2" />
      {/* Grip hole */}
      <rect x="10" y="20" width="16" height="14" rx="5" fill="#B45309" />
      <rect x="12" y="22" width="12" height="10" rx="3" fill="#7C2D12" opacity="0.5" />
      {/* Connection bolts */}
      <circle cx="30" cy="22" r="3" fill="#B45309" />
      <circle cx="30" cy="22" r="1.5" fill="#EA580C" />
      <circle cx="30" cy="34" r="2.5" fill="#B45309" />
      <circle cx="30" cy="34" r="1.3" fill="#EA580C" />
    </svg>
  );
}

function CartoonLevel({ size = 140 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.35} viewBox="0 0 100 35" fill="none">
      <defs>
        <linearGradient id="lBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4ADE80" />
          <stop offset="40%" stopColor="#22C55E" />
          <stop offset="100%" stopColor="#16A34A" />
        </linearGradient>
      </defs>
      {/* Body */}
      <rect x="2" y="6" width="96" height="22" rx="5" fill="url(#lBody)" />
      <rect x="2" y="6" width="96" height="8" rx="4" fill="white" opacity="0.18" />
      {/* Center bubble window */}
      <rect x="36" y="10" width="28" height="14" rx="7" fill="#0F172A" stroke="#1A2634" strokeWidth="0.5" />
      <rect x="38" y="12" width="24" height="10" rx="5" fill="#07111E" />
      <ellipse cx="50" cy="17" rx="5" ry="3.5" fill="#FDE047" opacity="0.9" />
      <ellipse cx="49" cy="16" rx="2" ry="1.5" fill="#FEFCE8" opacity="0.7" />
      <line x1="42" y1="17" x2="44" y2="17" stroke="#2A3A4A" strokeWidth="0.8" />
      <line x1="56" y1="17" x2="58" y2="17" stroke="#2A3A4A" strokeWidth="0.8" />
      {/* Side bubbles */}
      <rect x="10" y="12" width="14" height="10" rx="5" fill="#0F172A" />
      <ellipse cx="17" cy="17" rx="3" ry="2.5" fill="#FDE047" opacity="0.75" />
      <rect x="76" y="12" width="14" height="10" rx="5" fill="#0F172A" />
      <ellipse cx="83" cy="17" rx="3" ry="2.5" fill="#FDE047" opacity="0.75" />
      {/* End caps */}
      <rect x="0" y="8" width="6" height="18" rx="3" fill="#15803D" />
      <rect x="94" y="8" width="6" height="18" rx="3" fill="#15803D" />
      {/* Body sheen */}
      <rect x="4" y="8" width="92" height="3" rx="2" fill="white" opacity="0.1" />
    </svg>
  );
}

/* â”€â”€ NAIL SVG (redesigned, bigger) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

function CartoonNail({ size = 55, sunk = 0 }: { size?: number; sunk: number }) {
  return (
    <svg width={size * 0.45} height={size} viewBox="0 0 18 50" fill="none">
      <g style={{ transform: `translateY(${sunk * 6}px)`, transition: "transform 0.2s ease-out" }}>
        {/* Head â€” flat & wide */}
        <ellipse cx="9" cy="4" rx="8" ry="4" fill="#4B5563" />
        <ellipse cx="9" cy="3" rx="6" ry="2.5" fill="#6B7280" opacity="0.6" />
        <ellipse cx="9" cy="2.5" rx="3" ry="1" fill="#9CA3AF" opacity="0.4" />
        {/* Shaft */}
        <rect x="6.5" y="7" width="5" height="34" rx="1.5" fill="#6B7280" />
        <rect x="8" y="7" width="1.5" height="34" rx="0.75" fill="#9CA3AF" opacity="0.3" />
        {/* Point */}
        <path d="M6.5 41 L9 49 L11.5 41" fill="#6B7280" />
        {/* Notch detail */}
        <line x1="7" y1="12" x2="12" y2="12" stroke="#4B5563" strokeWidth="0.6" opacity="0.5" />
        <line x1="7" y1="18" x2="12" y2="18" stroke="#4B5563" strokeWidth="0.6" opacity="0.5" />
      </g>
    </svg>
  );
}

/* â”€â”€ SCENE SVGs (shovel, sand, pickaxe, rock, decorations) â”€â”€â”€â”€â”€â”€ */

function CartoonShovel({ size = 90 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <rect x="36" y="4" width="7" height="48" rx="3" fill="#A0522D" />
      <rect x="38" y="4" width="2.5" height="48" rx="1" fill="#C4813D" opacity="0.5" />
      <rect x="34" y="2" width="11" height="8" rx="3" fill="#4A3728" />
      <rect x="36" y="3" width="3" height="6" rx="1.5" fill="#6B5B4A" opacity="0.4" />
      <path d="M28 50 Q26 52 26 58 Q26 72 40 76 Q54 72 54 58 Q54 52 52 50 Z" fill="#7B8794" />
      <path d="M30 50 Q29 53 29 58 Q29 68 40 72 Q38 66 36 58 Q35 53 34 50 Z" fill="#9CA3AF" opacity="0.5" />
      <path d="M28 50 L52 50" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}

function CartoonSandPile({ width = 140 }: { width?: number }) {
  return (
    <svg width={width} height={width * 0.55} viewBox="0 0 140 77" fill="none">
      <path d="M5 75 Q18 20 70 12 Q122 20 135 75 Z" fill="#D4A574" />
      <path d="M22 68 Q42 22 70 16 Q98 22 118 68" fill="#DEB887" opacity="0.45" />
      {/* Sand grains */}
      <circle cx="45" cy="42" r="2.5" fill="#C49A6C" opacity="0.6" />
      <circle cx="80" cy="38" r="2" fill="#C49A6C" opacity="0.5" />
      <circle cx="62" cy="54" r="3" fill="#C49A6C" opacity="0.4" />
      <circle cx="100" cy="50" r="2.2" fill="#C49A6C" opacity="0.5" />
      <circle cx="35" cy="58" r="1.8" fill="#B8956A" opacity="0.4" />
      <circle cx="90" cy="60" r="2.5" fill="#B8956A" opacity="0.35" />
      {/* Base spread */}
      <ellipse cx="28" cy="72" rx="4" ry="2.5" fill="#A08060" opacity="0.5" />
      <ellipse cx="112" cy="70" rx="3" ry="2" fill="#A08060" opacity="0.4" />
      {/* Shadow */}
      <ellipse cx="70" cy="75" rx="60" ry="5" fill="#8B6914" opacity="0.12" />
    </svg>
  );
}

function CartoonPickaxe({ size = 85 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <rect x="32" y="30" width="7" height="46" rx="3" fill="#A0522D" transform="rotate(-15 35 53)" />
      <rect x="34" y="30" width="2.5" height="46" rx="1" fill="#C4813D" opacity="0.5" transform="rotate(-15 35 53)" />
      <path d="M18 18 Q22 15 28 14 L34 22 L24 24 Z" fill="#6B7280" />
      <path d="M18 18 L28 14 L30 16 L20 20 Z" fill="#9CA3AF" opacity="0.5" />
      <path d="M50 14 Q56 15 60 18 L54 24 L44 22 Z" fill="#6B7280" />
      <path d="M50 14 L60 18 L58 20 L48 16 Z" fill="#9CA3AF" opacity="0.5" />
      <rect x="30" y="16" width="18" height="12" rx="4" fill="#7B8794" />
      <rect x="32" y="17" width="14" height="5" rx="2" fill="#9CA3AF" opacity="0.4" />
      <rect x="34" y="19" width="8" height="2" rx="1" fill="#CBD5E1" opacity="0.4" />
    </svg>
  );
}

function CartoonRock({ size = 100, cracks = 0 }: { size?: number; cracks: number }) {
  return (
    <svg width={size} height={size * 0.7} viewBox="0 0 80 56" fill="none">
      <path d="M10 48 L5 32 L12 18 L28 8 L52 6 L68 14 L76 28 L72 46 L55 52 L25 52 Z" fill="#78716C" />
      <path d="M12 18 L28 8 L52 6 L68 14 L58 22 L35 24 L18 22 Z" fill="#A8A29E" opacity="0.6" />
      <path d="M30 10 L48 8 L56 14 L42 18 Z" fill="#D6D3D1" opacity="0.25" />
      {/* Pebble texture */}
      <circle cx="22" cy="35" r="3" fill="#6B6560" opacity="0.3" />
      <circle cx="55" cy="32" r="2.5" fill="#6B6560" opacity="0.25" />
      <circle cx="38" cy="42" r="2" fill="#6B6560" opacity="0.2" />
      <ellipse cx="40" cy="52" rx="30" ry="4" fill="#57534E" opacity="0.2" />
      {cracks >= 1 && <path d="M38 12 L40 26 L44 22" stroke="#57534E" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.8" />}
      {cracks >= 2 && <path d="M42 18 L50 32 L46 38" stroke="#57534E" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.8" />}
      {cracks >= 3 && (
        <>
          <path d="M36 24 L28 36 L32 44" stroke="#57534E" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.8" />
          <path d="M40 26 L42 40" stroke="#44403C" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.6" />
        </>
      )}
    </svg>
  );
}

function CartoonWheelbarrow({ size = 110 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.64} viewBox="0 0 100 64" fill="none">
      <path d="M20 15 L15 45 L60 48 L65 18 Z" fill="#DC2626" />
      <path d="M20 15 L65 18 L62 28 L22 25 Z" fill="#EF4444" opacity="0.5" />
      <path d="M18 14 L67 17" stroke="#B91C1C" strokeWidth="2" strokeLinecap="round" />
      <circle cx="72" cy="52" r="10" fill="#374151" />
      <circle cx="72" cy="52" r="7" fill="#4B5563" />
      <circle cx="72" cy="52" r="2" fill="#6B7280" />
      <line x1="60" y1="48" x2="72" y2="52" stroke="#374151" strokeWidth="2.5" />
      <line x1="20" y1="15" x2="4" y2="30" stroke="#A0522D" strokeWidth="3" strokeLinecap="round" />
      <line x1="22" y1="18" x2="6" y2="33" stroke="#A0522D" strokeWidth="3" strokeLinecap="round" />
      <rect x="1" y="28" width="6" height="8" rx="2" fill="#1E293B" />
      <rect x="3" y="31" width="6" height="8" rx="2" fill="#1E293B" />
      <path d="M22 20 Q40 16 62 22 L60 38 Q40 42 24 38 Z" fill="#A08060" opacity="0.6" />
    </svg>
  );
}

function CartoonTrafficCone({ size = 50 }: { size?: number }) {
  return (
    <svg width={size} height={size * 1.2} viewBox="0 0 40 48" fill="none">
      <rect x="4" y="40" width="32" height="6" rx="2" fill="#1E293B" />
      <path d="M10 40 L18 6 L22 6 L30 40 Z" fill="#F97316" />
      <rect x="12" y="18" width="16" height="4" rx="1" fill="white" opacity="0.7" />
      <rect x="14" y="28" width="12" height="3.5" rx="1" fill="white" opacity="0.6" />
      <ellipse cx="20" cy="6" rx="3" ry="2" fill="#EA580C" />
      <path d="M16 10 L18 6 L19 6 L17 40 L14 40 Z" fill="#FB923C" opacity="0.4" />
    </svg>
  );
}

function CartoonHardHat({ size = 55 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.73} viewBox="0 0 50 36" fill="none">
      <path d="M6 24 Q6 6 25 4 Q44 6 44 24 Z" fill="#EAB308" />
      <path d="M10 22 Q10 8 25 6 Q34 8 36 18 L14 20 Z" fill="#FACC15" opacity="0.5" />
      <rect x="2" y="22" width="46" height="6" rx="3" fill="#CA8A04" />
      <rect x="4" y="22" width="42" height="3" rx="2" fill="#EAB308" opacity="0.4" />
      <circle cx="25" cy="16" r="4" fill="#CA8A04" opacity="0.5" />
      <circle cx="25" cy="16" r="2" fill="#FACC15" opacity="0.4" />
      <path d="M14 10 Q20 6 28 8" stroke="#FDE68A" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.5" />
    </svg>
  );
}

function CartoonCementBag({ size = 60 }: { size?: number }) {
  return (
    <svg width={size} height={size * 1.1} viewBox="0 0 50 55" fill="none">
      <path d="M8 10 Q6 10 6 14 L6 48 Q6 52 10 52 L40 52 Q44 52 44 48 L44 14 Q44 10 42 10 Z" fill="#9CA3AF" />
      <path d="M8 10 Q12 6 25 5 Q38 6 42 10 L42 15 Q38 12 25 11 Q12 12 8 15 Z" fill="#7B8794" />
      <rect x="12" y="20" width="26" height="18" rx="2" fill="#E5E7EB" opacity="0.4" />
      <rect x="16" y="24" width="18" height="3" rx="1" fill="#6B7280" opacity="0.3" />
      <rect x="16" y="30" width="14" height="2" rx="1" fill="#6B7280" opacity="0.2" />
      <path d="M10 44 Q18 42 22 44" stroke="#7B8794" strokeWidth="1" fill="none" opacity="0.4" />
      <path d="M28 46 Q34 44 40 46" stroke="#7B8794" strokeWidth="1" fill="none" opacity="0.3" />
      <rect x="8" y="14" width="4" height="34" rx="2" fill="#B0BEC5" opacity="0.2" />
    </svg>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   PART B â€” EFFECTS (sparks, dirt, debris)
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

function Sparks({ x, y }: { x: number; y: number }) {
  const particles = Array.from({ length: 6 }, (_, i) => {
    const angle = (i * 60 + Math.random() * 20) * (Math.PI / 180);
    const dist = 18 + Math.random() * 15;
    return { tx: Math.cos(angle) * dist, ty: Math.sin(angle) * dist, size: 3 + Math.random() * 3, delay: i * 0.02 };
  });
  return (
    <div className="fixed pointer-events-none" style={{ left: x, top: y, zIndex: 9999 }}>
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-amber-400"
          style={{ width: p.size, height: p.size, left: -p.size / 2, top: -p.size / 2 }}
          initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
          animate={{ opacity: 0, x: p.tx, y: p.ty, scale: 0 }}
          transition={{ duration: 0.45, delay: p.delay, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

function DirtParticles({ x, y }: { x: number; y: number }) {
  const particles = Array.from({ length: 8 }, (_, i) => {
    const angle = (-30 - Math.random() * 120) * (Math.PI / 180);
    const dist = 25 + Math.random() * 30;
    return { tx: Math.cos(angle) * dist, ty: Math.sin(angle) * dist, size: 4 + Math.random() * 5, delay: i * 0.03 };
  });
  return (
    <div className="absolute pointer-events-none" style={{ left: x, top: y }}>
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{ width: p.size, height: p.size, left: -p.size / 2, top: -p.size / 2, backgroundColor: i % 2 === 0 ? "#D4A574" : "#A08060" }}
          initial={{ opacity: 0.9, x: 0, y: 0, scale: 1 }}
          animate={{ opacity: 0, x: p.tx, y: p.ty, scale: 0.3 }}
          transition={{ duration: 0.7, delay: p.delay, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

function RockDebris() {
  const fragments = [
    { fx: -35, fy: -30, fr: -45, color: "#78716C" },
    { fx: 30, fy: -35, fr: 60, color: "#A8A29E" },
    { fx: -25, fy: 18, fr: -30, color: "#78716C" },
    { fx: 40, fy: 12, fr: 90, color: "#57534E" },
    { fx: 8, fy: -40, fr: 120, color: "#A8A29E" },
  ];
  return (
    <>
      {fragments.map((f, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ width: 10 + i * 3, height: 8 + i * 2, backgroundColor: f.color, borderRadius: "2px", left: "50%", top: "40%" }}
          initial={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 }}
          animate={{ opacity: 0, x: f.fx, y: f.fy, rotate: f.fr, scale: 0.4 }}
          transition={{ duration: 0.9, delay: i * 0.04, ease: "easeOut" }}
        />
      ))}
    </>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   PART C â€” FLOATING TOOLS (fixed overlay, bouncing physics)
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

type ToolConfig = {
  id: string;
  icon: "hammer" | "wrench" | "drill" | "pliers" | "saw" | "level";
  size: number;
  rotate: number;
};

type NailConfig = {
  id: string;
  xPct: number;
  yPct: number;
  rotate: number;
};

const TOOLS: ToolConfig[] = [
  { id: "hammer", icon: "hammer", size: 130, rotate: -20 },
  { id: "wrench", icon: "wrench", size: 120, rotate: 15 },
  { id: "drill", icon: "drill", size: 135, rotate: -10 },
  { id: "pliers", icon: "pliers", size: 120, rotate: 12 },
  { id: "saw", icon: "saw", size: 130, rotate: -8 },
  { id: "level", icon: "level", size: 125, rotate: 3 },
];

// Image paths for realistic tool renders
const TOOL_IMAGES: Record<string, string> = {
  hammer: "/tools/hammer.png",
  wrench: "/tools/wrench.png",
  drill: "/tools/drill.png",
  pliers: "/tools/pliers.png",
  saw: "/tools/saw.png",
  level: "/tools/level.png",
};

// Glow color per tool for the dark premium look
const TOOL_GLOW: Record<string, string> = {
  hammer: "rgba(168,195,224,0.65)",   // bright steel blue
  wrench: "rgba(239,68,68,0.6)",     // vivid red handle
  drill: "rgba(251,191,36,0.7)",     // bright amber drill
  pliers: "rgba(239,68,68,0.55)",    // red handles
  saw: "rgba(251,146,60,0.6)",       // vibrant orange handle
  level: "rgba(34,197,94,0.6)",      // vivid green body
};

const NAILS: NailConfig[] = [
  { id: "nail-1", xPct: 25, yPct: 1, rotate: 0 },
  { id: "nail-2", xPct: 55, yPct: 1, rotate: 6 },
  { id: "nail-3", xPct: 80, yPct: 1, rotate: -4 },
  { id: "nail-4", xPct: 2, yPct: 30, rotate: 90 },
  { id: "nail-5", xPct: 96, yPct: 45, rotate: -90 },
  { id: "nail-6", xPct: 30, yPct: 92, rotate: 180 },
  { id: "nail-7", xPct: 70, yPct: 92, rotate: 175 },
];

/* â”€â”€ Bouncing physics hook â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

type PhysicsBody = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  paused: boolean;
};

function useBouncingPhysics(count: number, sizes: number[]) {
  const bodies = useRef<PhysicsBody[]>([]);
  const rafId = useRef<number>(0);
  const [positions, setPositions] = useState<{ x: number; y: number }[]>([]);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const initial: PhysicsBody[] = [];
    const startPositions = [
      { xPct: 5, yPct: 8 },
      { xPct: 82, yPct: 12 },
      { xPct: 55, yPct: 30 },
      { xPct: 8, yPct: 48 },
      { xPct: 72, yPct: 52 },
      { xPct: 38, yPct: 10 },
    ];

    for (let i = 0; i < count; i++) {
      const s = sizes[i] || 120;
      const sp = startPositions[i] || { xPct: 20 + i * 15, yPct: 10 + i * 12 };
      const speed = 0.3 + Math.random() * 0.5;
      const angle = Math.random() * Math.PI * 2;
      initial.push({
        x: (sp.xPct / 100) * (vw - s),
        y: (sp.yPct / 100) * (vh - s),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        w: s,
        h: s,
        paused: false,
      });
    }
    bodies.current = initial;
    setPositions(initial.map((b) => ({ x: b.x, y: b.y })));
  }, [count, sizes]);

  // Animation loop
  useEffect(() => {
    let frameCount = 0;
    const tick = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const bs = bodies.current;

      for (const b of bs) {
        if (b.paused) continue;

        // Friction â€” gradually slow down
        b.vx *= 0.9985;
        b.vy *= 0.9985;

        // Keep minimum drift speed so tools never fully stop
        const spd = Math.hypot(b.vx, b.vy);
        if (spd > 0 && spd < 0.15) {
          const scale = 0.15 / spd;
          b.vx *= scale;
          b.vy *= scale;
        }

        b.x += b.vx;
        b.y += b.vy;

        // Bounce off walls with energy loss
        if (b.x <= 0) { b.x = 0; b.vx = Math.abs(b.vx) * 0.85; }
        if (b.x + b.w >= vw) { b.x = vw - b.w; b.vx = -Math.abs(b.vx) * 0.85; }
        if (b.y <= 0) { b.y = 0; b.vy = Math.abs(b.vy) * 0.85; }
        if (b.y + b.h >= vh) { b.y = vh - b.h; b.vy = -Math.abs(b.vy) * 0.85; }
      }

      // Always update â€” includes paused bodies moved by drag
      frameCount++;
      if (frameCount % 2 === 0) {
        setPositions(bs.map((b) => ({ x: b.x, y: b.y })));
      }

      rafId.current = requestAnimationFrame(tick);
    };

    rafId.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId.current);
  }, []);

  const pauseBody = useCallback((index: number) => {
    if (bodies.current[index]) bodies.current[index].paused = true;
  }, []);

  const setBodyPosition = useCallback((index: number, x: number, y: number) => {
    const b = bodies.current[index];
    if (b) { b.x = x; b.y = y; }
  }, []);

  const getPosition = useCallback((index: number) => {
    const b = bodies.current[index];
    return b ? { x: b.x, y: b.y } : null;
  }, []);

  const resumeBody = useCallback((index: number, vx?: number, vy?: number) => {
    const b = bodies.current[index];
    if (!b) return;
    // Clamp position to viewport
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    b.x = Math.max(0, Math.min(vw - b.w, b.x));
    b.y = Math.max(0, Math.min(vh - b.h, b.y));

    if (vx !== undefined && vy !== undefined) {
      const maxV = 8;
      b.vx = Math.max(-maxV, Math.min(maxV, vx));
      b.vy = Math.max(-maxV, Math.min(maxV, vy));
    } else {
      const speed = 0.3 + Math.random() * 0.5;
      const angle = Math.random() * Math.PI * 2;
      b.vx = Math.cos(angle) * speed;
      b.vy = Math.sin(angle) * speed;
    }
    b.paused = false;
  }, []);

  return { positions, pauseBody, resumeBody, setBodyPosition, getPosition };
}

export function FloatingTools() {
  const nailRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [nailSunk, setNailSunk] = useState<Record<string, number>>({});
  const [sparks, setSparks] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const toolSizes = TOOLS.map((t) => t.size);
  const { positions, pauseBody, resumeBody, setBodyPosition, getPosition } =
    useBouncingPhysics(TOOLS.length, toolSizes);

  useEffect(() => { setMounted(true); }, []);

  /* â”€â”€ Drag tracking via pointer events â”€â”€ */
  const dragRef = useRef<{
    index: number;
    offsetX: number;
    offsetY: number;
    trail: { x: number; y: number; t: number }[];
  } | null>(null);

  const checkCollision = useCallback((toolEl: HTMLElement | null, nailId: string): boolean => {
    const nailEl = nailRefs.current[nailId];
    if (!toolEl || !nailEl) return false;
    const a = toolEl.getBoundingClientRect();
    const b = nailEl.getBoundingClientRect();
    const pad = 25;
    return !(a.right < b.left - pad || a.left > b.right + pad || a.bottom < b.top - pad || a.top > b.bottom + pad);
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent, index: number) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    pauseBody(index);
    const pos = getPosition(index);
    if (!pos) return;
    dragRef.current = {
      index,
      offsetX: e.clientX - pos.x,
      offsetY: e.clientY - pos.y,
      trail: [{ x: e.clientX, y: e.clientY, t: performance.now() }],
    };
    setIsDragging(TOOLS[index].id);
  }, [pauseBody, getPosition]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    const newX = e.clientX - drag.offsetX;
    const newY = e.clientY - drag.offsetY;
    setBodyPosition(drag.index, newX, newY);
    // Track trail for velocity computation
    const now = performance.now();
    drag.trail.push({ x: e.clientX, y: e.clientY, t: now });
    if (drag.trail.length > 6) drag.trail.shift();
  }, [setBodyPosition]);

  const handlePointerUp = useCallback(() => {
    const drag = dragRef.current;
    if (!drag) return;
    const toolId = TOOLS[drag.index].id;

    // Compute velocity from recent pointer trail
    let vx = 0, vy = 0;
    const trail = drag.trail;
    if (trail.length >= 2) {
      const last = trail[trail.length - 1];
      const first = trail[0];
      const dt = last.t - first.t;
      if (dt > 5) {
        vx = ((last.x - first.x) / dt) * 16; // scale to ~per-frame
        vy = ((last.y - first.y) / dt) * 16;
      }
    }
    // Ensure minimum drift so it doesn't freeze in place
    if (Math.hypot(vx, vy) < 0.3) {
      const angle = Math.random() * Math.PI * 2;
      vx = Math.cos(angle) * 0.4;
      vy = Math.sin(angle) * 0.4;
    }

    // Hammer â†’ check nail collisions
    if (toolId === "hammer") {
      const hammerEl = document.querySelector(`[data-ftool="hammer"]`) as HTMLElement;
      if (hammerEl) {
        for (const nail of NAILS) {
          if (checkCollision(hammerEl, nail.id)) {
            const current = nailSunk[nail.id] || 0;
            if (current >= 4) continue;
            setNailSunk((prev) => ({ ...prev, [nail.id]: current + 1 }));
            const nailEl = nailRefs.current[nail.id];
            if (nailEl) {
              const rect = nailEl.getBoundingClientRect();
              setSparks({ x: rect.left + rect.width / 2, y: rect.top });
              setTimeout(() => setSparks(null), 500);
            }
            break;
          }
        }
      }
    }

    resumeBody(drag.index, vx, vy);
    dragRef.current = null;
    setIsDragging(null);
  }, [checkCollision, nailSunk, resumeBody]);

  if (!mounted || positions.length === 0) return null;

  const toolIcon = (icon: string, size: number) => {
    switch (icon) {
      case "hammer": return <CartoonHammer size={size} />;
      case "wrench": return <CartoonWrench size={size} />;
      case "drill": return <CartoonDrill size={size} />;
      case "pliers": return <CartoonPliers size={size} />;
      case "saw": return <CartoonSaw size={size} />;
      case "level": return <CartoonLevel size={size} />;
      default: return null;
    }
  };

  return (
    <>
      <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }} aria-hidden>
        {/* Floating tools */}
        {TOOLS.map((tool, i) => {
          const isHeld = isDragging === tool.id;
          const glow = TOOL_GLOW[tool.id] || "rgba(255,255,255,0.3)";
          // Per-tool staggered animation delays
          const floatDelay = `${i * 0.8}s`;
          const glowDelay = `${i * 0.5}s`;
          return (
            <div
              key={tool.id}
              data-ftool={tool.id}
              className="absolute pointer-events-auto cursor-grab active:cursor-grabbing"
              style={{
                left: positions[i]?.x ?? 0,
                top: positions[i]?.y ?? 0,
                transform: `rotate(${tool.rotate}deg)${isHeld ? " scale(1.15)" : ""}`,
                opacity: isHeld ? 0.5 : 0.25,
                transition: "opacity 0.25s, transform 0.2s cubic-bezier(0.34,1.56,0.64,1), filter 0.3s ease",
                willChange: "left, top",
                touchAction: "none",
                animation: isHeld
                  ? "none"
                  : `tool-float ${4 + i * 0.4}s ease-in-out ${floatDelay} infinite, tool-glow-pulse ${3 + i * 0.3}s ease-in-out ${glowDelay} infinite`,
                filter: isHeld
                  ? `drop-shadow(0 0 24px ${glow}) drop-shadow(0 0 48px ${glow}) drop-shadow(0 12px 32px rgba(0,0,0,0.5))`
                  : `drop-shadow(0 0 14px ${glow}) drop-shadow(0 0 30px ${glow.replace(/[\d.]+\)$/, (m) => `${parseFloat(m) * 0.35})`)}) drop-shadow(0 4px 10px rgba(0,0,0,0.4))`,
              }}
              onPointerDown={(e) => handlePointerDown(e, i)}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
            >
              {toolIcon(tool.icon, tool.size)}
            </div>
          );
        })}

        {/* Nails on edges */}
        {NAILS.map((nail) => {
          const sunk = nailSunk[nail.id] || 0;
          const isFullySunk = sunk >= 4;
          return (
            <motion.div
              key={nail.id}
              ref={(el) => { nailRefs.current[nail.id] = el; }}
              className="absolute pointer-events-none"
              style={{ left: `${nail.xPct}%`, top: `${nail.yPct}%`, transform: `rotate(${nail.rotate}deg)`, opacity: isFullySunk ? 0.1 : 0.35 }}
              animate={{ opacity: isFullySunk ? 0.1 : 0.35 }}
            >
              <CartoonNail size={55} sunk={sunk} />
              {isFullySunk && (
                <motion.div
                  className="absolute -top-1 left-1/2 -translate-x-1/2 text-green-400 text-xs font-bold"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 0.7, scale: 1 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  âœ“
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {sparks && <Sparks x={sparks.x} y={sparks.y} />}
    </>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   PART D â€” CONSTRUCTION SCENE (page section, NOT fixed overlay)
   Draggable shovel + pickaxe with continuous collision detection
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

function ShovelScene() {
  const shovelRef = useRef<HTMLDivElement>(null);
  const sandRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const [showDirt, setShowDirt] = useState(false);
  const [dirtPos, setDirtPos] = useState({ x: 0, y: 0 });
  const cooldownRef = useRef(false);
  const [sandSquish, setSandSquish] = useState(false);

  const checkCollisionOnDrag = useCallback(() => {
    if (cooldownRef.current) return;
    const shovelEl = shovelRef.current;
    const sandEl = sandRef.current;
    if (!shovelEl || !sandEl) return;

    const a = shovelEl.getBoundingClientRect();
    const b = sandEl.getBoundingClientRect();
    const pad = 15;
    const colliding = !(a.right < b.left - pad || a.left > b.right + pad || a.bottom < b.top - pad || a.top > b.bottom + pad);

    if (colliding) {
      cooldownRef.current = true;
      // Trigger dirt particles relative to the sand pile
      const sceneRect = sceneRef.current?.getBoundingClientRect();
      if (sceneRect) {
        setDirtPos({
          x: b.left - sceneRect.left + b.width / 2,
          y: b.top - sceneRect.top,
        });
      }
      setShowDirt(true);
      setSandSquish(true);
      setTimeout(() => setSandSquish(false), 400);
      setTimeout(() => setShowDirt(false), 700);
      setTimeout(() => { cooldownRef.current = false; }, 800);
    }
  }, []);

  return (
    <div ref={sceneRef} className="absolute pointer-events-none" style={{ left: "8%", bottom: "12%", width: "200px", height: "160px" }}>
      {/* Sand pile */}
      <div
        ref={sandRef}
        style={{
          position: "absolute",
          left: 0,
          bottom: 0,
          transform: sandSquish ? "scaleY(0.92) scaleX(1.04)" : "scaleY(1) scaleX(1)",
          transformOrigin: "bottom center",
          transition: "transform 0.3s ease-out",
        }}
      >
        <CartoonSandPile width={140} />
      </div>

      {/* Draggable shovel */}
      <motion.div
        ref={shovelRef}
        className="pointer-events-auto cursor-grab active:cursor-grabbing"
        style={{ position: "absolute", left: 100, bottom: 20, zIndex: 5 }}
        drag
        dragConstraints={sceneRef}
        dragElastic={0.1}
        dragMomentum={false}
        onDrag={() => checkCollisionOnDrag()}
        whileDrag={{ scale: 1.08 }}
      >
        <CartoonShovel size={90} />
      </motion.div>

      {/* Dirt effect */}
      {showDirt && <DirtParticles x={dirtPos.x} y={dirtPos.y} />}

      {/* Shadow under sand */}
      <div className="absolute bottom-0 left-2" style={{ width: 136, height: 8, background: "radial-gradient(ellipse, rgba(0,0,0,0.2) 0%, transparent 70%)", borderRadius: "50%" }} />
    </div>
  );
}

function PickaxeScene() {
  const pickaxeRef = useRef<HTMLDivElement>(null);
  const rockRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const [cracks, setCracks] = useState(0);
  const [isShaking, setIsShaking] = useState(false);
  const [isBroken, setIsBroken] = useState(false);
  const cooldownRef = useRef(false);

  const checkCollisionOnDrag = useCallback(() => {
    if (cooldownRef.current || isBroken) return;
    const pickEl = pickaxeRef.current;
    const rockEl = rockRef.current;
    if (!pickEl || !rockEl) return;

    const a = pickEl.getBoundingClientRect();
    const b = rockEl.getBoundingClientRect();
    const pad = 15;
    const colliding = !(a.right < b.left - pad || a.left > b.right + pad || a.bottom < b.top - pad || a.top > b.bottom + pad);

    if (colliding) {
      cooldownRef.current = true;
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 300);

      setCracks((prev) => {
        const next = prev + 1;
        if (next >= 3) {
          setIsBroken(true);
          setTimeout(() => { setCracks(0); setIsBroken(false); }, 2500);
        }
        return next;
      });

      setTimeout(() => { cooldownRef.current = false; }, 600);
    }
  }, [isBroken]);

  return (
    <div ref={sceneRef} className="absolute pointer-events-none" style={{ left: "65%", bottom: "12%", width: "200px", height: "160px" }}>
      {/* Rock */}
      <div
        ref={rockRef}
        style={{
          position: "absolute",
          left: 30,
          bottom: 0,
          animation: isShaking ? "rock-shake 0.3s ease-out" : "none",
          opacity: isBroken ? 0.3 : 1,
          transition: "opacity 0.3s",
        }}
      >
        <CartoonRock size={100} cracks={cracks} />
      </div>

      {/* Rock debris when broken */}
      {isBroken && (
        <div style={{ position: "absolute", left: 55, bottom: 20 }}>
          <RockDebris />
        </div>
      )}

      {/* Draggable pickaxe */}
      <motion.div
        ref={pickaxeRef}
        className="pointer-events-auto cursor-grab active:cursor-grabbing"
        style={{ position: "absolute", left: -10, bottom: 25, zIndex: 5 }}
        drag
        dragConstraints={sceneRef}
        dragElastic={0.1}
        dragMomentum={false}
        onDrag={() => checkCollisionOnDrag()}
        whileDrag={{ scale: 1.08 }}
      >
        <CartoonPickaxe size={85} />
      </motion.div>

      {/* Shadow under rock */}
      <div className="absolute bottom-0" style={{ left: 35, width: 90, height: 8, background: "radial-gradient(ellipse, rgba(0,0,0,0.2) 0%, transparent 70%)", borderRadius: "50%" }} />
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════════
   CONSTRUCTION SCENE — blended into page as background layer
   ═══════════════════════════════════════════════════════════════════ */
export function ConstructionScene() {
  return (
    <div
      className="relative w-screen select-none"
      style={{
        height: "550px",
        marginTop: "-350px",
        marginLeft: "calc(-1 * (100vw - 100%) / 2)",
        width: "100vw",
      }}
    >
      {/* Image layer — blended with page */}
      <div
        className="absolute inset-0"
        style={{
          mixBlendMode: "lighten",
          opacity: 0.2,
          maskImage: "linear-gradient(to bottom, transparent 0%, black 30%, black 75%, transparent 100%), linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)",
          maskComposite: "intersect",
          WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 30%, black 75%, transparent 100%), linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)",
          WebkitMaskComposite: "destination-in",
        }}
      >
        <img
          src="/construction-scene.png"
          alt=""
          className="w-full h-full object-cover"
          style={{ objectPosition: "center 80%" }}
          draggable={false}
        />
      </div>
    </div>
  );
}
