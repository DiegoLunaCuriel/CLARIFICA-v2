"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";

/* ═══════════════════════════════════════════════════════════════════
   MARTILLO Y CLAVOS — Construction site whack-a-nail game
   Full construction scene background + lives + progressive difficulty
   ═══════════════════════════════════════════════════════════════════ */

const VB_W = 672;
const VB_H = 280;

// Board (wood plank) — positioned on the ground like the reference image
const BRD_X = 120;
const BRD_Y = 115;
const BRD_W = 430;
const BRD_H = 130;
const BRD_DEPTH = 14; // 3D depth/thickness

// Nail spawn area
const NAIL_PAD = 35;
const NAIL_MIN_X = BRD_X + NAIL_PAD;
const NAIL_MAX_X = BRD_X + BRD_W - NAIL_PAD;
const NAIL_MIN_Y = BRD_Y + 20;
const NAIL_MAX_Y = BRD_Y + BRD_H - 20;

// Nail dimensions
const NAIL_H = 38;
const NAIL_W = 7;
const HEAD_W = 16;
const HEAD_H = 6;
const HIT_R = 28;

// Scoring
const PERFECT_START = 0.4;
const PERFECT_END = 0.7;
const GOOD_BUFFER = 0.12;

// Difficulty levels — fast ramp-up, 8s per level
const LEVELS = [
  { dur: 2400, spawn: 850, max: 3 },
  { dur: 2000, spawn: 720, max: 3 },
  { dur: 1700, spawn: 600, max: 4 },
  { dur: 1400, spawn: 500, max: 4 },
  { dur: 1200, spawn: 420, max: 5 },
  { dur: 1000, spawn: 360, max: 5 },
  { dur: 850,  spawn: 300, max: 6 },
  { dur: 700,  spawn: 260, max: 7 },
];
const LEVEL_INTERVAL = 8000;
const MAX_LIVES = 3;

interface Nail {
  id: number;
  x: number;
  y: number;
  spawnTime: number;
  duration: number;
  hit: boolean;
  hitTime: number;
  hitQuality: "perfect" | "good" | "miss" | null;
  missed: boolean;
}
interface HitFx { id: number; x: number; y: number; time: number; quality: "perfect" | "good"; points: number; }
interface MissFx { id: number; x: number; y: number; time: number; }
interface LifeLostFx { id: number; x: number; y: number; time: number; }

/* ═══════════════════════════════════════════════════════════════════
   CONSTRUCTION SCENE BACKGROUND
   ═══════════════════════════════════════════════════════════════════ */
function ConstructionBackground() {
  return (
    <g>
      {/* Sky gradient */}
      <defs>
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#D4C4A0" />
          <stop offset="60%" stopColor="#C8B890" />
          <stop offset="100%" stopColor="#B8A878" />
        </linearGradient>
        <linearGradient id="dirtGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#9E8B6A" />
          <stop offset="40%" stopColor="#8A7758" />
          <stop offset="100%" stopColor="#7A6848" />
        </linearGradient>
      </defs>
      <rect width={VB_W} height={VB_H} fill="url(#skyGrad)" />

      {/* Sand mound (right) */}
      <path d="M 500 110 Q 560 40 640 65 Q 700 80 672 110 Z" fill="#D4BC8A" />
      <path d="M 510 110 Q 555 50 635 70 Q 680 85 672 110 Z" fill="#CCAF78" opacity={0.6} />
      <path d="M 530 110 Q 570 70 620 80 Q 660 95 672 110 Z" fill="#C4A870" opacity={0.4} />

      {/* Steel structure (left background) */}
      <g opacity={0.85}>
        {/* Vertical beams */}
        <rect x={30} y={20} width={8} height={105} fill="#8090A0" />
        <rect x={80} y={15} width={8} height={110} fill="#8090A0" />
        <rect x={130} y={25} width={8} height={100} fill="#7888A0" />
        {/* Horizontal beams */}
        <rect x={26} y={20} width={116} height={6} fill="#8898A8" />
        <rect x={26} y={55} width={116} height={5} fill="#8898A8" />
        <rect x={26} y={85} width={116} height={5} fill="#7888A0" />
        {/* Cross braces */}
        <line x1={34} y1={22} x2={84} y2={55} stroke="#7888A0" strokeWidth={3} />
        <line x1={84} y1={22} x2={34} y2={55} stroke="#7888A0" strokeWidth={3} />
        <line x1={84} y1={57} x2={134} y2={85} stroke="#7888A0" strokeWidth={3} />
        {/* Bolts */}
        {[[34, 22], [84, 22], [134, 27], [34, 57], [84, 57], [134, 87]].map(([bx, by], i) => (
          <circle key={i} cx={bx} cy={by} r={2.5} fill="#6878A0" />
        ))}
      </g>

      {/* Brick wall (left, partial) */}
      <g>
        <rect x={20} y={70} width={70} height={55} fill="#C47040" rx={2} />
        {/* Brick rows */}
        {[0, 1, 2, 3, 4].map((row) => {
          const yy = 72 + row * 11;
          const offset = row % 2 === 0 ? 0 : 12;
          return (
            <g key={row}>
              {[0, 1, 2, 3].map((col) => {
                const xx = 22 + offset + col * 22;
                if (xx > 86) return null;
                return (
                  <g key={col}>
                    <rect x={xx} y={yy} width={20} height={9} rx={1} fill={row % 2 === 0 ? "#C87848" : "#B86838"} />
                    <rect x={xx} y={yy} width={20} height={3} rx={1} fill="#D08858" opacity={0.4} />
                  </g>
                );
              })}
              <line x1={20} y1={yy + 10.5} x2={90} y2={yy + 10.5} stroke="#AA9070" strokeWidth={1} opacity={0.5} />
            </g>
          );
        })}
      </g>

      {/* Ground/terrain */}
      <path d="M 0 115 Q 80 105 200 112 Q 350 108 500 115 Q 600 110 672 115 L 672 280 L 0 280 Z" fill="url(#dirtGrad)" />
      {/* Ground texture — dirt bumps */}
      <path d="M 0 125 Q 40 120 100 128 Q 200 122 300 130 Q 400 125 500 132 Q 600 127 672 130" fill="none" stroke="#7A6540" strokeWidth={1} opacity={0.3} />
      <path d="M 0 150 Q 50 145 150 153 Q 300 148 450 155 Q 580 150 672 154" fill="none" stroke="#6A5838" strokeWidth={1} opacity={0.25} />

      {/* Scattered rocks */}
      {[
        { x: 50, y: 135, rx: 8, ry: 5, c: "#9A9080" },
        { x: 15, y: 155, rx: 6, ry: 4, c: "#8A8070" },
        { x: 95, y: 148, rx: 5, ry: 3, c: "#A09888" },
        { x: 580, y: 130, rx: 7, ry: 4, c: "#9A9080" },
        { x: 620, y: 150, rx: 9, ry: 5, c: "#8A8070" },
        { x: 470, y: 258, rx: 6, ry: 4, c: "#9A9080" },
        { x: 200, y: 260, rx: 5, ry: 3, c: "#8A8070" },
      ].map((r, i) => (
        <g key={`rock-${i}`}>
          <ellipse cx={r.x} cy={r.y + 2} rx={r.rx} ry={r.ry} fill="#5A4A38" opacity={0.3} />
          <ellipse cx={r.x} cy={r.y} rx={r.rx} ry={r.ry} fill={r.c} />
          <ellipse cx={r.x - 1} cy={r.y - 1} rx={r.rx * 0.5} ry={r.ry * 0.4} fill="#B0A898" opacity={0.3} />
        </g>
      ))}

      {/* Scattered bricks on ground */}
      {[
        { x: 20, y: 168, r: 15, c: "#C47040" },
        { x: 75, y: 178, r: -10, c: "#B86838" },
        { x: 560, y: 145, r: 8, c: "#C47040" },
        { x: 610, y: 170, r: -5, c: "#B86838" },
        { x: 150, y: 265, r: 20, c: "#C47040" },
      ].map((b, i) => (
        <g key={`brick-${i}`} transform={`translate(${b.x}, ${b.y}) rotate(${b.r})`}>
          <rect x={-12} y={-5} width={24} height={10} rx={1.5} fill={b.c} />
          <rect x={-12} y={-5} width={24} height={4} rx={1.5} fill="#D08858" opacity={0.35} />
          <rect x={-12} y={-5} width={24} height={10} rx={1.5} fill="none" stroke="#8A5A30" strokeWidth={0.8} />
        </g>
      ))}
    </g>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   WOOD BOARD (on the ground, with 3D depth)
   ═══════════════════════════════════════════════════════════════════ */
function WoodBoard() {
  return (
    <g>
      {/* Board shadow on ground */}
      <path
        d={`M ${BRD_X + 8} ${BRD_Y + BRD_H + 6} L ${BRD_X + BRD_W + 8} ${BRD_Y + BRD_H + 6} L ${BRD_X + BRD_W + 4} ${BRD_Y + BRD_H + BRD_DEPTH + 10} L ${BRD_X + 4} ${BRD_Y + BRD_H + BRD_DEPTH + 10} Z`}
        fill="#3A2A18" opacity={0.35}
      />

      {/* Board front face (depth/thickness) */}
      <rect x={BRD_X} y={BRD_Y + BRD_H} width={BRD_W} height={BRD_DEPTH} fill="#9A7030" />
      <rect x={BRD_X} y={BRD_Y + BRD_H} width={BRD_W} height={3} fill="#B08040" opacity={0.4} />
      <rect x={BRD_X} y={BRD_Y + BRD_H} width={BRD_W} height={BRD_DEPTH} fill="none" stroke="#6A4A1A" strokeWidth={1.5} />

      {/* Board top surface */}
      <rect x={BRD_X} y={BRD_Y} width={BRD_W} height={BRD_H} fill="#D4A050" />

      {/* Wood grain */}
      {[0.08, 0.17, 0.27, 0.37, 0.48, 0.58, 0.68, 0.78, 0.88, 0.95].map((pct, i) => {
        const yy = BRD_Y + BRD_H * pct;
        const amp = 1.5 + (i % 3) * 1.2;
        const freq = 0.009 + (i % 2) * 0.004;
        let d = `M ${BRD_X + 5} ${yy}`;
        for (let x = BRD_X + 8; x <= BRD_X + BRD_W - 5; x += 3) {
          const dy = Math.sin(x * freq + i * 1.9) * amp + Math.sin(x * freq * 2.5 + i * 0.7) * (amp * 0.35);
          d += ` L ${x} ${yy + dy}`;
        }
        const cols = ["#C09038", "#B88530", "#CA9A45", "#A87A28", "#D0A450"];
        return <path key={i} d={d} fill="none" stroke={cols[i % cols.length]} strokeWidth={0.8 + (i % 2) * 0.4} opacity={0.3 + (i % 3) * 0.06} />;
      })}

      {/* Wood knots */}
      {[
        { cx: BRD_X + BRD_W * 0.22, cy: BRD_Y + BRD_H * 0.35, rx: 10, ry: 7 },
        { cx: BRD_X + BRD_W * 0.7, cy: BRD_Y + BRD_H * 0.6, rx: 8, ry: 6 },
      ].map((k, i) => (
        <g key={`k-${i}`}>
          <ellipse cx={k.cx} cy={k.cy} rx={k.rx} ry={k.ry} fill="#8B6020" opacity={0.4} />
          <ellipse cx={k.cx} cy={k.cy} rx={k.rx * 0.55} ry={k.ry * 0.55} fill="#7A5018" opacity={0.35} />
          <ellipse cx={k.cx} cy={k.cy} rx={k.rx * 0.2} ry={k.ry * 0.2} fill="#6A4010" opacity={0.4} />
        </g>
      ))}

      {/* Top highlight */}
      <rect x={BRD_X} y={BRD_Y} width={BRD_W} height={3} fill="#E8C070" opacity={0.35} />
      {/* Bottom edge */}
      <rect x={BRD_X} y={BRD_Y + BRD_H - 2} width={BRD_W} height={2} fill="#8A6020" opacity={0.3} />
      {/* Outline */}
      <rect x={BRD_X} y={BRD_Y} width={BRD_W} height={BRD_H} fill="none" stroke="#6A4A1A" strokeWidth={2} />
    </g>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   NAIL SVG (straight, cartoon style with cross-hatch head)
   ═══════════════════════════════════════════════════════════════════ */
function NailSVG({ x, y, progress, opacity }: { x: number; y: number; progress: number; opacity: number }) {
  const popUp = Math.min(progress / 0.12, 1);
  const visibleH = NAIL_H * popUp;
  const nailTopY = y - visibleH;
  if (visibleH < 2) return null;

  return (
    <g opacity={opacity}>
      <ellipse cx={x + 1} cy={y + 1} rx={5} ry={2} fill="#5A3A10" opacity={0.3} />
      {/* Shaft */}
      <rect x={x - NAIL_W / 2} y={nailTopY + HEAD_H} width={NAIL_W} height={Math.max(visibleH - HEAD_H - 5, 1)} rx={1} fill="#8A9BAA" />
      <rect x={x - NAIL_W / 2 + 1.5} y={nailTopY + HEAD_H} width={1.8} height={Math.max(visibleH - HEAD_H - 5, 1)} fill="#B0C0CC" opacity={0.5} />
      <rect x={x + NAIL_W / 2 - 2} y={nailTopY + HEAD_H} width={1.2} height={Math.max(visibleH - HEAD_H - 5, 1)} fill="#6A7A8A" opacity={0.4} />
      {visibleH > 18 && [0.25, 0.38].map((p, i) => (
        <line key={i} x1={x - NAIL_W / 2 + 0.5} y1={nailTopY + HEAD_H + (visibleH - HEAD_H) * p} x2={x + NAIL_W / 2 - 0.5} y2={nailTopY + HEAD_H + (visibleH - HEAD_H) * p} stroke="#6A7A8A" strokeWidth={0.7} opacity={0.5} />
      ))}
      {visibleH > 8 && <polygon points={`${x - NAIL_W / 2},${y - 3} ${x + NAIL_W / 2},${y - 3} ${x},${y + 1}`} fill="#6A7A8A" />}
      {/* Head */}
      {visibleH > HEAD_H + 2 && (
        <g>
          <ellipse cx={x} cy={nailTopY + HEAD_H + 1} rx={HEAD_W / 2} ry={2.5} fill="#4A4A4A" opacity={0.15} />
          <rect x={x - HEAD_W / 2} y={nailTopY} width={HEAD_W} height={HEAD_H} rx={2} fill="#8A9BAA" />
          <rect x={x - HEAD_W / 2} y={nailTopY} width={HEAD_W} height={2.5} rx={2} fill="#AAB8C4" />
          <g opacity={0.2}>
            {[-2, 1, 4].map((dx, i) => <line key={`h${i}`} x1={x + dx - 2} y1={nailTopY + 1.5} x2={x + dx + 2} y2={nailTopY + HEAD_H - 1.5} stroke="#555" strokeWidth={0.5} />)}
            {[-3, 0, 3].map((dx, i) => <line key={`v${i}`} x1={x - HEAD_W / 2 + 2 + i * 4} y1={nailTopY + 1} x2={x - HEAD_W / 2 + 4 + i * 4} y2={nailTopY + HEAD_H - 1} stroke="#555" strokeWidth={0.5} />)}
          </g>
          <rect x={x - HEAD_W / 2} y={nailTopY} width={HEAD_W} height={HEAD_H} rx={2} fill="none" stroke="#5A6A7A" strokeWidth={1} />
        </g>
      )}
      <TimingIndicator x={x} y={nailTopY - 2} progress={progress} />
    </g>
  );
}

function BentNailSVG({ x, y, opacity }: { x: number; y: number; opacity: number }) {
  return (
    <g opacity={opacity}>
      <path d={`M ${x} ${y} L ${x + 3} ${y - 10} Q ${x + 8} ${y - 18} ${x + 5} ${y - 26} L ${x + 2} ${y - 33}`} fill="none" stroke="#7A8B9A" strokeWidth={NAIL_W} strokeLinecap="round" strokeLinejoin="round" />
      <path d={`M ${x - 1} ${y} L ${x + 2} ${y - 10} Q ${x + 7} ${y - 18} ${x + 4} ${y - 26}`} fill="none" stroke="#A0B0BB" strokeWidth={1.5} opacity={0.4} strokeLinecap="round" />
      <g transform={`translate(${x + 2}, ${y - 33}) rotate(-20)`}>
        <rect x={-HEAD_W / 2} y={-HEAD_H / 2} width={HEAD_W} height={HEAD_H} rx={2} fill="#8A9BAA" stroke="#5A6A7A" strokeWidth={1} />
      </g>
    </g>
  );
}

function TimingIndicator({ x, y, progress }: { x: number; y: number; progress: number }) {
  if (progress < 0.12 || progress > 0.95) return null;
  const adj = (progress - 0.12) / 0.83;
  const maxR = 18;
  const curR = maxR * (1 - adj);
  if (curR < 1.5) return null;

  const inP = progress >= PERFECT_START && progress <= PERFECT_END;
  const inG = !inP && progress >= PERFECT_START - GOOD_BUFFER && progress <= PERFECT_END + GOOD_BUFFER;
  let col = "#FFFFFF", op = 0.5;
  if (inP) { col = "#4ADE80"; op = 0.9; }
  else if (inG) { col = "#FBBF24"; op = 0.7; }

  const gO = maxR * (1 - (PERFECT_START - 0.12) / 0.83);
  const gI = maxR * (1 - (PERFECT_END - 0.12) / 0.83);

  return (
    <g>
      <circle cx={x} cy={y} r={maxR} fill="none" stroke="#555" strokeWidth={1.2} opacity={0.15} />
      <circle cx={x} cy={y} r={(gO + gI) / 2} fill="none" stroke="#4ADE80" strokeWidth={Math.max(gO - gI, 1.5)} opacity={0.2} />
      <circle cx={x} cy={y} r={curR} fill="none" stroke={col} strokeWidth={2} opacity={op} />
    </g>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   HAMMER CURSOR
   ═══════════════════════════════════════════════════════════════════ */
function HammerCursor({ x, y, striking }: { x: number; y: number; striking: boolean }) {
  const rot = striking ? 12 : -35;
  return (
    <g transform={`translate(${x}, ${y}) rotate(${rot})`} style={{ pointerEvents: "none" }}>
      {/* ── HANDLE (extends down from head) ── */}
      {/* Shadow */}
      <rect x={-3} y={5} width={8} height={46} rx={3} fill="#000" opacity={0.1} />
      {/* Main wooden shaft — slight taper */}
      <path d="M -2.5 4 L -3.5 46 Q -3.5 49 0.5 49 Q 4.5 49 4.5 46 L 3.5 4 Z" fill="#C47A30" />
      {/* Left highlight */}
      <path d="M -2.5 4 L -3.2 46 Q -3.2 48 -1.5 48 L -1 4 Z" fill="#DDA050" opacity={0.45} />
      {/* Wood grain lines */}
      <path d="M -1 9 Q 0.5 18 -0.5 28 Q 0.5 38 0 46" fill="none" stroke="#9A5A18" strokeWidth={0.6} opacity={0.4} />
      <path d="M 1.5 11 Q 2.5 20 1.5 32 Q 2 40 1 47" fill="none" stroke="#B07028" strokeWidth={0.5} opacity={0.3} />
      {/* Knot on handle */}
      <ellipse cx={0.5} cy={24} rx={2.2} ry={1.6} fill="#9A5818" opacity={0.35} />
      <ellipse cx={0.5} cy={24} rx={0.8} ry={0.6} fill="#7A4010" opacity={0.35} />
      {/* Handle outline */}
      <path d="M -2.5 4 L -3.5 46 Q -3.5 49 0.5 49 Q 4.5 49 4.5 46 L 3.5 4 Z" fill="none" stroke="#7A4510" strokeWidth={1.2} />

      {/* Rubber grip at bottom */}
      <path d="M -3.2 38 L -3.5 46 Q -3.5 49 0.5 49 Q 4.5 49 4.5 46 L 4.2 38 Z" fill="#3A2818" />
      <path d="M -3.2 38 L -3.0 43 L 4.0 43 L 4.2 38 Z" fill="#4A3520" opacity={0.5} />
      {/* Grip ridges */}
      {[40, 42.5, 45, 47].map((gy, i) => (
        <line key={i} x1={-3.2} y1={gy} x2={4.2} y2={gy} stroke="#2A1808" strokeWidth={0.5} opacity={0.4} />
      ))}
      <path d="M -3.2 38 L -3.5 46 Q -3.5 49 0.5 49 Q 4.5 49 4.5 46 L 4.2 38 Z" fill="none" stroke="#2A1808" strokeWidth={0.8} />

      {/* ── HAMMER HEAD ── */}
      <g>
        {/* Drop shadow */}
        <rect x={-22} y={1} width={45} height={18} rx={3} fill="#000" opacity={0.12} />

        {/* Main head block */}
        <rect x={-22} y={-6} width={45} height={18} rx={3.5} fill="#6E7F8E" />
        {/* Top face — lighter for 3D */}
        <rect x={-22} y={-6} width={45} height={7} rx={3.5} fill="#8FA0AE" opacity={0.6} />
        {/* Bottom darker edge */}
        <rect x={-22} y={6} width={45} height={6} rx={3} fill="#5A6A78" opacity={0.35} />

        {/* ─ Striking face (left, wider & flat) ─ */}
        <rect x={-25} y={-7.5} width={7} height={21} rx={2} fill="#5E6E7E" />
        <rect x={-25} y={-7.5} width={3} height={21} rx={1.5} fill="#8898A8" opacity={0.4} />
        <rect x={-25} y={-7.5} width={7} height={21} rx={2} fill="none" stroke="#3E4E5E" strokeWidth={1} />
        {/* Impact surface highlight */}
        <line x1={-25.5} y1={-4} x2={-25.5} y2={10} stroke="#9AAABA" strokeWidth={0.8} opacity={0.5} />

        {/* Cheek shine */}
        <ellipse cx={-10} cy={-1} rx={6} ry={4} fill="#A0B0BE" opacity={0.25} />

        {/* Head outline */}
        <rect x={-22} y={-6} width={45} height={18} rx={3.5} fill="none" stroke="#3E4E5E" strokeWidth={1.5} />

        {/* ─ CLAW (right side, curved V) ─ */}
        {/* Outer claw */}
        <path
          d="M 21 -5 Q 28 -14 25 -24 Q 24 -22 23 -20 Q 25 -12 21 -5"
          fill="#6E7F8E" stroke="#3E4E5E" strokeWidth={1} strokeLinejoin="round"
        />
        {/* Inner claw */}
        <path
          d="M 18 -5 Q 21 -14 17 -23 Q 16 -20 15.5 -18 Q 19 -12 17 -5"
          fill="#6E7F8E" stroke="#3E4E5E" strokeWidth={1} strokeLinejoin="round"
        />
        {/* V-notch between claws */}
        <path d="M 23 -20 L 20 -13 L 15.5 -18" fill="none" stroke="#3E4E5E" strokeWidth={0.8} />
        {/* Claw highlights */}
        <path d="M 22 -6 Q 27 -14 24.5 -22" fill="none" stroke="#8FA0AE" strokeWidth={0.6} opacity={0.4} />
        <path d="M 18.5 -6 Q 20.5 -13 17.5 -21" fill="none" stroke="#8FA0AE" strokeWidth={0.6} opacity={0.4} />

        {/* ─ Metal collar (where handle meets head) ─ */}
        <rect x={-4} y={-7} width={9} height={20} rx={1.5} fill="#5A6A78" />
        <rect x={-4} y={-7} width={3} height={20} rx={1} fill="#7A8A9A" opacity={0.3} />
        <rect x={-4} y={-7} width={9} height={20} rx={1.5} fill="none" stroke="#3E4E5E" strokeWidth={0.8} />
      </g>
    </g>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   GAME OVER SCREEN
   ═══════════════════════════════════════════════════════════════════ */
function GameOverScreen({ score, level, onRetry }: { score: number; level: number; onRetry: () => void }) {
  return (
    <g>
      <rect width={VB_W} height={VB_H} fill="#000" opacity={0.7} rx={12} />
      <text x={VB_W / 2} y={90} textAnchor="middle" fill="#EF4444" fontFamily="monospace" fontWeight="bold" fontSize={28} stroke="#000" strokeWidth={3} paintOrder="stroke">
        GAME OVER
      </text>
      <text x={VB_W / 2} y={130} textAnchor="middle" fill="#FFF" fontFamily="monospace" fontSize={16} stroke="#000" strokeWidth={2} paintOrder="stroke">
        Puntos: {score}
      </text>
      <text x={VB_W / 2} y={155} textAnchor="middle" fill="#9CA3AF" fontFamily="monospace" fontSize={13} stroke="#000" strokeWidth={2} paintOrder="stroke">
        Nivel alcanzado: {level}
      </text>
      {/* Retry button */}
      <g onClick={onRetry} style={{ cursor: "pointer" }}>
        <rect x={VB_W / 2 - 70} y={175} width={140} height={36} rx={8} fill="#e6a817" />
        <rect x={VB_W / 2 - 70} y={175} width={140} height={18} rx={8} fill="#F0C040" opacity={0.4} />
        <rect x={VB_W / 2 - 70} y={175} width={140} height={36} rx={8} fill="none" stroke="#AA7A0A" strokeWidth={2} />
        <text x={VB_W / 2} y={198} textAnchor="middle" fill="#FFF" fontFamily="monospace" fontWeight="bold" fontSize={15}>
          Reintentar
        </text>
      </g>
    </g>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════ */
export function BlockStacker() {
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [level, setLevel] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [nails, setNails] = useState<Nail[]>([]);
  const [hitFxs, setHitFxs] = useState<HitFx[]>([]);
  const [missFxs, setMissFxs] = useState<MissFx[]>([]);
  const [lifeLostFxs, setLifeLostFxs] = useState<LifeLostFx[]>([]);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [striking, setStriking] = useState(false);

  const svgRef = useRef<SVGSVGElement>(null);
  const nextIdRef = useRef(0);
  const nailsRef = useRef<Nail[]>([]);
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const livesRef = useRef(MAX_LIVES);
  const levelRef = useRef(1);
  const gameOverRef = useRef(false);
  const frameRef = useRef(0);
  const spawnTimerRef = useRef(0);
  const levelTimerRef = useRef(0);
  const gameStartRef = useRef(performance.now());

  nailsRef.current = nails;
  scoreRef.current = score;
  comboRef.current = combo;
  livesRef.current = lives;
  levelRef.current = level;
  gameOverRef.current = gameOver;

  const resetGame = useCallback(() => {
    setScore(0); setCombo(0); setLives(MAX_LIVES); setLevel(1);
    setGameOver(false); setNails([]); setHitFxs([]); setMissFxs([]); setLifeLostFxs([]);
    spawnTimerRef.current = 0;
    levelTimerRef.current = 0;
    gameStartRef.current = performance.now();
    livesRef.current = MAX_LIVES;
    levelRef.current = 1;
    gameOverRef.current = false;
  }, []);

  // Game loop
  useEffect(() => {
    let running = true;
    let lastTime = performance.now();

    function loop(now: number) {
      if (!running) return;
      const dt = now - lastTime;
      lastTime = now;

      if (gameOverRef.current) {
        frameRef.current = requestAnimationFrame(loop);
        return;
      }

      const lvl = LEVELS[Math.min(levelRef.current - 1, LEVELS.length - 1)];

      // Level up timer
      levelTimerRef.current += dt;
      if (levelTimerRef.current >= LEVEL_INTERVAL && levelRef.current < LEVELS.length) {
        levelTimerRef.current = 0;
        setLevel((l) => Math.min(l + 1, LEVELS.length));
      }

      // Spawn nails
      spawnTimerRef.current += dt;
      if (spawnTimerRef.current >= lvl.spawn) {
        spawnTimerRef.current = 0;
        const current = nailsRef.current;
        const activeCount = current.filter((n) => !n.hit && !n.missed && now - n.spawnTime < n.duration).length;

        if (activeCount < lvl.max) {
          const durRange = lvl.dur * 0.2;
          const duration = lvl.dur - durRange + Math.random() * durRange * 2;

          let nx = 0, ny = 0;
          for (let attempt = 0; attempt < 15; attempt++) {
            nx = NAIL_MIN_X + Math.random() * (NAIL_MAX_X - NAIL_MIN_X);
            ny = NAIL_MIN_Y + Math.random() * (NAIL_MAX_Y - NAIL_MIN_Y);
            if (!current.some((n) => !n.hit && !n.missed && Math.hypot(n.x - nx, n.y - ny) < 50)) break;
          }

          setNails((prev) => [...prev, {
            id: nextIdRef.current++, x: nx, y: ny, spawnTime: now, duration,
            hit: false, hitTime: 0, hitQuality: null, missed: false,
          }]);
        }
      }

      // Mark expired nails as missed → lose life
      setNails((prev) => {
        let lostLife = false;
        const updated = prev.map((n) => {
          if (!n.hit && !n.missed && now - n.spawnTime >= n.duration) {
            lostLife = true;
            setLifeLostFxs((fx) => [...fx, { id: nextIdRef.current++, x: n.x, y: n.y - NAIL_H / 2, time: now }]);
            return { ...n, missed: true, hitTime: now };
          }
          return n;
        });
        if (lostLife) {
          setLives((l) => {
            const newL = l - 1;
            if (newL <= 0) setGameOver(true);
            return Math.max(0, newL);
          });
          setCombo(0);
        }
        return updated;
      });

      // Cleanup
      setNails((prev) => prev.filter((n) => {
        if (n.hit) return now - n.hitTime < 350;
        if (n.missed) return now - n.hitTime < 500;
        return true;
      }));
      setHitFxs((prev) => prev.filter((f) => now - f.time < 700));
      setMissFxs((prev) => prev.filter((f) => now - f.time < 500));
      setLifeLostFxs((prev) => prev.filter((f) => now - f.time < 800));

      frameRef.current = requestAnimationFrame(loop);
    }

    frameRef.current = requestAnimationFrame(loop);
    return () => { running = false; cancelAnimationFrame(frameRef.current); };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    setMousePos({ x: ((e.clientX - rect.left) / rect.width) * VB_W, y: ((e.clientY - rect.top) / rect.height) * VB_H });
  }, []);

  const handleClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (gameOverRef.current) return;
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * VB_W;
    const py = ((e.clientY - rect.top) / rect.height) * VB_H;
    const now = performance.now();

    setStriking(true);
    setTimeout(() => setStriking(false), 100);

    let bestNail: Nail | null = null;
    let bestDist = HIT_R;
    for (const n of nailsRef.current) {
      if (n.hit || n.missed) continue;
      if (now - n.spawnTime < n.duration * 0.12) continue;
      const dist = Math.hypot(px - n.x, py - (n.y - NAIL_H / 2));
      if (dist < bestDist) { bestDist = dist; bestNail = n; }
    }

    if (bestNail) {
      const progress = (now - bestNail.spawnTime) / bestNail.duration;
      let quality: "perfect" | "good" = "good";
      let pts = 25;
      if (progress >= PERFECT_START && progress <= PERFECT_END) { quality = "perfect"; pts = 50; }
      const newCombo = quality === "perfect" ? comboRef.current + 1 : comboRef.current;
      const mult = Math.min(1 + newCombo * 0.1, 3.0);
      const final = Math.round(pts * mult);

      setNails((prev) => prev.map((n) => n.id === bestNail!.id ? { ...n, hit: true, hitTime: now, hitQuality: quality } : n));
      setScore((s) => s + final);
      setCombo(newCombo);
      setHitFxs((prev) => [...prev, { id: nextIdRef.current++, x: bestNail!.x, y: bestNail!.y - NAIL_H / 2, time: now, quality, points: final }]);
    } else {
      setCombo(0);
      setMissFxs((prev) => [...prev, { id: nextIdRef.current++, x: px, y: py, time: now }]);
    }
  }, []);

  const now = performance.now();

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      width="100%"
      style={{ display: "block", borderRadius: "0.75rem", cursor: mousePos ? "none" : "default", userSelect: "none" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setMousePos(null)}
      onClick={handleClick}
    >
      {/* Construction scene background */}
      <ConstructionBackground />

      {/* Wood board (play area) */}
      <WoodBoard />

      {/* Nails */}
      {nails.map((nail) => {
        if (nail.hit) {
          const t = (now - nail.hitTime) / 350;
          return (
            <g key={nail.id} opacity={Math.max(0, 1 - t * 1.5)}>
              <rect x={nail.x - HEAD_W / 2} y={nail.y - 2 - (1 - Math.min(t * 3, 1)) * 2} width={HEAD_W} height={HEAD_H} rx={2} fill="#8A9BAA" stroke="#5A6A7A" strokeWidth={0.8} />
            </g>
          );
        }
        if (nail.missed) {
          return <BentNailSVG key={nail.id} x={nail.x} y={nail.y} opacity={Math.max(0, 1 - (now - nail.hitTime) / 500)} />;
        }
        const progress = (now - nail.spawnTime) / nail.duration;
        return <NailSVG key={nail.id} x={nail.x} y={nail.y} progress={progress} opacity={progress > 0.85 ? (1 - progress) / 0.15 : 1} />;
      })}

      {/* Hit effects */}
      {hitFxs.map((fx) => {
        const t = (now - fx.time) / 700;
        if (t > 1) return null;
        const isP = fx.quality === "perfect";
        return (
          <g key={fx.id} opacity={1 - t}>
            {Array.from({ length: isP ? 7 : 4 }, (_, j) => {
              const a = (j / (isP ? 7 : 4)) * Math.PI * 2 + 0.3;
              const len = 5 + t * (isP ? 18 : 12);
              const sR = 4 + t * 2;
              return <line key={j} x1={fx.x + Math.cos(a) * sR} y1={fx.y + Math.sin(a) * sR} x2={fx.x + Math.cos(a) * (sR + len)} y2={fx.y + Math.sin(a) * (sR + len)} stroke={isP ? "#4ADE80" : "#FBBF24"} strokeWidth={isP ? 2 : 1.5} strokeLinecap="round" />;
            })}
            <text x={fx.x} y={fx.y - 12 - t * 20} textAnchor="middle" fill={isP ? "#4ADE80" : "#FBBF24"} fontFamily="monospace" fontWeight="bold" fontSize={isP ? 14 : 11} stroke="#000" strokeWidth={2.5} paintOrder="stroke">
              {isP ? "PERFECTO!" : "BIEN!"}
            </text>
            <text x={fx.x} y={fx.y - 0 - t * 16} textAnchor="middle" fill="#FFF" fontFamily="monospace" fontWeight="bold" fontSize={10} stroke="#000" strokeWidth={2} paintOrder="stroke">+{fx.points}</text>
          </g>
        );
      })}

      {/* Miss effects */}
      {missFxs.map((fx) => {
        const t = (now - fx.time) / 500;
        if (t > 1) return null;
        return (
          <g key={fx.id} opacity={1 - t}>
            <circle cx={fx.x} cy={fx.y} r={2 + t * 6} fill="none" stroke="#8B5E2A" strokeWidth={1.5} />
          </g>
        );
      })}

      {/* Life lost effects */}
      {lifeLostFxs.map((fx) => {
        const t = (now - fx.time) / 800;
        if (t > 1) return null;
        return (
          <text key={fx.id} x={fx.x} y={fx.y - 10 - t * 25} textAnchor="middle" fill="#EF4444" fontFamily="monospace" fontWeight="bold" fontSize={13} stroke="#000" strokeWidth={2.5} paintOrder="stroke" opacity={1 - t}>
            -1 ❤️
          </text>
        );
      })}

      {/* ─── HUD ─── */}
      {/* Lives (top-left) */}
      {[0, 1, 2].map((i) => (
        <g key={`life-${i}`}>
          <text x={14 + i * 22} y={20} fontSize={16} opacity={i < lives ? 1 : 0.25}>❤️</text>
        </g>
      ))}

      {/* Score + Level (top-right) */}
      <text x={VB_W - 14} y={17} textAnchor="end" fill="#e6a817" fontFamily="monospace" fontSize={10} stroke="#000" strokeWidth={2} paintOrder="stroke">Nv.{level}</text>
      <text x={VB_W - 14} y={32} textAnchor="end" fill="#FFF" fontFamily="monospace" fontWeight="bold" fontSize={15} stroke="#000" strokeWidth={3} paintOrder="stroke">{score}</text>

      {combo > 1 && (
        <text x={VB_W - 14} y={46} textAnchor="end" fill="#FBBF24" fontFamily="monospace" fontWeight="bold" fontSize={11} stroke="#000" strokeWidth={2} paintOrder="stroke">
          x{combo}
        </text>
      )}

      {/* Hammer cursor */}
      {mousePos && !gameOver && <HammerCursor x={mousePos.x} y={mousePos.y} striking={striking} />}

      {/* Game Over */}
      {gameOver && <GameOverScreen score={score} level={level} onRetry={resetGame} />}
    </svg>
  );
}
