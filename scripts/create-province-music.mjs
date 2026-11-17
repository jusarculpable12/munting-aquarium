import fs from 'node:fs';
import path from 'node:path';

// Original composition: Hapon sa Probinsya. Soft chiptune in a lilting 3/4.
// Run: node scripts/create-province-music.mjs
const rate = 22050, bpm = 80, beat = 60 / bpm, bars = 32;
const duration = bars * 3 * beat, length = Math.round(duration * rate);
const left = new Float64Array(length), right = new Float64Array(length);
const hz = note => 440 * 2 ** ((note - 69) / 12);
const wrap = i => ((i % length) + length) % length;
const triangle = phase => (Math.sin(phase) - Math.sin(3 * phase) / 9 + Math.sin(5 * phase) / 25) / 1.151;
const pulse = phase => (Math.sin(phase) + Math.sin(3 * phase) / 3 + Math.sin(5 * phase) / 5 + Math.sin(7 * phase) / 7) / 1.676;
function note(midi, start, seconds, volume, voice = 'pluck', pan = 0) {
  const frequency = hz(midi), count = Math.ceil(seconds * rate);
  const lg = Math.sqrt((1 - pan) / 2), rg = Math.sqrt((1 + pan) / 2);
  const begin = Math.round(start * rate);
  for (let i = 0; i < count; i++) {
    const t = i / rate, phase = 2 * Math.PI * frequency * t;
    const attack = Math.min(1, t / .018), release = Math.min(1, (seconds - t) / .1);
    let sound;
    if (voice === 'lead') sound = (.79 * triangle(phase + .012 * Math.sin(2 * Math.PI * 4 * t)) + .21 * pulse(phase)) * Math.exp(-t * 1.8);
    else if (voice === 'bass') sound = (.8 * Math.sin(phase) + .2 * triangle(phase)) * Math.exp(-t * 2.2);
    else if (voice === 'bell') sound = (.8 * Math.sin(phase) + .2 * Math.sin(phase * 2)) * Math.exp(-t * 5);
    else sound = (.78 * triangle(phase) + .22 * Math.sin(phase * 2)) * Math.exp(-t * 5.5);
    const value = sound * attack * Math.max(0, release) * volume;
    const index = wrap(begin + i); left[index] += value * lg; right[index] += value * rg;
    if (voice !== 'bass') {
      // Wrapped, quiet echoes preserve the loop tail at the start of the file.
      const echo = wrap(begin + i + Math.round(beat * .75 * rate));
      left[echo] += value * rg * .13; right[echo] += value * lg * .13;
      const echo2 = wrap(begin + i + Math.round(beat * 1.5 * rate));
      left[echo2] += value * lg * .045; right[echo2] += value * rg * .045;
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
  note(chord[0], start, beat * 1.8, .105, 'bass', -.04);
  note(chord[0] + 7, start + beat * 2, beat * .75, .045, 'bass', .04);
  for (let n = 0; n < 6; n++) {
    const pitch = chord[1 + [0, 2, 1, 3, 2, 1][n]];
    note(pitch, start + n * beat / 2, beat * .68, .045 * (n % 2 ? .85 : 1), 'pluck', n % 2 ? .36 : -.36);
  }
  for (const [pitch, offset, held] of phrases[bar % 16]) {
    const variation = bar >= 16 && bar % 8 < 4 ? -12 : 0;
    note(pitch + variation, start + offset * beat, held * beat, .09, 'lead', -.08);
  }
  if (bar % 4 === 0) note(chord[4] + 12, start + beat * 1.5, beat * 1.4, .023, 'bell', .5);
  // Quiet woody off-beats, with no hiss or bright snare.
  for (const at of [1, 2]) note(91, start + at * beat, .075, .012, 'pluck', -.4);
}
// Gentle one-pole smoothing rounds the highest chip harmonics, including the loop seam.
for (const samples of [left, right]) {
  let previous = samples[length - 1];
  for (let pass = 0; pass < 2; pass++) for (let i = 0; i < length; i++) {
    previous += .62 * (samples[i] - previous);
    if (pass === 1) samples[i] = previous;
  }
}
let peak = 0, energy = 0;
for (let i = 0; i < length; i++) { peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i])); energy += left[i] ** 2 + right[i] ** 2; }
const gain = .58 / peak;
const wav = Buffer.alloc(44 + length * 4);
wav.write('RIFF', 0); wav.writeUInt32LE(wav.length - 8, 4); wav.write('WAVEfmt ', 8);
wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(2, 22);
wav.writeUInt32LE(rate, 24); wav.writeUInt32LE(rate * 4, 28); wav.writeUInt16LE(4, 32); wav.writeUInt16LE(16, 34);
wav.write('data', 36); wav.writeUInt32LE(length * 4, 40);
for (let i = 0; i < length; i++) { wav.writeInt16LE(Math.round(left[i] * gain * 32767), 44 + i * 4); wav.writeInt16LE(Math.round(right[i] * gain * 32767), 46 + i * 4); }
const output = path.resolve('public/audio/hapon-sa-probinsya.wav');
fs.mkdirSync(path.dirname(output), { recursive: true }); fs.writeFileSync(output, wav);
console.log(JSON.stringify({ output, durationSeconds: duration, bpm, peak: peak * gain, rms: Math.sqrt(energy / (length * 2)) * gain, bytes: wav.length }));
