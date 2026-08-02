import { useEffect, useMemo, useState } from "react";
import Bouquet from "./components/Bouquet";
import Petals from "./components/Petals";
import Confetti from "./components/Confetti";
import CursorHearts from "./components/CursorHearts";
import MusicDock from "./components/MusicDock";
import HeroFlowers from "./components/HeroFlowers";
import PresetDoodle from "./components/PresetDoodle";
import { BellIcon, BackIcon, HeartIcon, HeartLetterIcon, LinkIcon, PencilIcon, SparkleIcon, FlowerIcon } from "./components/HandDrawnIcons";
import { useChime } from "./hooks/useChime";
import { useMusic } from "./hooks/useMusic";
import { PRESET_MESSAGES, SIGN_OFFS, doodleFor } from "./data/messages";
import { resolveTheme } from "../api/themes.js";

function parseQuery() {
  const q = new URLSearchParams(window.location.search);
  return {
    name: q.get("name") || "",
    msg: q.get("msg") || "",
    from: q.get("from") || "",
    music: q.get("music") || "",
  };
}

export default function App() {
  const query = useMemo(() => parseQuery(), []); // read once — used for shared-link prefill

  const [name, setName] = useState(query.name || "");
  const [customMsg, setCustomMsg] = useState(query.msg || "");
  const [fromName, setFromName] = useState(query.from || "");
  const [preset, setPreset] = useState(null);            // chosen preset label
  const [useCustom, setUseCustom] = useState(Boolean(query.msg));
  const [generated, setGenerated] = useState(Boolean(query.name)); // bouquet screen visible
  const [seed, setSeed] = useState(() => (query.seed ? Math.floor(Number(query.seed)) || 0 : 0));
  const [noteOpen, setNoteOpen] = useState(false);
  const [burst, setBurst] = useState(() => (query.name ? 1 : 0)); // celebrate shared-link opens
  const [muted, setMuted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showIntro, setShowIntro] = useState(!query.name);

  const { playChime, playPop, playSwoosh } = useChime();

  // floating music dock — built-in lullaby (which shifts mood with the
  // chosen wish), or a song uploaded / linked
  const music = useMusic(query.music || "", muted, preset);

  const displayName = (name || "cutie").trim() || "cutie";

  // deterministic sign-off: stable per name/from so it never re-rolls on keystrokes
  const signOff = useMemo(() => {
    if (fromName.trim()) return `with love, ${fromName.trim()}`;
    const h = Array.from(displayName).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    return SIGN_OFFS[h % SIGN_OFFS.length];
  }, [fromName, displayName]);

  // palette for the chosen wish — drives the message doodles (same source
  // of truth as the OG banner themes)
  const theme = useMemo(() => resolveTheme(preset || ""), [preset]);



  const resolvedMsg = useMemo(() => {
    if (useCustom && customMsg.trim()) return customMsg.trim();
    if (preset) return PRESET_MESSAGES.find((p) => p.label === preset)?.text || "";
    return "";
  }, [useCustom, customMsg, preset]);

  const handleGenerate = () => {
    if (!resolvedMsg && !preset) {
      // pick a random cute message when nothing (or an empty textarea) is chosen
      const m = PRESET_MESSAGES[Math.floor(Math.random() * PRESET_MESSAGES.length)];
      setPreset(m.label);
      setUseCustom(false);
    }
    setSeed((s) => s + 1);
    setGenerated(true);
    setShowIntro(false);
    setNoteOpen(false);
    setBurst((b) => b + 1);
    playSwoosh(muted);
    setTimeout(() => playChime(muted), 320);
    if (!muted) music.startMusic(); // soft melody to welcome the bouquet
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAnother = () => {
    setSeed((s) => s + 1);
    setBurst((b) => b + 1);
    playPop(muted);
  };

  const handleShare = async () => {
    const url = new URL(window.location.href);
    url.search = "";
    url.searchParams.set("name", displayName);
    if (seed) url.searchParams.set("seed", String(seed));
    if (resolvedMsg) url.searchParams.set("msg", resolvedMsg);
    if (preset) url.searchParams.set("wish", preset); // banner palette matches the wish
    if (fromName.trim()) url.searchParams.set("from", fromName.trim());
    if (music.customTrack?.remote) url.searchParams.set("music", music.customTrack.src);
    try {
      await navigator.clipboard.writeText(url.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
      playPop(muted);
    } catch {
      window.prompt("Copy this link:", url.toString());
    }
  };

  const toggleMute = () => {
    setMuted((m) => !m);
  };

  // close the note with Escape
  useEffect(() => {
    if (!noteOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setNoteOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [noteOpen]);

  const backToIntro = () => {
    setGenerated(false);
    setShowIntro(true);
    setNoteOpen(false);
    playPop(muted);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="app">
      {/* soft gradient blobs */}
      <div className="blob blob-a" />
      <div className="blob blob-b" />
      <div className="blob blob-c" />

      <Petals count={generated ? 18 : 10} />
      <CursorHearts />
      {burst > 0 && <Confetti burst={burst} />}

      <MusicDock
        audioRef={music.audioRef}
        playing={music.playing}
        volume={music.volume}
        customTrack={music.customTrack}
        warning={music.warning}
        muted={muted}
        autoOpen={Boolean(query.music)}
        toggleMusic={music.toggleMusic}
        setVolume={music.setVolume}
        setCustomFromFile={music.setCustomFromFile}
        setCustomFromUrl={music.setCustomFromUrl}
        clearCustom={music.clearCustom}
      />

      {generated && !showIntro ? (
        /* ------------------------------------------------ BOUQUET */
        <main className="bouquet-view">
          <header className="top-bar">
            <button className="pill-btn soft" onClick={backToIntro} aria-label="Go back">
              <BackIcon size={15} /> change it
            </button>
            <button className="pill-btn soft mute" onClick={toggleMute} aria-label="Toggle sound">
              <BellIcon muted={muted} size={18} />
            </button>
          </header>

          <section className="scene" key={seed}>
            <div className="bouquet-wrap">
              <Bouquet seed={seed} />
            </div>
          </section>

          <section className="message-card">
            <div className="msg-heading">
              <span className="for-word">flowers for you,</span>
              <span className="name">{displayName}</span>
              <span className="exclaim">!</span>
            </div>
            {resolvedMsg && (
              <p className="msg-text">
                {resolvedMsg}{" "}
                {preset && <PresetDoodle type={doodleFor(preset)} theme={theme} />}
              </p>
            )}
            <p className="sign-off">— {signOff}</p>
          </section>

          <footer className="actions">
            <button className="pill-btn primary" onClick={handleAnother}>
              <SparkleIcon size={16} /> another bouquet
            </button>
            <button className="pill-btn primary" onClick={() => { setNoteOpen(true); playPop(muted); }}>
              <HeartLetterIcon size={16} /> open your note
            </button>
            <button className="pill-btn soft" onClick={handleShare}>
              {copied ? (<><HeartIcon size={15} /> copied!</>) : (<><LinkIcon size={15} /> share the link</>)}
            </button>
          </footer>
        </main>
      ) : (
        /* ------------------------------------------------ INTRO */
        <main className="intro-view">
          <section className="hero">
            <HeroFlowers onKiss={() => playPop(muted)} />
            <h1 className="title">
              <span className="title-main">Bouchique</span>
              <span className="title-sub">a bouquet, grown just for you</span>
            </h1>
          </section>

          <section className="card">
            <label className="field-label" htmlFor="name">whose name goes on it?</label>
            <input
              id="name"
              className="text-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="type their name…"
              maxLength={28}
              autoFocus
            />

            <div className="field-label row-label">
              <span>pick a wish</span>
              <button
                className={`link-btn${useCustom ? " active" : ""}`}
                onClick={() => { setUseCustom((v) => !v); playPop(muted); }}
              >
                {useCustom ? "use a preset instead" : (<><PencilIcon size={14} /> write my own</>)}
              </button>
            </div>

            {useCustom ? (
              <textarea
                className="text-input area"
                value={customMsg}
                onChange={(e) => setCustomMsg(e.target.value)}
                placeholder="e.g. happy girlfriends day, my everything. you make every day softer"
                rows={3}
                maxLength={160}
              />
            ) : (
              <div className="chips">
                {PRESET_MESSAGES.map((p) => (
                  <button
                    key={p.label}
                    className={`chip${preset === p.label ? " chosen" : ""}`}
                    onClick={() => { setPreset(p.label); playPop(muted); }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            )}

            <label className="field-label" htmlFor="from">from (optional)</label>
            <input
              id="from"
              className="text-input"
              value={fromName}
              onChange={(e) => setFromName(e.target.value)}
              placeholder="your name — or stay a mystery"
              maxLength={28}
            />

            <button className="grow-btn" onClick={handleGenerate}>
              <FlowerIcon size={22} /> grow their bouquet
            </button>

            <p className="preview">
              “flowers for you, <b>{displayName}</b>! {resolvedMsg || "a sweet surprise"}&nbsp;— {signOff}”
            </p>
          </section>

          <p className="footnote">every bouquet is one of a kind · made with <HeartIcon size={13} /></p>
        </main>
      )}

      {/* ------------------------------------------------ NOTE */}
      {noteOpen && (
        <div
          className="note-overlay"
          onClick={(e) => e.target === e.currentTarget && setNoteOpen(false)}
        >
          <div className="envelope" onClick={(e) => e.stopPropagation()}>
            <div className="env-flap" />
            <div className="env-body">
              <div className="letter">
                <span className="letter-seal"><HeartLetterIcon size={34} color="#e76f8e" /></span>
                <p className="letter-to">for {displayName}</p>
                <p className="letter-msg">
                  {resolvedMsg || "you make everything better."}{" "}
                  {preset && <PresetDoodle type={doodleFor(preset)} theme={theme} />}
                </p>
                <p className="letter-sign">— {signOff}</p>
                <div className="letter-actions">
                  <button className="pill-btn soft small" onClick={() => setNoteOpen(false)}>
                    close
                  </button>
                  <button className="pill-btn primary small" onClick={handleShare}>
                    {copied ? (<><HeartIcon size={13} /> copied!</>) : (<><LinkIcon size={13} /> share</>)}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
