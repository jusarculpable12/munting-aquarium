import type { Action } from './model';
export type FeedingSound = 'pellet-drop' | 'fish-eat';
/** Only accepted actions make a sound; stale/duplicate food must stay silent. */
export function feedingSound(action: Action, result: string): FeedingSound | null {
  if (action.type === 'feed' && result === 'One pellet dropped.') return 'pellet-drop';
  if (action.type === 'eat' && result === 'Fish ate a pellet.') return 'fish-eat';
  return null;
}
