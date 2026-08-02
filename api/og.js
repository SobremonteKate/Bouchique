/* =========================================================================
   BOUCHIQUE — /api/og  (Vercel serverless function)
   Renders a personalized Open Graph image: "flowers for you, [name]!"
   on the pastel banner, so the image itself is unique per shared link.
   Built with @vercel/og (Satori → PNG). Uses React.createElement so the
   file is plain JS — runnable locally via scripts/test-og.js.
   ========================================================================= */

import React from "react";
import { ImageResponse } from "@vercel/og";
import { resolveTheme } from "./themes.js";
import { bloom } from "./blooms.js";

const FONT_FAMILY = "Dancing Script";

/* Fetch Dancing Script (the site's script font) once and cache it, so warm
   instances skip the network on repeat renders. Falls back to the default
   font if Google Fonts is unreachable. */
let fontPromise = null;
function loadFont() {
  if (!fontPromise) {
    fontPromise = (async () => {
      try {
        // A curl-ish UA makes Google Fonts serve TTF — @vercel/og's font
        // parser (opentype.js) can't read the woff2 that modern UAs get.
        const css = await fetch(
          "https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap",
          { headers: { "user-agent": "curl/8.0" } }
        ).then((r) => r.text());
        const match = css.match(/url\((https:\/\/[^)]+\.ttf)\)/);
        if (!match) return null;
        return await fetch(match[1]).then((r) => r.arrayBuffer());
      } catch {
        return null;
      }
    })();
  }
  return fontPromise;
}

const el = React.createElement;

/* Blob layer (absolute, behind the text) */
function blob(style) {
  return el("div", {
    style: {
      position: "absolute",
      borderRadius: "50%",
      ...style,
    },
  });
}

export async function buildOgResponse(name, msg, wish) {
  const fontData = await loadFont();
  const theme = resolveTheme(wish);
  // code-point-safe truncation so an emoji in the name never gets split
  const cleanName = Array.from((name || "").trim().replace(/[<>"]/g, "")).slice(0, 18).join("");
  const displayName = cleanName || "you";
  const cleanMsg = Array.from((msg || "").trim()).slice(0, 90).join("");
  const nameSize = displayName.length > 10 ? 104 : 148;

  const inner = [
    el(
      "div",
      { style: { fontSize: 44, color: theme.subColor, fontWeight: 700, fontFamily: FONT_FAMILY } },
      "flowers for you,"
    ),
    el(
      "div",
      {
        style: {
          display: "flex",
          alignItems: "center",
          gap: 16,
          fontSize: nameSize,
          fontWeight: 800,
          color: theme.nameColor,
          fontFamily: FONT_FAMILY,
          lineHeight: 1.12,
          maxWidth: 1000,
        },
      },
      el("span", { style: { textShadow: `0 4px 18px ${theme.nameShadow}` } }, `${displayName}!`),
      bloom(theme.nameBloom, theme, Math.max(44, nameSize * 0.4), "name-bloom")
    ),
    cleanMsg
      ? el(
          "div",
          {
            style: {
              fontSize: 34,
              color: "#5b4a52",
              fontStyle: "italic",
              fontWeight: 600,
              marginTop: 8,
              maxWidth: 940,
              textAlign: "center",
              lineHeight: 1.4,
            },
          },
          `“${cleanMsg}”`
        )
      : null,
    el(
      "div",
      { style: { display: "flex", gap: 16, marginTop: 26, alignItems: "center" } },
      ...theme.blooms.map((t, i) => bloom(t, theme, 34, i))
    ),
  ];

  const element = el(
    "div",
    {
      style: {
        width: "100%",
        height: "100%",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        overflow: "hidden",
        background: theme.gradient,
      },
    },
    blob({ width: 500, height: 500, left: -160, top: -150, background: `radial-gradient(circle, ${theme.blobCss[0]} 0%, rgba(255,255,255,0) 70%)` }),
    blob({ width: 540, height: 540, right: -180, bottom: -170, background: `radial-gradient(circle, ${theme.blobCss[1]} 0%, rgba(255,255,255,0) 70%)` }),
    blob({ width: 360, height: 360, right: 200, top: -120, background: `radial-gradient(circle, ${theme.blobCss[2]} 0%, rgba(255,255,255,0) 70%)` }),
    ...inner
  );

  return new ImageResponse(element, {
    width: 1200,
    height: 630,
    fonts: fontData
      ? [{ name: FONT_FAMILY, data: fontData, weight: 700, style: "normal" }]
      : [],
    headers: { "cache-control": "public, max-age=0, s-maxage=86400" },
  });
}

export default async function handler(req) {
  // resolve relative req.url safely — never let URL parsing crash the function
  const base = `https://${req.headers?.get?.("host") || "bouchique.vercel.app"}`;
  const url = new URL(req.url, base);
  const { searchParams } = url;
  try {
    return await buildOgResponse(
      searchParams.get("name") || "",
      searchParams.get("msg") || "",
      searchParams.get("wish") || ""
    );
  } catch {
    // if rendering ever fails, fall back to the static banner so chat
    // previews never show a broken image
    return Response.redirect(`${url.origin}/og-banner.png`, 302);
  }
}
