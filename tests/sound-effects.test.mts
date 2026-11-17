import { test } from 'node:test';
import assert from 'node:assert/strict';
import { act, start } from '../game/model.ts';
import { feedingSound } from '../game/sound-effects.ts';
test('accepted drops and bites sound once; duplicate and unavailable pellets stay silent', () => {
  const now=Date.now(), initial=start(now);
  const drop={type:'feed',tank:0,pellet:'sound-test'} as const;
  const [fed,dropResult]=act(initial,drop,now);
  assert.equal(feedingSound(drop,dropResult),'pellet-drop');
  assert.equal(feedingSound(drop,act(fed,drop,now)[1]),null);
  const bite={type:'eat',tank:0,fish:fed.tanks[0].fish[0].id,pellet:'sound-test'} as const;
  const [eaten,biteResult]=act(fed,bite,now);
  assert.equal(feedingSound(bite,biteResult),'fish-eat');
  assert.equal(feedingSound(bite,act(eaten,bite,now)[1]),null);
  assert.equal(feedingSound(bite,act(fed,bite,now+5000)[1]),null);
  assert.equal(feedingSound({type:'water',tank:0},'Changed 30% of the water.'),null);
});
