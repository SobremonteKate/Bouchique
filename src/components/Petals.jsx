import { useMemo } from "react";

/* eslint-disable react-hooks/purity -- decorative randomness; specs are memoized once per mount */


/* Gentle petals drifting down across the scene. */
const COLORS = ["#ff8fab", "#ffc2d4", "#ffb199", "#f8a5c2", "#ffd6e0", "#a78bfa"];

export default function Petals({ count = 16 }) {
  const petals = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: 10 + Math.random() * 12,
        delay: -Math.random() * 18,
        duration: 9 + Math.random() * 12,
        color: COLORS[i % COLORS.length],
        sway: Math.random() * 60 - 30,
        rot: Math.random() * 360,
        op: 0.5 + Math.random() * 0.5,
      })),
    [count]
  );

  return (
    <div className="petals" aria-hidden="true">
      {petals.map((p) => (
        <span
          key={p.id}
          className="petal"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.82,
            background: p.color,
            opacity: p.op,
            transform: `rotate(${p.rot}deg)`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            "--sway": `${p.sway}px`,
          }}
        />
      ))}
    </div>
  );
}
