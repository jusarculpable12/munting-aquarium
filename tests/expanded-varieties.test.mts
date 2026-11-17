import {test} from 'node:test';
import assert from 'node:assert/strict';
import { varieties,rollVariety } from '../game/varieties.ts';
import { kinds,start,act } from '../game/model.ts';
import { decode } from '../game/storage.ts';
import { discoveryKey } from '../game/discoveries.ts';
import { recolorVariant } from '../game/variant-art.ts';

test('expanded catalog preserves legacy IDs and every entry is reachable and saveable',()=>{
 assert.deepEqual(kinds.map(kind=>varieties[kind].length),[19,18,13,14]);
 const rolls={Common:.1,Uncommon:.7,Rare:.9,Legendary:.99};const now=Date.now();
 for(const kind of kinds){
  assert.equal(new Set(varieties[kind].map(color=>color.id)).size,varieties[kind].length);
  for(const color of varieties[kind]){
   const pool=varieties[kind].filter(other=>other.rarity===color.rarity),index=pool.indexOf(color);
   let calls=0;assert.equal(rollVariety(kind,()=>calls++===0?rolls[color.rarity]:(index+.5)/pool.length).id,color.id);
   const initial=start(now);initial.coins=500;initial.tanks[0].size=2;initial.tanks[0].hard=true;initial.tanks[0].water=100;
   calls=0;const [bought]=act(initial,{type:'buy',tank:0,kind,sex:'M'},now,()=>calls++===0?rolls[color.rarity]:(index+.5)/pool.length);
   const restored=decode(JSON.stringify(bought));assert.equal(restored.tanks[0].fish.at(-1)!.variant,color.id);
   assert.ok(restored.discoveries!.includes(discoveryKey(restored.tanks[0].fish.at(-1)!)));
  }
 }
});
test('markings change the correct regions while preserving the original alpha mask',()=>{
 const w=100,h=100,source=new Uint8ClampedArray(w*h*4).fill(190);
 for(let i=3;i<source.length;i+=4)source[i]=255;source[3]=0;
 const red=varieties.platy.find(c=>c.id==='red')!,wag=varieties.platy.find(c=>c.id==='wagtail')!,mickey=varieties.platy.find(c=>c.id==='mickey')!;
 const solid=recolorVariant(source,w,h,'platy','M',red),darkFins=recolorVariant(source,w,h,'platy','M',wag),spotted=recolorVariant(source,w,h,'platy','M',mickey);
 const at=(x:number,y:number)=>(y*w+x)*4;
 assert.ok(darkFins[at(15,50)]<solid[at(15,50)]/2);
 assert.deepEqual(darkFins.slice(at(75,50),at(75,50)+3),solid.slice(at(75,50),at(75,50)+3));
 assert.ok(spotted[at(36,52)]<spotted[at(60,52)]/2);
 for(const kind of kinds)for(const color of varieties[kind]){
  const output=recolorVariant(source,w,h,kind,'M',color);
  for(let i=3;i<output.length;i+=4)assert.equal(output[i],source[i]);
 }
});
