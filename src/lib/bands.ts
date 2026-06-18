/** UK amateur band definitions — mirror docs/reference/bands.md */

export interface BandDefinition {
  id: string;
  label: string;
  minMhz: number;
  maxMhz: number;
  color: string;
  mantine: string;
}

export const UK_BANDS: BandDefinition[] = [
  {
    id: '136khz',
    label: '136 kHz',
    minMhz: 0.1357,
    maxMhz: 0.1378,
    color: '#6741d9',
    mantine: 'violet.7',
  },
  { id: '600m', label: '600 m', minMhz: 0.472, maxMhz: 0.479, color: '#1098ad', mantine: 'cyan.7' },
  { id: '160m', label: '160 m', minMhz: 1.81, maxMhz: 2.0, color: '#ae3ec9', mantine: 'grape.6' },
  { id: '80m', label: '80 m', minMhz: 3.5, maxMhz: 3.8, color: '#4263eb', mantine: 'indigo.6' },
  {
    id: '60m',
    label: '60 m',
    minMhz: 5.2585,
    maxMhz: 5.4065,
    color: '#f59f00',
    mantine: 'yellow.7',
  },
  { id: '40m', label: '40 m', minMhz: 7.0, maxMhz: 7.2, color: '#2f9e44', mantine: 'green.7' },
  { id: '30m', label: '30 m', minMhz: 10.1, maxMhz: 10.15, color: '#12b886', mantine: 'teal.6' },
  { id: '20m', label: '20 m', minMhz: 14.0, maxMhz: 14.35, color: '#0ca678', mantine: 'teal.7' },
  { id: '17m', label: '17 m', minMhz: 18.068, maxMhz: 18.168, color: '#099268', mantine: 'teal.8' },
  { id: '15m', label: '15 m', minMhz: 21.0, maxMhz: 21.45, color: '#40c057', mantine: 'green.6' },
  { id: '12m', label: '12 m', minMhz: 24.89, maxMhz: 24.99, color: '#82c91e', mantine: 'lime.6' },
  { id: '10m', label: '10 m', minMhz: 28.0, maxMhz: 29.7, color: '#fab005', mantine: 'yellow.6' },
  { id: '6m', label: '6 m', minMhz: 50.0, maxMhz: 52.0, color: '#fd7e14', mantine: 'orange.6' },
  { id: '4m', label: '4 m', minMhz: 70.0, maxMhz: 70.5, color: '#fcc419', mantine: 'yellow.5' },
  { id: '2m', label: '2 m', minMhz: 144.0, maxMhz: 146.0, color: '#e03131', mantine: 'red.7' },
  { id: '70cm', label: '70 cm', minMhz: 430.0, maxMhz: 440.0, color: '#339af0', mantine: 'blue.5' },
  { id: '23cm', label: '23 cm', minMhz: 1240, maxMhz: 1325, color: '#7950f2', mantine: 'violet.6' },
  { id: '13cm', label: '13 cm', minMhz: 2310, maxMhz: 2450, color: '#868e96', mantine: 'gray.6' },
  { id: '9cm', label: '9 cm', minMhz: 3400, maxMhz: 3475, color: '#495057', mantine: 'gray.7' },
  { id: '6cm', label: '6 cm', minMhz: 5650, maxMhz: 5850, color: '#343a40', mantine: 'gray.8' },
  { id: '3cm', label: '3 cm', minMhz: 10000, maxMhz: 10500, color: '#212529', mantine: 'gray.9' },
  {
    id: '12cm',
    label: '1.2 cm',
    minMhz: 24000,
    maxMhz: 24250,
    color: '#495057',
    mantine: 'gray.7',
  },
  { id: 'mm', label: 'mm+', minMhz: 47000, maxMhz: 300000, color: '#868e96', mantine: 'gray.6' },
];

export const UNKNOWN_BAND_COLOR = '#ced4da';

export function bandFromFrequencyMhz(mhz: number): BandDefinition | null {
  if (!Number.isFinite(mhz) || mhz <= 0) return null;
  for (const band of UK_BANDS) {
    if (mhz >= band.minMhz && mhz <= band.maxMhz) return band;
  }
  return null;
}

export function bandFromChannel(rxFrequency: string, txFrequency?: string): BandDefinition | null {
  const bands = bandsFromFrequencies(rxFrequency, txFrequency ?? '');
  return bands[0] ?? null;
}

/** Distinct bands for RX and TX (RX first). Empty when neither frequency classifies. */
export function bandsFromFrequencies(
  rxFrequency: string,
  txFrequency: string,
): BandDefinition[] {
  const bands: BandDefinition[] = [];
  const seen = new Set<string>();

  for (const raw of [rxFrequency, txFrequency]) {
    const mhz = parseFloat(raw);
    if (!Number.isFinite(mhz) || mhz <= 0) continue;
    const band = bandFromFrequencyMhz(mhz);
    if (band && !seen.has(band.id)) {
      seen.add(band.id);
      bands.push(band);
    }
  }

  return bands;
}

export function channelMatchesBandFilter(
  rxFrequency: string,
  txFrequency: string,
  bandIds: string[],
): boolean {
  if (!bandIds.length) return true;
  return bandsFromFrequencies(rxFrequency, txFrequency).some((b) => bandIds.includes(b.id));
}

export function frequencyOffsetMhz(rxFrequency: string, txFrequency: string): number | null {
  const rx = parseFloat(rxFrequency);
  const tx = parseFloat(txFrequency);
  if (!Number.isFinite(rx) || !Number.isFinite(tx)) return null;
  return tx - rx;
}

export function formatOffsetMhz(offset: number): string {
  const sign = offset >= 0 ? '+' : '';
  return `${sign}${offset.toFixed(4).replace(/\.?0+$/, '')} MHz`;
}
