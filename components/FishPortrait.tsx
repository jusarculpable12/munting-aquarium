"use client";
import { useEffect, useRef } from 'react';
import { loadFishArt, paintFish } from '../game/fish-art';
import type { Fish } from '../game/model';
import { colorVariety } from '../game/varieties';
export default function FishPortrait({ fish, silhouette = false }: { silhouette?: boolean; fish: Pick<Fish, 'kind' | 'sex' | 'rare' | 'variant'> }) {
 const canvas=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{let active=true;void loadFishArt().then(()=>{if(!active)return;const ctx=canvas.current?.getContext('2d');if(!ctx)return;ctx.clearRect(0,0,240,140);ctx.save();ctx.translate(155,70);const variety=colorVariety(fish),tall=variety.fin==='highfin'||variety.fin==='sailfin'||variety.id==='sailfin-lyretail-gold-dust';const scale=tall?1.7:variety.fin==='lyretail'?2:2.4;ctx.scale(scale,scale);ctx.filter=silhouette?'brightness(0)':'none';paintFish(ctx,fish);ctx.restore();});return()=>{active=false;};},[fish.kind,fish.sex,fish.rare,fish.variant,silhouette]);
 return <canvas className="fish-portrait" ref={canvas} width={240} height={140} role="img" aria-label={silhouette?`Undiscovered ${fish.kind} silhouette`:`${fish.variant ?? ''} ${fish.kind} illustration`}/>;
}
