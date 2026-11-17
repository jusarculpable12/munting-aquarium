"use client";
import { useEffect, useRef, useState } from "react";

const preferenceKey = "munting-aquarium-music-v1";
const track = "/audio/lilim-at-simoy-audible.wav";
export default function BackgroundMusic({ visible }: { visible: boolean }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [enabled, setEnabled] = useState(true);
  const [volume, setVolume] = useState(.5);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(preferenceKey);
      if (raw) {
        const settings = JSON.parse(raw);
        if (typeof settings.enabled === "boolean") setEnabled(settings.enabled);
        if (typeof settings.volume === "number" && Number.isFinite(settings.volume)) setVolume(Math.max(0, Math.min(1, settings.volume)));
      }
    } catch { /* Music still works when preferences cannot be read. */ }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(preferenceKey, JSON.stringify({ enabled, volume })); } catch { /* Session controls remain usable. */ }
  }, [enabled, volume, ready]);
  useEffect(() => { if (audio.current) audio.current.volume = volume; }, [volume]);
  useEffect(() => {
    const element = audio.current;
    if (!element || !ready) return;
    const play = () => {
      if (!enabled || document.hidden || element.error || !element.paused) return;
      // Browsers may require a click/key before playback. Retry on that gesture.
      void element.play().catch(() => {});
    };
    const visibility = () => { if (document.hidden) element.pause(); else play(); };
    const pause = () => element.pause();
    if (enabled) play(); else pause();
    document.addEventListener("pointerdown", play, { capture: true, passive: true });
    document.addEventListener("keydown", play, true);
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("pagehide", pause);
    return () => {
      element.pause();
      document.removeEventListener("pointerdown", play, true);
      document.removeEventListener("keydown", play, true);
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("pagehide", pause);
    };
  }, [enabled, ready]);
  function toggle() {
    const element = audio.current;
    if (!element) return;
    if (playing) { setEnabled(false); element.pause(); }
    else {
      setEnabled(true); setFailed(false);
      if (element.error) element.load();
      element.volume = volume;
      void element.play().catch(() => setFailed(true));
    }
  }
  return <section className="music-settings" hidden={!visible} aria-label="Background music">
    <audio ref={audio} src={track} loop preload="none" onPlay={() => { setPlaying(true); setFailed(false); }} onPause={() => setPlaying(false)} onError={() => { setFailed(true); setPlaying(false); }} />
    <h3>Background music</h3><p>Lilim at Simoy <small>Soft countryside ambience</small></p>
    <button type="button" className="action" aria-pressed={playing} onClick={toggle}>{playing ? "Pause music" : "Play music"}</button>
    <label className="music-volume">Music volume <output>{Math.round(volume * 100)}%</output><input type="range" min="0" max="100" step="1" value={Math.round(volume * 100)} onChange={event => setVolume(Number(event.target.value) / 100)} /></label>
    <p className="hint" role="status">{failed ? "Music could not play. Press Play music to retry." : enabled && !playing ? "Music starts after a click or key press. It pauses when you leave this tab." : "Loops gently and pauses when you leave this tab. Your music preferences are remembered here."}</p>
  </section>;
}
