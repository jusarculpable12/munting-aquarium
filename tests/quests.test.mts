import { test } from 'node:test';
import assert from 'node:assert/strict';
import { act, matchesOrder, orderVariant, start, type Order } from '../game/model.ts';
import { decode } from '../game/storage.ts';

test('customer quest requires exact species, variant, age and a living settled fish',()=>{
 const now=Date.now(),save=start(now),adult=save.tanks[0].fish[0];
 assert.equal(matchesOrder(adult,save.order,now),true);
 assert.equal(matchesOrder({...adult,variant:'cobra'},save.order,now),false);
 assert.equal(matchesOrder({...adult,kind:'platy'},save.order,now),false);
 assert.equal(matchesOrder({...adult,diedAt:now},save.order,now),false);
 assert.equal(matchesOrder({...adult,sellAfter:now+1000},save.order,now),false);
 const baby={...adult,id:'quest-baby',motherId:adult.id,born:now,maturesAt:now+1800000};
 const request:Order={...save.order,age:'baby'};
 assert.equal(matchesOrder(baby,request,now),true);
 assert.equal(matchesOrder({...baby,motherId:undefined},request,now),false);
 assert.equal(matchesOrder(adult,request,now),false);
 assert.equal(matchesOrder(baby,save.order,now),false);
 assert.equal(matchesOrder(baby,request,baby.maturesAt),false);
});
test('baby quest sells the chosen fry once, pays its offer and preserves discovery',()=>{
 const now=Date.now(),save=start(now),parent=save.tanks[0].fish[0];
 save.order={...save.order,age:'baby',reward:25};
 save.tanks[0].fish.push({...parent,id:'baby-for-customer',motherId:parent.id,born:now,maturesAt:now+1800000});
 const action={type:'sell',tank:0,fish:'baby-for-customer',order:save.order.id} as const;
 const [sold,result]=act(save,action,now);
 assert.match(result,/fulfilled/); assert.equal(sold.coins,save.coins+25);
 assert.equal(sold.tanks[0].fish.length,2); assert.equal(sold.order.id,save.order.id+1);
 assert.deepEqual(act(sold,action,now)[0],sold);
 assert.deepEqual(decode(JSON.stringify(sold)),sold);
 assert.ok(sold.discoveries?.includes('guppy:sunset'));
});
test('wrong or stale quest fulfillment never removes fish or pays coins',()=>{
 const now=Date.now(),save=start(now),id=save.tanks[0].fish[0].id;
 const wrong={...save,order:{...save.order,variant:'cobra'}};
 assert.deepEqual(act(wrong,{type:'sell',tank:0,fish:id,order:wrong.order.id},now)[0],wrong);
 assert.deepEqual(act(save,{type:'sell',tank:0,fish:id,order:save.order.id+1},now)[0],save);
 const [skipped]=act(save,{type:'next-order',tank:0},now);
 assert.equal(skipped.coins,save.coins);assert.deepEqual(skipped.tanks,save.tanks);
 assert.equal(skipped.order.id,1);assert.equal(skipped.order.age,'baby');
 assert.ok(skipped.order.variant);assert.equal(orderVariant(skipped.order).id,skipped.order.variant);
});
test('legacy orders remain usable; malformed variants and ages are rejected',()=>{
 const save=start(Date.now());delete save.order.age;delete save.order.variant;
 const legacy=decode(JSON.stringify(save));
 assert.equal(matchesOrder(legacy.tanks[0].fish[0],legacy.order,legacy.last),true);
 assert.throws(()=>decode(JSON.stringify({...save,order:{...save.order,variant:'not-a-color'}})));
 assert.throws(()=>decode(JSON.stringify({...save,order:{...save.order,age:'egg'}})));
});
