"use client";
import { useEffect, useState } from 'react';

const assets=['/art/aquarium-scene.png','/art/aquarium-gravel.png','/art/tool-icons.png','/art/fish-book-icon.png'];
export default function IntroScreen({saveReady,onComplete}:{saveReady:boolean;onComplete:()=>void}) {
  const [loaded,setLoaded]=useState(0);
  const [minimumPassed,setMinimumPassed]=useState(false);
  const [leaving,setLeaving]=useState(false);
  useEffect(()=>{
    let cancelled=false;
    const timers:ReturnType<typeof setTimeout>[]=[],images:HTMLImageElement[]=[];
    timers.push(setTimeout(()=>setMinimumPassed(true),1600));
    for(const source of assets){
      const image=new Image();images.push(image);
      let settled=false;
      const finish=()=>{if(settled)return;settled=true;if(!cancelled)setLoaded(count=>count+1);};
      image.onload=()=>{void image.decode().catch(()=>{}).then(finish);};
      image.onerror=finish;image.src=source;
      // A failed/slow image must never trap a player on the opening screen.
      timers.push(setTimeout(finish,8000));
    }
    return()=>{cancelled=true;timers.forEach(clearTimeout);images.forEach(image=>{image.onload=null;image.onerror=null;});};
  },[]);
  useEffect(()=>{
    if(!saveReady||loaded<assets.length||!minimumPassed)return;
    setLeaving(true);
    const timer=setTimeout(onComplete,240);
    return()=>clearTimeout(timer);
  },[saveReady,loaded,minimumPassed,onComplete]);
  const progress=Math.round((loaded+(saveReady?1:0))/(assets.length+1)*100);
  return <section className={'intro-screen'+(leaving?' is-leaving':'')} aria-labelledby="intro-title" aria-label="Opening Munting Aquarium">
    <div className="intro-rays" aria-hidden="true"/>
    <div className="intro-center">
      <div className="intro-fish" aria-hidden="true"><img src="/art/fish-logo.png" alt="" width="150" height="150"/></div>
      <div className="intro-sign"><span className="intro-greeting">MABUHAY! WELCOME TO</span><h1 id="intro-title">Munting<br/><span>Aquarium</span></h1><span className="intro-sign-dot left" aria-hidden="true"/><span className="intro-sign-dot right" aria-hidden="true"/></div>
      <p className="intro-tagline">A little aquarium. A world of discoveries.</p>
      <div className="intro-loading"><progress max="100" value={progress} aria-label="Loading your aquarium"/><p role="status">{progress===100?'Your aquarium is ready…':'Preparing your aquarium…'}</p></div>
      <span className="intro-caption">Raise fish · Discover colors · Fill your book</span>
    </div>
  </section>;
}
