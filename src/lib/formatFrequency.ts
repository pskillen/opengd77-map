/**
 * Format MHz for display — see docs/reference/display-conventions.md
 */
export function formatFrequencyMhz(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';

  const n = parseFloat(trimmed);
  if (!Number.isFinite(n)) return `${trimmed} MHz`;

  const khzRounded = Math.round(n * 1000);
  const isKhzAligned = Math.abs(n * 1000 - khzRounded) < 1e-9;

  if (isKhzAligned) {
    return `${(khzRounded / 1000).toFixed(3)} MHz`;
  }

  const dot = trimmed.indexOf('.');
  const inputDecimals = dot >= 0 ? trimmed.length - dot - 1 : 0;
  const decimals = Math.min(Math.max(inputDecimals, 3), 9);
  return `${n.toFixed(decimals)} MHz`;
}
