/* =========================================================================
   BOUCHIQUE — og-banner generator (theme-aware)
   Draws a 1200×630 pastel bouquet banner pixel-by-pixel for every theme in
   api/themes.js and writes real PNGs (RGBA, color type 6) using only Node
   built-ins. No dependencies.
   Usage:  node scripts/gen-og.js
   ========================================================================= */

import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { THEMES } from "../api/themes.js";

const W = 1200;
const H = 630;

/* ---------- tiny helpers ---------- */

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const lerp = (a, b, t) => a + (b - a) * t;
const dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);

const hexRgb = (hex) => {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
};

// coverage from a signed distance (negative inside the shape)
const cov = (d) => clamp01(0.5 - d);

// standard "over" blend onto an opaque canvas
function blend(img, x, y, r, g, b, a) {
  const i = (y * W + x) * 4;
  const t = clamp01(a);
  img[i] = img[i] * (1 - t) + r * t;
  img[i + 1] = img[i + 1] * (1 - t) + g * t;
  img[i + 2] = img[i + 2] * (1 - t) + b * t;
  img[i + 3] = 255;
}

/* ---------- shapes ---------- */

function circle(img, cx, cy, r, [cr, cg, cb], alpha = 1) {
  const x0 = Math.max(0, Math.floor(cx - r - 1));
  const x1 = Math.min(W - 1, Math.ceil(cx + r + 1));
  const y0 = Math.max(0, Math.floor(cy - r - 1));
  const y1 = Math.min(H - 1, Math.ceil(cy + r + 1));
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const d = dist(x, y, cx, cy) - r;
      const c = cov(d);
      if (c > 0) blend(img, x, y, cr, cg, cb, c * alpha);
    }
  }
}

function ellipse(img, cx, cy, rx, ry, rot, [cr, cg, cb], alpha = 1) {
  const cos = Math.cos(-rot);
  const sin = Math.sin(-rot);
  const R = Math.max(rx, ry);
  const x0 = Math.max(0, Math.floor(cx - R - 1));
  const x1 = Math.min(W - 1, Math.ceil(cx + R + 1));
  const y0 = Math.max(0, Math.floor(cy - R - 1));
  const y1 = Math.min(H - 1, Math.ceil(cy + R + 1));
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const u = (dx * cos - dy * sin) / rx;
      const v = (dx * sin + dy * cos) / ry;
      const d = (Math.sqrt(u * u + v * v) - 1) * Math.min(rx, ry);
      const c = cov(d);
      if (c > 0) blend(img, x, y, cr, cg, cb, c * alpha);
    }
  }
}

function segment(img, x1, y1, x2, y2, w, [cr, cg, cb], alpha = 1) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  const x0 = Math.max(0, Math.floor(Math.min(x1, x2) - w - 1));
  const x1b = Math.min(W - 1, Math.ceil(Math.max(x1, x2) + w + 1));
  const y0 = Math.max(0, Math.floor(Math.min(y1, y2) - w - 1));
  const y1b = Math.min(H - 1, Math.ceil(Math.max(y1, y2) + w + 1));
  for (let y = y0; y <= y1b; y++) {
    for (let x = x0; x <= x1b; x++) {
      let t = 0;
      if (len2 > 0) t = clamp01(((x - x1) * dx + (y - y1) * dy) / len2);
      const d = dist(x, y, x1 + t * dx, y1 + t * dy) - w;
      const c = cov(d);
      if (c > 0) blend(img, x, y, cr, cg, cb, c * alpha);
    }
  }
}

function triangle(img, ax, ay, bx, by, cx, cy, [cr, cg, cb], alpha = 1) {
  const x0 = Math.max(0, Math.floor(Math.min(ax, bx, cx) - 1));
  const x1 = Math.min(W - 1, Math.ceil(Math.max(ax, bx, cx) + 1));
  const y0 = Math.max(0, Math.floor(Math.min(ay, by, cy) - 1));
  const y1 = Math.min(H - 1, Math.ceil(Math.max(ay, by, cy) + 1));
  const edges = [
    [ax, ay, bx, by],
    [bx, by, cx, cy],
    [cx, cy, ax, ay],
  ];
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      let minE = Infinity;
      for (const [x1e, y1e, x2e, y2e] of edges) {
        const ex = x2e - x1e;
        const ey = y2e - y1e;
        const len = Math.hypot(ex, ey) || 1;
        const e = ((x - x1e) * ey - (y - y1e) * ex) / len;
        minE = Math.min(minE, e);
      }
      const c = cov(-minE);
      if (c > 0) blend(img, x, y, cr, cg, cb, c * alpha);
    }
  }
}

// heart = two lobes + a pointy bottom
function heart(img, cx, cy, s, [cr, cg, cb], alpha = 1) {
  const r = s * 0.52;
  circle(img, cx - s * 0.5, cy - s * 0.18, r, [cr, cg, cb], alpha);
  circle(img, cx + s * 0.5, cy - s * 0.18, r, [cr, cg, cb], alpha);
  triangle(
    img,
    cx - s * 1.02,
    cy + s * 0.12,
    cx + s * 1.02,
    cy + s * 0.12,
    cx,
    cy + s * 1.55,
    [cr, cg, cb],
    alpha
  );
}

// soft radial blob for the background
function blob(img, cx, cy, r, [cr, cg, cb], alpha = 1) {
  const x0 = Math.max(0, Math.floor(cx - r));
  const x1 = Math.min(W - 1, Math.ceil(cx + r));
  const y0 = Math.max(0, Math.floor(cy - r));
  const y1 = Math.min(H - 1, Math.ceil(cy + r));
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const d = dist(x, y, cx, cy);
      if (d > r) continue;
      const a = (1 - d / r) * (1 - d / r) * alpha;
      blend(img, x, y, cr, cg, cb, a);
    }
  }
}

/* ---------- PNG encoding ---------- */

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function be32(n) {
  return [n >>> 24, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff];
}

function chunk(type, data) {
  const typeBytes = [...type].map((ch) => ch.charCodeAt(0));
  const body = new Uint8Array([...be32(data.length), ...typeBytes, ...data]);
  const crc = be32(crc32(body.subarray(4)));
  return new Uint8Array([...body, ...crc]);
}

function encodePng(img) {
  const raw = new Uint8Array(H * (W * 4 + 1));
  for (let y = 0; y < H; y++) {
    const rowStart = y * (W * 4 + 1);
    raw[rowStart] = 0;
    raw.set(img.subarray(y * W * 4, (y + 1) * W * 4), rowStart + 1);
  }
  const ihdr = new Uint8Array([
    ...be32(W),
    ...be32(H),
    8, // bit depth
    6, // color type: RGBA
    0, 0, 0, // compression, filter, interlace
  ]);
  const idat = deflateSync(raw, { level: 9 });
  return new Uint8Array([
    ...[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
    ...chunk("IHDR", ihdr),
    ...chunk("IDAT", idat),
    ...chunk("IEND", new Uint8Array(0)),
  ]);
}

/* ---------- draw one themed banner ---------- */

function drawBanner(theme) {
  const img = new Uint8ClampedArray(W * H * 4);

  const [bgTop, bgBottom] = [hexRgb(theme.bgTop), hexRgb(theme.bgBottom)];
  for (let y = 0; y < H; y++) {
    const t = y / H;
    const r = lerp(bgTop[0], bgBottom[0], t);
    const g = lerp(bgTop[1], bgBottom[1], t);
    const b = lerp(bgTop[2], bgBottom[2], t);
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      img[i] = r;
      img[i + 1] = g;
      img[i + 2] = b;
      img[i + 3] = 255;
    }
  }

  blob(img, 950, 130, 400, hexRgb(theme.blobs[0]), 0.6);
  blob(img, 200, 520, 430, hexRgb(theme.blobs[1]), 0.55);
  blob(img, 600, 290, 330, hexRgb(theme.blobs[2]), 0.5);

  /* bouquet */
  const CONE_APEX = [600, 396];
  const CONE_L = [468, 600];
  const CONE_R = [732, 600];
  const STEM_GREEN = [126, 198, 163];
  const STEM_GREEN2 = [94, 201, 163];
  const STEM_GREEN3 = [154, 230, 200];

  // leaves first (behind cone rim + flowers)
  ellipse(img, 566, 336, 22, 9, -0.55, STEM_GREEN3);
  ellipse(img, 660, 348, 24, 10, 0.5, STEM_GREEN2);
  ellipse(img, 520, 386, 20, 8, -0.35, STEM_GREEN);

  // stems
  segment(img, CONE_APEX[0], CONE_APEX[1], 600, 262, 5, STEM_GREEN);
  segment(img, CONE_APEX[0], CONE_APEX[1], 472, 316, 5, STEM_GREEN2);
  segment(img, CONE_APEX[0], CONE_APEX[1], 706, 284, 5, STEM_GREEN2);
  segment(img, CONE_APEX[0], CONE_APEX[1], 742, 372, 5, STEM_GREEN);
  segment(img, CONE_APEX[0], CONE_APEX[1], 456, 396, 5, STEM_GREEN);

  // paper cone (rim in theme color, cream fill)
  triangle(img, CONE_APEX[0], CONE_APEX[1] + 2, CONE_L[0], CONE_L[1], CONE_R[0], CONE_R[1], hexRgb(theme.coneRim), 1);
  triangle(img, CONE_APEX[0], CONE_APEX[1], CONE_L[0], CONE_L[1], CONE_R[0], CONE_R[1], [255, 253, 246], 1);

  // ribbon band + knot + bows
  const bandY = 546;
  const bandHalf = 15;
  const bandL = lerp(CONE_APEX[0], CONE_L[0], (bandY - CONE_APEX[1]) / (CONE_L[1] - CONE_APEX[1]));
  const bandR = lerp(CONE_APEX[0], CONE_R[0], (bandY - CONE_APEX[1]) / (CONE_R[1] - CONE_APEX[1]));
  triangle(img, bandL - 6, bandY - bandHalf, bandR + 6, bandY - bandHalf, 600, bandY - bandHalf - 22, hexRgb(theme.ribbon[0]), 1);
  triangle(img, bandL - 6, bandY + bandHalf, bandR + 6, bandY + bandHalf, 600, bandY + bandHalf + 22, hexRgb(theme.ribbon[1]), 1);
  circle(img, 600, bandY, 16, hexRgb(theme.ribbon[0]));
  circle(img, 600, bandY, 9, hexRgb(theme.ribbon[2]));
  circle(img, 574, bandY - 2, 18, hexRgb(theme.ribbon[0]), 0.95);
  circle(img, 626, bandY - 2, 18, hexRgb(theme.ribbon[0]), 0.95);
  circle(img, 574, bandY - 2, 8, hexRgb(theme.ribbon[2]), 0.7);
  circle(img, 626, bandY - 2, 8, hexRgb(theme.ribbon[2]), 0.7);

  /* flowers */
  // rose (center)
  circle(img, 600, 198, 62, hexRgb(theme.rose[0]));
  circle(img, 600, 198, 48, hexRgb(theme.rose[1]));
  circle(img, 600, 198, 30, hexRgb(theme.rose[2]));
  circle(img, 589, 187, 12, hexRgb(theme.rose[3]), 0.85);

  // tulip (left)
  ellipse(img, 472, 268, 34, 48, 0, hexRgb(theme.tulip[0]));
  ellipse(img, 472, 276, 20, 30, 0, hexRgb(theme.tulip[1]));

  // daisy (upper right)
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    ellipse(img, 706 + Math.cos(a) * 33, 252 + Math.sin(a) * 33, 15, 30, a, [255, 255, 255]);
  }
  circle(img, 706, 252, 21, hexRgb(theme.daisyCenter[0]));
  circle(img, 706, 252, 10, hexRgb(theme.daisyCenter[1]));

  // sunflower (lower right)
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + 0.3;
    ellipse(img, 742 + Math.cos(a) * 36, 334 + Math.sin(a) * 36, 14, 32, a, hexRgb(theme.sunflower[0]));
  }
  circle(img, 742, 334, 25, hexRgb(theme.sunflower[1]));
  circle(img, 742, 334, 14, hexRgb(theme.sunflower[2]));

  // lavender sprig (lower left)
  circle(img, 450, 340, 9, hexRgb(theme.lavender[0]));
  circle(img, 462, 344, 9, hexRgb(theme.lavender[1]));
  circle(img, 452, 354, 9, hexRgb(theme.lavender[0]));
  circle(img, 464, 358, 8, hexRgb(theme.lavender[2]));
  circle(img, 456, 368, 8, hexRgb(theme.lavender[1]));
  circle(img, 446, 362, 8, hexRgb(theme.lavender[2]));

  // baby's breath dots
  circle(img, 640, 300, 5, [255, 255, 255], 0.95);
  circle(img, 556, 330, 5, [255, 255, 255], 0.95);
  circle(img, 682, 368, 6, [255, 255, 255], 0.9);
  circle(img, 522, 402, 5, [255, 255, 255], 0.9);
  circle(img, 614, 352, 4, [255, 255, 255], 0.9);

  /* floating hearts & petals */
  heart(img, 170, 150, 30, hexRgb(theme.hearts[0]), 0.85);
  heart(img, 1016, 192, 22, hexRgb(theme.hearts[0]), 0.8);
  heart(img, 136, 430, 18, hexRgb(theme.hearts[1]), 0.75);
  heart(img, 1050, 462, 20, hexRgb(theme.hearts[2]), 0.8);
  heart(img, 960, 84, 14, hexRgb(theme.hearts[3]), 0.8);

  ellipse(img, 248, 306, 9, 15, 0.6, hexRgb(theme.petals[0]), 0.7);
  ellipse(img, 330, 236, 8, 14, -0.5, hexRgb(theme.petals[1]), 0.65);
  ellipse(img, 900, 300, 9, 15, -0.7, hexRgb(theme.petals[0]), 0.7);
  ellipse(img, 984, 246, 8, 13, 0.4, hexRgb(theme.petals[1]), 0.65);
  ellipse(img, 360, 470, 8, 14, 0.8, hexRgb(theme.petals[0]), 0.6);
  ellipse(img, 884, 424, 9, 15, -0.4, hexRgb(theme.petals[1]), 0.6);

  // sparkles
  circle(img, 206, 96, 4, hexRgb(theme.sparkle), 0.9);
  circle(img, 1002, 118, 5, hexRgb(theme.sparkle), 0.85);
  circle(img, 286, 420, 4, [255, 255, 255], 0.9);
  circle(img, 940, 390, 4, [255, 255, 255], 0.85);

  return encodePng(img);
}

/* ---------- write every theme ---------- */

mkdirSync("public", { recursive: true });
for (const [id, theme] of Object.entries(THEMES)) {
  const png = drawBanner(theme);
  const file = id === "blush" ? "og-banner.png" : `og-banner-${id}.png`;
  writeFileSync(`public/${file}`, png);
  console.log(`wrote public/${file} (${W}×${H}, ${(png.length / 1024).toFixed(1)} kB) — ${theme.label}`);
}
