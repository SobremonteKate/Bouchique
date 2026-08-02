/* =========================================================================
   BOUCHIQUE — local end-to-end OG harness
   Serves dist/ statically and mounts the two Vercel pieces exactly as
   production would:
     - middleware.js  on "/"        (rewrites OG tags for ?name= links)
     - api/og.js      at /api/og    (personalized banner PNG)
   No dependencies — just node built-ins. Run the build first:
       npm run build && node scripts/serve-og.js [port]
   Then:
       curl "http://localhost:8787/api/og?name=Maya&wish=Goodnight"
       curl -H "Accept: text/html" "http://localhost:8787/?name=Maya&wish=Goodnight"
   ========================================================================= */

import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import ogHandler from "../api/og.js";
import middleware from "../middleware.js";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const DIST = join(ROOT, "dist");
const PORT = Number(process.argv[2] || 8787);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".json": "application/json",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
};

async function serveStatic(pathname) {
  const rel = pathname === "/" ? "/index.html" : pathname;
  const file = normalize(join(DIST, rel));
  if (!file.startsWith(DIST)) return new Response("forbidden", { status: 403 });
  try {
    return new Response(await readFile(file), {
      headers: { "content-type": MIME[extname(file)] || "application/octet-stream" },
    });
  } catch {
    return new Response("not found", { status: 404 });
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) headers.set(k, String(v));
  const request = new Request(url, { method: req.method, headers, body: null });

  let response;
  try {
    if (url.pathname.startsWith("/api/")) {
      response = await ogHandler(request);
    } else if (url.pathname === "/") {
      response = await middleware(request); // undefined → let origin serve
      if (!response) response = await serveStatic("/");
    } else {
      response = await serveStatic(url.pathname);
    }
  } catch (err) {
    response = new Response(String(err?.stack || err), {
      status: 500,
      headers: { "content-type": "text/plain" },
    });
  }

  res.writeHead(response.status, Object.fromEntries(response.headers));
  res.end(Buffer.from(await response.arrayBuffer()));
});

server.listen(PORT, () => {
  console.log(`Bouchique OG harness → http://localhost:${PORT}`);
  console.log(`  OG image : /api/og?name=Maya&wish=Goodnight`);
  console.log(`  Middleware: /?name=Maya&wish=Goodnight   (send Accept: text/html)`);
});
