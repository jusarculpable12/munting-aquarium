import fs from 'node:fs';
import path from 'node:path';

// Original ambient composition: Tahimik na Mundo (120-second original sandbox ambience).
// Soft synthesized felt-piano notes over slow, rounded string-like swells.
const rate = 22050, duration = 120, length = rate * duration;
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
      const attack = Math.sin(Math.min(1, t / .11) * Math.PI / 2) ** 2;
      const release = Math.sin(Math.min(1, (seconds - t) / 1.8) * Math.PI / 2) ** 2;
      // The fundamental rings; upper partials fade early, keeping the piano mellow.
      value = attack * release * (Math.sin(phase) * Math.exp(-t / 3.5) + .12 * Math.sin(phase * 2.0001) * Math.exp(-t / 1.5) + .012 * Math.sin(phase * 3.0003) * Math.exp(-t / .65));
    }
    value *= level;
    const at = wrap(begin + i); left[at] += value * gl; right[at] += value * gr;
    for (const [delay, gain] of offsets) {
      const echo = wrap(at + delay); left[echo] += value * gr * gain; right[echo] += value * gl * gain;
    }
  }
}
// Original harmony and melody, evoking exploration and quiet open spaces.
const harmony = [
 [38,57,61,64,66], // Dmaj9
 [35,54,57,61,62], // Bm9
 [31,55,59,62,66], // Gmaj7
 [38,54,57,61,64], // Dmaj9
 [40,55,59,62,66], // Em9
 [31,55,59,62,66], // Gmaj7
 [33,57,59,62,64], // Asus
 [38,54,57,61,64], // Dmaj9
];
for(let section=0;section<harmony.length;section++) {
 const chord=harmony[section],start=section*15;
 for(let n=1;n<chord.length;n++) play(chord[n],start-1.5+n*.17,18,.008,'swell',(n-2.5)*.22);
 play(chord[0]+12,start+.15,9,.042,'piano',-.25);
 play(chord[1],start+.28,8,.027,'piano',-.12);
 play(chord[3],start+2.35,7,.025,'piano',.14);
 if(section%2===0) play(chord[2],start+10.2,7,.02,'piano',.24);
}
// Small motifs repeat with changed endings and several seconds of silence.
const melody=[
 [66,3.2],[69,5.8],[64,9.1],
 [61,18.4],[62,21.2],[66,25.6],
 [67,33.3],[66,36.1],[62,40.4],
 [64,48.2],[61,51.5],[62,55.8],
 [66,63.4],[67,66.2],[71,70.1],
 [69,78.6],[66,81.1],[62,85.9],
 [64,93.3],[62,96.4],[61,101.2],
 [66,108.5],[64,111.4],[62,115.2],
];
for(const [pitch,time] of melody) play(pitch,time,7.8,.062,'piano',.06);

// Very mellow three-stage low-pass: bright transients and upper harmonics fall away.
const alpha = 1 - Math.exp(-2 * Math.PI * 1050 / rate);
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
const output=path.resolve('public/audio/tahimik-na-mundo.wav'); fs.mkdirSync(path.dirname(output),{recursive:true}); fs.writeFileSync(output,wav);
console.log(JSON.stringify({output,durationSeconds:duration,peak:peak*gain,rms:Math.sqrt(sum/(length*2))*gain,maxSampleStep:jump,bytes:wav.length}));
