/* ------------------------------------------------------------------
   Bouchique flower heads — hand-drawn SVG blooms.
   Each head is drawn centered on (0,0) with a natural radius of ~48.
   Colors come from a palette { a, b, center } where a→b is the petal
   gradient and center is the heart of the bloom.
   ------------------------------------------------------------------ */

function Rose({ palette, gid }) {
  const petals = [];
  const layers = [
    { count: 6, r: 34, pr: 15, pw: 19 },
    { count: 6, r: 24, pr: 11, pw: 14, offset: 30 },
    { count: 5, r: 14, pr: 8, pw: 10, offset: 18 },
  ];
  layers.forEach((layer) => {
    for (let i = 0; i < layer.count; i++) {
      const a = (i / layer.count) * Math.PI * 2 + (layer.offset ?? 0) * (Math.PI / 180);
      petals.push(
        <ellipse
          key={`${layer.r}-${i}`}
          cx={Math.cos(a) * layer.r}
          cy={Math.sin(a) * layer.r}
          rx={layer.pr}
          ry={layer.pw}
          transform={`rotate(${(a * 180) / Math.PI})`}
          fill={`url(#${gid})`}
          stroke={palette.b}
          strokeWidth="1.2"
        />
      );
    }
  });
  return (
    <g>
      {petals}
      <circle r="9" fill={palette.center} />
      <path
        d="M -3 -2 Q 0 -7 3 -2 Q 6 0 3 3 Q 0 6 -3 3 Q -6 0 -3 -2 Z"
        fill="#fde2e4"
        opacity="0.85"
      />
    </g>
  );
}

function Tulip({ palette, gid }) {
  return (
    <g>
      <path
        d="M -16 30 C -26 12 -20 -16 0 -30 C 20 -16 26 12 16 30 Z"
        fill={`url(#${gid})`}
        stroke={palette.b}
        strokeWidth="1.4"
      />
      <path
        d="M -2 -24 C -6 -8 -8 10 -4 26"
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.5"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M 2 -20 C 5 -4 6 12 2 26"
        fill="none"
        stroke={palette.b}
        strokeOpacity="0.7"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </g>
  );
}

function Daisy({ palette, gid }) {
  const petals = [];
  const count = 12;
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    petals.push(
      <ellipse
        key={i}
        cx={Math.cos(a) * 26}
        cy={Math.sin(a) * 26}
        rx={9}
        ry={22}
        transform={`rotate(${(a * 180) / Math.PI})`}
        fill={`url(#${gid})`}
        stroke={palette.b}
        strokeWidth="1.2"
      />
    );
  }
  return (
    <g>
      {petals}
      <circle r="12" fill={palette.center} />
      <circle r="7" fill={palette.a} opacity="0.55" />
      {[0, 60, 120, 180, 240, 300].map((ang) => (
        <circle
          key={ang}
          cx={Math.cos((ang * Math.PI) / 180) * 4}
          cy={Math.sin((ang * Math.PI) / 180) * 4}
          r="1.6"
          fill="#ffffff"
        />
      ))}
    </g>
  );
}

function Sunflower({ palette, gid }) {
  const petals = [];
  const count = 14;
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    petals.push(
      <ellipse
        key={i}
        cx={Math.cos(a) * 28}
        cy={Math.sin(a) * 28}
        rx={10}
        ry={21}
        transform={`rotate(${(a * 180) / Math.PI})`}
        fill={`url(#${gid})`}
        stroke={palette.b}
        strokeWidth="1.3"
      />
    );
  }
  const seeds = [];
  for (let ring = 0; ring < 3; ring++) {
    const n = 6 + ring * 2;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + ring;
      seeds.push(
        <circle
          key={`${ring}-${i}`}
          cx={Math.cos(a) * (2.5 + ring * 3.4)}
          cy={Math.sin(a) * (2.5 + ring * 3.4)}
          r="1.5"
          fill={palette.b}
          opacity="0.9"
        />
      );
    }
  }
  return (
    <g>
      {petals}
      <circle r="13" fill={palette.center} />
      {seeds}
    </g>
  );
}

function Peony({ palette, gid }) {
  const petals = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    petals.push(
      <path
        key={`out-${i}`}
        d="M 0 -26 C 10 -32 22 -30 26 -18 C 29 -6 22 4 10 8 C 4 10 -4 10 -10 8 C -22 4 -29 -6 -26 -18 C -22 -30 -10 -32 0 -26 Z"
        transform={`rotate(${(a * 180) / Math.PI})`}
        fill={`url(#${gid})`}
        stroke={palette.b}
        strokeWidth="1.2"
        opacity="0.92"
      />
    );
  }
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + 0.4;
    petals.push(
      <path
        key={`mid-${i}`}
        d="M 0 -15 C 6 -20 14 -19 16 -11 C 18 -3 12 3 5 5 C 0 7 -5 7 -10 5 C -17 3 -18 -7 -16 -13 C -14 -20 -6 -20 0 -15 Z"
        transform={`rotate(${(a * 180) / Math.PI})`}
        fill={`url(#${gid})`}
        stroke={palette.b}
        strokeWidth="1"
        opacity="0.95"
      />
    );
  }
  return (
    <g>
      {petals}
      <circle r="6" fill={palette.center} />
      {[0, 90, 180, 270].map((ang) => (
        <circle
          key={ang}
          cx={Math.cos((ang * Math.PI) / 180) * 3.4}
          cy={Math.sin((ang * Math.PI) / 180) * 3.4}
          r="1.4"
          fill="#ffffff"
          opacity="0.8"
        />
      ))}
    </g>
  );
}

function Poppy({ palette, gid }) {
  const petals = [];
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    petals.push(
      <path
        key={i}
        d="M 0 -30 C 12 -38 26 -32 28 -18 C 30 -6 24 2 12 6 C 4 9 -4 9 -12 6 C -24 2 -30 -6 -28 -18 C -26 -32 -12 -38 0 -30 Z"
        transform={`rotate(${(a * 180) / Math.PI})`}
        fill={`url(#${gid})`}
        stroke={palette.b}
        strokeWidth="1.3"
      />
    );
  }
  return (
    <g>
      {petals}
      <circle r="10" fill={palette.center} />
      <circle r="6.5" fill={palette.b} />
      <circle r="3" fill="#2d1a11" />
      <circle r="1.2" cx="6" cy="-2" fill="#ffd166" />
    </g>
  );
}

function Lavender({ palette, gid }) {
  const buds = [];
  for (let i = 0; i < 7; i++) {
    buds.push(
      <ellipse
        key={i}
        cx={(i % 2 === 0 ? 1 : -1) * (5 + i * 1.2)}
        cy={-26 + i * 8.5}
        rx="6"
        ry="7.5"
        fill={`url(#${gid})`}
        stroke={palette.b}
        strokeWidth="1"
      />
    );
  }
  return (
    <g>
      <rect x="-2.2" y="-40" width="4.4" height="70" rx="2.2" fill="#5aa469" />
      {buds}
      <ellipse cx="0" cy="-38" rx="4.4" ry="7" fill={`url(#${gid})`} stroke={palette.b} strokeWidth="1" />
    </g>
  );
}

function Calla({ palette, gid }) {
  return (
    <g>
      <path
        d="M -4 26 C -16 18 -22 4 -18 -8 C -14 -18 -6 -24 4 -26 C 12 -27 20 -24 22 -18 L 8 2 C 6 10 4 18 -4 26 Z"
        fill={`url(#${gid})`}
        stroke={palette.b}
        strokeWidth="1.4"
      />
      <path
        d="M -4 26 C 6 30 10 20 8 4"
        fill="none"
        stroke={palette.b}
        strokeWidth="2.4"
        strokeLinecap="round"
        opacity="0.8"
      />
      <rect x="-2" y="-34" width="4" height="16" rx="2" fill="#ffd166" />
    </g>
  );
}

function BabysBreath({ palette }) {
  const buds = [];
  const spots = [
    [0, 0, 5], [16, -6, 3.6], [-15, -9, 4], [8, -18, 3], [-6, -20, 4.4],
    [24, 6, 3], [-24, 4, 3.4], [14, 14, 3.2], [-13, 16, 3], [28, -14, 2.6],
    [-28, -14, 2.8], [0, 22, 3.2], [34, 0, 2.4], [-34, -2, 2.6], [20, -24, 2.4],
  ];
  spots.forEach(([x, y, r], i) => {
    buds.push(
      <g key={i}>
        <circle cx={x} cy={y} r={r} fill="#ffffff" stroke="#f4c2d0" strokeWidth="1" />
        <circle cx={x} cy={y} r={r * 0.45} fill={palette.a} />
      </g>
    );
  });
  return <g>{buds}</g>;
}

const RENDERERS = {
  rose: Rose,
  tulip: Tulip,
  daisy: Daisy,
  sunflower: Sunflower,
  peony: Peony,
  poppy: Poppy,
  lavender: Lavender,
  calla: Calla,
  babysbreath: BabysBreath,
};

/* A single bloom: gradient defs + head, rotated by tilt. */
export default function Flower({ type, palette, gid, tilt = 0, scale = 1, swayDelay = 0 }) {
  const Renderer = RENDERERS[type] || Daisy;
  return (
    <g transform={`translate(0,0) scale(${scale}) rotate(${tilt})`}>
      {/* inner g holds the CSS sway so it doesn't clobber the tilt/scale above.
          transform-box: fill-box makes transform-origin relative to THIS bloom,
          so each flower gently sways on its stem instead of orbiting the viewBox. */}
      <g
        style={{
          transformBox: "fill-box",
          transformOrigin: "50% 100%",
          animation: swayDelay >= 0 ? `flowerSway ${5 + (swayDelay % 3)}s ease-in-out ${swayDelay}s infinite alternate` : undefined,
        }}
      >
        <Renderer palette={palette} gid={gid} />
      </g>
    </g>
  );
}
