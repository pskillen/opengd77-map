import {
  normalizeToneValue,
  parseFrequencyHzFromMhzWire,
} from '../../channelFields/index.ts';
import type { ChannelMode } from '../../channelModes.ts';
import type { ChannelTone } from '../../channelFields/tones.ts';

const CHIRP_DEFAULT_TONE_FREQ = '88.5';

/** CHIRP `Power` wire → internal percent (null = radio default / high). */
export function parseChirpPowerWire(wire: string): number | null {
  const trimmed = wire.trim();
  if (!trimmed) return null;
  if (trimmed === '1.0W') return 25;
  if (trimmed === '5.0W' || trimmed === '10W' || trimmed === '25W') return null;
  const match = /^([\d.]+)W$/i.exec(trimmed);
  if (match) {
    const watts = parseFloat(match[1]);
    if (Number.isFinite(watts) && watts <= 1.5) return 25;
  }
  return null;
}

export function parseChirpModeWire(wire: string): ChannelMode {
  const key = wire.trim().toUpperCase();
  if (key === 'NFM' || key === 'FM') return 'fm';
  if (key === 'AM') return 'am';
  return 'other';
}

export function formatChirpModeWire(mode: ChannelMode): string {
  if (mode === 'fm') return 'NFM';
  if (mode === 'am') return 'AM';
  return 'NFM';
}

export function parseChirpTones(
  toneMode: string,
  rToneFreq: string,
  cToneFreq: string,
): { rxTone: ChannelTone; txTone: ChannelTone } {
  const mode = toneMode.trim().toUpperCase();
  const rFreq = rToneFreq.trim();
  const cFreq = cToneFreq.trim();

  if (!mode) {
    return { rxTone: 'none', txTone: 'none' };
  }

  if (mode === 'TSQL') {
    return {
      rxTone: normalizeToneValue(rFreq),
      txTone: normalizeToneValue(cFreq),
    };
  }

  if (mode === 'TONE') {
    return {
      rxTone: 'none',
      txTone: normalizeToneValue(cFreq || rFreq),
    };
  }

  return { rxTone: 'none', txTone: 'none' };
}

export function formatChirpToneMode(rxTone: ChannelTone, txTone: ChannelTone): string {
  const hasRx = rxTone !== 'none';
  const hasTx = txTone !== 'none';
  if (hasRx && hasTx && rxTone !== txTone) return 'TSQL';
  if (hasTx) return 'Tone';
  return '';
}

export function formatChirpToneFreq(tone: ChannelTone): string {
  if (tone === 'none') return CHIRP_DEFAULT_TONE_FREQ;
  if (tone.startsWith('D')) return CHIRP_DEFAULT_TONE_FREQ;
  return tone;
}

export function parseChirpFrequencyWire(wire: string): number | null {
  return parseFrequencyHzFromMhzWire(wire);
}

export function formatChirpFrequencyWire(hz: number | null): string {
  if (hz == null || hz <= 0) return '';
  return (hz / 1_000_000).toFixed(6);
}

export function parseChirpOffsetMhz(wire: string): number {
  const trimmed = wire.trim().replace(',', '.');
  if (!trimmed) return 0;
  const n = parseFloat(trimmed);
  return Number.isFinite(n) ? n : 0;
}

export function deriveChirpTxFrequencyHz(
  rxHz: number | null,
  duplex: string,
  offsetMhz: number,
): number | null {
  if (rxHz == null) return null;
  const d = duplex.trim().toLowerCase();
  const offsetHz = Math.round(offsetMhz * 1_000_000);
  if (d === '+') return rxHz + offsetHz;
  if (d === '-') return rxHz - offsetHz;
  return rxHz;
}

export function deriveChirpDuplexAndOffset(
  rxHz: number | null,
  txHz: number | null,
): { duplex: string; offsetMhz: number } {
  if (rxHz == null || txHz == null || rxHz === txHz) {
    return { duplex: '', offsetMhz: 0 };
  }
  const diffHz = txHz - rxHz;
  const offsetMhz = Math.abs(diffHz) / 1_000_000;
  if (diffHz > 0) return { duplex: '+', offsetMhz };
  return { duplex: '-', offsetMhz };
}

export function parseChirpScanSkip(wire: string): boolean {
  return wire.trim().toUpperCase() === 'S';
}

export function formatChirpScanSkip(scanSkip: boolean): string {
  return scanSkip ? 'S' : '';
}

export function parseChirpTStepWire(wire: string): number | null {
  const trimmed = wire.trim().replace(',', '.');
  if (!trimmed) return null;
  const step = parseFloat(trimmed);
  if (!Number.isFinite(step)) return null;
  if (step <= 6.25) return 12.5;
  if (step <= 12.5) return 12.5;
  return 25;
}

export function formatChirpTStepWire(bandwidthKHz: number | null): string {
  if (bandwidthKHz == null) return '5.00';
  if (bandwidthKHz >= 20) return '25.00';
  return '5.00';
}

export function formatChirpPowerWire(power: number | null, profileDefaultHigh = '5.0W'): string {
  if (power == null) return profileDefaultHigh;
  if (power <= 30) return '1.0W';
  return profileDefaultHigh;
}

export function formatChirpPowerWireForProfile(
  power: number | null,
  profileId: string,
): string {
  if (profileId === 'retevis-rt95') {
    if (power != null && power <= 30) return '10W';
    return power == null ? '10W' : '25W';
  }
  return formatChirpPowerWire(power, profileId === 'baofeng-uv21prov2' ? '5.0W' : '5.0W');
}
