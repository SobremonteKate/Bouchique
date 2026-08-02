import { useEffect, useRef, useState } from "react";
import Flower from "./Flower";
import { HeartIcon } from "./HandDrawnIcons";
import { PALETTES } from "../data/flowers";

/* ------------------------------------------------------------------
   Hero flowers — the intro's little flower row, drawn by hand instead
   of stock emojis. Reuses the same Flower component + palettes as the
   bouquet, each bloom in its own tiny svg with its own gradient defs
   and the site's pop-in + gentle bob animations.

   They wave hello: while the cursor is over the row, every bloom leans
   toward it (like sunflowers tracking the sun), eased with a small
   requestAnimationFrame loop so the motion stays buttery. The lean is
   applied to an inner "tilt" span so it never fights the outer
   pop-in/bob animation. Disabled for prefers-reduced-motion.

   They blow kisses: rest the cursor on a bloom and it sends a tiny
   heart floating up (with a soft pop), and keeps sending them as long
   as you linger. Disabled for prefers-reduced-motion.
   ------------------------------------------------------------------ */

const SPROUTS = [
  { type: "tulip", palette: PALETTES.rose },
  { type: "daisy", palette: PALETTES.snow },
  { type: "peony", palette: PALETTES.blush },
  { type: "sunflower", palette: PALETTES.sunny },
  { type: "lavender", palette: PALETTES.grape },
  { type: "poppy", palette: PALETTES.coral },
  { type: "rose", palette: PALETTES.berry },
];

const MAX_LEAN = 16; // degrees of tilt at the extreme
const LEAN_PER_PX = 0.12; // degrees per pixel the cursor is off-center
const EASE = 0.16; // per-frame smoothing toward the target lean

const LINGER_MS = 380; // rest on a bloom this long before it blows a kiss
const KISS_GAP_MS = 950; // keep sending kisses while you keep resting
const KISS_LIFE_MS = 1400; // how long a heart floats before it fades out
const MAX_KISSES_PER_LINGER = 4; // stop after a few — a moment, not a metronome
// rich pastel hearts — palette.center is too pale on cream for the snow daisy
const HEART_COLORS = ["#e76f8e", "#a78bfa", "#ff8fab", "#ffb703", "#f06292", "#ff7a5c"];

export default function HeroFlowers({ onKiss }) {
  const [hearts, setHearts] = useState([]);
  const rootRef = useRef(null);
  const itemRefs = useRef([]);
  const centersRef = useRef([]);
  const tiltRef = useRef(SPROUTS.map(() => 0));
  const mouseXRef = useRef(0);
  const hoveredRef = useRef(false);
  const rafRef = useRef(null);
  const lingerTimersRef = useRef([]); // per-bloom linger / repeat timers
  const kissCountRef = useRef(SPROUTS.map(() => 0)); // kisses sent this linger
  const removalTimersRef = useRef([]); // per-heart removal timeouts
  const kissIdRef = useRef(0);
  const onKissRef = useRef(onKiss);
  const reducedMotionRef = useRef(
    typeof window !== "undefined" &&
      !!window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  // keep the latest callback without re-running the main effect
  useEffect(() => {
    onKissRef.current = onKiss;
  }, [onKiss]);

  const measure = () => {
    centersRef.current = SPROUTS.map((_, i) => {
      const el = itemRefs.current[i];
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return r.left + r.width / 2;
    });
  };

  useEffect(() => {
    const root = rootRef.current;
    const timers = lingerTimersRef.current; // stable handle for cleanup
    const kissCount = kissCountRef.current;
    const removalTimers = removalTimersRef.current; // stable handle for cleanup
    measure();
    const onResize = () => measure();
    window.addEventListener("resize", onResize);

    const loop = () => {
      let needMore = hoveredRef.current && !reducedMotionRef.current;
      for (let i = 0; i < SPROUTS.length; i++) {
        const el = itemRefs.current[i];
        if (!el) continue;
        let target = 0;
        if (hoveredRef.current && !reducedMotionRef.current) {
          const center = centersRef.current[i];
          if (center != null) {
            const dx = mouseXRef.current - center;
            target = Math.max(-MAX_LEAN, Math.min(MAX_LEAN, dx * LEAN_PER_PX));
          }
        }
        const cur = tiltRef.current[i];
        const nv = cur + (target - cur) * EASE;
        tiltRef.current[i] = nv;
        if (Math.abs(nv) > 0.02) el.style.transform = `rotate(${nv.toFixed(2)}deg)`;
        else if (el.style.transform) el.style.transform = "";
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

    /* ---- blow a kiss ---- */

    const spawnKiss = (i) => {
      const el = itemRefs.current[i];
      if (!el || reducedMotionRef.current) return;
      const b = el.getBoundingClientRect();
      const r = root.getBoundingClientRect();
      const id = ++kissIdRef.current;
      setHearts((h) =>
        [
          ...h.slice(-6),
          {
            id,
            x: b.left - r.left + b.width / 2 + (Math.random() * 12 - 6),
            y: b.top - r.top + b.height * 0.4,
            color: HEART_COLORS[i % HEART_COLORS.length],
            rot: Math.random() * 30 - 15,
          },
        ]
      );
      kissCount[i] += 1;
      onKissRef.current?.();
      removalTimers.push(setTimeout(() => setHearts((h) => h.filter((x) => x.id !== id)), KISS_LIFE_MS));
    };

    const clearBloomTimer = (i) => {
      clearTimeout(timers[i]);
      clearInterval(timers[i]);
      timers[i] = null;
    };

    const bloomEnter = (i) => {
      if (reducedMotionRef.current) return;
      clearBloomTimer(i);
      kissCount[i] = 0;
      // linger a moment, then keep blowing kisses while the cursor rests
      timers[i] = setTimeout(() => {
        spawnKiss(i);
        timers[i] = setInterval(() => {
          if (kissCount[i] >= MAX_KISSES_PER_LINGER) {
            clearBloomTimer(i); // enough for one lingering moment
            return;
          }
          spawnKiss(i);
        }, KISS_GAP_MS);
      }, LINGER_MS);
    };

    // per-bloom hover listeners on the tilt spans (the flowers themselves)
    const bloomListeners = SPROUTS.map((_, i) => {
      const el = itemRefs.current[i];
      if (!el) return null;
      const handleEnter = () => bloomEnter(i);
      const handleLeave = () => clearBloomTimer(i);
      el.addEventListener("mouseenter", handleEnter);
      el.addEventListener("mouseleave", handleLeave);
      return { el, handleEnter, handleLeave };
    });

    root.addEventListener("mouseenter", enter);
    root.addEventListener("mouseleave", leave);
    root.addEventListener("mousemove", move);
    return () => {
      window.removeEventListener("resize", onResize);
      root.removeEventListener("mouseenter", enter);
      root.removeEventListener("mouseleave", leave);
      root.removeEventListener("mousemove", move);
      bloomListeners.forEach((l) => {
        if (!l) return;
        l.el.removeEventListener("mouseenter", l.handleEnter);
        l.el.removeEventListener("mouseleave", l.handleLeave);
      });
      timers.forEach((t) => {
        clearTimeout(t);
        clearInterval(t);
      });
      removalTimers.forEach(clearTimeout);
      removalTimers.length = 0;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, []);

  return (
    <p className="hero-flowers" ref={rootRef} aria-hidden="true">
      {SPROUTS.map((s, i) => (
        <span key={i} className="hero-flower-item" style={{ animationDelay: `${i * 0.35}s` }}>
          <span
            className="hero-flower-tilt"
            ref={(el) => {
              itemRefs.current[i] = el;
            }}
          >
            <svg viewBox="-62 -62 124 124" width="52" height="52" aria-hidden="true">
              <defs>
                <radialGradient id={`hero-${i}`} cx="50%" cy="38%" r="75%">
                  <stop offset="0%" stopColor={s.palette.a} />
                  <stop offset="100%" stopColor={s.palette.b} />
                </radialGradient>
              </defs>
              <Flower type={s.type} palette={s.palette} gid={`hero-${i}`} scale={0.78} swayDelay={i * 1.1} />
            </svg>
          </span>
        </span>
      ))}

      {/* floating kisses */}
      {hearts.length > 0 && (
        <span className="hero-kiss-layer" aria-hidden="true">
          {hearts.map((h) => (
            <span key={h.id} className="hero-kiss" style={{ left: h.x, top: h.y }}>
              <span className="hero-kiss-inner" style={{ transform: `rotate(${h.rot}deg)` }}>
                <HeartIcon size={18} color={h.color} />
              </span>
            </span>
          ))}
        </span>
      )}
    </p>
  );
}
