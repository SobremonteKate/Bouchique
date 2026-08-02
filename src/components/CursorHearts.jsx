import { useEffect, useRef, useState } from "react";
import { HeartIcon, SparkleIcon } from "./HandDrawnIcons";

const HEARTS = [
  { Icon: HeartIcon, color: "#ff8fab" },
  { Icon: HeartIcon, color: "#e76f8e" },
  { Icon: HeartIcon, color: "#ffb3c6" },
  { Icon: SparkleIcon, color: "#ffd166" },
  { Icon: HeartIcon, color: "#a78bfa" },
];

/* Tiny drawn hearts + sparkles that trail the cursor on gentle movement. */
export default function CursorHearts() {
  const [hearts, setHearts] = useState([]);
  const lastRef = useRef(0);

  useEffect(() => {
    const onMove = (e) => {
      const now = performance.now();
      if (now - lastRef.current < 110) return;
      lastRef.current = now;
      const id = now + Math.random();
      const heart = {
        id,
        x: e.clientX,
        y: e.clientY,
        style: HEARTS[Math.floor(Math.random() * HEARTS.length)],
        rot: Math.random() * 40 - 20,
      };
      setHearts((h) => [...h.slice(-18), heart]);
      setTimeout(() => setHearts((h) => h.filter((x) => x.id !== id)), 1100);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  return (
    <div className="cursor-hearts" aria-hidden="true">
      {hearts.map((h) => (
        <span
          key={h.id}
          className="cursor-heart"
          style={{ left: h.x, top: h.y, transform: `rotate(${h.rot}deg)` }}
        >
          <h.style.Icon size={17} color={h.style.color} />
        </span>
      ))}
    </div>
  );
}
