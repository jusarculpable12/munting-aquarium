import { test } from 'node:test';
import assert from 'node:assert/strict';
import { start, courtshipPair, COURTSHIP_SECONDS, GROWTH_MS, advance, pregnancyProgress } from '../game/model.ts';
import { bellyShape } from '../game/fish-body.ts';

test('courtship selects only an eligible adult pair, excluding fry and extra adults', () => {
 const now=Date.now();const save=start(now-2000);const tank=save.tanks[0];
 const mother=tank.fish[0],father=tank.fish[1];
 tank.fish.unshift({...father,id:'baby',born:now,maturesAt:now+GROWTH_MS,motherId:mother.id});
 tank.fish.push({...father,id:'extra-adult'});
 tank.breeding.guppy=30;
 assert.deepEqual(courtshipPair(tank,'guppy',now).map(f=>f.id),[mother.id,father.id]);
 tank.fish.find(f=>f.id===father.id)!.overfed=30;
 assert.deepEqual(courtshipPair(tank,'guppy',now).map(f=>f.id),[mother.id,'extra-adult']);
 tank.breeding.guppy=COURTSHIP_SECONDS;
 const pregnant=advance(save,save.last+1000);
 assert.deepEqual(courtshipPair(pregnant.tanks[0],'guppy',pregnant.last),[]);
 assert.ok(pregnancyProgress(pregnant.tanks[0],pregnant.tanks[0].fish.find(f=>f.id===mother.id)!,pregnant.last)>0);
 assert.equal(pregnancyProgress(pregnant.tanks[0],pregnant.tanks[0].fish[0],pregnant.last),0);
});

test('fullness belly shrinks with digestion and pregnancy has a distinct larger signal', () => {
 assert.equal(bellyShape(60,0).meal,0);
 assert.ok(bellyShape(100,0).meal>bellyShape(85,0).meal);
 assert.equal(bellyShape(100,0).pregnancy,0);
 assert.ok(bellyShape(70,1).pregnancy>bellyShape(100,0).meal);
 assert.ok(bellyShape(80,.9).pregnancy>bellyShape(80,.2).pregnancy);
 assert.deepEqual(bellyShape(-10,2),{meal:0,pregnancy:.8});
});
