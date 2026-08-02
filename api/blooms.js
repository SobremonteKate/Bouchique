/* =========================================================================
   BOUCHIQUE — hand-drawn blooms for the OG banner (Satori-safe)
   api/og.js renders these as SVG elements via @vercel/og, so the shared
   preview card carries the same hand-drawn flowers as the site instead of
   stock emojis. Each bloom draws in a 60×60 viewBox and takes its colors
   straight from the wish's theme palette.
   ========================================================================= */

import React from "react";

const el = React.createElement;

function svg(size, children, key) {
  return el(
    "svg",
    { key, width: size, height: size, viewBox: "-30 -30 60 60", style: { flex: "none" } },
    ...children
  );
}

function rose(theme, size, key) {
  return svg(size, [
    el("circle", { cx: 0, cy: 0, r: 19, fill: theme.rose[0] }),
    el("circle", { cx: 0, cy: 0, r: 14, fill: theme.rose[1] }),
    el("circle", { cx: 0, cy: 0, r: 8, fill: theme.rose[2] }),
    el("circle", { cx: -5, cy: -6, r: 3.4, fill: theme.rose[3], opacity: 0.85 }),
  ], key);
}

function tulip(theme, size, key) {
  return svg(size, [
    el("path", {
      d: "M -13 26 C -22 9 -16 -13 0 -26 C 16 -13 22 9 13 26 Z",
      fill: theme.tulip[0],
      stroke: theme.tulip[1],
      strokeWidth: 1.5,
      strokeLinejoin: "round",
    }),
    el("path", {
      d: "M -3 -20 C -6 -8 -6 6 -3 22",
      fill: "none",
      stroke: "#ffffff",
      strokeOpacity: 0.5,
      strokeWidth: 2.6,
      strokeLinecap: "round",
    }),
    el("path", {
      d: "M 2 -18 C 4 -6 5 8 2 22",
      fill: "none",
      stroke: theme.tulip[1],
      strokeOpacity: 0.65,
      strokeWidth: 1.5,
      strokeLinecap: "round",
    }),
  ], key);
}

function daisy(theme, size, key) {
  const petals = [];
  for (let i = 0; i < 10; i++) {
    petals.push(
      el("g", { key: i, transform: `rotate(${i * 36})` }, [
        el("ellipse", { cx: 0, cy: -15, rx: 5.6, ry: 13, fill: "#ffffff", stroke: "#f4c2d0", strokeWidth: 1 }),
      ])
    );
  }
  return svg(size, [
    ...petals,
    el("circle", { cx: 0, cy: 0, r: 7, fill: theme.daisyCenter[0] }),
    el("circle", { cx: 0, cy: 0, r: 3.4, fill: theme.daisyCenter[1] }),
  ], key);
}

function sunflower(theme, size, key) {
  const petals = [];
  for (let i = 0; i < 12; i++) {
    petals.push(
      el("g", { key: i, transform: `rotate(${i * 30})` }, [
        el("ellipse", { cx: 0, cy: -16, rx: 6, ry: 14, fill: theme.sunflower[0], stroke: "#e6a02c", strokeWidth: 0.8 }),
      ])
    );
  }
  const seeds = [];
  for (let ring = 0; ring < 2; ring++) {
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + ring;
      seeds.push(
        el("circle", {
          key: `${ring}-${i}`,
          cx: Math.cos(a) * (2.2 + ring * 2.8),
          cy: Math.sin(a) * (2.2 + ring * 2.8),
          r: 1.2,
          fill: theme.sunflower[2],
          opacity: 0.9,
        })
      );
    }
  }
  return svg(size, [
    ...petals,
    el("circle", { cx: 0, cy: 0, r: 8, fill: theme.sunflower[1] }),
    ...seeds,
  ], key);
}

function lavender(theme, size, key) {
  const buds = [];
  for (let i = 0; i < 6; i++) {
    buds.push(
      el("ellipse", {
        key: i,
        cx: (i % 2 === 0 ? 1 : -1) * (3.6 + i * 0.9),
        cy: -24 + i * 8,
        rx: 4.2,
        ry: 5.4,
        fill: theme.lavender[0],
        stroke: theme.lavender[2],
        strokeWidth: 0.8,
      })
    );
  }
  return svg(size, [
    el("rect", { x: -1.6, y: -26, width: 3.2, height: 52, rx: 1.6, fill: "#5aa469" }),
    ...buds,
    el("ellipse", { cx: 0, cy: -26, rx: 3.2, ry: 5.2, fill: theme.lavender[0], stroke: theme.lavender[2], strokeWidth: 0.8 }),
  ], key);
}

function poppy(theme, size, key) {
  const petals = [];
  for (let i = 0; i < 5; i++) {
    petals.push(
      el("path", {
        key: i,
        d: "M 0 -20 C 8 -26 18 -22 19 -13 C 20 -5 16 1 8 4 C 3 6 -3 6 -8 4 C -16 1 -20 -5 -19 -13 C -18 -22 -8 -26 0 -20 Z",
        transform: `rotate(${i * 72})`,
        fill: theme.rose[0],
        stroke: theme.rose[1],
        strokeWidth: 1.2,
      })
    );
  }
  return svg(size, [
    ...petals,
    el("circle", { cx: 0, cy: 0, r: 8, fill: theme.rose[2] }),
    el("circle", { cx: 0, cy: 0, r: 3, fill: "#2d1a11" }),
    el("circle", { cx: 5, cy: -2, r: 1.4, fill: "#ffd166" }),
  ], key);
}

/* one hand-drawn bloom, colored by the theme, sized to `size` px */
export function bloom(type, theme, size, key) {
  switch (type) {
    case "tulip": return tulip(theme, size, key);
    case "daisy": return daisy(theme, size, key);
    case "sunflower": return sunflower(theme, size, key);
    case "lavender": return lavender(theme, size, key);
    case "poppy": return poppy(theme, size, key);
    case "rose":
    default: return rose(theme, size, key);
  }
}
