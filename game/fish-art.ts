import { recolorVariant } from './variant-art';
import { bellyShape, type FishBodyState } from './fish-body';
import { colorVariety } from './varieties';
import type { Fish } from './model';

type Appearance = Pick<Fish, 'kind' | 'sex' | 'rare' | 'variant'>;
let atlas: HTMLImageElement | undefined;
let loading: Promise<void> | undefined;
const sprites = new Map<string, HTMLCanvasElement>();

/** Browser-only shared atlas, loaded once for portraits and the animated tank. */
export function loadFishArt(): Promise<void> {
  if (loading) return loading;
  loading = new Promise(resolve => {
    atlas = new Image();
    atlas.onload = () => resolve();
    atlas.onerror = () => resolve();
    atlas.src = '/art/fish-atlas.png';
  });
  return loading;
}

function sprite(fish: Appearance) {
  if (!atlas?.complete || !atlas.naturalWidth) return;
  const variety = colorVariety(fish);
  const key = `${fish.kind}-${fish.sex}-${variety.id}`;
  if (sprites.has(key)) return sprites.get(key)!;
  const row = ['guppy', 'platy', 'molly', 'swordtail'].indexOf(fish.kind);
  const width = atlas.width / 2, height = atlas.height / 4;
  const cell = document.createElement('canvas'); cell.width = width; cell.height = height;
  const ctx = cell.getContext('2d')!;
  ctx.drawImage(atlas, fish.sex === 'F' ? width : 0, row * height, width, height, 0, 0, width, height);
  const pixels = ctx.getImageData(0, 0, width, height);
  let left = width, top = height, right = 0, bottom = 0;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const offset = (y * width + x) * 4;
    if (pixels.data[offset + 3] > 40) { left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y); }
  }
  const result = document.createElement('canvas'); result.width = right - left + 1; result.height = bottom - top + 1;
  const out = result.getContext('2d')!;
  out.drawImage(cell,left,top,result.width,result.height,0,0,result.width,result.height);
  if(!(fish.kind==='guppy'&&variety.id==='sunset')){
    const pixels=out.getImageData(0,0,result.width,result.height);
    pixels.data.set(recolorVariant(pixels.data,result.width,result.height,fish.kind,fish.sex,variety));
    out.putImageData(pixels,0,0);
  }
  const image=withFinForm(result,variety);
  sprites.set(key, image); return image;
}

/** Fin extensions share the source palette and are cached with the colored sprite. */
function withFinForm(source:HTMLCanvasElement,color:import('./varieties').ColorVariety):HTMLCanvasElement {
 if(!color.fin||color.fin==='standard')return source;
 const w=source.width,h=source.height,lyre=color.fin==='lyretail',tall=color.fin==='highfin'||color.fin==='sailfin'||color.id==='sailfin-lyretail-gold-dust';
 const pad=Math.ceil(h*(tall?.3:.12)),left=(lyre||color.fin==='pintail')?Math.ceil(w*.12):0;
 const canvas=document.createElement('canvas');canvas.width=w+left;canvas.height=h+pad*2;
 const ctx=canvas.getContext('2d')!;ctx.imageSmoothingEnabled=false;ctx.translate(left,pad);
 const finColor=color.pattern==='wagtail'?'#1b292d':color.colors[1];
 const shape=(points:number[][])=>{ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fillStyle=finColor;ctx.fill();ctx.strokeStyle=color.colors[0];ctx.lineWidth=2;ctx.stroke();};
 if(tall){
  shape([[w*.35,h*.4],[w*.36,-pad*.45],[w*.48,-pad*.85],[w*.61,-pad*.65],[w*.73,h*.34]]);
  ctx.strokeStyle=color.colors[2];ctx.lineWidth=1;
  for(let ray=0;ray<9;ray++){ctx.beginPath();ctx.moveTo(w*(.36+ray*.038),h*.38);ctx.lineTo(w*(.36+ray*.027),-pad*(.4+Math.sin(ray/9*Math.PI)*.4));ctx.stroke();}
 }
 if(lyre){
  shape([[w*.32,h*.47],[w*.14,h*.16],[-left,h*.02],[w*.08,h*.36],[w*.24,h*.51]]);
  shape([[w*.32,h*.53],[w*.14,h*.84],[-left,h*.98],[w*.08,h*.64],[w*.24,h*.49]]);
 }
 if(color.fin==='pintail')shape([[w*.32,h*.43],[-left,h*.5],[w*.32,h*.57]]);
 ctx.drawImage(source,0,0);
 return canvas;
}

/** Facing right; mouth stays at x=25 so feeding and movement share an anchor. */
export function paintFish(ctx: CanvasRenderingContext2D, fish: Appearance, time = 0, bite = 0, turn = 0, body: FishBodyState = {}) {
  if (!loading) void loadFishArt();
  const image = sprite(fish); if (!image) return;
  const width = fish.kind === 'swordtail' && fish.sex === 'M' ? 100 : 78;
  const height = width * image.height / image.width;
  ctx.save(); ctx.imageSmoothingEnabled = false;
  // Narrow vertical strips flex the tail without flipping or resetting the swimmer.
  const belly = bellyShape(body.fullness ?? 0, fish.sex === "F" ? body.pregnancy ?? 0 : 0);
  const strips = 48;
  for (let i = 0; i < strips; i++) {
    const fraction = i / strips;
    const tail = Math.pow(1 - fraction, 2);
    const wave = Math.sin(time * 12 - fraction * 5) * tail * (2 + turn * 4);
    const mealCurve = Math.exp(-Math.pow((fraction - .70) / .15, 2));
    const gravidCurve = Math.exp(-Math.pow((fraction - .59) / .19, 4));
    const expansion = height * (belly.meal * mealCurve + belly.pregnancy * gravidCurve);
    const sourceX = i * image.width / strips, destX = 25 - width + i * width / strips;
    const split = image.height * .52;
    ctx.drawImage(image, sourceX, 0, image.width / strips + .2, split, destX, -height / 2 + wave, width / strips + .15, height * .52);
    ctx.drawImage(image, sourceX, split, image.width / strips + .2, image.height - split, destX, height * .02 + wave, width / strips + .15, height * .48 + expansion);
  }
  if (belly.pregnancy > .08) {
    ctx.save();ctx.globalAlpha = .25 + belly.pregnancy * .35;ctx.fillStyle = '#34312e';
    ctx.beginPath();ctx.ellipse(25 - width * .46, height * (.16 + belly.pregnancy * .28), 2.5 + belly.pregnancy * 2, 1.7 + belly.pregnancy * 2, -.2, 0, Math.PI * 2);ctx.fill();ctx.restore();
  }
  if (bite > 0) {
    ctx.fillStyle = '#182f38'; ctx.beginPath();
    ctx.ellipse(25, 0, 1.5, 1 + Math.abs(Math.sin(bite * Math.PI * 3)) * 2, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

