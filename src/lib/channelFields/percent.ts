/** Clamp percent to 0–100 or return null for radio-default. */
export function clampPercent(value: number | null): number | null {
  if (value == null) return null;
  if (!Number.isFinite(value)) return null;
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function percentLabel(value: number | null): string {
  if (value == null) return 'Radio default';
  return `${value}%`;
}

export const POWER_PERCENT_OPTIONS: readonly (number | null)[] = [null, 25, 50, 75, 100];

export const SQUELCH_PERCENT_OPTIONS: readonly (number | null)[] = [null, 0, 25, 50, 75, 100];
