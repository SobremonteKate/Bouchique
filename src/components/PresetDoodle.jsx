/* ------------------------------------------------------------------
   PresetDoodle — tiny hand-drawn doodles that sit beside the preset
   messages (message card + letter). Each doodle takes its colors from
   the resolved wish theme, so a Birthday message gets a gold
   sunflower and a Goodnight message a lavender moon.
   ------------------------------------------------------------------ */

export default function PresetDoodle({ type, theme, size = 17 }) {
  let body;

  switch (type) {
    case "tulip":
      body = (
        <>
          <path
            d="M 8 20 C 5.5 15 6.5 9.5 12 6 C 17.5 9.5 18.5 15 16 20 Z"
            fill={theme.tulip[0]}
            stroke={theme.tulip[1]}
            strokeWidth="1"
          />
          <path
            d="M 10.2 8.5 C 9.4 12 9.2 16 9.8 19.5"
            fill="none"
            stroke="#ffffff"
            strokeOpacity="0.5"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </>
      );
      break;
    case "heart":
      body = (
        <path
          d="M 12 20 C 12 20 4 14.5 4 9.5 C 4 6.5 6.4 4.5 8.8 4.5 C 10.4 4.5 11.4 5.3 12 6.4 C 12.6 5.3 13.6 4.5 15.2 4.5 C 17.6 4.5 20 6.5 20 9.5 C 20 14.5 12 20 12 20 Z"
          fill={theme.hearts[0]}
        />
      );
      break;
    case "daisy": {
      const petals = [];
      for (let i = 0; i < 8; i++) {
        petals.push(
          <ellipse
            key={i}
            cx="12"
            cy="5.6"
            rx="2.2"
            ry="4.6"
            transform={`rotate(${i * 45} 12 12)`}
            fill="#ffffff"
            stroke="#f4c2d0"
            strokeWidth="0.7"
          />
        );
      }
      body = (
        <>
          {petals}
          <circle cx="12" cy="12" r="3.2" fill={theme.daisyCenter[0]} />
          <circle cx="12" cy="12" r="1.4" fill={theme.daisyCenter[1]} />
        </>
      );
      break;
    }
    case "sparkle":
      body = (
        <path
          d="M 12 4 C 12.8 8 14.5 9.7 20 12 C 14.5 14.3 12.8 16 12 20 C 11.2 16 9.5 14.3 4 12 C 9.5 9.7 11.2 8 12 4 Z"
          fill={theme.sparkle}
        />
      );
      break;
    case "sunflower": {
      const petals = [];
      for (let i = 0; i < 8; i++) {
        petals.push(
          <ellipse
            key={i}
            cx="12"
            cy="5.4"
            rx="2.1"
            ry="4.6"
            transform={`rotate(${i * 45} 12 12)`}
            fill={theme.sunflower[0]}
            stroke="#e6a02c"
            strokeWidth="0.6"
          />
        );
      }
      body = (
        <>
          {petals}
          <circle cx="12" cy="12" r="4" fill={theme.sunflower[1]} />
          <circle cx="12" cy="12" r="2" fill={theme.sunflower[2]} />
        </>
      );
      break;
    }
    case "sun": {
      const rays = [];
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
        rays.push(
          <line
            key={i}
            x1={12 + Math.cos(a) * 5.4}
            y1={12 + Math.sin(a) * 5.4}
            x2={12 + Math.cos(a) * 8.4}
            y2={12 + Math.sin(a) * 8.4}
            stroke={theme.sunflower[0]}
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        );
      }
      body = (
        <>
          {rays}
          <circle cx="12" cy="12" r="4.4" fill={theme.sunflower[0]} />
          <circle cx="10.8" cy="10.6" r="1.3" fill="#ffffff" opacity="0.55" />
        </>
      );
      break;
    }
    case "moon":
      body = (
        <>
          <path
            d="M 14.5 5.5 A 8 8 0 1 0 20 14.5 A 6 6 0 0 1 14.5 5.5 Z"
            fill={theme.lavender[0]}
          />
          <circle cx="8.2" cy="8" r="0.9" fill="#ffffff" opacity="0.85" />
          <circle cx="10.6" cy="5.6" r="0.6" fill="#ffffff" opacity="0.7" />
        </>
      );
      break;
    case "star":
      body = (
        <path
          d="M 12 4.5 L 13.76 9.57 L 19.13 9.68 L 14.85 12.93 L 16.41 18.07 L 12 15 L 7.59 18.07 L 9.15 12.93 L 4.87 9.68 L 10.24 9.57 Z"
          fill={theme.hearts[2]}
        />
      );
      break;
    default:
      return null;
  }

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      style={{ display: "inline-block", verticalAlign: "0.12em", flex: "none" }}
    >
      {body}
    </svg>
  );
}
