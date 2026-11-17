import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rollVariety, varieties } from '../game/varieties.ts';
import { kinds } from '../game/model.ts';
test('all species have complete rarity pools and correct probability boundaries',()=>{
 for(const kind of kinds){
  for(const [roll,rarity] of [[0,'Common'],[.5999,'Common'],[.6,'Uncommon'],[.8799,'Uncommon'],[.88,'Rare'],[.9799,'Rare'],[.98,'Legendary']] as const){
   let calls=0;const color=rollVariety(kind,()=>calls++===0?roll:0);
   assert.equal(color.rarity,rarity);assert.ok(varieties[kind].includes(color));
  }
 }
});
