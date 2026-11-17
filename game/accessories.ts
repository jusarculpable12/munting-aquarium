import { accessoryArt } from './accessory-art.ts';
const artificialPlants = [
 {id:'coin-bush',name:'Coin-leaf bush',size:'Small',price:15,slots:1,cell:0},
 {id:'grass-tuft',name:'Fine grass tuft',size:'Small',price:15,slots:1,cell:1},
 {id:'mini-fern',name:'Mini fern bush',size:'Small',price:15,slots:1,cell:2},
 {id:'spear-leaf',name:'Spear-leaf bunch',size:'Medium',price:25,slots:2,cell:3},
 {id:'oval-stem',name:'Oval-leaf stem',size:'Medium',price:25,slots:2,cell:4},
 {id:'scalloped-leaf',name:'Scalloped-leaf cluster',size:'Medium',price:25,slots:2,cell:5},
 {id:'ribbon-grass',name:'Ribbon grass',size:'Medium',price:25,slots:2,cell:6},
 {id:'lance-stem',name:'Tall lance-leaf stem',size:'Tall',price:40,slots:3,cell:7},
 {id:'lime-leaf',name:'Lime-leaf cluster',size:'Tall',price:40,slots:3,cell:8},
 {id:'oval-vine',name:'Branching oval vine',size:'Tall',price:40,slots:3,cell:9},
 {id:'leaf-thicket',name:'Dense leaf thicket',size:'Tall',price:40,slots:3,cell:10},
 {id:'pink-stem',name:'Pink-tip leafy stem',size:'Tall',price:40,slots:3,cell:11},
] as const;
export const plantCatalog = [
 ...artificialPlants.map(p=>({...p,category:'Artificial' as const,benefit:'Shelter for fry and resting fish.'})),
 {id:'live-fern',name:'Live Java fern',size:'Medium',price:60,slots:2,cell:2,category:'Live plant',benefit:'Cover and up to 15% slower nutrient buildup with a plant light.'},
 {id:'shelter-cave',name:'River-stone cave',size:'Medium',price:35,slots:2,cell:-1,category:'Shelter',benefit:'A retreat for fry, expecting females and fish needing rest.'},
 {id:'sponge-filter',name:'Sponge filter',size:'Medium',price:80,slots:2,cell:-1,category:'Equipment',benefit:'Gentle filtration: 15% slower waste buildup.'},
 {id:'power-filter',name:'Internal filter',size:'Tall',price:140,slots:3,cell:-1,category:'Equipment',benefit:'25% slower waste buildup. Filter bonuses do not stack.'},
 {id:'air-stone',name:'Air stone',size:'Small',price:30,slots:1,cell:-1,category:'Equipment',benefit:'Aeration zone: fish in poor water visit the upper water nearby. Does not remove waste.'},
 {id:'heater',name:'Heater & thermometer',size:'Medium',price:75,slots:2,cell:-1,category:'Equipment',benefit:'Stable-temperature comfort: +3 happiness when basic care is good.'},
 {id:'led-light',name:'Plant LED light',size:'Small',price:45,slots:1,cell:-1,category:'Equipment',benefit:'Enables live plant nutrient benefits. One per tank.'},
 {id:'tank-lid',name:'Tank cover',size:'Small',price:20,slots:1,cell:-1,category:'Equipment',benefit:'Decorative cover; real covers reduce evaporation and jumping. No extra capacity.'},
 {id:'river-gravel',name:'River gravel mound',size:'Small',price:15,slots:1,cell:-1,category:'Substrate',benefit:'A natural foraging spot. Does not clean waste.'},
] as const;
export type PlantId = typeof plantCatalog[number]['id'];
export type PlacedPlant = {id:string;kind:PlantId;x:number;y:number;layer?:'back'|'front';paidPrice?:number};
export const plantDefinition=(id:PlantId)=>plantCatalog.find(p=>p.id===id)!;
export const accessoryLimit=(tank:{size:number})=>4+tank.size*2;
export const accessoryLoad=(tank:{accessories?:PlacedPlant[]})=>(tank.accessories??[]).reduce((sum,p)=>sum+plantDefinition(p.kind).slots,0);
const equipmentHeights:Partial<Record<PlantId,number>>={'shelter-cave':20,'sponge-filter':18,'power-filter':22,'air-stone':11,'heater':23,'led-light':7,'tank-lid':7,'river-gravel':7};
export const plantHeight=(kind:PlantId)=>equipmentHeights[kind]??({Small:14,Medium:23,Tall:33}[plantDefinition(kind).size]);
export const accessoryVisitorBonus=(tank:{accessories?:PlacedPlant[]})=>Math.min(2,Math.floor(accessoryLoad(tank)/2));

export const hasAccessory=(tank:{accessories?:PlacedPlant[]},kind:PlantId)=>(tank.accessories??[]).some(p=>p.kind===kind);
export const shelterAccessories=(tank:{accessories?:PlacedPlant[]})=>(tank.accessories??[]).filter(p=>['Artificial','Live plant','Shelter'].includes(plantDefinition(p.kind).category));
/** Fictional bounded bonuses; never bypass feeding, water changes or stocking rules. */
export function accessoryEffects(tank:{accessories?:PlacedPlant[]}) {
 const filtration=hasAccessory(tank,'power-filter')?.25:hasAccessory(tank,'sponge-filter')?.15:0;
 const plants=hasAccessory(tank,'live-fern')&&hasAccessory(tank,'led-light')?.15:0;
 return {wasteMultiplier:1-filtration-plants,comfort:hasAccessory(tank,'heater')?3:0};
}
/** Shared raster sprites keep shop portraits and placed accessories visually identical. */
export function accessorySpriteStyle(kind:PlantId) {
 const {width,height}=accessoryArt[kind];
 return {backgroundImage:`url('/art/accessories-v2/${kind}.png')`,backgroundSize:'100% 100%',backgroundPosition:'center',aspectRatio:`${width}/${height}`};
}

/** Older saves were purchased under the original 5-coins-per-slot pricing. */
export const accessoryRefund=(item:PlacedPlant)=>item.paidPrice??plantDefinition(item.kind).slots*5;
export const accessoryPriceRange={min:Math.min(...plantCatalog.map(p=>p.price)),max:Math.max(...plantCatalog.map(p=>p.price))};
