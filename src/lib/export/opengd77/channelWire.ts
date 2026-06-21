import {
  formatFrequencyMhzWireFromHz,
  NONE_TONE,
  type ChannelTone,
} from '../../channelFields/index.ts';

/** Internal percent → OpenGD77 `Power` wire. */
const OPENGD77_PERCENT_TO_POWER_WIRE: [number | null, string][] = [
  [null, 'Master'],
  [25, 'P2'],
  [50, 'P4'],
  [75, 'P8'],
  [100, 'Master'],
];

export function formatOpenGd77PowerWire(percent: number | null): string {
  if (percent == null) return 'Master';
  for (const [p, wire] of OPENGD77_PERCENT_TO_POWER_WIRE) {
    if (p === percent) return wire;
  }
  if (percent <= 25) return 'P2';
  if (percent <= 50) return 'P4';
  if (percent <= 75) return 'P8';
  return 'Master';
}

export function formatOpenGd77SquelchWire(percent: number | null): string {
  if (percent == null) return 'Master';
  if (percent === 0) return 'Disabled';
  return `${percent}%`;
}

export function formatOpenGd77BandwidthWire(khz: number | null): string {
  if (khz == null) return '';
  return String(khz);
}

export function formatOpenGd77ColourCodeWire(code: number | null): string {
  if (code == null) return '';
  return String(code);
}

export function formatOpenGd77TimeslotWire(slot: 1 | 2 | null): string {
  if (slot == null) return '';
  return String(slot);
}

export function formatOpenGd77DmrIdWire(id: number | null): string {
  if (id == null) return '';
  return String(id);
}

export function formatOpenGd77TransmitTimeoutWire(seconds: number | null): string {
  if (seconds == null) return '';
  return String(seconds);
}

export function formatOpenGd77ToneWire(tone: ChannelTone | null): string {
  if (tone == null || tone === NONE_TONE) return 'None';
  return tone;
}

export function formatOpenGd77FrequencyWire(hz: number | null): string {
  return formatFrequencyMhzWireFromHz(hz);
}
