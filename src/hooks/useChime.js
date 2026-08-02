import { useRef, useCallback } from "react";

/* Tiny WebAudio synth — no audio files needed. */
export function useChime() {
  const ctxRef = useRef(null);

  const ensureCtx = () => {
    if (!ctxRef.current) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) ctxRef.current = new AC();
    }
    if (ctxRef.current && ctxRef.current.state === "suspended") {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  };

  const note = useCallback((ctx, freq, t0, dur, vol = 0.12, type = "sine") => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }, []);

  const playChime = useCallback(
    (muted) => {
      if (muted) return;
      const ctx = ensureCtx();
      if (!ctx) return;
      const t = ctx.currentTime + 0.02;
      // soft ascending arpeggio (C5 E5 G5 C6)
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
        note(ctx, f, t + i * 0.11, 1.2, 0.09, "sine");
      });
    },
    [note]
  );

  const playPop = useCallback(
    (muted) => {
      if (muted) return;
      const ctx = ensureCtx();
      if (!ctx) return;
      const t = ctx.currentTime + 0.01;
      note(ctx, 740, t, 0.18, 0.08, "triangle");
      note(ctx, 987.77, t + 0.07, 0.22, 0.07, "triangle");
    },
    [note]
  );

  const playSwoosh = useCallback(
    (muted) => {
      if (muted) return;
      const ctx = ensureCtx();
      if (!ctx) return;
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(220, t);
      osc.frequency.exponentialRampToValueAtTime(660, t + 0.4);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.06, t + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.5);
    },
    []
  );

  return { playChime, playPop, playSwoosh };
}
