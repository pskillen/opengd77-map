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

/** Format a numeric MHz value for display (no unit suffix). */
export function formatMhzNumber(mhz: number): string {
  if (!Number.isFinite(mhz)) return String(mhz);

  const khzRounded = Math.round(mhz * 1000);
  const isKhzAligned = Math.abs(mhz * 1000 - khzRounded) < 1e-9;

  if (isKhzAligned) {
    return (khzRounded / 1000).toFixed(3);
  }

  for (let decimals = 4; decimals <= 9; decimals++) {
    const formatted = mhz.toFixed(decimals);
    if (Math.abs(parseFloat(formatted) - mhz) < 1e-12) {
      return formatted.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
    }
  }

  return mhz.toFixed(9);
}

/** Format a band allocation min–max range for reference display. */
export function formatBandRangeMhz(minMhz: number, maxMhz: number): string {
  return `${formatMhzNumber(minMhz)} – ${formatMhzNumber(maxMhz)} MHz`;
}
