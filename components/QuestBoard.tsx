"use client";
import { useEffect, useRef, useState } from 'react';
import { customerName, matchesOrder, orderVariant, species, type Action, type Fish, type Save } from '../game/model';
import FishPortrait from './FishPortrait';

export default function QuestBoard({save,now,onAction}:{save:Save;now:number;onAction:(action:Action)=>void}) {
  const order=save.order, color=orderVariant(order), baby=order.age==='baby';
  const matching=save.tanks.flatMap((tank,home)=>tank.fish.filter(fish=>matchesOrder(fish,order,now)).map(fish=>({fish,home})));
  const [pending,setPending]=useState<{fish:Fish;home:number;order:number;reward:number;name:string;customer:string;age:string}|null>(null);
  const dialog=useRef<HTMLDialogElement>(null);
  const board=useRef<HTMLElement>(null);
  useEffect(()=>{board.current?.closest(".panel")?.scrollTo({top:0});},[order.id]);
  useEffect(()=>{const node=dialog.current;if(pending&&!node?.open)node?.showModal();else if(!pending&&node?.open)node.close();},[pending]);
  const stillMatches=!!pending&&pending.order===order.id&&save.tanks[pending.home]?.fish.some(f=>f.id===pending.fish.id&&matchesOrder(f,order,now));
  return <section ref={board} className="quest-board" aria-label="Customer quests">
    <p className="eyebrow">CUSTOMER REQUEST</p><h2>A fish for {customerName(order)}</h2>
    <article className="quest-request">
      <div className="quest-fish"><FishPortrait fish={{kind:order.kind,sex:'F',rare:order.rare,variant:color.id}}/><div><span className="quest-age">{baby?'Baby · bred fry':'Adult'}</span><h3>{color.name} {species[order.kind].name}</h3><span className={'rarity rarity-'+color.rarity.toLowerCase()}>{color.rarity}</span></div></div>
      <p>“I’m looking for <strong>1 {baby?'baby':'adult'} {color.name} {species[order.kind].name}</strong>. I’ll buy it for <strong>{order.reward} coins</strong>!”</p>
      <div className="quest-offer"><span>Offer for 1 fish</span><strong>◉ {order.reward} coins</strong></div>
    </article>
    <p className="hint">{baby?'Baby means a fish born in your aquarium that has not grown into an adult. Shop juveniles do not count.':'Only living, settled adult fish of this exact species and variant qualify.'} Either sex is welcome. No deadline.</p>
    <h3>{matching.length} matching fish in your tanks</h3>
    {!matching.length&&<div className="quest-empty">{baby ? "No match yet. Breed this variant, or meet another customer. Fry can outgrow a baby request—check their age before selling." : "No match yet. Buy or breed this variant and raise it to adulthood, or meet another customer."}</div>}
    {matching.map(({fish,home})=><div className="list-row quest-match" key={fish.id}><FishPortrait fish={fish}/><div><strong>{color.name} {species[fish.kind].name}</strong><small>Tank {home+1} · {fish.sex==='F'?'Female':'Male'} · {baby?'Baby (fry)':'Adult'}</small><small>Health {Math.ceil(fish.health)}%</small></div><button onClick={()=>setPending({fish,home,order:order.id,reward:order.reward,name:color.name+" "+species[fish.kind].name,customer:customerName(order),age:baby?"Baby (fry)":"Adult"})}>Offer this fish</button></div>)}
    <button className="action" onClick={()=>onAction({type:'next-order',tank:0})}>Meet another customer</button><p className="hint">A completed request pays once and brings a new customer. Skipping is free and sells nothing. Book discoveries stay unlocked. Prices are fictional game coins.</p>
    <dialog ref={dialog} className="sale-dialog" aria-labelledby="quest-sale-title" onCancel={()=>setPending(null)}>
      {pending&&<><div className="sale-dialog-heading"><h2 id="quest-sale-title">Complete this quest?</h2><button aria-label="Close quest confirmation" onClick={()=>setPending(null)}>×</button></div><div className="sale-dialog-content"><p>Sell <strong>{pending.name}</strong> ({pending.age}) from Tank {pending.home+1} to {pending.customer}?</p><p>You receive <strong>{pending.reward} coins</strong>. This fish leaves your aquarium.</p>{!stillMatches&&<p role="status">The request or fish has changed. Choose a matching fish again.</p>}<div className="sale-dialog-actions"><button autoFocus onClick={()=>setPending(null)}>Keep fish</button><button disabled={!stillMatches} onClick={()=>{onAction({type:'sell',tank:pending.home,fish:pending.fish.id,order:pending.order});setPending(null);}}>Sell for {pending.reward} coins</button></div></div></>}
    </dialog>
  </section>;
}
