import fs from 'node:fs';
import path from 'node:path';

// Original composition: Lilim at Simoy — soft synthesized piano arrangement.
// Run: node scripts/create-piano-music.mjs
const rate = 22050, bpm = 60, beat = 60 / bpm, bars = 32;
const duration = bars * 3 * beat, length = Math.round(duration * rate);
const left = new Float64Array(length), right = new Float64Array(length);
const hz = note => 440 * 2 ** ((note - 69) / 12);
const wrap = i => ((i % length) + length) % length;
// A felt-like piano model: decaying, slightly inharmonic strings and quiet unisons.
// This is synthesized piano, not a sampled acoustic instrument.
function note(midi, start, seconds, volume, voice = 'piano', pan = 0) {
  const frequency = hz(midi), count = Math.ceil(seconds * rate);
  const lg = Math.sqrt((1 - pan) / 2), rg = Math.sqrt((1 + pan) / 2);
  const begin = Math.round(start * rate);
  const harmonics = [1, .34, .13, .065, .032, .015];
  for (let i = 0; i < count; i++) {
    const t = i / rate;
    const attack = Math.sin(Math.min(1, t / .025) * Math.PI / 2) ** 2;
    const release = Math.sin(Math.min(1, (seconds - t) / .65) * Math.PI / 2) ** 2;
    let sound = 0;
    for (let h = 1; h <= harmonics.length; h++) {
      const partial = frequency * h * Math.sqrt(1 + .00008 * h * h);
      const decay = Math.exp(-t * (.48 + h * .22 + Math.max(0, midi - 60) * .009));
      const phase = 2 * Math.PI * partial * t;
      sound += harmonics[h - 1] * decay * (.8 * Math.sin(phase) + .2 * Math.sin(phase + 2 * Math.PI * .24 * t));
    }
    const value = sound * attack * Math.max(0, release) * volume;
    const index = wrap(begin + i); left[index] += value * lg; right[index] += value * rg;
    // Subtle room reflections; tails wrap so the background track can repeat.
    for (const [delay, level] of [[.073,.09],[.131,.07],[.211,.045],[.337,.026]]) {
      const echo = wrap(begin + i + Math.round(delay * rate));
      left[echo] += value * rg * level; right[echo] += value * lg * level;
    }
  }
}
const chords = [
  [48, 60, 64, 67, 74], [43, 59, 62, 67, 69],
  [45, 60, 64, 69, 71], [40, 59, 64, 67, 71],
  [41, 60, 65, 69, 74], [38, 60, 62, 65, 69],
  [43, 59, 62, 67, 69], [48, 60, 64, 67, 74],
];
// [pitch, onset in beats, duration in beats]. Restful space is intentional.
const phrases = [
  [[76,0,1],[79,1.25,.5],[81,2,.65]], [[79,0,1.4],[74,2,.7]],
  [[76,.25,.7],[72,1.25,.7],[76,2.25,.5]], [[74,0,1],[71,1.5,1]],
  [[72,0,.8],[77,1,.6],[81,2,.7]], [[79,.25,.7],[77,1.25,1.3]],
  [[74,0,.7],[76,1,.55],[74,2,.65]], [[72,0,2.4]],
  [[79,.25,.7],[76,1.25,.7],[74,2.25,.5]], [[71,0,1],[74,1.5,1]],
  [[72,0,.75],[76,1,.75],[79,2,.7]], [[76,0,1.5],[74,2,.7]],
  [[77,0,.75],[79,1,.75],[81,2,.7]], [[77,.25,1.15],[74,2,.65]],
  [[76,0,.75],[74,1,1.1]], [[72,0,2.35]],
];
for (let bar = 0; bar < bars; bar++) {
  const start = bar * 3 * beat, chord = chords[bar % chords.length];
  note(chord[0], start, beat * 4.5, .07, 'piano', -.25);
  for (let tone=1;tone<4;tone++) note(chord[tone], start + .035 * tone, beat * 3.8, .018, 'piano', (tone-2)*.2);

  for (let n = 0; n < 3; n++) {
    const pitch = chord[1 + [0, 2, 1, 3, 2, 1][n]];
    if (n > 0) note(pitch, start + n * beat + .012, beat * 2.5, .022, 'piano', .12);
  }
  for (const [pitch, offset, held] of phrases[bar % 16]) {
    const variation = -12;
    note(pitch + variation, start + offset * beat, (held + 1.25) * beat, .075, 'piano', .08);
  }
  // No bright bells, percussion or pulse-wave edges in this shaded version.
}
// Two gentle low-pass stages remove upper harmonics without a sharp attack.
for (const samples of [left, right]) {
  for (let stage = 0; stage < 2; stage++) {
    let previous = samples[length - 1];
    for (let pass = 0; pass < 2; pass++) for (let i = 0; i < length; i++) {
      previous += .42 * (samples[i] - previous);
      if (pass === 1) samples[i] = previous;
    }
  }
}
let peak = 0, energy = 0;
for (let i = 0; i < length; i++) { peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i])); energy += left[i] ** 2 + right[i] ** 2; }
const gain = .65 / peak;
const wav = Buffer.alloc(44 + length * 4);
wav.write('RIFF', 0); wav.writeUInt32LE(wav.length - 8, 4); wav.write('WAVEfmt ', 8);
wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(2, 22);
wav.writeUInt32LE(rate, 24); wav.writeUInt32LE(rate * 4, 28); wav.writeUInt16LE(4, 32); wav.writeUInt16LE(16, 34);
wav.write('data', 36); wav.writeUInt32LE(length * 4, 40);
for (let i = 0; i < length; i++) { wav.writeInt16LE(Math.round(left[i] * gain * 32767), 44 + i * 4); wav.writeInt16LE(Math.round(right[i] * gain * 32767), 46 + i * 4); }
const output = path.resolve('public/audio/lilim-at-simoy-piano.wav');
fs.mkdirSync(path.dirname(output), { recursive: true }); fs.writeFileSync(output, wav);
console.log(JSON.stringify({ output, durationSeconds: duration, bpm, peak: peak * gain, rms: Math.sqrt(energy / (length * 2)) * gain, bytes: wav.length }));
