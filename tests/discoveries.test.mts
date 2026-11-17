import {test} from 'node:test';
import assert from 'node:assert/strict';
import {start,act,advance,species} from '../game/model.ts';
import {discoveredVariants,discoveryKey,discoveryKeys} from '../game/discoveries.ts';
import {decode} from '../game/storage.ts';

test('starter book, purchased colors and sales preserve discoveries through saves',()=>{
 const now=Date.now();const initial=start(now);
 assert.deepEqual([...discoveredVariants(initial)],['guppy:sunset']);assert.equal(discoveryKeys.length,64);
 let calls=0;let [bought]=act(initial,{type:'buy',tank:0,kind:'guppy',sex:'M'},now,()=>calls++===0?.7:0);
 const fish=bought.tanks[0].fish.at(-1)!;assert.equal(discoveryKey(fish),'guppy:tuxedo');
 assert.ok(bought.discoveries!.includes('guppy:tuxedo'));
 fish.born=now-2000000;fish.maturesAt=now-1;fish.sellAfter=now;
 const [sold]=act(bought,{type:'sell-fish',tank:0,fish:fish.id},now);
 assert.ok(!sold.tanks[0].fish.some(f=>f.id===fish.id));assert.ok(discoveredVariants(sold).has('guppy:tuxedo'));
 assert.deepEqual(decode(JSON.stringify(sold)),sold);
});
test('births unlock once, and legacy fish are recorded before an order removes them',()=>{
 const now=Date.now();const initial=start(now);initial.tanks[0].breeding.guppy=species.guppy.breed-1;
 const bred=advance(initial,now+1000,()=>.99);
 assert.ok(discoveredVariants(bred).has('guppy:lavender'));assert.equal(bred.discoveries!.filter(key=>key==='guppy:lavender').length,1);
 const old=start(now);delete old.discoveries;old.tanks[0].fish[0].variant='cobra';
 const [sold]=act(old,{type:'sell',tank:0,fish:old.tanks[0].fish[0].id,order:old.order.id},now);
 assert.ok(discoveredVariants(sold).has('guppy:cobra'));
 assert.ok(discoveredVariants(decode(JSON.stringify(old))).has('guppy:cobra'));
});
test('discovery validation rejects unknown, duplicate and malformed entries',()=>{
 const now=Date.now();for(const discoveries of [['fake:color'],['guppy:sunset','guppy:sunset'],[12],'bad']){
  assert.throws(()=>decode(JSON.stringify({...start(now),discoveries})));
 }
 const legacy=start(now);delete legacy.discoveries;assert.doesNotThrow(()=>decode(JSON.stringify(legacy)));
});
