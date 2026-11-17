import type { Fish } from './model';

/** Separate visual signals: a small round meal bump versus a larger rear pregnancy. */
export function bellyShape(fullness: number, pregnancy: number) {
  return {
    meal: Math.max(0, Math.min(1, (fullness - 70) / 30)) * .24,
    pregnancy: Math.max(0, Math.min(1, pregnancy)) * .8,
  };
}
export type FishBodyState = { fullness?: Fish['fullness']; pregnancy?: number };
