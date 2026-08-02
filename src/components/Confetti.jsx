import { useMemo } from "react";

/* eslint-disable react-hooks/purity -- celebratory randomness; specs are memoized per burst */


const COLORS = ["#ff8fab", "#ffd166", "#a78bfa", "#79b8f5", "#63b06f", "#ffb199", "#ff5d8f"];

/* A single celebratory burst — key it with `burst` to replay. */
export default function Confetti({ burst, count = 70 }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: `${burst}-${i}`,
        left: Math.random() * 100,
        delay: Math.random() * 0.7,
        duration: 2.2 + Math.random() * 1.8,
        color: COLORS[i % COLORS.length],
        size: 7 + Math.random() * 7,
        drift: Math.random() * 140 - 70,
        rot: Math.random() * 720 - 360,
        round: Math.random() > 0.6,
      })),
    [burst, count]
  );

  return (
    <div className="confetti-layer" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.round ? p.size : p.size * 0.45,
            background: p.color,
            borderRadius: p.round ? "50%" : 2,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            "--drift": `${p.drift}px`,
            "--rot": `${p.rot}deg`,
          }}
        />
      ))}
    </div>
  );
}
