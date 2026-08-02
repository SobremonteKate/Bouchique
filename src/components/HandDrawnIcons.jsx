/* ------------------------------------------------------------------
   Hand-drawn SVG icons — the site's buttons and labels carry tiny
   drawn glyphs instead of stock emojis, so the whole site shares one
   soft, hand-drawn visual language. Icons inherit the surrounding
   text color via currentColor unless a `color` prop is given, and
   scale with `size` (default 16).
   ------------------------------------------------------------------ */

function Svg({ size = 16, color, children, className = "", ...rest }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      color={color}
      aria-hidden="true"
      focusable="false"
      className={`drawn-icon ${className}`.trim()}
      {...rest}
    >
      {children}
    </svg>
  );
}

/* ✨ a little four-point sparkle, plus two tiny dust motes */
export const SparkleIcon = (p) => (
  <Svg {...p}>
    <path
      d="M12 2.5c.9 5.3 2.5 7.3 7.8 8.2-5.3.9-6.9 2.9-7.8 8.2-.9-5.3-2.5-7.3-7.8-8.2 5.3-.9 6.9-2.9 7.8-8.2Z"
      fill="currentColor"
      stroke="none"
    />
    <circle cx="20" cy="3.2" r="0.8" fill="currentColor" stroke="none" />
    <circle cx="3.6" cy="20.4" r="0.6" fill="currentColor" stroke="none" />
  </Svg>
);

/* 💖 a filled hand-drawn heart */
export const HeartIcon = (p) => (
  <Svg {...p}>
    <path
      d="M12 20.5C6.5 15.8 3.6 11.6 5.2 8.6 6.6 6.1 9.8 6.2 12 8.9c2.2-2.7 5.4-2.8 6.8-.3 1.6 3-1.3 7.2-6.8 11.9Z"
      fill="currentColor"
      stroke="none"
    />
  </Svg>
);

/* 💌 a letter sealed with a tiny heart */
export const HeartLetterIcon = (p) => (
  <Svg {...p}>
    <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
    <path d="M3.5 7.5 12 13.5 20.5 7.5" />
    <path
      d="M12 15.7c-.5-.6-1.4-1.2-1.4-2 0-.9.8-1.4 1.4-1.4.25 0 .5.1.7.25.2-.15.45-.25.7-.25.6 0 1.4.5 1.4 1.4 0 .8-.9 1.4-1.4 2Z"
      fill="currentColor"
      stroke="none"
    />
  </Svg>
);

/* 🔔 a hand-drawn bell — with a little slash when muted */
export const BellIcon = ({ muted, ...p }) => (
  <Svg {...p}>
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    {muted && <path d="M4 4.5 20 19.5" strokeWidth={1.6} />}
  </Svg>
);

/* 🔗 two chain links */
export const LinkIcon = (p) => (
  <Svg {...p}>
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </Svg>
);

/* ✍️ a pencil at an angle */
export const PencilIcon = (p) => (
  <Svg {...p}>
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
  </Svg>
);

/* 🌸 a small five-petal bloom with a pale heart */
export const FlowerIcon = (p) => (
  <Svg {...p}>
    {[0, 72, 144, 216, 288].map((a) => (
      <ellipse
        key={a}
        cx="12"
        cy="7"
        rx="2.2"
        ry="4.2"
        transform={`rotate(${a} 12 12)`}
        fill="currentColor"
        stroke="none"
        opacity="0.9"
      />
    ))}
    <circle cx="12" cy="12" r="2.7" fill="#fff" />
    <circle cx="12" cy="12" r="1.4" fill="currentColor" />
  </Svg>
);

/* 🎵 a double eighth-note */
export const NoteIcon = (p) => (
  <Svg {...p}>
    <path d="M9.5 18V5.2" />
    <path d="M9.5 5.2 18.5 3.4" />
    <path d="M18.5 3.4V16" />
    <ellipse cx="7" cy="18" rx="2.3" ry="1.8" fill="currentColor" stroke="none" />
    <ellipse cx="16" cy="16" rx="2.3" ry="1.8" fill="currentColor" stroke="none" />
  </Svg>
);

/* ▶ a filled play triangle */
export const PlayIcon = (p) => (
  <Svg {...p}>
    <path d="M8 5.6v12.8L19.2 12Z" fill="currentColor" stroke="none" />
  </Svg>
);

/* ⏸ two rounded pause bars */
export const PauseIcon = (p) => (
  <Svg {...p}>
    <rect x="6.8" y="5.4" width="3.4" height="13.2" rx="1.7" fill="currentColor" stroke="none" />
    <rect x="13.8" y="5.4" width="3.4" height="13.2" rx="1.7" fill="currentColor" stroke="none" />
  </Svg>
);

/* ↩️ a return arrow (back to the lullaby) */
export const BackIcon = (p) => (
  <Svg {...p}>
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
  </Svg>
);

/* ⬆️ an up arrow into a tray */
export const UploadIcon = (p) => (
  <Svg {...p}>
    <path d="M12 3v11" />
    <path d="m7 8 5-5 5 5" />
    <path d="M4.5 17v2.5A1.5 1.5 0 0 0 6 21h12a1.5 1.5 0 0 0 1.5-1.5V17" />
  </Svg>
);
