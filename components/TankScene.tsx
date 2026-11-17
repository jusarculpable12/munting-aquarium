"use client";
import { useEffect, useRef } from 'react';
import { adult, growthScale, pregnancyProgress, COURTSHIP_SECONDS, courtshipPair, type Tank } from '../game/model';

import { paintFish } from '../game/fish-art';


import { shelterAccessories } from '../game/accessories';
import { swimToward, type SwimPosition } from '../game/swimming';
type Pellet={id:string;x:number;y:number;time:number};
export default function TankScene({tank,onFeed,onEat,highlighted,feedingDisabled=false}:{feedingDisabled?:boolean;highlighted?:string|null;tank:Tank;onFeed:(pellet:string)=>void;onEat:(fish:string,pellet:string)=>void}){
 const canvas=useRef<HTMLCanvasElement>(null),live=useRef({tank,onFeed,onEat,highlighted}),pellets=useRef<Pellet[]>([]);
 useEffect(()=>{live.current={tank,onFeed,onEat,highlighted};},[tank,onFeed,onEat,highlighted]);
 function drop(x:number,y:number){if(feedingDisabled)return;const id=crypto.randomUUID();pellets.current.push({id,x:Math.max(25,Math.min(935,x)),y:Math.max(35,Math.min(505,y)),time:performance.now()});live.current.onFeed(id);}
 useEffect(()=>{
 const ctx=canvas.current?.getContext('2d');if(!ctx)return;
 ctx.setTransform(1.5,0,0,1.5,0,0);
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');let frame=0;

 const positions = new Map<string, SwimPosition>();
 const previousBreeding = new Map<string, number>();
 const successes = new Map<string, number>();
 const bites = new Map<string, { time: number; x: number; y: number }>();
 let previousTime: number | undefined;
 const ellipse=(x:number,y:number,rx:number,ry:number,color:string)=>{ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();};
 function draw(time:number){if(!ctx)return;const {tank}=live.current,t=reduced.matches?0:time/1000;
 const bounds=canvas.current?.getBoundingClientRect(); const artAspect=bounds ? (bounds.height/600)/(bounds.width/960) : 1; const mobileSize=bounds && bounds.width<700 ? .6 : 1;
 const seconds = previousTime === undefined ? 0 : (time - previousTime) / 1000; previousTime = time;
 const residentIds = new Set(tank.fish.map(fish => fish.id));
 for (const id of positions.keys()) if (!residentIds.has(id)) { positions.delete(id); bites.delete(id); }
 ctx.clearRect(0,0,960,600);

 for(const kind of ['guppy','platy','molly','swordtail'] as const){
   const progress=tank.breeding[kind]??0, previous=previousBreeding.get(kind);
   if(previous!==undefined&&previous>0&&previous<=COURTSHIP_SECONDS&&progress>COURTSHIP_SECONDS){
     const mother=tank.fish.find(f=>f.kind===kind&&pregnancyProgress(tank,f)>0);
     if(mother)successes.set(mother.id,time);
   }
   previousBreeding.set(kind,progress);
 }
 for(const [id,started] of successes)if(time-started>7000||!residentIds.has(id))successes.delete(id);
 const newborn=tank.fish.find(f=>f.motherId&&!f.diedAt&&Date.now()-f.born<12000);
 if(newborn){ctx.save();ctx.translate(480,190);ctx.scale(artAspect*mobileSize,mobileSize);ctx.fillStyle='#fff0bf';ctx.beginPath();ctx.roundRect(-145,-22,290,44,12);ctx.fill();ctx.font='bold 20px system-ui';ctx.textAlign='center';ctx.fillStyle='#67421c';ctx.fillText('New fry! Check the nursery',0,6);ctx.restore();}
 for(let i=0;i<12;i++){const y=520-(i*53+t*22)%500,x=900+Math.sin(t+i)*9;ctx.beginPath();ctx.arc(x,y,2+i%3,0,7);ctx.strokeStyle='#b5ece557';ctx.lineWidth=1;ctx.stroke();}
 if(!reduced.matches)for(const accessory of tank.accessories??[])if(accessory.kind==='air-stone'||accessory.kind==='sponge-filter')for(let b=0;b<6;b++){const rise=(t*26+b*32)%180;ctx.beginPath();ctx.arc(accessory.x*960+Math.sin(t+b)*3,accessory.y*600-20-rise,2+b%2,0,Math.PI*2);ctx.strokeStyle='#c2fbef88';ctx.stroke();}
 pellets.current=pellets.current.filter(p=>time-p.time<4000);const food=pellets.current.at(-1);
 for(const p of pellets.current)ellipse(p.x,Math.min(515,p.y+(time-p.time)/32),4,3,'#e9b36b');
 tank.fish.forEach((fish,i)=>{if(fish.diedAt){const p=positions.get(fish.id) ?? {x:200+i*100%600,y:80,direction:1};p.y=Math.max(45,p.y-seconds*25);positions.set(fish.id,p);ctx.save();ctx.translate(p.x,p.y);ctx.scale(1.8*growthScale(fish,Date.now())*artAspect*mobileSize,-1.8*growthScale(fish,Date.now())*mobileSize);ctx.globalAlpha=.6;paintFish(ctx,fish,0);ctx.restore();return;}const size=(fish.kind==='guppy'?1.8:2.1)*growthScale(fish,Date.now())*mobileSize; const food=pellets.current.at(-1); const currentBite=bites.get(fish.id); const chewing=currentBite!==undefined && time-currentBite.time<550; const phase=t*(.24+i%3*.035)+i*2.2;const young=!adult(fish,Date.now());const pregnancy=pregnancyProgress(tank,fish);const nearNursery=(young&&!!fish.motherId)||pregnancy>.65;let bx=nearNursery?215+Math.sin(phase)*(young?58:100):480+Math.sin(phase)*(290-i%4*35),by=nearNursery?450+Math.sin(phase*1.6)*22:100+i*89%330+Math.sin(phase*1.6)*15;
 const shelters=shelterAccessories(tank);
 if(shelters.length&&((young&&fish.motherId)||pregnancy>.65||fish.health<70||fish.overfed>=20||Math.floor(t/12+i)%5===0)){const shelter=shelters[i%shelters.length];bx=shelter.x*960+Math.sin(phase)*18;by=Math.min(515,shelter.y*600-45)+Math.sin(phase*1.6)*8;}
 const gravel=tank.accessories?.find(p=>p.kind==='river-gravel');
 if(gravel&&!young&&fish.health>=70&&Math.floor(t/10+i)%6===1){bx=gravel.x*960+Math.sin(phase)*22;by=Math.min(515,gravel.y*600-30);}
 const aerator=tank.accessories?.find(p=>p.kind==='air-stone');
 if(aerator&&tank.water<55){bx=aerator.x*960+Math.sin(phase)*30;by=95+i%3*25;}
 const pair=courtshipPair(tank,fish.kind);
 const courting=pair.some(parent=>parent.id===fish.id);
 const partner=courting&&fish.sex==='M'?pair[0]:undefined;
 const partnerPosition=partner?positions.get(partner.id):undefined;
 if(partnerPosition){bx=Math.max(85,Math.min(875,partnerPosition.x-60*partnerPosition.direction+Math.sin(t*3)*18));by=partnerPosition.y+Math.sin(t*2)*22;}
 const target = food ? { x: Math.max(75,Math.min(885,food.x-Math.sign(food.x-(positions.get(fish.id)?.x ?? bx))*25*size*artAspect)), y: Math.min(515,food.y+(time-food.time)/32) } : { x: bx, y: by }; const previous = positions.get(fish.id) ?? { x: young&&fish.motherId?220:bx, y: young&&fish.motherId?490:by, direction: Math.cos(phase)>=0?1:-1 }; const position = reduced.matches ? previous : swimToward(previous,chewing?previous:target,seconds,food?155:85); positions.set(fish.id,position); const { x, y, direction: dir } = position;
 if (!chewing && !reduced.matches) { const mouthX=x+dir*25*size*artAspect; const pellet=pellets.current.find(p=>Math.hypot(p.x-mouthX,Math.min(515,p.y+(time-p.time)/32)-y)<17); if(pellet){bites.set(fish.id,{time,x:pellet.x,y:Math.min(515,pellet.y+(time-pellet.time)/32)});pellets.current=pellets.current.filter(p=>p!==pellet);live.current.onEat(fish.id,pellet.id);} }
 const bite=bites.get(fish.id); const biteAge=bite?time-bite.time:Infinity; const biteProgress=biteAge<550?Math.max(.01,biteAge/550):0;
 if(live.current.highlighted===fish.id){ctx.beginPath();ctx.arc(x,y,63,0,Math.PI*2);ctx.strokeStyle="#fff3b0";ctx.lineWidth=2;ctx.stroke();ctx.fillStyle="#ffffff";ctx.beginPath();ctx.moveTo(x-5,y-74);ctx.lineTo(x+5,y-74);ctx.lineTo(x,y-65);ctx.fill();}
  const facing=position.facing ?? dir;
 const turn=1-Math.abs(facing);
 const bank=(i%2?1:-1);
 const visibleDirection=Math.sign(facing||dir);
 // Bank into a small arc and kick the fins instead of flattening into a line.
 ctx.save();ctx.translate(x,y+Math.sin(turn*Math.PI/2)*12*bank);
 ctx.rotate(bank*turn*.38*visibleDirection);
 ctx.scale(visibleDirection*size,size);
 ctx.transform(1,bank*turn*.12,0,1,0,0);
 ctx.rotate(Math.sin(t*2+i)*.025);
 const velocity=seconds>0?Math.hypot(x-previous.x,y-previous.y)/seconds:0;
 ctx.scale(artAspect,1);paintFish(ctx,fish,reduced.matches?0:t+i,biteProgress,turn,{fullness:fish.fullness,pregnancy},Math.min(1,velocity/155));ctx.restore();
 if(turn>.15){
   for(let trail=0;trail<3;trail++){
     ctx.beginPath();ctx.arc(x-visibleDirection*(35+trail*12),y+bank*(8+trail*5),2+trail*.6,0,Math.PI*2);
     ctx.strokeStyle=`rgba(185,240,250,${turn*(.5-trail*.1)})`;ctx.lineWidth=1;ctx.stroke();
   }
 }
 if(bite && biteAge<400){const spread=biteAge/20;ctx.globalAlpha=1-biteAge/400;for(let crumb=0;crumb<5;crumb++){const angle=crumb*Math.PI*2/5;ellipse(bite.x+Math.cos(angle)*spread,bite.y+Math.sin(angle)*spread,2,2,crumb%2?'#fff1a1':'#e9b36b');}ctx.globalAlpha=1;}
 const success=successes.get(fish.id);
 if(success!==undefined){
   const age=(time-success)/1000;ctx.save();ctx.translate(x,y-70);ctx.scale(artAspect*mobileSize,mobileSize);
   if(!reduced.matches)for(let particle=0;particle<10;particle++){const angle=particle*Math.PI/5;const radius=18+age*12;ctx.globalAlpha=Math.max(0,1-age/7);ctx.fillStyle=particle%2?'#fff1a2':'#ff91bc';ctx.font=particle%2?'bold 15px system-ui':'bold 20px system-ui';ctx.textAlign='center';ctx.fillText(particle%2?'✦':'♥',Math.cos(angle)*radius,Math.sin(angle)*radius-age*6);}
   ctx.globalAlpha=1;ctx.fillStyle='#fff1cc';ctx.beginPath();ctx.roundRect(-105,-15,210,30,10);ctx.fill();ctx.fillStyle='#a43f70';ctx.font='bold 13px system-ui';ctx.textAlign='center';ctx.fillText('♥ Courtship successful!',0,5);ctx.restore();
 }
 if(pregnancy>0&&success===undefined){ctx.save();ctx.translate(x,y-48);ctx.scale(artAspect*mobileSize,mobileSize);ctx.fillStyle='#fff1ca';ctx.beginPath();ctx.roundRect(-48,-20,96,19,5);ctx.fill();ctx.fillStyle='#735475';ctx.font='bold 11px monospace';ctx.textAlign='center';ctx.fillText(pregnancy>.85?'Nursery ready':'Expecting fry',0,-6);ctx.restore();}
 if(courting&&!food){ctx.save();ctx.translate(x,y-48);ctx.scale(artAspect*mobileSize,mobileSize);ctx.font='bold 13px system-ui';ctx.textAlign='center';ctx.fillStyle='#ffd6e7';ctx.fillText('♥ Courting',0,0);ctx.restore();}
 if(young&&fish.motherId&&Date.now()-fish.born<12000){ctx.fillStyle='#fff0ac';ctx.font='bold 15px monospace';ctx.textAlign='center';ctx.fillText('New fry!',x,y-22);}
 if((Math.floor(t+i*4.1)%19<2)||food&&i===0){const mood=food?'✦':fish.fullness<45?'?':tank.water<60?'!':'♥';ctx.font='18px system-ui';ctx.textAlign='center';ellipse(x,y-45,16,15,'#f3eee0');ctx.fillStyle=food?'#b87a2d':fish.fullness<45||tank.water<60?'#ac7051':'#cf7888';ctx.fillText(mood,x,y-39);}
 });
 if(tank.water<70){ctx.fillStyle=tank.water<45?'#82913b44':'#82913b18';ctx.fillRect(0,0,960,525);}
 frame=requestAnimationFrame(draw);
 }frame=requestAnimationFrame(draw);return()=>cancelAnimationFrame(frame);
 },[]);
 return <canvas data-tour="feed" ref={canvas} width={1440} height={900} role="button" tabIndex={feedingDisabled?-1:0} aria-label="Aquarium water. Tap or press Enter to drop one pellet" onPointerDown={e=>{const r=e.currentTarget.getBoundingClientRect();drop((e.clientX-r.left)*960/r.width,(e.clientY-r.top)*600/r.height);}} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();drop(480,130);}}}/>;
}


























