import { useCallback, useEffect, useMemo, useRef } from "react";
import Flower from "./Flower";
import { PALETTES, TYPE_PALETTES, FLOWER_NAMES } from "../data/flowers";

/* ------------------------------------------------------------------
   Bouquet — builds a one-of-a-kind arrangement.
   Layout math: flowers sit in a fan from a focal point near the bottom
   (the "hand" holding the stems). Each flower gets a random type,
   palette, scale, tilt, and position. A paper cone wraps the stems and
   a ribbon ties it together.

   All randomness comes from a small seeded PRNG (mulberry32) so each
   `seed` value produces the exact same bouquet — deterministic renders,
   yet "another bouquet" still gives a brand new arrangement.

   The bouquet feels alive: while the cursor is over the SVG, every
   bloom leans toward it (same eased rAF loop as the hero flowers),
   pivoting at the base of its head where the stem meets the petals,
   so they read as bending toward you. Disabled for
   prefers-reduced-motion.
   ------------------------------------------------------------------ */

function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FLOWER_TYPES = Object.keys(TYPE_PALETTES);

function makeFlower(rng, index, backRow) {
  const type = FLOWER_TYPES[Math.floor(rng() * FLOWER_TYPES.length)];
  const paletteOptions = TYPE_PALETTES[type];
  const paletteKey = paletteOptions[Math.floor(rng() * paletteOptions.length)];
  const palette = PALETTES[paletteKey];

  const angle = backRow ? (rng() - 0.5) * 1.04 : (rng() - 0.5) * 0.8;
  const radius = backRow ? 148 + rng() * 34 : 96 + rng() * 40;
  const headX = Math.sin(angle) * radius;
  const headY = -Math.cos(angle) * radius;

  return {
    id: index,
    type,
    paletteKey,
    palette,
    name: FLOWER_NAMES[type],
    headX,
    headY,
    tilt: rng() * 32 - 16,
    scale: backRow ? 0.62 + rng() * 0.2 : 0.78 + rng() * 0.27,
    stemCurve: rng() * 28 - 14,
    swayDelay: rng() * 3,
    backRow,
  };
}

/* petal radial-gradient helper — SVG defs are fine in a data module */
function petal(id, palette) {
  return (
    <radialGradient key={id} id={id} cx="50%" cy="38%" r="75%">
      <stop offset="0%" stopColor={palette.a} />
      <stop offset="100%" stopColor={palette.b} />
    </radialGradient>
  );
}

const RIBBONS = ["#ff5d8f", "#a78bfa", "#ff8fab", "#f472b6", "#ffb703"];

/* cursor-lean tuning — same feel as the hero flowers */
const MAX_LEAN = 16; // degrees of tilt at the extreme
const LEAN_PER_PX = 0.12; // degrees per pixel the cursor is off-center
const EASE = 0.16; // per-frame smoothing toward the target lean
const HEAD_PIVOT = 34; // local units below the head center = the stem pivot

export default function Bouquet({ seed }) {
  // seed changes -> brand new arrangement
  const flowers = useMemo(() => {
    const rng = mulberry32((seed * 9301 + 49297) % 233280);
    const arr = [];
    const backCount = 4 + Math.floor(rng() * 3);   // 4-6
    const frontCount = 3 + Math.floor(rng() * 2);  // 3-4
    for (let i = 0; i < backCount; i++) arr.push(makeFlower(rng, i, true));
    for (let i = 0; i < frontCount; i++) arr.push(makeFlower(rng, backCount + i, false));
    // sort back row first so front flowers overlap correctly
    return arr.sort((a, b) => (a.backRow === b.backRow ? a.headY - b.headY : a.backRow ? -1 : 1));
  }, [seed]);

  const ribbon = useMemo(() => RIBBONS[Math.abs(seed * 7) % RIBBONS.length], [seed]);

  const rootRef = useRef(null);
  const itemRefs = useRef([]);
  const centersRef = useRef([]);
  const leanRef = useRef([]);
  const mouseXRef = useRef(0);
  const hoveredRef = useRef(false);
  const rafRef = useRef(null);
  const reducedMotionRef = useRef(
    typeof window !== "undefined" &&
      !!window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  const measure = useCallback(() => {
    centersRef.current = flowers.map((_, i) => {
      const el = itemRefs.current[i];
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return r.left + r.width / 2;
    });
  }, [flowers]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    leanRef.current = flowers.map(() => 0);
    measure();
    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    // the .scene entrance animation (sceneIn: scale 0.92 -> 1 over 0.9s) is
    // mid-flight at mount, so re-measure once it settles for pixel-accurate centers
    const settleTimer = setTimeout(measure, 1100);

    const loop = () => {
      let needMore = hoveredRef.current && !reducedMotionRef.current;
      for (let i = 0; i < flowers.length; i++) {
        const el = itemRefs.current[i];
        if (!el) continue;
        const f = flowers[i];
        let target = 0;
        if (hoveredRef.current && !reducedMotionRef.current) {
          const center = centersRef.current[i];
          if (center != null) {
            const dx = mouseXRef.current - center;
            target = Math.max(-MAX_LEAN, Math.min(MAX_LEAN, dx * LEAN_PER_PX));
          }
        }
        const cur = leanRef.current[i];
        const nv = cur + (target - cur) * EASE;
        leanRef.current[i] = nv;
        const base = `translate(${f.headX}, ${f.headY})`;
        if (Math.abs(nv) > 0.02) {
          el.setAttribute(
            "transform",
            `${base} rotate(${nv.toFixed(2)} 0 ${(HEAD_PIVOT * f.scale).toFixed(1)})`
          );
        } else if (el.getAttribute("transform") !== base) {
          el.setAttribute("transform", base);
        }
        if (Math.abs(nv - target) > 0.02) needMore = true;
      }
      rafRef.current = needMore ? requestAnimationFrame(loop) : null;
    };

    const startLoop = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(loop);
    };

    const enter = () => {
      hoveredRef.current = true;
      if (!centersRef.current.length) measure();
      startLoop();
    };
    const leave = () => {
      hoveredRef.current = false; // loop keeps easing back to upright, then stops
    };
    const move = (e) => {
      mouseXRef.current = e.clientX;
      if (!centersRef.current.length) measure();
      startLoop();
    };

    root.addEventListener("mouseenter", enter);
    root.addEventListener("mouseleave", leave);
    root.addEventListener("mousemove", move);
    return () => {
      clearTimeout(settleTimer);
      window.removeEventListener("resize", onResize);
      root.removeEventListener("mouseenter", enter);
      root.removeEventListener("mouseleave", leave);
      root.removeEventListener("mousemove", move);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [flowers, measure]);

  return (
    <svg
      viewBox="-200 -240 400 340"
      className="bouquet-svg"
      role="img"
      aria-label="A digital bouquet of flowers"
      ref={rootRef}
    >
      <defs>
        {flowers.map((f) => petal(`bq-${f.id}`, f.palette))}
        <linearGradient id="paperGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff5f7" />
          <stop offset="100%" stopColor="#ffd6e0" />
        </linearGradient>
        <linearGradient id="paperBack" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffd6e0" />
          <stop offset="100%" stopColor="#f8b8c8" />
        </linearGradient>
      </defs>

      {/* ---- paper cone (back flap) ---- */}
      <path
        d="M -70 -78 L 70 -78 L 60 4 L -60 4 Z"
        fill="url(#paperBack)"
        opacity="0.9"
      />

      {/* ---- stems + leaves ---- */}
      {flowers.map((f) => {
        const cx = f.headX + f.stemCurve * 0.35;
        const cy = (f.headY + 92) / 2;
        return (
          <g key={`stem-${f.id}`}>
            <path
              d={`M 0 92 Q ${cx} ${cy} ${f.headX} ${f.headY}`}
              fill="none"
              stroke="#4f9d5f"
              strokeWidth={f.backRow ? 3.4 : 4.2}
              strokeLinecap="round"
            />
            {/* leaf */}
            <g transform={`translate(${cx - f.stemCurve * 0.2}, ${cy}) rotate(${f.stemCurve > 0 ? 150 : 30})`}>
              <path
                d="M 0 0 C 10 -4 18 -1 22 6 C 14 9 6 8 0 0 Z"
                fill="#63b06f"
                opacity="0.95"
              />
            </g>
          </g>
        );
      })}

      {/* ---- flowers (back row first) ---- */}
      {flowers.map((f, i) => (
        <g
          key={f.id}
          ref={(el) => {
            itemRefs.current[i] = el;
          }}
          transform={`translate(${f.headX}, ${f.headY})`}
          aria-label={f.name}
          role="img"
        >
          <Flower
            type={f.type}
            palette={f.palette}
            gid={`bq-${f.id}`}
            tilt={f.tilt}
            scale={f.scale}
            swayDelay={f.swayDelay}
          />
        </g>
      ))}

      {/* ---- paper cone (front wrap) ---- */}
      <g>
        <path
          d="M -84 -70 C -92 -30 -88 10 -72 34 C -64 44 -70 76 -58 96 L 58 96 C 70 76 64 44 72 34 C 88 10 92 -30 84 -70 C 46 -58 -46 -58 -84 -70 Z"
          fill="url(#paperGrad)"
          stroke="#f7c8d4"
          strokeWidth="1.6"
        />
        {/* pleats */}
        <path d="M -30 -62 L -20 94" stroke="#f9d4de" strokeWidth="1.6" fill="none" />
        <path d="M 0 -60 L 0 96" stroke="#f9d4de" strokeWidth="1.6" fill="none" />
        <path d="M 30 -62 L 20 94" stroke="#f9d4de" strokeWidth="1.6" fill="none" />
      </g>

      {/* ---- ribbon ---- */}
      <g>
        {/* band */}
        <path d="M -64 -18 C -40 -10 40 -10 64 -18 L 60 -2 C 38 8 -38 8 -60 -2 Z" fill={ribbon} />
        {/* bow left */}
        <path
          d="M -4 -8 C -26 -34 -58 -26 -48 -4 C -42 8 -22 8 -6 -4 Z"
          fill={ribbon}
          stroke={ribbon}
          strokeWidth="1"
        />
        {/* bow right */}
        <path
          d="M 4 -8 C 26 -34 58 -26 48 -4 C 42 8 22 8 6 -4 Z"
          fill={ribbon}
          stroke={ribbon}
          strokeWidth="1"
        />
        {/* knot + tails */}
        <circle cx="0" cy="-6" r="7" fill={ribbon} />
        <path d="M -2 -2 Q -10 14 -8 30" fill="none" stroke={ribbon} strokeWidth="5" strokeLinecap="round" />
        <path d="M 2 -2 Q 12 16 10 34" fill="none" stroke={ribbon} strokeWidth="5" strokeLinecap="round" />
      </g>

      {/* sparkles */}
      <g fill="#ffd166">
        <path d="M 96 -120 L 99 -112 L 107 -109 L 99 -106 L 96 -98 L 93 -106 L 85 -109 L 93 -112 Z" />
        <path d="M -104 -132 L -102 -126 L -96 -124 L -102 -122 L -104 -116 L -106 -122 L -112 -124 L -106 -126 Z" />
        <path d="M 118 -60 L 120 -55 L 125 -53 L 120 -51 L 118 -46 L 116 -51 L 111 -53 L 116 -55 Z" opacity="0.8" />
      </g>
    </svg>
  );
}
