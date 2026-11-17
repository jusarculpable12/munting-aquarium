import fs from 'node:fs';
import path from 'node:path';

// Original ambient composition: Siesta sa Lilim (96-second seamless loop).
// Soft synthesized felt-piano notes over slow, rounded string-like swells.
const rate = 22050, duration = 96, length = rate * duration;
const left = new Float64Array(length), right = new Float64Array(length);
const frequency = midi => 440 * 2 ** ((midi - 69) / 12);
const wrap = n => ((n % length) + length) % length;
const reflections = [[.173,.13],[.311,.1],[.479,.075],[.719,.055],[1.033,.04],[1.391,.025]];
function play(midi, start, seconds, level, type, pan) {
  const hz = frequency(midi), count = Math.ceil(seconds * rate), begin = Math.round(start * rate);
  const gl = Math.sqrt((1 - pan) / 2), gr = Math.sqrt((1 + pan) / 2);
  const offsets = reflections.map(([delay, gain]) => [Math.round(delay * rate), gain]);
  for (let i = 0; i < count; i++) {
    const t = i / rate, phase = 2 * Math.PI * hz * t;
    let value;
    if (type === 'swell') {
      // Multi-second onset and release: no struck or plucked edge.
      const envelope = Math.sin(Math.PI * t / seconds) ** 2;
      value = envelope * (.92 * Math.sin(phase) + .06 * Math.sin(phase * 1.0008) + .02 * Math.sin(phase * 2));
    } else {
      const attack = Math.sin(Math.min(1, t / .19) * Math.PI / 2) ** 2;
      const release = Math.sin(Math.min(1, (seconds - t) / 1.8) * Math.PI / 2) ** 2;
      // The fundamental rings; upper partials fade early, keeping the piano mellow.
      value = attack * release * (Math.sin(phase) * Math.exp(-t / 3.5) + .09 * Math.sin(phase * 2.0001) * Math.exp(-t / 1.5) + .012 * Math.sin(phase * 3.0003) * Math.exp(-t / .65));
    }
    value *= level;
    const at = wrap(begin + i); left[at] += value * gl; right[at] += value * gr;
    for (const [delay, gain] of offsets) {
      const echo = wrap(at + delay); left[echo] += value * gr * gain; right[echo] += value * gl * gain;
    }
  }
}
const harmony = [
  [48,55,59,62,64], // Cmaj9
  [45,52,55,59,60], // Am9
  [41,53,57,60,64], // Fmaj7
  [43,55,60,62,64], // C/G
  [50,57,60,64,65], // Dm9
  [41,53,57,60,64], // Fmaj7
  [43,55,60,62,67], // Gsus
  [48,55,59,62,64], // Cmaj9
];
for (let bar = 0; bar < harmony.length; bar++) {
  const chord = harmony[bar], start = bar * 12;
  for (let tone = 0; tone < chord.length; tone++) {
    play(chord[tone], start - 2 + tone * .09, 17, tone === 0 ? .032 : .022, 'swell', (tone - 2) * .17);
  }
  // Loose, spacious piano gestures; no repeated rhythmic accompaniment.
  play(chord[1], start + .65, 8, .031, 'piano', -.25);
  play(chord[3], start + 4.1, 7.5, .027, 'piano', .18);
}
const melody = [[64,2.6],[67,8.3],[64,16.7],[60,22.5],[64,28.2],[65,34.4],[64,39.8],[62,45.7],[65,52.8],[64,58.1],[60,64.5],[64,70.2],[62,77.4],[67,82.9],[64,88.6]];
for (const [pitch, time] of melody) play(pitch, time, 8.5, .055, 'piano', .07);

// Very mellow three-stage low-pass: bright transients and upper harmonics fall away.
const alpha = 1 - Math.exp(-2 * Math.PI * 850 / rate);
for (const channel of [left, right]) {
  for (let stage = 0; stage < 3; stage++) {
    let state = channel[length - 1];
    for (let pass = 0; pass < 2; pass++) for (let i = 0; i < length; i++) {
      state += alpha * (channel[i] - state);
      if (pass === 1) channel[i] = state;
    }
  }
}
let peak = 0, sum = 0, jump = 0;
for (let i = 0; i < length; i++) { peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i])); sum += left[i] ** 2 + right[i] ** 2; }
const gain = .48 / peak;
const wav = Buffer.alloc(44 + length * 4);
wav.write('RIFF',0); wav.writeUInt32LE(wav.length-8,4); wav.write('WAVEfmt ',8);
wav.writeUInt32LE(16,16); wav.writeUInt16LE(1,20); wav.writeUInt16LE(2,22); wav.writeUInt32LE(rate,24); wav.writeUInt32LE(rate*4,28); wav.writeUInt16LE(4,32); wav.writeUInt16LE(16,34); wav.write('data',36); wav.writeUInt32LE(length*4,40);
for (let i=0;i<length;i++) { wav.writeInt16LE(Math.round(left[i]*gain*32767),44+i*4); wav.writeInt16LE(Math.round(right[i]*gain*32767),46+i*4); jump=Math.max(jump,Math.abs(left[i]-left[wrap(i-1)])*gain,Math.abs(right[i]-right[wrap(i-1)])*gain); }
const output=path.resolve('public/audio/siesta-sa-lilim.wav'); fs.mkdirSync(path.dirname(output),{recursive:true}); fs.writeFileSync(output,wav);
console.log(JSON.stringify({output,durationSeconds:duration,peak:peak*gain,rms:Math.sqrt(sum/(length*2))*gain,maxSampleStep:jump,bytes:wav.length}));
