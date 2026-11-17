"use client";
import { useEffect, useRef, useState } from 'react';
import { kinds, species, type Save, type Species } from '../game/model';
import { varieties, variantTraits } from '../game/varieties';
import { discoveredVariants, discoveryKeys } from '../game/discoveries';
import { fieldGuide, guideSources, variantNote, variantOdds } from '../game/field-guide';
import FishPortrait from './FishPortrait';
import BookTutorial from './BookTutorial';

export default function FishBook({save,open,onClose,tutorial=false,onTutorialComplete}:{save:Save;open:boolean;onClose:()=>void;tutorial?:boolean;onTutorialComplete?:()=>void}) {
 const dialog=useRef<HTMLDialogElement>(null);
 const carePage=useRef<HTMLElement>(null),colorPage=useRef<HTMLElement>(null);
 const [kind,setKind]=useState<Species>('guppy');
 const [guideStep,setGuideStep]=useState(0);
 useEffect(()=>{if(open && tutorial){setKind('guppy');setGuideStep(0);}},[open,tutorial]);
 function guideMove(step:number){setGuideStep(step);if(step<4)setKind(kinds[step]);}
 function closeBook(){if(tutorial && guideStep===5 && onTutorialComplete)onTutorialComplete();else onClose();}
 const [sex,setSex]=useState<'F'|'M'>('M');
 useEffect(()=>{carePage.current?.scrollTo({top:0});colorPage.current?.scrollTo({top:0});},[kind]);
 const found=discoveredVariants(save),guide=fieldGuide[kind];
 const featured=varieties[kind].find(color=>found.has(`${kind}:${color.id}`))??varieties[kind][0];
 const pageFound=varieties[kind].filter(color=>found.has(`${kind}:${color.id}`)).length;
 useEffect(()=>{const node=dialog.current;if(open&&!node?.open)node?.showModal();else if(!open&&node?.open)node.close();},[open]);
 return <dialog ref={dialog} className="fish-book" aria-labelledby="fish-book-title" onCancel={event=>{event.preventDefault();closeBook();}}>
  {open&&<><header className="book-heading"><div><span className="book-kicker">MUNTING FIELD GUIDE</span><h2 id="fish-book-title">My fish book</h2></div><div className="book-total" aria-live="polite">{found.size}/{discoveryKeys.length} discovered</div><button type="button" className="book-close" aria-label="Close fish book" onClick={closeBook}>×</button></header>
  <nav className="book-species" aria-label="Book species">{kinds.map(item=>{
   const colors=varieties[item],collected=colors.filter(color=>found.has(`${item}:${color.id}`)),preview=collected[0]??colors[0];
   return <button data-book-tour={item} type="button" key={item} aria-label={`${species[item].name}, ${collected.length} of ${colors.length} discovered`} aria-pressed={kind===item} onClick={()=>{setKind(item);if(tutorial)setGuideStep(kinds.indexOf(item));}}><span className="book-tab-fish" aria-hidden="true"><FishPortrait silhouette={!collected.length} fish={{kind:item,sex:'M',rare:preview.id==='lavender',variant:preview.id}}/></span><span>{species[item].name}<small>{collected.length}/{colors.length}</small></span></button>;
  })}</nav>
  <div className="book-spread">
   <article ref={carePage} className="book-care" tabIndex={0} aria-label="Species care notes"><span className="book-kicker">SPECIES NOTES</span><h3>{species[kind].name}</h3><i>{guide.scientific}</i><div className="book-species-portrait"><FishPortrait silhouette={!pageFound} fish={{kind,sex,rare:featured.id==='lavender',variant:featured.id}}/><span>Livebearer · {sex==='M'?'Male':'Female'}</span></div><p>{guide.appearance}</p><h4>Care & company</h4><p>{guide.care}</p><h4>How they breed</h4><p>{guide.breeding}</p><div className="book-game-facts"><strong>In our aquarium</strong><span>{species[kind].load} stocking {species[kind].load===1?'space':'spaces'} · {species[kind].water}% minimum water quality</span><span>{kind==='molly'?'Hard-water setup required':'Standard or hard-water setup'}</span><span>30 game minutes to adulthood · healthy adult pair needed for breeding</span></div><details className="book-references"><summary>About these notes & sources</summary><p>Care notes summarize the sources below. Game timers, water-quality scores, colors, coin values and rarity tiers are fictional balance choices. This is a curated collection, not every existing strain. Ornamental names can vary between breeders. Colors and fin forms can combine. Odds are rounded and equal within each rarity tier; birth colors are random game rolls, not a genetic model. Lavender is a fantasy variant.</p>{guideSources.map(source=><a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.name} ↗</a>)}</details></article>
   <section ref={colorPage} tabIndex={0} className="book-collection" aria-label={`${species[kind].name} variants`}><div className="book-variants-heading"><div><span className="book-kicker">COLOR COLLECTION</span><h3>{pageFound}/{varieties[kind].length} revealed</h3></div><label>View <select aria-label="Book fish sex" value={sex} onChange={event=>setSex(event.target.value as 'M'|'F')}><option value="M">Male</option><option value="F">Female</option></select></label></div><p className="book-help">Buy or breed a color to reveal it. Discoveries remain after selling or moving fish.</p><div className="book-variant-grid">{varieties[kind].map((color,index)=>{const unlocked=found.has(`${kind}:${color.id}`);return <article key={color.id} className={`book-variant ${unlocked?'is-discovered':'is-locked'}`} aria-label={unlocked?`${color.name}, discovered`:`Variant ${index+1}, not discovered`}><div className="book-portrait"><FishPortrait silhouette={!unlocked} fish={{kind,sex,rare:color.id==='lavender',variant:color.id}}/>{!unlocked&&<span className="book-lock" aria-hidden="true">?</span>}</div><div><span className={`rarity rarity-${color.rarity.toLowerCase()}`}>{color.rarity}</span><h4>{unlocked?color.name:'Undiscovered'}</h4>{unlocked&&variantTraits(color)&&<small className="book-traits">{variantTraits(color)}</small>}<small>≈ {variantOdds(kind,color)}% chance per purchase or birth</small><p>{unlocked?variantNote(kind,color):'Collect this color to reveal its name and notes.'}</p></div></article>;})}</div></section>
  </div><footer className="book-footer">A growing record of your discoveries · Saved with your aquarium</footer>{tutorial&&<BookTutorial step={guideStep} onStep={guideMove}/>}</>}
 </dialog>;
}
