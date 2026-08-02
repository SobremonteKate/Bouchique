/* =========================================================================
   BOUCHIQUE — music link helpers
   Recognizes Spotify / YouTube (incl. YouTube Music, shorts, live, youtu.be)
   and direct audio-file links, and builds the official embed URLs that the
   music dock renders. A plain <audio> element can't play Spotify or YouTube
   pages, so we hand those to their embed players instead.
   ========================================================================= */

/* YouTube video ids are 11 chars of [A-Za-z0-9_-]; be a bit lenient (6+) */
const ID_RE = "[A-Za-z0-9_-]{6,}";

const YT_HOSTS = new Set([
  "youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtu.be",
]);

const SPOTIFY_HOSTS = new Set([
  "spotify.com",
  "open.spotify.com",
  "play.spotify.com",
  "spotify.link",
]);

const SPOTIFY_TYPES = ["track", "album", "playlist", "artist", "episode", "show"];

export function parseMusicLink(raw) {
  const input = String(raw || "").trim();
  if (!/^https?:\/\//i.test(input)) return { kind: "unknown" };

  let u;
  try {
    u = new URL(input);
  } catch {
    return { kind: "unknown" };
  }
  const host = u.hostname.toLowerCase().replace(/^www\./, "");

  /* ---- YouTube ---- */
  if (YT_HOSTS.has(host)) {
    const videoId =
      u.searchParams.get("v") || pathToVideoId(u.pathname) || null;
    const playlistId = u.searchParams.get("list") || null;
    const start = parseStart(u.searchParams.get("t") || u.searchParams.get("start"));
    if (videoId || playlistId) return { kind: "youtube", videoId, playlistId, start };
    return { kind: "unknown" };
  }

  /* ---- Spotify ---- */
  if (SPOTIFY_HOSTS.has(host)) {
    // spotify.link short links need resolving via the oEmbed API
    if (host === "spotify.link") return { kind: "spotify", short: input };
    const m = u.pathname.match(
      new RegExp(`^/(?:intl-[^/]+/)?(?:embed/)?(${SPOTIFY_TYPES.join("|")})/([A-Za-z0-9]+)`)
    );
    if (m) return { kind: "spotify", spotifyType: m[1], spotifyId: m[2] };
    return { kind: "unknown" };
  }

  /* ---- anything else: try it as a direct audio file ---- */
  return { kind: "audio", url: input };
}

function pathToVideoId(pathname) {
  const known = pathname.match(new RegExp(`^/(?:shorts|embed|live|v|watch)/(${ID_RE})`));
  if (known) return known[1];
  const bare = pathname.match(new RegExp(`^/(${ID_RE})$`)); // youtu.be/<id>
  return bare ? bare[1] : null;
}

/* "1m30s", "90", "1:30", "1:02:03" → seconds (YouTube share t= formats) */
function parseStart(raw) {
  if (!raw) return null;
  const s = String(raw).trim();
  const clock = s.match(/^(?:(\d+):)?(\d{1,2}):(\d{1,2})$/);
  if (clock) return (Number(clock[1]) || 0) * 3600 + Number(clock[2]) * 60 + Number(clock[3]);
  const parts = s.match(/^(?:(\d+)h)?\s*(?:(\d+)m)?\s*(?:(\d+)s)?$/i);
  if (parts && (parts[1] || parts[2] || parts[3])) {
    return (Number(parts[1]) || 0) * 3600 + (Number(parts[2]) || 0) * 60 + (Number(parts[3]) || 0);
  }
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : null;
}

/* Official YouTube embed (privacy-enhanced domain). enablejsapi=1 lets the
   dock control play/pause/mute/volume via postMessage. */
export function youtubeEmbedUrl(p) {
  const q = new URLSearchParams();
  q.set("playsinline", "1");
  q.set("rel", "0");
  q.set("enablejsapi", "1");
  if (typeof window !== "undefined" && window.location.origin) {
    q.set("origin", window.location.origin); // the player only trusts this parent
  }
  if (p.start) q.set("start", String(p.start));
  if (p.playlistId) {
    q.set("list", p.playlistId);
    if (!p.videoId) {
      // a pure playlist link (e.g. youtube.com/playlist?list=…) plays as a series
      return `https://www.youtube-nocookie.com/embed/videoseries?${q.toString()}`;
    }
  }
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(p.videoId)}?${q.toString()}`;
}

export function spotifyEmbedUrl(p) {
  return `https://open.spotify.com/embed/${p.spotifyType}/${encodeURIComponent(p.spotifyId)}`;
}

/* Resolve a spotify.link short link to its canonical open.spotify.com
   track/playlist/… via Spotify's public oEmbed endpoint. Returns null if it
   can't be resolved (network blocked, bad link). */
export async function resolveSpotifyShort(url) {
  try {
    const res = await fetch(
      `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`,
      { headers: { accept: "application/json" } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const m = String(data.html || "").match(
      new RegExp(`open\\.spotify\\.com\\/embed\\/(${SPOTIFY_TYPES.join("|")})\\/([A-Za-z0-9]+)`)
    );
    return m ? { type: m[1], id: m[2] } : null;
  } catch {
    return null;
  }
}
