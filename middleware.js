/* =========================================================================
   BOUCHIQUE — Vercel Edge Middleware
   Social scrapers (Discord, WhatsApp, iMessage, Slack) fetch the page HTML
   without running JavaScript, so the static og:title in index.html can't
   show the recipient's name. This middleware intercepts shared links that
   carry ?name= and rewrites the Open Graph / Twitter tags server-side, so
   pasting a link in chat shows "flowers for you, [name]!".
   ========================================================================= */

const ESCAPE = (s) =>
  s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function patchTags(html, { title, description, url, image }) {
  return html
    .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${title}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${description}$2`)
    .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${url}$2`)
    .replace(/(<meta property="og:image" content=")[^"]*(")/, `$1${image}$2`)
    .replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${title}$2`)
    .replace(/(<meta name="twitter:description" content=")[^"]*(")/, `$1${description}$2`)
    .replace(/(<meta name="twitter:image" content=")[^"]*(")/, `$1${image}$2`);
}

export default async function middleware(request) {
  // prevent re-entry from the origin fetch below
  if (request.headers.get("x-bouchique-og")) return;

  // bail fast for assets and non-HTML fetches
  const accept = request.headers.get("accept") || "";
  if (!accept.includes("text/html")) return;

  const url = new URL(request.url);
  const name = (url.searchParams.get("name") || "").trim().slice(0, 40);
  if (!name) return; // not a shared link — serve the static page as-is

  const msg = (url.searchParams.get("msg") || "").trim().slice(0, 120);
  const wish = (url.searchParams.get("wish") || "").trim().slice(0, 40);
  const escapedName = ESCAPE(name);
  const escapedMsg = ESCAPE(msg);
  const title = `flowers for you, ${escapedName}!`;
  const description = msg
    ? `“${escapedMsg}” — a bouquet, grown just for you`
    : "a one-of-a-kind digital bouquet, grown just for you — open the link to see it bloom.";
  const shareUrl = ESCAPE(url.origin + url.pathname + url.search);
  // personalized OG image — the banner carries the name and matches the wish
  const image = ESCAPE(
    `${url.origin}/api/og?name=${encodeURIComponent(name)}${msg ? `&msg=${encodeURIComponent(msg)}` : ""}${wish ? `&wish=${encodeURIComponent(wish)}` : ""}`
  );

  try {
    // fetch the real index.html from the origin, then rewrite its meta tags.
    // the extra header stops any sub-request from re-entering this middleware.
    const res = await fetch(url.origin + "/", {
      headers: { "x-bouchique-og": "1", accept: "text/html" },
    });
    const html = await res.text();
    const patched = patchTags(html, { title, description, url: shareUrl, image });
    // personalized share links are gift URLs, not pages — keep them out of search
    const finalHtml = patched.replace(
      /<head[^>]*>/i,
      '<head>\n    <meta name="robots" content="noindex, nofollow" />'
    );
    return new Response(finalHtml, {
      status: res.status,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "public, max-age=0, s-maxage=300",
      },
    });
  } catch {
    // if anything fails, let the origin serve the static page unchanged
    return;
  }
}

export const config = {
  matcher: ["/"],
};
