import { discoveryKeys } from './discoveries.ts';
import { plantCatalog, accessoryLoad, accessoryLimit } from './accessories.ts';
import { varieties } from './varieties.ts';
import { capacity, decorations, kinds, load, species, BREEDING_RECOVERY_SECONDS, GROWTH_MS, type Save } from "./model.ts";
export const key = "munting-aquarium-v1";

export function decode(raw: string): Save {
  const save = JSON.parse(raw) as Save;
  const number = (value: number, min: number, max: number) => Number.isFinite(value) && value >= min && value <= max;
  const integer = (value: number, min: number, max: number) => Number.isInteger(value) && number(value, min, max);
  const timestamp = (value: number) => integer(value, 0, Date.now() + 1000);
  const ids = new Set<string>();
  if (save?.version !== 1 || !number(save.coins, 0, Number.MAX_SAFE_INTEGER) || !timestamp(save.last) ||
      !Array.isArray(save.tanks) || !integer(save.tanks.length, 1, 3) ||
      !save.order || !kinds.includes(save.order.kind) || typeof save.order.rare !== "boolean" ||
      !integer(save.order.id, 0, Number.MAX_SAFE_INTEGER - 1) || !integer(save.order.reward, 1, 180)) {
    throw new Error("Invalid aquarium save");
  }
  if(save.discoveries!==undefined&&(!Array.isArray(save.discoveries)||save.discoveries.length>discoveryKeys.length||new Set(save.discoveries).size!==save.discoveries.length||save.discoveries.some(entry=>!discoveryKeys.includes(entry))))throw new Error('Invalid fish discoveries');
  for (const tank of save.tanks) {
    if (!tank || !number(tank.food, 0, 100) || !number(tank.water, 0, 100) ||
        !integer(tank.size, 0, 2) || !integer(tank.filter, 0, 2) || typeof tank.hard !== "boolean" ||
        !integer(tank.decor, 0, decorations.length - 1) || !Array.isArray(tank.fish) ||
        tank.fish.length > capacity(tank) || !tank.breeding || typeof tank.breeding !== "object" ||
        Object.entries(tank.breeding).some(([kind, progress]) =>
          !kinds.includes(kind as (typeof kinds)[number]) || !integer(progress, -BREEDING_RECOVERY_SECONDS, species[kind as (typeof kinds)[number]].breed - 1))) {
      throw new Error("Invalid tank");
    }
    if(tank.accessories!==undefined){
      if(!Array.isArray(tank.accessories)||tank.accessories.length>8)throw new Error('Invalid accessories');
      for(const plant of tank.accessories){
        if(!plant||typeof plant.id!=='string'||!plant.id||ids.has(plant.id)||!plantCatalog.some(p=>p.id===plant.kind)||!number(plant.x,.04,.93)||!number(plant.y,.82,.94)||(plant.layer!==undefined&&!['front','back'].includes(plant.layer)))throw new Error('Invalid plant placement');
        if(plantCatalog.find(p=>p.id===plant.kind)?.category==='Equipment'&&tank.accessories.filter(p=>p.kind===plant.kind).length>1)throw new Error('Duplicate equipment');
        if(plant.paidPrice!==undefined&&!integer(plant.paidPrice,0,plantCatalog.find(p=>p.id===plant.kind)!.price))throw new Error('Invalid accessory purchase price');
        ids.add(plant.id);
      }
      if(accessoryLoad(tank)>accessoryLimit(tank))throw new Error('Too many accessories');
    }
    for (const fish of tank.fish) {
      if (!fish || typeof fish.id !== "string" || !fish.id || ids.has(fish.id) ||
          !kinds.includes(fish.kind) || !["F", "M"].includes(fish.sex) ||
          typeof fish.rare !== "boolean" || !timestamp(fish.born) || (fish.sellAfter !== undefined && !integer(fish.sellAfter, 0, Date.now() + 121000)) || (fish.kind === "molly" && !tank.hard)) {
        throw new Error("Invalid fish");
      }
      if (fish.maturesAt !== undefined && !integer(fish.maturesAt, fish.born, Date.now() + GROWTH_MS + 1000)) throw new Error("Invalid fish growth");
      if (fish.fullness === undefined) fish.fullness = tank.food; // Migrate existing local saves.
      if (!number(fish.fullness, 0, 100)) throw new Error("Invalid fish hunger");
      fish.health ??= 100; fish.overfed ??= 0;
      if (!number(fish.health, 0, 100) || !number(fish.overfed, 0, 100) || (fish.diedAt !== undefined && (!timestamp(fish.diedAt) || fish.health !== 0)) || (fish.health === 0 && fish.diedAt === undefined)) throw new Error("Invalid fish health");
      if (fish.variant !== undefined && (!varieties[fish.kind].some(v => v.id === fish.variant) || fish.rare !== (fish.variant === "lavender"))) throw new Error("Invalid fish color");
      if (fish.motherId !== undefined && (typeof fish.motherId !== "string" || !fish.motherId)) throw new Error("Invalid fish parent");
      ids.add(fish.id);
    }
    if (tank.pellets !== undefined && (!Array.isArray(tank.pellets) || tank.pellets.some(p => !p || typeof p.id !== "string" || !timestamp(p.dropped)))) throw new Error("Invalid food");
    if (load(tank) > capacity(tank)) throw new Error("Overstocked tank");
  }
  return save;
}









