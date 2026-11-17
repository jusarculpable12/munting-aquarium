import { rememberDiscoveries } from './discoveries.ts';
import { accessoryRefund, accessoryEffects, accessoryLimit, accessoryLoad, accessoryVisitorBonus, plantCatalog, type PlantId, type PlacedPlant } from './accessories.ts';
import { colorVariety, rollVariety } from './varieties.ts';
export const species = {
  guppy: { name: "Guppy", price: 18, load: 1, water: 55, breed: 960, color: "#f9aa69", profile: "flexible", tail: 8, incompatibleWith: [] },
  platy: { name: "Platy", price: 28, load: 2, water: 60, breed: 1260, color: "#f07966", profile: "flexible", tail: 5, incompatibleWith: [] },
  molly: { name: "Molly", price: 36, load: 2, water: 72, breed: 1860, color: "#d4d6f6", profile: "hard", tail: 6, incompatibleWith: [] },
  swordtail: { name: "Swordtail", price: 45, load: 3, water: 68, breed: 1560, color: "#f3c65f", profile: "flexible", tail: 11, incompatibleWith: [] },
} as const;
export type Species = keyof typeof species;
export const kinds = Object.keys(species) as Species[];
export const decorations = ["None", "Java fern", "River stones"] as const;
export const unlockPrices = [0, 150, 300];
export type Fish = { id: string; kind: Species; sex: "F" | "M"; rare: boolean; variant?: string; motherId?: string; born: number; maturesAt?: number; fullness: number; health: number; overfed: number; diedAt?: number; sellAfter?: number };
export type Tank = { accessories?: PlacedPlant[]; fish: Fish[]; pellets?: { id: string; dropped: number }[]; food: number; water: number; size: number; filter: number; hard: boolean; decor: number; breeding: Partial<Record<Species, number>> };
export type Order = { id: number; kind: Species; rare: boolean; variant?: string; reward: number };
export type Save = { tutorialComplete?: boolean; discoveries?: string[]; version: 1; coins: number; last: number; tanks: Tank[]; order: Order };
export const capacity = (tank: Tank) => 6 + 5 * tank.size;
export const load = (tank: Tank) => tank.fish.reduce((sum, fish) => sum + species[fish.kind].load, 0);
export const fits = (tank: Tank, kind: Species) => load(tank) + species[kind].load <= capacity(tank) &&
  (species[kind].profile !== "hard" || tank.hard) && tank.water >= species[kind].water &&
  !tank.fish.some(fish =>
    (species[kind].incompatibleWith as readonly Species[]).includes(fish.kind) ||
    (species[fish.kind].incompatibleWith as readonly Species[]).includes(kind));
export const GROWTH_MS = 30 * 60 * 1000;
// Existing saves without maturesAt retain their original two-minute maturity.
export const adult = (fish: Fish, now: number) => now >= (fish.maturesAt ?? fish.born + 120_000);
export function growthScale(fish: Fish, now: number): number {
  const duration = Math.max(1, (fish.maturesAt ?? fish.born + 120_000) - fish.born);
  const progress = Math.max(0, Math.min(1, (now - fish.born) / duration));
  const initial = fish.motherId ? 0.25 : 0.45;
  return initial + (1 - initial) * progress;
}
/** Fictional resale values stay below purchase cost, including rare rolls. */
export function fishValue(fish: Fish): number {
  if (fish.diedAt) return 0;
  const fraction = { Common: .5, Uncommon: .6, Rare: .7, Legendary: .8 }[colorVariety(fish).rarity];
  return Math.max(1, Math.floor(species[fish.kind].price * fraction));
}
export const sellable = (fish: Fish, now: number) => !fish.diedAt && adult(fish, now) && now >= (fish.sellAfter ?? 0);
export const living = (tank: Tank) => tank.fish.filter(fish => !fish.diedAt);
export const fishHappiness = (fish: Fish, tank: Tank) => Math.min(100, Math.min(tank.water, fish.fullness, Math.max(0, 100 - fish.overfed)) + (tank.water >= 55 && fish.fullness >= 45 && fish.overfed < 20 ? accessoryEffects(tank).comfort : 0));
export const fullness = (tank: Tank) => living(tank).length ? living(tank).reduce((sum, fish) => sum + fish.fullness, 0) / living(tank).length : 100;
export const happiness = (tank: Tank) => living(tank).length ? living(tank).reduce((sum, fish) => sum + fishHappiness(fish, tank), 0) / living(tank).length : 0;
export const visitors = (tank: Tank) => living(tank).length > 0 && happiness(tank) >= 55 ? 2 + tank.decor + accessoryVisitorBonus(tank) : 0;
export const OFFLINE_SECONDS = 3600;
export const COURTSHIP_SECONDS = 60;
export const BREEDING_RECOVERY_SECONDS = 120;
const clamp = (value: number) => Math.max(0, Math.min(100, value));
const fish = (kind: Species, born: number, sex: Fish["sex"], rare = false): Fish => ({
  id: globalThis.crypto.randomUUID(), kind, born, maturesAt: born + GROWTH_MS, sex, rare, fullness: 85, health: 100, overfed: 0,
});
const newTank = (): Tank => ({ fish: [], food: 85, water: 95, size: 0, filter: 0, hard: false, decor: 0, breeding: {} });
function makeOrder(id: number, stock: Fish[]): Order {
  const kind = stock.length ? stock[id % stock.length].kind : kinds[id % kinds.length];
  const rare = id % 5 === 4 && stock.some(f => f.kind === kind && f.rare);
  return { id, kind, rare, reward: species[kind].price * (rare ? 4 : 2) };
}
export function start(now: number): Save {
  const tank = newTank();
  tank.water = 82;
  tank.fish = [fish("guppy", now - GROWTH_MS, "F"), fish("guppy", now - GROWTH_MS, "M")];
  const save: Save = { version: 1, tutorialComplete: false, coins: 85, last: now, tanks: [tank], order: makeOrder(0, tank.fish) };
  rememberDiscoveries(save);
  return save;
}
/** Away time pays capped visitors but never consumes fish care or breeding progress. */
export function resume(save: Save, now: number): Save {
  const elapsed = Math.floor((now - save.last) / 1000);
  if (elapsed <= 0) return save;
  const next = structuredClone(save);
  rememberDiscoveries(next);
  next.last = save.last + elapsed * 1000;
  next.coins += next.tanks.reduce((sum, tank) => sum + visitors(tank), 0) * Math.min(elapsed, OFFLINE_SECONDS) / 60;
  // Food animation cannot resume after its original consumption window.
  for (const tank of next.tanks) if (tank.pellets) tank.pellets = tank.pellets.filter(p => next.last - p.dropped < 4000);
  return next;
}

/** A suspended browser must not catch up harmful care ticks on waking. */
export function advanceVisible(save: Save, now: number): Save {
  return now - save.last > 5000 ? resume(save, now) : advance(save, now);
}

export function advance(save: Save, now: number, random = Math.random): Save {
  const elapsed = Math.floor((now - save.last) / 1000);
  if (elapsed <= 0) return save;
  const seconds = Math.min(elapsed, OFFLINE_SECONDS);
  const next = structuredClone(save);
  rememberDiscoveries(next);
  next.last = save.last + elapsed * 1000;
  for (let tick = 1; tick <= seconds; tick++) {
    const time = next.last - (seconds - tick) * 1000;
    for (const tank of next.tanks) {
      const occupied = load(tank);
      if (!occupied) continue;
      for (const resident of living(tank)) {
        resident.fullness = clamp(resident.fullness - 0.018);
        resident.overfed = Math.max(0, resident.overfed - 0.5);
        // Digestion clears even severe excess within 200 seconds without more food.
        // Overfeeding causes mild temporary damage; starvation/dirty water remain serious.
        const danger = resident.fullness < 30 || tank.water < 30;
        resident.health = clamp(resident.health + (danger ? -1 / 3 : resident.overfed >= 20 ? -0.1 : 0.2));
        if (resident.health <= 0.000001) { resident.health = 0; resident.diedAt = time; tank.breeding[resident.kind] = 0; }
      }
      tank.food = fullness(tank);
      tank.pellets = (tank.pellets ?? []).filter(p => time - p.dropped < 4000);
      tank.water = clamp(tank.water - (0.009 + occupied * 0.004) * accessoryEffects(tank).wasteMultiplier / (1 + tank.filter));
      next.coins += visitors(tank) / 60;
      for (const kind of kinds) {
        if ((tank.breeding[kind] ?? 0) < 0) { tank.breeding[kind] = tank.breeding[kind]! + 1; continue; }
        const adults = tank.fish.filter(f => f.kind === kind && !f.diedAt && f.health >= 70 && f.overfed < 20 && adult(f, time) && f.fullness >= 65);
        if (!fits(tank, kind) || happiness(tank) < 65 || !adults.some(f => f.sex === "F") || !adults.some(f => f.sex === "M")) continue;
        const progress = (tank.breeding[kind] ?? 0) + 1;
        if (progress < species[kind].breed) {
          tank.breeding[kind] = progress;
          continue;
        }
        const baby = fish(kind, time, random() < 0.5 ? "F" : "M");
        baby.motherId = adults.find(parent => parent.sex === "F")!.id;
        const color = rollVariety(kind, random);
        baby.variant = color.id; baby.rare = color.id === "lavender";
        tank.fish.push(baby);
        rememberDiscoveries(next);
        tank.breeding[kind] = -BREEDING_RECOVERY_SECONDS;
      }
    }
  }
  return next;
}
export type Action =
  | { type: "plant-buy"; tank: number; kind: PlantId }
  | { type: "plant-move"; tank: number; id: string; x: number; y: number }
  | { type: "plant-layer"; tank: number; id: string; layer: "back" | "front" }
  | { type: "plant-return"; tank: number; id: string }
  | { type: "sell-fish"; tank: number; fish: string }
  | { type: "remove"; tank: number; fish: string }
  | { type: "feed"; tank: number; pellet: string }
  | { type: "eat"; tank: number; fish: string; pellet: string }
  | { type: "water" | "size" | "filter" | "hard" | "unlock"; tank: number }
  | { type: "buy"; tank: number; kind: Species; sex: Fish["sex"] }
  | { type: "decor"; tank: number; decor: number }
  | { type: "sell"; tank: number; fish: string; order: number }
  | { type: "move"; tank: number; fish: string; target: number };
export function act(save: Save, action: Action, now: number, random = Math.random): [Save, string] {
  const settled = advance(save, now);
  const next = structuredClone(settled);
  rememberDiscoveries(next);
  const tank = next.tanks[action.tank];
  const fail = (message: string): [Save, string] => [settled, message];
  const pay = (amount: number) => {
    if (next.coins < amount) return false;
    next.coins -= amount;
    return true;
  };
  if (!tank) return fail("Tank unavailable.");
  switch (action.type) {
    case 'plant-buy': {
      const item=plantCatalog.find(p=>p.id===action.kind);
      if(!item)return fail('Accessory unavailable.');
      if(accessoryLoad(tank)+item.slots>accessoryLimit(tank))return fail('Accessory limit reached. Return an accessory or upgrade this tank.');
      if(item.category==='Equipment'&&tank.accessories?.some(p=>p.kind===item.id))return fail('Only one of this equipment per tank.');
      if(!pay(item.price))return fail('Not enough coins.');
      tank.accessories??=[];
      tank.accessories.push({id:globalThis.crypto.randomUUID(),kind:item.id,x:.35+(tank.accessories.length%4)*.17,y:.85+(tank.accessories.length%2)*.02,layer:'front',paidPrice:item.price});
      return [next,`${item.name} placed. Use Arrange accessories to drag it on the gravel.`];
    }
    case 'plant-move': {
      const item=tank.accessories?.find(p=>p.id===action.id);
      if(!item||!Number.isFinite(action.x)||!Number.isFinite(action.y))return fail('Accessory unavailable.');
      item.x=Math.max(.04,Math.min(.93,action.x));item.y=Math.max(.82,Math.min(.94,action.y));
      return [next,'Accessory moved.'];
    }
    case 'plant-layer': {
      const item=tank.accessories?.find(p=>p.id===action.id);
      if(!item||!['front','back'].includes(action.layer))return fail('Accessory unavailable.');
      item.layer=action.layer;return [next,`Accessory moved to the ${action.layer}.`];
    }
    case 'plant-return': {
      const item=tank.accessories?.find(p=>p.id===action.id);
      if(!item)return fail('Accessory unavailable.');
      next.coins+=accessoryRefund(item);
      tank.accessories=tank.accessories!.filter(p=>p.id!==item.id);
      return [next,'Accessory returned for its purchase price.'];
    }
    case "sell-fish": {
      const resident = tank.fish.find(f => f.id === action.fish);
      if (!resident || !sellable(resident, now)) return fail("Only settled adult fish can be sold.");
      const value = fishValue(resident);
      tank.fish = tank.fish.filter(f => f.id !== resident.id);
      tank.breeding[resident.kind] = 0;
      next.coins += value;
      return [next, `${species[resident.kind].name} sold for ${value} coins.`];
    }
    case "remove": {
      const resident = tank.fish.find(f => f.id === action.fish);
      if (!resident?.diedAt) return fail("Only deceased fish can be removed.");
      tank.fish = tank.fish.filter(f => f.id !== resident.id);
      return [next, "Deceased fish removed."];
    }
    case "feed":
      tank.pellets = (tank.pellets ?? []).filter(p => now - p.dropped < 4000);
      if (tank.pellets.some(p => p.id === action.pellet)) return fail("Pellet already dropped.");
      tank.pellets.push({ id: action.pellet, dropped: now });
      tank.water = clamp(tank.water - 0.3);
      return [next, "One pellet dropped."];
    case "eat": {
      const resident = tank.fish.find(f => f.id === action.fish);
      const pellet = tank.pellets?.find(p => p.id === action.pellet);
      if (!resident || resident.diedAt || !pellet || now - pellet.dropped >= 4000) return fail("Food is no longer available.");
      tank.pellets = tank.pellets!.filter(p => p.id !== action.pellet);
      if (resident.fullness >= 70) tank.water = clamp(tank.water - 1.2);
      resident.overfed = clamp(resident.overfed + Math.max(0, resident.fullness + 20 - 100));
      resident.fullness = clamp(resident.fullness + 20);
      tank.food = fullness(tank);
      return [next, "Fish ate a pellet."];
    }    case "water":
      tank.water = clamp(tank.water + (100 - tank.water) * 0.3);
      return [next, "Changed 30% of the water."];
    case "size":
    case "filter": {
      const key = action.type;
      if (tank[key] >= 2) return fail("Maximum upgrade reached.");
      if (!pay((key === "size" ? 65 : 45) * (tank[key] + 1))) return fail("Not enough coins.");
      tank[key]++;
      return [next, "Tank upgraded."];
    }
    case "hard":
      if (tank.hard && tank.fish.some(f => species[f.kind].profile === "hard")) return fail("Mollies need the hard-water setup.");
      tank.hard = !tank.hard;
      return [next, tank.hard ? "Hard-water setup selected." : "Standard water selected."];
    case "unlock":
      if (next.tanks.length >= 3) return fail("All tanks are unlocked.");
      if (!pay(unlockPrices[next.tanks.length])) return fail("Not enough coins.");
      next.tanks.push(newTank());
      return [next, "New tank unlocked."];
    case "decor":
      if (!decorations[action.decor] || tank.decor === action.decor) return fail("Choose a different decoration.");
      if (!pay(action.decor === 0 ? 0 : 22)) return fail("Not enough coins.");
      tank.decor = action.decor;
      return [next, "Decoration updated."];
    case "buy":
      if (!fits(tank, action.kind)) return fail("Check water quality, water profile, and stocking space.");
      if (!pay(species[action.kind].price)) return fail("Not enough coins.");
      const color = rollVariety(action.kind, random);
      tank.fish.push({ ...fish(action.kind, now, action.sex, color.id === "lavender"), variant: color.id, sellAfter: now + 120_000 });
      rememberDiscoveries(next);
      return [next, color.rarity + " " + color.name + " " + species[action.kind].name + " juvenile added! Grows gradually over 30 minutes."];
    case "move": {
      const target = next.tanks[action.target];
      const resident = tank.fish.find(f => f.id === action.fish);
      if (!resident || resident.diedAt || !target || target === tank || !fits(target, resident.kind)) return fail("The destination needs suitable water and spare capacity.");
      tank.fish = tank.fish.filter(f => f.id !== resident.id);
      target.fish.push(resident);
      tank.breeding[resident.kind] = 0;
      return [next, "Fish moved."];
    }
    case "sell": {
      const resident = tank.fish.find(f => f.id === action.fish);
      if (!resident || action.order !== next.order.id || resident.kind !== next.order.kind ||
        (next.order.rare && !resident.rare) || !sellable(resident, now)) return fail("This fish cannot fill the current order.");
      tank.fish = tank.fish.filter(f => f.id !== resident.id);
      tank.breeding[resident.kind] = 0;
      next.coins += next.order.reward;
      next.order = makeOrder(next.order.id + 1, next.tanks.flatMap(t => t.fish));
      return [next, "Order fulfilled. Salamat!"];
    }
  }
}







/** One visible pregnancy per species, matching the existing tank breeding timer. */
export function pregnancyProgress(tank: Tank, resident: Fish, now = Date.now()): number {
  if (resident.sex !== 'F' || resident.diedAt || !adult(resident, now)) return 0;
  const mother = tank.fish.find(f => f.kind === resident.kind && f.sex === 'F' && !f.diedAt && adult(f, now) && f.health >= 70 && f.overfed < 20 && f.fullness >= 65);
  return mother?.id === resident.id ? Math.max(0, (tank.breeding[resident.kind] ?? 0) - COURTSHIP_SECONDS) / (species[resident.kind].breed - COURTSHIP_SECONDS) : 0;
}



/** Readable stages and explicit blockers; the simulation remains timestamp-driven. */
export function breedingStatus(tank: Tank, kind: Species, now = Date.now()): string {
  const progress = tank.breeding[kind] ?? 0;
  if (progress < 0) return `Resting · ${Math.ceil(-progress / 60)} min`;
  const adults = living(tank).filter(f => f.kind === kind && adult(f, now));
  if (!adults.some(f => f.sex === 'F') || !adults.some(f => f.sex === 'M')) return 'Needs an adult female and male';
  if (!fits(tank, kind)) return 'Paused · needs suitable water and room for fry';
  if (happiness(tank) < 65 || !adults.some(f => f.sex === 'F' && f.health >= 70 && f.overfed < 20 && f.fullness >= 65) || !adults.some(f => f.sex === 'M' && f.health >= 70 && f.overfed < 20 && f.fullness >= 65)) return 'Paused · improve food, water or health';
  if (progress <= COURTSHIP_SECONDS) return 'Courting · watch the pair';
  const remaining = Math.ceil((species[kind].breed - progress) / 60);
  return progress >= COURTSHIP_SECONDS + (species[kind].breed - COURTSHIP_SECONDS) * .85 ? `Nursery ready · about ${remaining} min` : `Expecting fry · about ${remaining} min`;
}




/** Only these two eligible adults participate in the current courtship animation. */
export function courtshipPair(tank: Tank, kind: Species, now = Date.now()): Fish[] {
  const progress = tank.breeding[kind] ?? 0;
  if (progress <= 0 || progress > COURTSHIP_SECONDS || !breedingStatus(tank, kind, now).startsWith('Courting')) return [];
  const eligible = living(tank).filter(f => f.kind === kind && adult(f, now) && f.health >= 70 && f.overfed < 20 && f.fullness >= 65);
  const female = eligible.find(f => f.sex === 'F');
  const male = eligible.find(f => f.sex === 'M');
  return female && male ? [female, male] : [];
}



