import type { Species } from './model';
import type { ColorVariety } from './varieties';
type RGB=[number,number,number];
const rgb=(hex:string):RGB=>[parseInt(hex.slice(1,3),16),parseInt(hex.slice(3,5),16),parseInt(hex.slice(5,7),16)];
const blend=(a:RGB,b:RGB,t:number):RGB=>a.map((n,i)=>n*(1-t)+b[i]*t) as RGB;
const ink:RGB=[25,35,39];

/** Deterministic markings retain the source silhouette, transparency and scale shading. */
export function recolorVariant(source:Uint8ClampedArray,width:number,height:number,kind:Species,sex:'M'|'F',color:ColorVariety):Uint8ClampedArray {
 const output=new Uint8ClampedArray(source),body=rgb(color.colors[0]),fin=rgb(color.colors[1]);
 for(let py=0;py<height;py++)for(let px=0;px<width;px++){
  const at=(py*width+px)*4;if(!source[at+3])continue;
  const x=px/width,y=py/height,isFin=x<.32||(x<.83&&(y<.33||y>.7));
  const luminance=(source[at]*.2126+source[at+1]*.7152+source[at+2]*.0722)/255;
  let base=isFin?fin:body;
  if(kind==='guppy'&&sex==='F'&&!isFin)base=blend(base,[185,188,169],.5);
  const pattern=color.pattern;
  if(pattern==='tuxedo'&&x>.3&&x<(color.id==='black-berlin'?.86:.7))base=ink;
  if(pattern==='wagtail'&&isFin)base=ink;
  if(pattern==='bicolor')base=blend(body,fin,Math.max(0,Math.min(1,(.8-x)*1.7)));
  const field=Math.sin(x*23+y*17)+Math.cos(y*31-x*12)+Math.sin(x*41-y*28)*.6;
  if(pattern==='koi')base=field>.25?fin:body;
  if(pattern==='gold-dust'&&x<.55+Math.sin(y*22)*.07)base=ink;
  if(pattern==='marble'&&field>.6)base=ink;
  if(pattern==='marble'&&field<-.9)base=fin;
  const cx=Math.floor(x*15),cy=Math.floor(y*10),seed=Math.sin(cx*127.1+cy*311.7)*43758.5453;
  const noise=seed-Math.floor(seed),dx=(x*15-cx)-.5,dy=(y*10-cy)-.5;
  if(pattern==='spots'&&noise>.43&&dx*dx+dy*dy<.06+noise*.05)base=ink;
  if(pattern==='grass'&&isFin&&noise>.32&&dx*dx+dy*dy<.035)base=ink;
  if(pattern==='mosaic'&&isFin&&field>.2)base=ink;
  if(pattern==='snakeskin'&&((!isFin&&Math.sin(x*95+Math.sin(y*34)*2)*Math.sin(y*85+Math.sin(x*21))>.45)||(isFin&&field>.5)))base=ink;
  if(pattern==='tailspot'){
   if(color.id==='tricolor-mickey'&&x>.6&&field>.1)base=fin;
   const circle=(cx:number,cy:number,rx:number,ry:number)=>((x-cx)/rx)**2+((y-cy)/ry)**2<1;
   if(circle(.36,.52,.039,.075)||circle(.399,.438,.025,.047)||circle(.399,.602,.025,.047))base=ink;
  }
  if(kind==='swordtail'&&color.id==='green'&&!isFin&&x>.39&&x<.91&&Math.abs(y-.51)<.018)base=[151,72,48];
  // Keep the small eye area readable; albino lines receive pink/red eyes.
  const eye=((x-.925)/.035)**2+((y-.45)/.075)**2<1;
  if(eye){base=color.albino?(luminance<.45?[150,35,46]:[246,171,167]):[source[at],source[at+1],source[at+2]];}
  const shade=eye?1:.6+luminance*.65;
  for(let channel=0;channel<3;channel++)output[at+channel]=Math.min(255,Math.round(base[channel]*shade));
 }
 return output;
}
