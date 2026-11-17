import type { Species } from './model';
import { varieties, variantTraits, type ColorVariety, type FishPattern } from './varieties';

export const fieldGuide: Record<Species, { scientific: string; appearance: string; care: string; breeding: string }> = {
 guppy: {scientific:'Poecilia reticulata',appearance:'A small livebearer famous for colorful tails. Males often have larger, brighter fins; females tend to be larger-bodied.',care:'Give these active fish gentle filtration and plenty of cover. Protect delicate fins from fin-nipping tankmates.',breeding:'Females give birth to swimming fry. Dense plants help the babies hide from larger fish, including adults of their own species.'},
 platy: {scientific:'Xiphophorus maculatus / X. variatus strains',appearance:'A compact, deep-bodied livebearer with a short tail. Aquarium strains come in many colors and markings.',care:'Offer a varied omnivorous diet, clean water and peaceful companions. Provide retreats so females can escape persistent attention.',breeding:'Platies are livebearers. In real aquariums, leave room for a growing population and provide safe cover for fry.'},
 molly: {scientific:'Poecilia species and aquarium hybrids',appearance:'A sturdy livebearer. Common aquarium forms include black, silver, gold and spotted strains; body and fin shapes vary.',care:'Mollies appreciate mineral-rich water and vegetable matter in a varied diet. Our game requires the hard-water setup.',breeding:'Mollies give birth to live fry. The game simplifies pregnancy into a short timer; real pregnancies take weeks.'},
 swordtail: {scientific:'Xiphophorus hellerii strains',appearance:'An active, elongated livebearer. Adult males typically develop the long lower tail extension that gives swordtails their name.',care:'Provide generous swimming space, peaceful tankmates and a secure cover: swordtails can jump.',breeding:'Swordtails give birth to live fry. Provide cover and avoid crowding as young fish grow.'},
};
const notes: Record<string,string> = {
 'guppy:sunset':'Warm red-orange tail colors contrast with a bright blue-green body in this game design.',
 'guppy:red':'A red-focused ornamental guppy color form.',
 'guppy:tuxedo':'A dark rear-body pattern contrasts with brighter body and fin colors.',
 'guppy:cobra':'A patterned guppy inspired by ornamental cobra strains, with gold tones and dark markings.',
 'platy:orange':'A bright orange ornamental platy color form.',
 'platy:red':'A warm red ornamental platy color form.',
 'platy:wagtail':'Red-orange body colors contrast with dark fins.',
 'platy:mickey':'A dark marking near the tail base gives this ornamental form its familiar name.',
 'molly:black':'A dark ornamental molly form with restrained highlights so its scales remain readable.',
 'molly:silver':'A pale, reflective silver ornamental color form.',
 'molly:gold':'Warm gold and yellow tones define this ornamental color form.',
 'molly:dalmatian':'Contrasting dark spots on a pale body give this form its dalmatian name.',
 'swordtail:red':'A vivid red-orange ornamental swordtail form.',
 'swordtail:green':'Green body tones recall the natural-looking swordtail palette.',
 'swordtail:pineapple':'A warm yellow-orange ornamental palette with darker accents in this game.',
 'swordtail:koi':'Pale areas contrast with red-orange koi-inspired markings.',
};
const patternNotes:Record<FishPattern,string>={solid:'A predominantly solid-color ornamental form.',spots:'Dark scattered spots contrast with the underlying body color.',tuxedo:'A dark rear-body area contrasts with the other body and fin colors.',koi:'Pale areas contrast with red-orange koi-inspired patches.',tailspot:'A group of dark spots at the tail base resembles the familiar Mickey Mouse marking.',wagtail:'Dark fins and tail contrast with a colored body.',snakeskin:'Winding dark markings suggest the cobra or snakeskin ornamental pattern.',grass:'Fine scattered markings decorate the colorful fins.',mosaic:'Irregular dark patches break up the colorful fins.',marble:'Irregular contrasting patches form a marbled or calico appearance.','gold-dust':'Gold or yellow areas contrast with a dark rear region.',bicolor:'Two contrasting color areas share the body and fins.'};
export function variantNote(kind:Species,color:ColorVariety):string {
 if(color.fantasy)return 'A fantasy lavender palette created for this game; it is not a real-world market ranking.';
 const description=color.note??notes[`${kind}:${color.id}`]??patternNotes[color.pattern??'solid'];
 const traits=variantTraits(color);
 return description+(traits&&!color.note?` Fin/eye traits: ${traits}.`:'');
}
export function variantOdds(kind:Species,color:ColorVariety):number {
 const categoryOdds={Common:60,Uncommon:28,Rare:10,Legendary:2};
 return Math.round(categoryOdds[color.rarity]/varieties[kind].filter(other=>other.rarity===color.rarity).length*100)/100;
}
export const guideSources=[
 {name:'Tropicali · Guppy strains',url:'https://www.tropicalifish.com/fish/guppy/'},
 {name:'Tropicali · Platy strains',url:'https://www.tropicalifish.com/fish/platy/'},
 {name:'Tropicali · Molly forms',url:'https://www.tropicalifish.com/fish/molly/'},
 {name:'Tropicali · Swordtail forms',url:'https://www.tropicalifish.com/fish/swordtail/'},
 {name:'Leopard Aquatic · Guppies',url:'https://www.leopardaquatic.com/guppy/'},
 {name:'IFGA · Guppy show information',url:'https://www.ifga.org/'},
 {name:'Aqueon · Livebearer care',url:'https://www.aqueon.com/resources/care-guides/livebearer'},
 {name:'Aqueon · Livebearer aquariums',url:'https://www.aqueon.com/articles/livebearer-aquarium'},
 {name:'Aquarium Co-op · Guppy care',url:'https://www.aquariumcoop.com/blogs/aquarium/guppy-care-guide'},
];
