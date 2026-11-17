"use client";
import { useRef, useState, type PointerEvent } from 'react';
import { plantDefinition, plantHeight, accessorySpriteStyle, type PlacedPlant } from '../game/accessories';

export default function AccessoryLayer({plants,editing,onMove,onLayer}:{plants:PlacedPlant[];editing:boolean;onLayer:(id:string,layer:'front'|'back')=>void;onMove:(id:string,x:number,y:number)=>void}) {
 const [selected,setSelected]=useState<string|null>(null);
 const chosen=plants.find(p=>p.id===selected);
 const area=useRef<HTMLDivElement>(null);
 const grabOffset=useRef({x:0,y:0});
 const [drag,setDrag]=useState<{id:string;x:number;y:number}|null>(null);
 function position(event:PointerEvent){const r=area.current!.getBoundingClientRect();return {x:Math.max(.04,Math.min(.93,(event.clientX-r.left)/r.width+grabOffset.current.x)),y:Math.max(.82,Math.min(.94,(event.clientY-r.top)/r.height+grabOffset.current.y))};}
 return <div ref={area} className={`accessory-layer ${editing?'is-editing':''}`} aria-label={editing?'Arrange aquarium accessories':undefined}>
  <div className="nursery-occluder" aria-hidden="true"/>
  {[...plants].sort((a,b)=>a.y-b.y).map(plant=>{const item=plantDefinition(plant.kind),p=drag?.id===plant.id?drag:plant;return <button key={plant.id} type="button" disabled={!editing} aria-hidden={!editing} tabIndex={editing?0:-1} className="placed-plant" data-kind={plant.kind} aria-label={`Move ${item.name}. Drag or use arrow keys.`} style={{zIndex:plant.layer==='back'?0:2,left:`${p.x*100}%`,top:`${p.y*100}%`,height:`${plantHeight(plant.kind)}cqh`,aspectRatio:accessorySpriteStyle(plant.kind).aspectRatio}}
   onFocus={()=>setSelected(plant.id)} onPointerDown={event=>{setSelected(plant.id);event.preventDefault();event.stopPropagation();event.currentTarget.setPointerCapture(event.pointerId);const r=area.current!.getBoundingClientRect();grabOffset.current={x:plant.x-(event.clientX-r.left)/r.width,y:plant.y-(event.clientY-r.top)/r.height};setDrag({id:plant.id,x:plant.x,y:plant.y});}}
   onPointerMove={event=>{if(drag?.id===plant.id)setDrag({id:plant.id,...position(event)});}}
   onPointerUp={event=>{if(drag?.id!==plant.id)return;const p=position(event);onMove(plant.id,p.x,p.y);setDrag(null);}}
   onPointerCancel={()=>setDrag(null)}
   onKeyDown={event=>{const moves:Record<string,[number,number]>={ArrowLeft:[-.02,0],ArrowRight:[.02,0],ArrowUp:[0,-.01],ArrowDown:[0,.01]};const move=moves[event.key];if(move){event.preventDefault();onMove(plant.id,plant.x+move[0],plant.y+move[1]);}}}
  ><span className="accessory-art" style={accessorySpriteStyle(plant.kind)}/><span className="accessory-gravel"/></button>;})}
 {editing&&chosen&&<div className="accessory-depth-tools"><strong>{plantDefinition(chosen.kind).name}</strong><button type="button" aria-pressed={chosen.layer==='back'} onClick={()=>onLayer(chosen.id,'back')}>Behind cave</button><button type="button" aria-pressed={(chosen.layer??'front')==='front'} onClick={()=>onLayer(chosen.id,'front')}>In front</button></div>}
 </div>;
}

