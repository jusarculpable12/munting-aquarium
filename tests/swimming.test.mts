import { test } from 'node:test';
import assert from 'node:assert/strict';
import { swimToward, type SwimPosition } from '../game/swimming.ts';

test('successive food targets and returning to cruising preserve continuous movement', () => {
  let position: SwimPosition = { x: 100, y: 150, direction: 1 };
  for (const target of [{x:850,y:70},{x:50,y:450},{x:500,y:200}]) {
    for (let frame=0;frame<60;frame++) {
      const next=swimToward(position,target,1/60,155);
      assert.ok(Math.hypot(next.x-position.x,next.y-position.y)<=155/60+1e-9);
      position=next;
    }
  }
  const resumed=swimToward(position,{x:900,y:450},120,155);
  assert.ok(Math.hypot(resumed.x-position.x,resumed.y-position.y)<=155*.05+1e-9);
  assert.deepEqual(swimToward(position,{x:0,y:0},0,155),{...position,direction:-1,facing:position.facing ?? position.direction});
});

test('fish turn before reversing and always face their horizontal movement', () => {
  let position: SwimPosition = { x: 400, y: 200, direction: 1 };
  const target = { x: 100, y: 200 };
  const first = swimToward(position, target, 1/60, 155);
  assert.equal(first.x, position.x);
  assert.ok(first.facing! > 0 && first.facing! < 1);
  for (let frame=0;frame<90;frame++) {
    const next=swimToward(position,target,1/60,155);
    if(Math.abs(next.x-position.x)>1e-8) assert.equal(Math.sign(next.x-position.x),Math.sign(next.facing!));
    assert.ok(Math.abs(next.facing!-(position.facing ?? position.direction))<=.100001);
    position=next;
  }
  assert.ok(position.x<400);
  assert.equal(position.facing,-1);
});
