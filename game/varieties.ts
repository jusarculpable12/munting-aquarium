import type { Fish, Species } from './model';
export type Rarity = 'Common' | 'Uncommon' | 'Rare' | 'Legendary';
export type FishPattern = 'solid' | 'spots' | 'tuxedo' | 'koi' | 'tailspot' | 'wagtail' | 'snakeskin' | 'grass' | 'mosaic' | 'marble' | 'gold-dust' | 'bicolor';
export type FinForm = 'standard' | 'highfin' | 'pintail' | 'sailfin' | 'lyretail';
export type ColorVariety = { id:string; name:string; rarity:Rarity; colors:[string,string,string]; pattern?:FishPattern; fin?:FinForm; albino?:boolean; note?:string; fantasy?:boolean };
const v=(id:string,name:string,rarity:Rarity,colors:[string,string,string],pattern:FishPattern='solid',extra:Partial<Pick<ColorVariety,'fin'|'albino'|'note'>>={}):ColorVariety=>({id,name,rarity,colors,pattern,...extra});
const red:[string,string,string]=['#ed5034','#d93428','#ffb06a'];
const gold:[string,string,string]=['#f5bd36','#eb8b28','#fff0a5'];
const silver:[string,string,string]=['#d7e4e3','#b7cfce','#ffffff'];
const dark:[string,string,string]=['#202b31','#15212a','#72918c'];
const lavender:ColorVariety={...v('lavender','Lavender (fantasy)','Legendary',['#bd82ea','#8e58c1','#f4dcff']),fantasy:true};

// These are curated trade/strain entries, not an exhaustive biological classification.
// Rarity tiers and roll probabilities are fictional game balance. Existing IDs stay stable.
export const varieties:Record<Species,ColorVariety[]>={
 guppy:[
  v('sunset','Sunset','Common',['#29ced8','#f57629','#ffe45e'],'mosaic'),
  v('red','Full Red','Common',red),
  v('tuxedo','Blue Tuxedo','Uncommon',['#63bbd1','#3472ac','#c7f6ff'],'tuxedo'),
  v('cobra','Gold Cobra','Rare',gold,'snakeskin'),lavender,
  v('moscow-blue','Moscow Blue','Uncommon',['#296fae','#18589b','#71c8e0']),
  v('moscow-black','Black Moscow','Rare',dark),
  v('albino-red','Albino Full Red','Rare',red,'solid',{albino:true,note:'A red ornamental line with red/pink eyes and reduced dark pigmentation.'}),
  v('blue-grass','Blue Grass','Uncommon',['#8db9d4','#7ac0e3','#eefbff'],'grass'),
  v('red-mosaic','Red Mosaic','Common',['#7fb8cf','#ef5c32','#ffe5a1'],'mosaic'),
  v('red-cobra','Red Cobra','Uncommon',['#c9b76b','#e95835','#fff2aa'],'snakeskin'),
  v('yellow-cobra','Yellow Cobra','Uncommon',['#d4bf5b','#f4ce42','#fff2b0'],'snakeskin'),
  v('green-cobra','Green Cobra','Rare',['#69ab7b','#83c668','#e8f7ad'],'snakeskin'),
  v('red-tuxedo','Red Tuxedo','Common',['#b7bcad','#e74f32','#ffe9b5'],'tuxedo'),
  v('yellow-tuxedo','Yellow Tuxedo','Uncommon',['#c8c89e','#f0cc40','#fff7b0'],'tuxedo'),
  v('koi','Koi','Rare',['#eee5d5','#ed6c3e','#ffffff'],'koi'),
  v('platinum-red-tail','Platinum Red Tail','Rare',['#d6e2df','#e54b35','#ffffff']),
  v('purple','Purple','Uncommon',['#a58bc9','#9871bc','#e8d9ef']),
  v('moscow-purple','Moscow Purple','Rare',['#70558b','#5c437f','#bca6d1']),
 ],
 platy:[
  v('orange','Orange','Common',['#f6a13a','#ed7528','#ffe6a0']),v('red','Red','Common',red),
  v('wagtail','Red Wagtail','Uncommon',red,'wagtail'),
  v('mickey','Mickey Mouse','Rare',gold,'tailspot'),lavender,
  v('gold','Gold','Common',gold),
  v('sunset','Sunset','Common',['#f1be45','#e75530','#fff0b1'],'bicolor'),
  v('gold-wagtail','Gold Wagtail','Common',gold,'wagtail'),
  v('neon-blue-wagtail','Neon Blue Wagtail','Uncommon',['#69becb','#4d9bb4','#c9f9ea'],'wagtail'),
  v('red-mickey','Red Mickey Mouse','Uncommon',red,'tailspot'),
  v('blue-mickey','Blue Mickey Mouse','Rare',['#81b7ce','#6ca8c7','#e3f8f4'],'tailspot'),
  v('tricolor-mickey','Tricolor Mickey Mouse','Rare',['#eee2bd','#e67b36','#fff6dc'],'tailspot',{note:'A multicolored ornamental platy with the characteristic dark tail-base marking.'}),
  v('tuxedo-red','Tuxedo Red','Uncommon',red,'tuxedo'),
  v('panda','Panda','Rare',silver,'tuxedo'),
  v('calico','Calico','Uncommon',['#e9d7af','#e5863a','#fff4d3'],'marble'),
  v('bumblebee','Bumblebee','Uncommon',gold,'gold-dust'),
  v('highfin-sunset','Sunset High-fin','Rare',['#edb744','#e65932','#fff0af'],'bicolor',{fin:'highfin'}),
  v('pintail-red-wagtail','Red Wagtail Pintail','Rare',red,'wagtail',{fin:'pintail'}),
 ],
 molly:[
  v('black','Black','Common',dark),v('silver','Silver','Common',silver),v('gold','Gold','Uncommon',gold),
  v('dalmatian','Dalmatian','Rare',silver,'spots'),lavender,
  v('platinum','Platinum','Uncommon',['#edf1e8','#d8e4df','#ffffff']),
  v('gold-dust','Gold Dust','Uncommon',gold,'gold-dust'),
  v('white-marble','White Marble','Rare',silver,'marble'),
  v('gold-marble','Gold Marble','Rare',gold,'marble'),
  v('leopard','Leopard','Uncommon',['#dbc174','#c9a547','#fff1ac'],'spots'),
  v('sailfin-black','Black Sailfin','Rare',dark,'solid',{fin:'sailfin',note:'A black sailfin-form molly. Sailfin describes the dorsal fin, not a separate body color.'}),
  v('lyretail-black','Black Lyretail','Uncommon',dark,'solid',{fin:'lyretail'}),
  v('sailfin-lyretail-gold-dust','Gold Dust Sailfin Lyretail','Rare',gold,'gold-dust',{fin:'lyretail',note:'Gold-and-dark markings with both an enlarged dorsal fin and lyre-shaped tail.'}),
 ],
 swordtail:[
  v('red','Red','Common',red),v('green','Green','Common',['#76a87d','#88af68','#e6efbb']),
  v('pineapple','Yellow Pineapple','Uncommon',['#efc847','#e98a35','#fff3b5'],'bicolor'),
  v('koi','Kohaku Koi','Rare',['#eee6dc','#ed6542','#ffffff'],'koi'),lavender,
  v('red-wagtail','Red Wagtail','Common',red,'wagtail'),
  v('marigold-wagtail','Marigold Wagtail','Common',['#eeb83d','#e97d32','#fff2ae'],'wagtail'),
  v('green-pineapple','Green Pineapple','Uncommon',['#9fb25e','#dab645','#f3f0b2'],'bicolor'),
  v('tricolor','Tricolor','Rare',['#e8dfcc','#e96c3c','#ffffff'],'marble'),
  v('bicolor','Red & White Bicolor','Uncommon',['#eee7d6','#e95935','#ffffff'],'bicolor'),
  v('tuxedo-red','Tuxedo Red','Uncommon',red,'tuxedo'),
  v('black-berlin','Black Berlin','Rare',['#64746b','#72815a','#d5d9b1'],'tuxedo'),
  v('lyretail-red','Red Lyretail','Rare',red,'solid',{fin:'lyretail'}),
  v('lyretail-green-pineapple','Green Pineapple Lyretail','Rare',['#a1b465','#d8b044','#f2f1c3'],'bicolor',{fin:'lyretail'}),
 ],
};
export const rarityOdds='Common 60% · Uncommon 28% · Rare 10% · Legendary 2%';
export function rollVariety(kind:Species,random=Math.random):ColorVariety {
 const roll=random(),rarity:Rarity=roll<.6?'Common':roll<.88?'Uncommon':roll<.98?'Rare':'Legendary';
 const options=varieties[kind].filter(color=>color.rarity===rarity);
 return options[Math.min(options.length-1,Math.floor(random()*options.length))];
}
export function colorVariety(fish:Pick<Fish,'kind'|'rare'>&{variant?:string}):ColorVariety {
 return varieties[fish.kind].find(color=>color.id===fish.variant)??(fish.rare?lavender:varieties[fish.kind][0]);
}
export const fishLabel=(fish:Pick<Fish,'kind'|'rare'>&{variant?:string})=>colorVariety(fish).name;
export const variantTraits=(color:ColorVariety)=>[color.albino?'Albino eyes':null,color.fin&&color.fin!=='standard'?({highfin:'High-fin',sailfin:'Sailfin',lyretail:'Lyretail',pintail:'Pintail'}[color.fin]):null,color.id==='sailfin-lyretail-gold-dust'?'Sailfin':null].filter(Boolean).join(' · ');
