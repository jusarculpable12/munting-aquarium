"use client";
import { useEffect, useRef, useState } from 'react';
import type { FeedingSound } from '../game/sound-effects';

const preferenceKey = 'munting-aquarium-sounds-v1';
export default function SoundEffects({ visible }: { visible: boolean }) {
  const [enabled, setEnabled] = useState(true);
  const [volume, setVolume] = useState(.5);
  const [ready, setReady] = useState(false);
  const [preview, setPreview] = useState('');
  const preferences = useRef({ enabled: true, volume: .5 });
  const play = useRef<(sound: FeedingSound) => boolean>(() => false);
  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(preferenceKey);
      if (raw) {
        const settings = JSON.parse(raw);
        if (typeof settings.enabled === 'boolean') setEnabled(settings.enabled);
        if (typeof settings.volume === 'number' && Number.isFinite(settings.volume)) setVolume(Math.max(0, Math.min(1, settings.volume)));
      }
    } catch { /* Session controls still work without browser storage. */ }
    setReady(true);
  }, []);
  useEffect(() => {
    preferences.current = { enabled, volume };
    if (ready) try { localStorage.setItem(preferenceKey, JSON.stringify({ enabled, volume })); } catch { /* Keep session preferences. */ }
  }, [enabled, volume, ready]);
  useEffect(() => {
    let context: AudioContext | null = null;
    let output: DynamicsCompressorNode | null = null;
    const voices = new Set<OscillatorNode>();
    const last = { 'pellet-drop': -Infinity, 'fish-eat': -Infinity };
    function unlock() {
      if (!preferences.current.enabled || preferences.current.volume === 0 || document.hidden) return;
      try {
        const Constructor = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Constructor) return;
        if (!context) {
          context = new Constructor();
          output = context.createDynamicsCompressor();
          output.threshold.value = -16; output.knee.value = 16; output.ratio.value = 5;
          output.attack.value = .005; output.release.value = .12;
          output.connect(context.destination);
        }
        if (context.state === 'suspended') void context.resume().catch(() => {});
      } catch { /* Sound support must never block gameplay. */ }
    }
    function tone(frequency: number, end: number, start: number, duration: number, level: number) {
      if (!context || !output || voices.size >= 8) return;
      const oscillator = context.createOscillator(), gain = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, start);
      oscillator.frequency.exponentialRampToValueAtTime(end, start + duration);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(level * preferences.current.volume, start + .012);
      gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
      oscillator.connect(gain); gain.connect(output);
      voices.add(oscillator);
      oscillator.onended = () => { voices.delete(oscillator); oscillator.disconnect(); gain.disconnect(); };
      oscillator.start(start); oscillator.stop(start + duration + .015);
    }
    play.current = sound => {
      if (document.hidden || !preferences.current.enabled || preferences.current.volume === 0) return false;
      unlock();
      if (!context || !output || context.state !== 'running') return false;
      const time = context.currentTime;
      if (time - last[sound] < (sound === 'pellet-drop' ? .035 : .07) || voices.size >= 6) return false;
      last[sound] = time;
      const variation = .97 + Math.random() * .06;
      if (sound === 'pellet-drop') tone(570 * variation, 210 * variation, time, .18, .24);
      else {
        tone(330 * variation, 410 * variation, time, .085, .17);
        tone(390 * variation, 265 * variation, time + .07, .105, .11);
      }
      return true;
    };
    function effect(event: Event) {
      const sound = (event as CustomEvent<FeedingSound>).detail;
      if (sound === 'pellet-drop' || sound === 'fish-eat') play.current(sound);
    }
    function visibility() {
      if (!document.hidden) return;
      for (const voice of voices) try { voice.stop(); } catch { /* Already ended. */ }
    }
    document.addEventListener('pointerdown', unlock, { capture: true, passive: true });
    document.addEventListener('keydown', unlock, true);
    document.addEventListener('aquarium-feeding-sound', effect);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      play.current = () => false;
      document.removeEventListener('pointerdown', unlock, true);
      document.removeEventListener('keydown', unlock, true);
      document.removeEventListener('aquarium-feeding-sound', effect);
      document.removeEventListener('visibilitychange', visibility);
      if (previewTimer.current) clearTimeout(previewTimer.current);
      if (context) void context.close().catch(() => {});
    };
  }, []);
  function testSounds() {
    const started = play.current('pellet-drop');
    setPreview(started ? 'Water drop, then a gentle nibble.' : 'Sound is not ready. Try Preview sounds again.');
    if (previewTimer.current) clearTimeout(previewTimer.current);
    previewTimer.current = setTimeout(() => play.current('fish-eat'), 300);
  }
  return <section className="music-settings" hidden={!visible} aria-label="Feeding sound effects">
    <h3>Sound effects</h3><p>Soft water drops & gentle fish nibbles</p>
    <button className="action" aria-pressed={enabled} onClick={() => setEnabled(value => !value)}>Sound effects {enabled ? 'on' : 'off'}</button>
    <label className="music-volume">Sound-effect volume <output>{Math.round(volume * 100)}%</output><input aria-label="Sound-effect volume" type="range" min="0" max="100" step="1" value={Math.round(volume * 100)} onChange={event => setVolume(Number(event.target.value) / 100)} /></label>
    <button className="action" disabled={!enabled || volume === 0} onClick={testSounds}>Preview sounds</button><p className="hint" role="status">{preview || 'Separate from music. Your sound preferences are remembered in this browser.'}</p>
  </section>;
}
