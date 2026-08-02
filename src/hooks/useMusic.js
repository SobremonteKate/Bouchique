import { useCallback, useEffect, useRef, useState } from "react";
import { parseMusicLink, resolveSpotifyShort } from "../utils/musicLinks";

/* ------------------------------------------------------------------
   BOUCHIQUE music — a soft music-box lullaby ("Twinkle, Twinkle,
   Little Star", public domain, in C major) generated live with
   WebAudio, plus optional custom songs:
     • uploaded files / direct audio links  → <audio> element
     • spotify / youtube links              → official embed player
       (the dock renders it; this hook only gates the lullaby + <audio>)
   ------------------------------------------------------------------ */

const BEAT = 0.42; // one eighth-note — a gentle, unhurried lullaby pace
// "Twinkle, Twinkle, Little Star" as [freq, beats] pairs — the final note
// of each phrase holds for 2 beats so it breathes instead of rushing.
const MELODY = [
  [261.63, 1], [261.63, 1], [392.0, 1], [392.0, 1], [440.0, 1], [440.0, 1], [392.0, 2], // twinkle twinkle little star
  [349.23, 1], [349.23, 1], [329.63, 1], [329.63, 1], [293.66, 1], [293.66, 1], [261.63, 2], // how I wonder what you are
  [392.0, 1], [392.0, 1], [349.23, 1], [349.23, 1], [329.63, 1], [329.63, 1], [293.66, 2], // up above the world so high
  [392.0, 1], [392.0, 1], [349.23, 1], [349.23, 1], [329.63, 1], [329.63, 1], [293.66, 2], // like a diamond in the sky
  [261.63, 1], [261.63, 1], [392.0, 1], [392.0, 1], [440.0, 1], [440.0, 1], [392.0, 2], // twinkle twinkle little star
  [349.23, 1], [349.23, 1], [329.63, 1], [329.63, 1], [293.66, 1], [293.66, 1], [261.63, 2], // how I wonder what you are
];
const NOTES_PER_PHRASE = 7;
// one soft root note per phrase (C · F · G · G · C · F)
const BASS = [130.81, 174.61, 196.0, 196.0, 130.81, 174.61];

/* Each preset wish gets its own little mood — the same Twinkle melody
   transposed by `semitones` and played at its own `beat` pace, so a
   goodnight bouquet sounds lower & slower while a good-morning one
   sounds brighter & brisker. Unknown wishes fall back to the default. */
const WISH_MOODS = {
  "Goodnight": { semitones: -3, beat: 0.52 }, // low & sleepy
  "Good morning": { semitones: 2, beat: 0.36 }, // bright & fresh
  "Birthday": { semitones: 4, beat: 0.38 }, // a touch celebratory
  "Valentine": { semitones: 0, beat: 0.42 }, // the classic
  "Girlfriends Day": { semitones: 0, beat: 0.42 },
  "Just because": { semitones: 0, beat: 0.44 },
  "Thinking of you": { semitones: -2, beat: 0.46 }, // soft & wistful
  "Miss you": { semitones: -2, beat: 0.48 },
};
const DEFAULT_MOOD = { semitones: 0, beat: BEAT };
const getMood = (wish) => WISH_MOODS[wish] || DEFAULT_MOOD;
const MAX_PERSIST_BYTES = 2_000_000; // keep uploaded songs in storage only if small enough (~2.7MB base64, safe under the ~5MB quota)
const STORE_KEY = "bouchique.music.v1";

function loadPrefs(queryMusic) {
  let prefs = { on: false, volume: 0.6, track: null };
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) prefs = { ...prefs, ...JSON.parse(raw) };
  } catch {
    /* storage unavailable — start fresh */
  }
  prefs.on = false; // never restore `on` — autoplay needs a user gesture anyway
  if (queryMusic) {
    const parsed = parseMusicLink(queryMusic);
    prefs.track = {
      name: "your song",
      src: queryMusic,
      remote: true,
      persistable: true,
      kind: parsed.kind === "unknown" ? "audio" : parsed.kind,
    };
  }
  return prefs;
}

export function useMusic(queryMusic, muted, wish) {
  const [initial] = useState(() => loadPrefs(queryMusic));
  const [on, setOn] = useState(initial.on);
  const [volume, setVolumeState] = useState(initial.volume);
  const [customTrack, setCustomTrackState] = useState(initial.track);
  const [warning, setWarning] = useState(null);

  const ctxRef = useRef(null);
  const timerRef = useRef(null);
  const audioRef = useRef(null);
  const volRef = useRef(volume);
  const userStoppedRef = useRef(false);
  // the wish's mood (key + pace) — read live by the scheduler, restarted
  // below whenever the wish changes so the tune shifts in real time
  const moodRef = useRef(getMood(wish));

  const playing = on && !muted;

  /* ---------------- sound engine ---------------- */

  const ensureCtx = useCallback(() => {
    if (!ctxRef.current) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) ctxRef.current = new AC();
    }
    if (ctxRef.current && ctxRef.current.state === "suspended") {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  // gentle music-box chime: a pure sine plus a quiet octave shimmer — all
  // harmonic partials (no eerie inharmonic overtones), with a soft rounded
  // attack so it stays sweet instead of plucky
  const chime = useCallback((ctx, freq, t, dur, vol) => {
    const v = Math.max(vol, 0.0001); // exponential ramps can't target 0
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + 0.045);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.4);

    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;

    const shimmer = ctx.createOscillator();
    shimmer.type = "sine";
    shimmer.frequency.value = freq * 2; // octave shimmer — warm, not eerie
    const sg = ctx.createGain();
    sg.gain.value = 0.3;

    osc.connect(g);
    shimmer.connect(sg).connect(g);
    g.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.4);
    shimmer.start(t);
    shimmer.stop(t + dur + 0.4);
  }, []);

  // lookahead scheduler so the lullaby loops seamlessly. The wish's mood
  // sets the transposition (2^(semis/12)) and the beat pace, so the tune
  // is the same sweet melody in a different key and tempo.
  const startMelody = useCallback(() => {
    const ctx = ensureCtx();
    if (!ctx) return;
    if (timerRef.current) clearInterval(timerRef.current);
    const { semitones, beat } = moodRef.current;
    const transpose = Math.pow(2, semitones / 12);
    let next = ctx.currentTime + 0.08;
    let step = 0;
    timerRef.current = setInterval(() => {
      const ahead = ctx.currentTime + 0.35;
      while (next < ahead) {
        const idx = step % MELODY.length;
        const [baseFreq, beats] = MELODY[idx];
        const freq = baseFreq * transpose;
        const dur = beat * beats;
        chime(ctx, freq, next, dur, volRef.current * 0.3);
        // one soft bass root at the start of each phrase (transposed too)
        if (idx % NOTES_PER_PHRASE === 0) {
          const phrase = Math.floor(idx / NOTES_PER_PHRASE) % BASS.length;
          chime(ctx, BASS[phrase] * transpose, next, beat * 8, volRef.current * 0.16);
        }
        next += dur;
        step += 1;
      }
    }, 80);
  }, [chime, ensureCtx]);

  const stopAll = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (audioRef.current) audioRef.current.pause();
  }, []);

  // when the chosen wish changes while the lullaby is playing, restart it
  // in the new key & pace so the music feels personalized like the bouquet
  useEffect(() => {
    const next = getMood(wish);
    const changed =
      next.semitones !== moodRef.current.semitones || next.beat !== moodRef.current.beat;
    moodRef.current = next;
    if (changed && playing && !customTrack) {
      stopAll();
      startMelody();
    }
  }, [wish, playing, customTrack, stopAll, startMelody]);

  /* keep melody / custom song in sync with play state. Spotify & YouTube
     tracks are played by their embed player (rendered in the dock), so the
     <audio> element and the lullaby scheduler must leave them alone. */
  useEffect(() => {
    stopAll();
    if (!playing) return;
    const isEmbed = customTrack && (customTrack.kind === "youtube" || customTrack.kind === "spotify");
    if (customTrack && !isEmbed) {
      const aud = audioRef.current;
      if (aud) {
        if (aud.src !== customTrack.src) aud.src = customTrack.src;
        aud.volume = volRef.current;
        aud.play().catch(() => {});
      }
    } else if (!customTrack) {
      startMelody();
    }
  }, [playing, customTrack, startMelody, stopAll]);

  useEffect(() => {
    volRef.current = volume;
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  /* remember volume + song between visits — never the `on` state, because
     autoplay is blocked without a gesture and a restored `on` would leave a
     silent "playing" AudioContext ticking until the user toggles. */
  useEffect(() => {
    try {
      let track = null;
      if (customTrack && (customTrack.remote || customTrack.persistable)) {
        track = {
          name: customTrack.name,
          src: customTrack.src,
          remote: customTrack.remote,
          persistable: true,
          kind: customTrack.kind,
        };
      }
      localStorage.setItem(STORE_KEY, JSON.stringify({ on: false, volume, track }));
    } catch {
      /* storage full or blocked — skip silently */
    }
  }, [volume, customTrack]);

  /* tidy up on unmount */
  useEffect(
    () => () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (ctxRef.current) ctxRef.current.close().catch(() => {});
    },
    []
  );

  /* ---------------- controls ---------------- */

  const toggleMusic = useCallback(() => {
    userStoppedRef.current = true; // once the user touches it, they're in charge
    setOn((o) => !o);
  }, []);

  // gentle auto-start (called from a user gesture); never fights an explicit "off"
  const startMusic = useCallback(() => {
    if (userStoppedRef.current) return;
    setOn(true);
  }, []);

  const setVolume = useCallback((v) => setVolumeState(v), []);

  const setCustomFromFile = useCallback((file) => {
    const reader = new FileReader();
    reader.onload = () => {
      const persistable = file.size <= MAX_PERSIST_BYTES;
      setCustomTrackState({
        name: file.name,
        src: reader.result,
        remote: false,
        persistable,
      });
      setWarning(
        persistable
          ? null
          : "that song is too big to remember between visits — it'll play this visit only"
      );
    };
    reader.readAsDataURL(file);
  }, []);

  const setCustomFromUrl = useCallback(async (rawUrl) => {
    const url = String(rawUrl || "").trim();
    if (!/^https?:\/\//i.test(url)) {
      setWarning("that doesn't look like a link to a song");
      return;
    }
    const parsed = parseMusicLink(url);

    // spotify.link short links need resolving before they can be embedded
    if (parsed.kind === "spotify" && parsed.short) {
      const resolved = await resolveSpotifyShort(url);
      if (resolved) {
        setCustomTrackState({
          name: "a spotify song",
          src: `https://open.spotify.com/${resolved.type}/${resolved.id}`,
          remote: true,
          persistable: true,
          kind: "spotify",
        });
        setWarning(null);
        return;
      }
      setWarning("couldn't open that spotify link — try the track or playlist page link");
      return;
    }

    const kind = parsed.kind === "unknown" ? "audio" : parsed.kind;
    setCustomTrackState({
      name:
        kind === "youtube"
          ? "a song from youtube"
          : kind === "spotify"
            ? "a song from spotify"
            : url.split("/").filter(Boolean).pop() || "your song",
      src: url,
      remote: true,
      persistable: true,
      kind,
    });
    setWarning(null);
  }, []);

  const clearCustom = useCallback(() => {
    setCustomTrackState(null);
    setWarning(null);
  }, []);

  return {
    audioRef,
    playing,
    volume,
    customTrack,
    warning,
    toggleMusic,
    startMusic,
    setVolume,
    setCustomFromFile,
    setCustomFromUrl,
    clearCustom,
  };
}
