import type { Fish, Save } from './model.ts';
import { colorVariety, varieties } from './varieties.ts';

export const discoveryKeys = Object.entries(varieties).flatMap(([kind, colors]) => colors.map(color => `${kind}:${color.id}`));
export const discoveryKey = (fish: Pick<Fish, 'kind' | 'rare' | 'variant'>) => `${fish.kind}:${colorVariety(fish).id}`;
export function discoveredVariants(save: Save): Set<string> {
  return new Set([...(save.discoveries ?? []), ...save.tanks.flatMap(tank => tank.fish.map(discoveryKey))]);
}
/** Record before fish leave the collection, and immediately after purchases/births. */
export function rememberDiscoveries(save: Save): void {
  save.discoveries = [...discoveredVariants(save)];
}
