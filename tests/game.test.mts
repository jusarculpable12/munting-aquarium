import { test } from "node:test";
import assert from "node:assert/strict";
import { act, advance, advanceVisible, resume, capacity, fits, OFFLINE_SECONDS, start, adult, fishValue, growthScale, GROWTH_MS, pregnancyProgress, species, breedingStatus, COURTSHIP_SECONDS, BREEDING_RECOVERY_SECONDS } from "../game/model.ts";
import { decode } from "../game/storage.ts";

test("starter care, visitor income, breeding, sale, upgrade, and save restore", () => {
  const now = Date.now();
  const started = start(now - 240_000);
  started.tanks[0].breeding.guppy = species.guppy.breed - 240;
  const [dropped] = act(started, { type: "feed", tank: 0, pellet: "starter-pellet" }, started.last);
  assert.equal(dropped.tanks[0].fish[0].fullness, 85);
  const [fed] = act(dropped, { type: "eat", tank: 0, fish: started.tanks[0].fish[0].id, pellet: "starter-pellet" }, started.last);
  assert.equal(fed.tanks[0].fish[0].fullness, 100);
  assert.equal(fed.tanks[0].fish[1].fullness, 85);
  assert.equal(fed.tanks[0].food, 92.5);
  const [duplicate] = act(fed, { type: "eat", tank: 0, fish: started.tanks[0].fish[1].id, pellet: "starter-pellet" }, started.last);
  assert.equal(duplicate.tanks[0].fish[1].fullness, 85);  const [changed] = act(fed, { type: "water", tank: 0 }, fed.last);
  assert.ok(changed.tanks[0].water > fed.tanks[0].water);
  const bred = advance(changed, now, () => 0.99);
  assert.ok(bred.coins > changed.coins);
  assert.ok(bred.tanks[0].fish.some(fish => fish.rare));
  const order = { type: "sell", tank: 0, fish: bred.tanks[0].fish[0].id, order: bred.order.id } as const;
  const [sold] = act(bred, order, now);
  assert.equal(sold.coins, bred.coins + bred.order.reward);
  assert.deepEqual(act(sold, order, now)[0], sold);
  const [upgraded] = act(sold, { type: "size", tank: 0 }, now);
  assert.equal(capacity(upgraded.tanks[0]), 11);
  assert.deepEqual(decode(JSON.stringify(upgraded)), upgraded);
  assert.equal(advance(upgraded, now), upgraded);
});

test("offline simulation is capped and repeated refresh cannot pay twice", () => {
  const now = Date.now();
  const started = start(now - 86_400_000);
  const resumed = resume(started, now);
  assert.ok(resumed.coins <= started.coins + OFFLINE_SECONDS * 2 / 60 + 0.0001);
  assert.equal(resume(resumed, now), resumed);
  assert.equal(fits(started.tanks[0], "molly"), false);
  assert.throws(() => decode(JSON.stringify({ ...started, coins: -1 })));
  const [poor] = act({ ...started, coins: 0 }, { type: "buy", tank: 0, kind: "platy", sex: "F" }, started.last);
  assert.equal(poor.coins, 0);
});

test("tank progression, stocking limits, and moved fish survive a save round trip", () => {
  const now = Date.now();
  const initial = start(now);
  const [second] = act({ ...initial, coins: 500 }, { type: "unlock", tank: 0 }, now);
  const [third] = act(second, { type: "unlock", tank: 1 }, now);
  assert.equal(third.tanks.length, 3);
  assert.equal(third.coins, 50);
  assert.equal(act(third, { type: "unlock", tank: 2 }, now)[0].tanks.length, 3);
  const fishId = third.tanks[0].fish[0].id;
  const [moved] = act(third, { type: "move", tank: 0, fish: fishId, target: 1 }, now);
  assert.ok(moved.tanks[1].fish.some(fish => fish.id === fishId));
  assert.deepEqual(decode(JSON.stringify(moved)), moved);
  assert.throws(() => decode(JSON.stringify({ ...moved, tanks: [{ ...moved.tanks[0], fish: Array(50).fill(moved.tanks[0].fish[0]) }] })));
});


test("individual hunger survives save migration, active time and tank moves", () => {
  const now = Date.now();
  const initial = start(now - 10000);
  initial.tanks[0].fish[0].fullness = 20;
  initial.tanks[0].fish[1].fullness = 80;
  const elapsed = advance(initial, now);
  assert.ok(elapsed.tanks[0].fish[0].fullness < 20);
  assert.ok(elapsed.tanks[0].fish[1].fullness < 80);
  assert.equal(Math.round(elapsed.tanks[0].fish[1].fullness - elapsed.tanks[0].fish[0].fullness), 60);
  assert.deepEqual(decode(JSON.stringify(elapsed)), elapsed);
  const legacy = JSON.parse(JSON.stringify(initial));
  delete legacy.tanks[0].fish[0].fullness;
  assert.equal(decode(JSON.stringify(legacy)).tanks[0].fish[0].fullness, legacy.tanks[0].food);
  legacy.tanks[0].fish[0].fullness = -1;
  assert.throws(() => decode(JSON.stringify(legacy)));
  const [expanded] = act({ ...elapsed, coins: 500 }, { type: "unlock", tank: 0 }, now);
  const [moved] = act(expanded, { type: "move", tank: 0, target: 1, fish: initial.tanks[0].fish[0].id }, now);
  assert.equal(moved.tanks[1].fish[0].fullness, elapsed.tanks[0].fish[0].fullness);
});

test("poor care and repeated overfeeding affect individual fish, with recovery and death", () => {
  const now = Date.now();
  const initial = start(now - 360000);
  initial.tanks[0].water = 100;
  initial.tanks[0].filter = 2;
  initial.tanks[0].fish[0].fullness = 0;
  initial.tanks[0].fish[1].fullness = 90;
  const dead = advance(initial, now);
  assert.ok(dead.tanks[0].fish[0].diedAt);
  assert.equal(dead.tanks[0].fish[0].health, 0);
  assert.equal(dead.tanks[0].fish[1].health, 100);
  assert.deepEqual(decode(JSON.stringify(dead)), dead);
  const [removed] = act(dead, { type: "remove", tank: 0, fish: dead.tanks[0].fish[0].id }, now);
  assert.equal(removed.tanks[0].fish.length, 1);
  const recovering = start(now - 60000);
  recovering.tanks[0].fish[0].health = 50;
  assert.ok(advance(recovering, now).tanks[0].fish[0].health > 50);
  let overfed = start(now - 360000);
  overfed.tanks[0].water = 100;
  const id = overfed.tanks[0].fish[0].id;
  for (let i=0; i<6; i++) {
    [overfed] = act(overfed, { type: "feed", tank: 0, pellet: `excess-${i}` }, overfed.last);
    [overfed] = act(overfed, { type: "eat", tank: 0, fish: id, pellet: `excess-${i}` }, overfed.last);
  }
  assert.ok(overfed.tanks[0].fish[0].overfed >= 80);
  assert.equal(overfed.tanks[0].fish[1].overfed, 0);
  const result = advance(overfed, now);
      assert.equal(result.tanks[0].fish[0].diedAt, undefined);
    assert.equal(result.tanks[0].fish[0].overfed, 0);
    assert.equal(result.tanks[0].fish[0].health, 100);
  assert.equal(result.tanks[0].fish[1].health, 100);
});

test("purchased colors are rolled once, saved, and validated", () => {
 const now=Date.now();
 const initial=start(now);
 const [common]=act(initial,{type:'buy',tank:0,kind:'guppy',sex:'M'},now,()=>0);
 const [legendary]=act(initial,{type:'buy',tank:0,kind:'guppy',sex:'M'},now,()=>.999);
 assert.equal(common.tanks[0].fish.at(-1)!.variant,'sunset');
 assert.equal(legendary.tanks[0].fish.at(-1)!.variant,'lavender');
 assert.deepEqual(decode(JSON.stringify(legendary)),legendary);
 assert.equal(advance(legendary,now),legendary);
 const invalid=structuredClone(legendary);invalid.tanks[0].fish[2].variant='unknown';
 assert.throws(()=>decode(JSON.stringify(invalid)));
});

test("courtship, pregnancy, nursery birth and recovery persist without overstocking", () => {
 const now=Date.now();const initial=start(now-2000);
 initial.tanks[0].breeding.guppy=species.guppy.breed-2;
 const expecting=advance(initial,now-1000,()=>.5);
 const mother=expecting.tanks[0].fish.find(f=>f.sex==='F')!;
 const father=expecting.tanks[0].fish.find(f=>f.sex==='M')!;
 assert.ok(pregnancyProgress(expecting.tanks[0],mother,expecting.last)>.99);
 assert.equal(pregnancyProgress(expecting.tanks[0],father,expecting.last),0);
 assert.match(breedingStatus(expecting.tanks[0],'guppy',expecting.last),/Nursery ready/);
 const born=advance(expecting,now,()=>.5);
 assert.ok(born.tanks[0].fish.find(f=>f.motherId===mother.id));
 assert.equal(born.tanks[0].breeding.guppy,-BREEDING_RECOVERY_SECONDS);
 assert.deepEqual(decode(JSON.stringify(born)),born);
 const full=structuredClone(initial);
 for(let i=0;i<4;i++)full.tanks[0].fish.push({...father,id:`resident-${i}`});
 assert.equal(advance(full,now).tanks[0].fish.length,6);
 const fresh=start(now-120000);
 const courting=advance(fresh,fresh.last+30000);
 assert.equal(pregnancyProgress(courting.tanks[0],courting.tanks[0].fish[0],courting.last),0);
 assert.match(breedingStatus(courting.tanks[0],'guppy',courting.last),/Courting/);
 const pregnant=advance(courting,fresh.last+(COURTSHIP_SECONDS+1)*1000);
 assert.ok(pregnancyProgress(pregnant.tanks[0],pregnant.tanks[0].fish[0],pregnant.last)>0);
 assert.equal(advance(pregnant,now).tanks[0].fish.length,2);
 const alone=structuredClone(fresh);alone.tanks[0].fish.pop();
 assert.equal(advance(alone,now).tanks[0].breeding.guppy??0,0);
});

test("overfeeding wears off for each fish, causes temporary damage, and survives reload", () => {
  const now = Date.now() - 240000;
  const initial = start(now);
  initial.tanks[0].water = 100;
  initial.tanks[0].fish[0].overfed = 100;
  initial.tanks[0].fish[0].fullness = 100;
  const stressed = advance(initial, now + 60000);
  assert.equal(stressed.tanks[0].fish[0].overfed, 70);
  assert.ok(stressed.tanks[0].fish[0].health < 100);
  assert.equal(stressed.tanks[0].fish[1].overfed, 0);
  const restored = decode(JSON.stringify(stressed));
  const recovered = advance(restored, now + 240000);
  assert.equal(recovered.tanks[0].fish[0].overfed, 0);
  assert.equal(recovered.tanks[0].fish[0].diedAt, undefined);
  assert.ok(recovered.tanks[0].fish[0].health > stressed.tanks[0].fish[0].health);
  assert.deepEqual(advance(recovered, now + 240000), recovered);
});



test("purchases start small and grow gradually; fry mature slowly and saves preserve growth", () => {
 const now=Date.now();
 const initial=start(now);
 const [bought]=act(initial,{type:'buy',tank:0,kind:'guppy',sex:'F'},now,()=>0);
 const juvenile=bought.tanks[0].fish.at(-1)!;
 assert.equal(juvenile.born,now);
 assert.equal(adult(juvenile,now),false);
 assert.equal(growthScale(juvenile,now),.45);
 assert.ok(growthScale(juvenile,now+900000)>.45);
 assert.ok(growthScale(juvenile,now+900000)<1);
 assert.equal(adult(juvenile,now+GROWTH_MS-1),false);
 assert.equal(adult(juvenile,now+GROWTH_MS),true);
 assert.equal(growthScale(juvenile,now+GROWTH_MS),1);
 assert.deepEqual(decode(JSON.stringify(bought)),bought);
 assert.equal(growthScale({...juvenile,motherId:'mother'},now),.25);
 assert.equal(adult({...juvenile,maturesAt:undefined,born:now-120000},now),true);
});


test("direct fish sales pay the displayed value once without fulfilling an order", () => {
 const now=Date.now();const initial=start(now);
 const resident=initial.tanks[0].fish[0];
 const [sold]=act(initial,{type:'sell-fish',tank:0,fish:resident.id},now);
 assert.equal(sold.coins,initial.coins+fishValue(resident));
 assert.equal(sold.tanks[0].fish.some(f=>f.id===resident.id),false);
 assert.deepEqual(sold.order,initial.order);
 assert.deepEqual(act(sold,{type:'sell-fish',tank:0,fish:resident.id},now)[0],sold);
 assert.deepEqual(decode(JSON.stringify(sold)),sold);
 const [bought]=act(initial,{type:'buy',tank:0,kind:'guppy',sex:'F'},now,()=>.999);
 const juvenile=bought.tanks[0].fish.at(-1)!;
 assert.ok(fishValue(juvenile)<species.guppy.price);
 assert.deepEqual(act(bought,{type:'sell-fish',tank:0,fish:juvenile.id},now)[0],bought);
 const dead=structuredClone(initial);dead.tanks[0].fish[0].health=0;dead.tanks[0].fish[0].diedAt=now;
 assert.equal(fishValue(dead.tanks[0].fish[0]),0);
 assert.deepEqual(act(dead,{type:'sell-fish',tank:0,fish:resident.id},now)[0],dead);
});


 test("away protection preserves individual care, water and pregnancy even after days", () => {
  const initial = start(Date.now() - 7 * 86400000);
  const tank = initial.tanks[0];
  tank.water = 2;
  tank.fish[0].fullness = 0; tank.fish[0].health = 1;
  tank.fish[1].overfed = 100; tank.fish[1].health = 3;
  tank.breeding.guppy = 80;
  const returned = resume(initial, initial.last + 7 * 86400000);
  assert.deepEqual(returned.tanks, initial.tanks);
  assert.equal(returned.coins, initial.coins);
  assert.deepEqual(decode(JSON.stringify(returned)), returned);
  assert.equal(resume(returned, returned.last), returned);
  assert.deepEqual(advanceVisible(initial, returned.last), returned);
  assert.ok(advanceVisible(initial, initial.last + 1000).tanks[0].fish[0].health < 1);
  const healthy = start(initial.last);
  const paid = resume(healthy, healthy.last + 7 * 86400000);
  assert.equal(paid.coins, healthy.coins + OFFLINE_SECONDS * 2 / 60);
  healthy.tanks[0].fish[0].diedAt = healthy.last;
  healthy.tanks[0].fish[0].health = 0;
  assert.equal(resume(healthy, paid.last).tanks[0].fish[0].diedAt, healthy.last);
 });


