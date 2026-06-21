const HZ_PER_MHZ = 1_000_000;

/** Parse MHz wire text (`.` or `,` decimal) to integer Hz, or null when empty/invalid. */
export function parseFrequencyHzFromMhzWire(wire: string): number | null {
  const trimmed = wire.trim().replace(',', '.');
  if (!trimmed) return null;
  const mhz = parseFloat(trimmed);
  if (!Number.isFinite(mhz) || mhz <= 0) return null;
  return Math.round(mhz * HZ_PER_MHZ);
}

/** Convert integer Hz to MHz number for display/math. */
export function frequencyHzToMhz(hz: number | null): number | null {
  if (hz == null || !Number.isFinite(hz) || hz <= 0) return null;
  return hz / HZ_PER_MHZ;
}

/** Format Hz as MHz wire string (5 dp — OpenGD77 adapter may refine further). */
export function formatFrequencyMhzWireFromHz(hz: number | null): string {
  if (hz == null || hz <= 0) return '';
  const mhz = hz / HZ_PER_MHZ;
  return mhz.toFixed(5);
}

/** Parse user MHz input from CRUD forms to Hz. */
export function parseFrequencyHzFromMhzInput(input: string): number | null {
  return parseFrequencyHzFromMhzWire(input);
}
