/* =========================================================================
   BOUCHIQUE — /api/shorten  (Vercel serverless function)
   Best-effort URL shortener for share links. is.gd blocks browser CORS, so
   the frontend asks this same-origin function instead, which shortens
   server-side. Only shortens links for this site's own origin — never an
   open proxy. Falls back to the original URL on any failure.
   ========================================================================= */

export default async function handler(req) {
  const url = new URL(req.url);
  const target = url.searchParams.get("url") || "";
  try {
    const parsed = new URL(target);
    // only shorten our own share links — refuse to proxy arbitrary URLs
    if (parsed.origin !== url.origin) {
      return new Response(target, { headers: { "content-type": "text/plain" } });
    }
    const res = await fetch(
      `https://is.gd/create.php?format=simple&url=${encodeURIComponent(target)}`
    );
    if (res.ok) {
      const text = (await res.text()).trim();
      if (/^https?:\/\/is\.gd\/\S+$/.test(text)) {
        return new Response(text, { headers: { "content-type": "text/plain" } });
      }
    }
  } catch {
    /* is.gd unreachable — hand back the original URL */
  }
  return new Response(target, { headers: { "content-type": "text/plain" } });
}
