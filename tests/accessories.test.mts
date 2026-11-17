import { test } from 'node:test';
import assert from 'node:assert/strict';
import { act, advance, start, capacity, visitors, happiness } from '../game/model.ts';
import { plantCatalog, accessoryLimit, accessoryLoad, plantDefinition, accessoryEffects, shelterAccessories } from '../game/accessories.ts';
import { decode } from '../game/storage.ts';

test('catalog retains twelve artificial designs priced by size with premium equipment',()=>{
 assert.equal(plantCatalog.filter(p=>p.category==='Artificial').length,12);
 assert.equal(new Set(plantCatalog.map(p=>p.id)).size,plantCatalog.length);
 for(const item of plantCatalog.filter(p=>p.category==='Artificial'))assert.equal(item.price,({Small:15,Medium:25,Tall:40})[item.size]);
 assert.ok(plantDefinition('power-filter').price>plantDefinition('sponge-filter').price);
 assert.ok(plantDefinition('live-fern').price>plantDefinition('oval-stem').price);
});
test('plants use separate capped slots, cannot overspend, and preserve fish capacity',()=>{
 const now=Date.now();let save=start(now);const fishCapacity=capacity(save.tanks[0]);
 [save]=act(save,{type:'plant-buy',tank:0,kind:'leaf-thicket'},now);
 assert.equal(save.coins,45);assert.equal(accessoryLoad(save.tanks[0]),3);
 [save]=act(save,{type:'plant-buy',tank:0,kind:'grass-tuft'},now);
 assert.equal(save.coins,30);assert.equal(accessoryLoad(save.tanks[0]),4);
 assert.deepEqual(act(save,{type:'plant-buy',tank:0,kind:'coin-bush'},now)[0],save);
 assert.equal(capacity(save.tanks[0]),fishCapacity);assert.equal(save.tanks[0].fish.length,2);
 const emptyWallet={...start(now),coins:0};
 assert.deepEqual(act(emptyWallet,{type:'plant-buy',tank:0,kind:'coin-bush'},now)[0],emptyWallet);
 assert.deepEqual([0,1,2].map(size=>accessoryLimit({size})),[4,6,8]);
});
test('moving, save reload, plant returns and imported bounds are safe',()=>{
 const now=Date.now();const initial=start(now);
 const [bought]=act(initial,{type:'plant-buy',tank:0,kind:'pink-stem'},now);
 const plant=bought.tanks[0].accessories![0];
 const [moved]=act(bought,{type:'plant-move',tank:0,id:plant.id,x:9,y:-2},now);
 assert.equal(moved.tanks[0].accessories![0].x,.93);assert.equal(moved.tanks[0].accessories![0].y,.82);
 assert.deepEqual(decode(JSON.stringify(moved)),moved);
 assert.deepEqual(act(moved,{type:'plant-move',tank:0,id:plant.id,x:NaN,y:.9},now)[0],moved);
 const [returned]=act(moved,{type:'plant-return',tank:0,id:plant.id},now);
 assert.equal(returned.coins,initial.coins);assert.equal(accessoryLoad(returned.tanks[0]),0);
 assert.deepEqual(act(returned,{type:'plant-return',tank:0,id:plant.id},now)[0],returned);
 const invalid=structuredClone(moved);invalid.tanks[0].accessories![0].x=-1;
 assert.throws(()=>decode(JSON.stringify(invalid)));
 const crowded=structuredClone(moved);crowded.tanks[0].accessories!.push({...plant,id:'other'});
 assert.throws(()=>decode(JSON.stringify(crowded)));
 const legacy=start(now);delete legacy.tanks[0].accessories;assert.deepEqual(decode(JSON.stringify(legacy)),legacy);
});
test('plant attraction bonus is capped and does not bypass poor care or clean water',()=>{
 const now=Date.now();const save=start(now);const tank=save.tanks[0];tank.size=2;
 tank.accessories=Array.from({length:8},(_,i)=>({id:`plant-${i}`,kind:'grass-tuft' as const,x:.35,y:.9}));
 assert.equal(visitors(tank),4);assert.equal(tank.water,82);
 tank.water=10;assert.equal(visitors(tank),0);
 for(const plant of tank.accessories)assert.equal(plantDefinition(plant.kind).slots,1);
});

test('equipment and live plants have capped timestamp-based effects and unique equipment',()=>{
 const now=Date.now();const save=start(now);save.coins=500;save.tanks[0].size=2;
 let equipped=save;
 for(const kind of ['sponge-filter','live-fern','led-light','heater'] as const)[equipped]=act(equipped,{type:'plant-buy',tank:0,kind},now);
 assert.equal(accessoryLoad(equipped.tanks[0]),7);
 assert.equal(accessoryEffects(equipped.tanks[0]).wasteMultiplier,.7);
 assert.equal(happiness(equipped.tanks[0]),85);
 assert.ok(advance(equipped,now+10000).tanks[0].water>advance(save,now+10000).tanks[0].water);
 assert.deepEqual(act(equipped,{type:'plant-buy',tank:0,kind:'led-light'},now)[0],equipped);
 assert.equal(shelterAccessories(equipped.tanks[0]).length,1);
 equipped.tanks[0].water=10;assert.equal(happiness(equipped.tanks[0]),10);
});
test('accessory depth and cave-area placement persist; invalid depth is rejected',()=>{
 const now=Date.now();let [save]=act(start(now),{type:'plant-buy',tank:0,kind:'grass-tuft'},now);
 const id=save.tanks[0].accessories![0].id;
 [save]=act(save,{type:'plant-move',tank:0,id,x:.1,y:.9},now);
 [save]=act(save,{type:'plant-layer',tank:0,id,layer:'back'},now);
 assert.equal(save.tanks[0].accessories![0].x,.1);
 assert.equal(decode(JSON.stringify(save)).tanks[0].accessories![0].layer,'back');
 const invalid=JSON.parse(JSON.stringify(save));invalid.tanks[0].accessories[0].layer='wrong';assert.throws(()=>decode(JSON.stringify(invalid)));
 const duplicate=JSON.parse(JSON.stringify(save));duplicate.tanks[0].accessories=[{id:'a',kind:'led-light',x:.5,y:.9},{id:'b',kind:'led-light',x:.6,y:.9}];assert.throws(()=>decode(JSON.stringify(duplicate)));
});


test('legacy refunds use the old price and new purchase prices survive reload without duplicate payout',()=>{
 const now=Date.now();const old=start(now);old.tanks[0].accessories=[{id:'legacy',kind:'power-filter',x:.5,y:.85}];
 const [returned]=act(decode(JSON.stringify(old)),{type:'plant-return',tank:0,id:'legacy'},now);
 assert.equal(returned.coins,old.coins+15);
 let [bought]=act(start(now),{type:'plant-buy',tank:0,kind:'heater'},now);
 assert.equal(bought.coins,10);assert.equal(bought.tanks[0].accessories![0].paidPrice,75);
 bought=decode(JSON.stringify(bought));const id=bought.tanks[0].accessories![0].id;
 const [refund]=act(bought,{type:'plant-return',tank:0,id},now);assert.equal(refund.coins,85);
 assert.deepEqual(act(refund,{type:'plant-return',tank:0,id},now)[0],refund);
 const invalid=structuredClone(bought);invalid.tanks[0].accessories![0].paidPrice=999;assert.throws(()=>decode(JSON.stringify(invalid)));
});
