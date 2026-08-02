import { useCallback, useEffect, useRef, useState } from "react";
import MusicNoteIcon from "./MusicNoteIcon";
import { HeartLetterIcon, NoteIcon, PlayIcon, PauseIcon, BackIcon, UploadIcon } from "./HandDrawnIcons";
import {
  parseMusicLink,
  youtubeEmbedUrl,
  spotifyEmbedUrl,
} from "../utils/musicLinks";

/* Floating music dock — built-in lullaby, an uploaded / linked song played
   through <audio>, or a Spotify / YouTube link rendered as its official
   embed player. YouTube embeds are driven through the IFrame postMessage
   bridge so the dock's play / pause / volume / mute controls work on them. */
export default function MusicDock({
  audioRef,
  playing,
  volume,
  customTrack,
  warning,
  muted,
  toggleMusic,
  setVolume,
  setCustomFromFile,
  setCustomFromUrl,
  clearCustom,
  autoOpen = false,
}) {
  // open the panel right away when a song rides in on a shared link, so the
  // recipient sees it without hunting for the button
  const [open, setOpen] = useState(() => autoOpen && Boolean(customTrack));
  const [urlDraft, setUrlDraft] = useState("");
  const [audioError, setAudioError] = useState(false);
  const fileRef = useRef(null);
  const ytRef = useRef(null);
  // the src the player has announced ready for (null = none). Readiness is
  // derived — ytReadyFor must equal the current src — so switching tracks
  // implicitly resets it without setState-in-effect.
  const [ytReadyFor, setYtReadyFor] = useState(null);
  const [ytPlaying, setYtPlaying] = useState(false);

  const link = parseMusicLink(customTrack?.src || "");
  const isYoutube = Boolean(customTrack && link.kind === "youtube" && link.videoId);
  const isSpotify = Boolean(
    customTrack && link.kind === "spotify" && link.spotifyType && link.spotifyId
  );
  const ytReady = isYoutube && ytReadyFor === customTrack?.src;

  // close the panel with Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  /* ---- YouTube IFrame postMessage bridge ---- */

  const ytCommand = useCallback((func, args = []) => {
    const w = ytRef.current && ytRef.current.contentWindow;
    if (w) w.postMessage(JSON.stringify({ event: "command", func, args }), "*");
  }, []);

  useEffect(() => {
    if (!isYoutube) return;
    const onMsg = (e) => {
      if (!ytRef.current || e.source !== ytRef.current.contentWindow) return;
      if (e.origin !== "https://www.youtube-nocookie.com") return;
      const d = e.data;
      if (!d || typeof d !== "object") return;
      if (d.event === "onReady") setYtReadyFor(customTrack?.src ?? null);
      else if (d.event === "onStateChange") setYtPlaying(d.info === 1 || d.info === 3);
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [isYoutube, customTrack?.src]);

  // keep the video in step with the dock: play state, mute, volume
  useEffect(() => {
    if (!isYoutube || !ytReady) return;
    ytCommand(playing ? "playVideo" : "pauseVideo");
  }, [playing, isYoutube, ytReady, ytCommand]);

  useEffect(() => {
    if (!isYoutube || !ytReady) return;
    ytCommand(muted ? "muteVideo" : "unMuteVideo");
  }, [muted, isYoutube, ytReady, ytCommand]);

  useEffect(() => {
    if (!isYoutube || !ytReady) return;
    ytCommand("setVolume", [Math.round(volume * 100)]);
  }, [volume, isYoutube, ytReady, ytCommand]);

  const onFile = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) setCustomFromFile(file);
    e.target.value = "";
    setAudioError(false);
  };

  const onSubmitUrl = (e) => {
    e.preventDefault();
    setCustomFromUrl(urlDraft.trim());
    setAudioError(false);
    setUrlDraft("");
  };

  return (
    <div className="music-dock">
      <audio ref={audioRef} loop preload="auto" onError={() => setAudioError(true)} />

      {open && (
        <div className="music-panel" role="dialog" aria-label="Music">
          <p className="music-title">
            <NoteIcon size={18} color="#e76f8e" /> music for you
          </p>

          {isSpotify && (
            <>
              <div className="music-embed spotify">
                <iframe
                  src={spotifyEmbedUrl(link)}
                  title="Spotify player"
                  loading="lazy"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                />
              </div>
              <p className="music-embed-hint">
                <PlayIcon size={12} /> tap play in the widget — spotify previews ~30s without an account
              </p>
            </>
          )}

          {isYoutube && (
            <div className="music-embed youtube">
              <iframe
                ref={ytRef}
                src={youtubeEmbedUrl(link)}
                title="YouTube player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          )}

          {!isSpotify && (
            <button className="pill-btn primary small music-play" onClick={toggleMusic}>
              {isYoutube ? (ytPlaying ? (<><PauseIcon size={14} /> pause</>) : (<><PlayIcon size={14} /> play</>)) : playing ? (<><PauseIcon size={14} /> pause</>) : (<><PlayIcon size={14} /> play</>)}
            </button>
          )}

          {!isSpotify && (
            <label className="music-vol">
              <span>volume</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.02"
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
              />
            </label>
          )}

          <p className="now-playing" title={customTrack?.name}>
            {customTrack ? customTrack.name : "the bouchique lullaby"}
          </p>

          {customTrack && (
            <button
              className="link-btn music-clear"
              onClick={() => {
                clearCustom();
                setAudioError(false);
              }}
            >
              <BackIcon size={14} /> back to the lullaby
            </button>
          )}

          <div className="music-divider" />

          <p className="music-hint">make it yours — upload a song or paste a link to one:</p>

          <input ref={fileRef} type="file" accept="audio/*" hidden onChange={onFile} />
          <button className="pill-btn soft small" onClick={() => fileRef.current && fileRef.current.click()}>
            <UploadIcon size={14} /> upload a song
          </button>

          <form className="music-url" onSubmit={onSubmitUrl}>
            <input
              className="text-input"
              value={urlDraft}
              onChange={(e) => setUrlDraft(e.target.value)}
              placeholder="…or paste a link (mp3 · spotify · youtube)"
              aria-label="Song link"
            />
            <button className="pill-btn primary small" type="submit">
              use
            </button>
          </form>

          {customTrack?.remote && (
            <p className="music-tip">
              <HeartLetterIcon size={13} color="#e76f8e" /> this song rides along in the share link!
            </p>
          )}
          {customTrack && !customTrack.remote && (
            <p className="music-tip">uploaded songs stay on this device — paste a link to share it</p>
          )}
          {warning && <p className="music-warn">{warning}</p>}
          {audioError && <p className="music-warn">hmm, that song wouldn't play — try a spotify / youtube link or an mp3</p>}
        </div>
      )}

      <button
        className={`music-fab${playing ? " playing" : ""}`}
        onClick={() => setOpen((o) => !o)}
        aria-label={playing ? "Music is playing" : "Open music"}
        aria-expanded={open}
      >
        <MusicNoteIcon playing={playing} />
      </button>
    </div>
  );
}
