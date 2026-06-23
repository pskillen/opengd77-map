import {
  normalizeToneValue,
  parseFrequencyHzFromMhzWire,
  type ChannelTone,
  type ChannelTimeslot,
} from '../../channelFields/index.ts';
import { isAnalogMode, isDmrMode, type ChannelMode } from '../../channelModes.ts';
import type { ChannelModeProfile } from '../../../models/codeplug.ts';
import { channelModeProfileDefaults } from '../../../models/codeplug.ts';
import {
  dm32PercentToSquelchWire,
  dm32PercentToWire,
  dm32SquelchWireToPercent,
  dm32WireToPercent,
  DEFAULT_DM32_PROFILE_ID,
} from '../../dm32/profiles.ts';

export function parseDm32BandwidthWire(wire: string): number | null {
  const trimmed = wire.trim();
  if (trimmed === '12.5KHz') return 12.5;
  if (trimmed === '25KHz') return 25;
  const n = parseFloat(trimmed.replace('KHz', '').replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function formatDm32BandwidthWire(khz: number | null): string {
  if (khz == null) return '12.5KHz';
  if (Math.abs(khz - 25) < 0.01) return '25KHz';
  return '12.5KHz';
}

export function parseDm32TimeslotWire(wire: string): ChannelTimeslot | null {
  const trimmed = wire.trim();
  if (trimmed === 'Slot 1') return 1;
  if (trimmed === 'Slot 2') return 2;
  return null;
}

export function formatDm32TimeslotWire(slot: ChannelTimeslot | null): string {
  if (slot === 2) return 'Slot 2';
  return 'Slot 1';
}

export function parseDm32ColourCodeWire(wire: string): number | null {
  const trimmed = wire.trim();
  if (!trimmed) return null;
  const n = parseInt(trimmed, 10);
  return Number.isFinite(n) && n >= 0 && n <= 15 ? n : null;
}

export function parseDm32FlagWire(wire: string): boolean {
  return wire.trim() === '1';
}

export function formatDm32FlagWire(value: boolean): string {
  return value ? '1' : '0';
}

export function parseDm32ToneWire(wire: string): ChannelTone {
  return normalizeToneValue(wire);
}

export function formatDm32ToneWire(tone: ChannelTone): string {
  if (tone === 'none') return 'None';
  return tone;
}

export type Dm32ChannelTypeWire =
  | 'Analog'
  | 'Anlaog'
  | 'Digital'
  | 'Fixed Analog'
  | 'Fixed Digital';

export interface Dm32ChannelTypeParse {
  mode: ChannelMode;
  multiMode: boolean;
  dualKind?: 'fixedAnalog' | 'fixedDigital';
}

export function parseDm32ChannelTypeWire(wire: string): Dm32ChannelTypeParse {
  const trimmed = wire.trim();
  if (trimmed === 'Analog' || trimmed === 'Anlaog') return { mode: 'fm', multiMode: false };
  if (trimmed === 'Digital') return { mode: 'dmr', multiMode: false };
  if (trimmed === 'Fixed Analog') return { mode: 'fm', multiMode: true, dualKind: 'fixedAnalog' };
  if (trimmed === 'Fixed Digital')
    return { mode: 'dmr', multiMode: true, dualKind: 'fixedDigital' };
  return { mode: 'other', multiMode: false };
}

export function formatDm32ChannelTypeWire(
  mode: ChannelMode,
  multiMode: boolean,
  modeProfiles: ChannelModeProfile[],
): string {
  if (!multiMode || modeProfiles.length < 2) {
    if (isAnalogMode(mode)) return 'Analog';
    if (isDmrMode(mode)) return 'Digital';
    return 'Analog';
  }
  const hasFm = modeProfiles.some((p) => isAnalogMode(p.mode));
  const hasDmr = modeProfiles.some((p) => isDmrMode(p.mode));
  if (hasFm && hasDmr) {
    return isDmrMode(mode) ? 'Fixed Digital' : 'Fixed Analog';
  }
  if (isDmrMode(mode)) return 'Digital';
  return 'Analog';
}

export function parseDm32FrequencyWire(wire: string): number | null {
  const trimmed = wire.trim();
  if (!trimmed) return null;
  return parseFrequencyHzFromMhzWire(trimmed);
}

export function formatDm32FrequencyWire(hz: number | null): string {
  if (hz == null) return '';
  return (hz / 1_000_000).toFixed(5);
}

export function parseDm32PowerWire(
  wire: string,
  profileId: string = DEFAULT_DM32_PROFILE_ID,
): number | null {
  return dm32WireToPercent(profileId, wire);
}

export function formatDm32PowerWire(
  percent: number | null,
  profileId: string = DEFAULT_DM32_PROFILE_ID,
): string {
  return dm32PercentToWire(profileId, percent);
}

export function parseDm32SquelchWire(
  wire: string,
  profileId: string = DEFAULT_DM32_PROFILE_ID,
): number | null {
  return dm32SquelchWireToPercent(profileId, wire);
}

export function formatDm32SquelchWire(
  percent: number | null,
  profileId: string = DEFAULT_DM32_PROFILE_ID,
): string {
  return dm32PercentToSquelchWire(profileId, percent);
}

export function buildDm32ModeProfilesFromRow(
  typeParse: Dm32ChannelTypeParse,
  fields: {
    bandwidthKHz: number | null;
    colourCode: number | null;
    timeslot: ChannelTimeslot | null;
    rxTone: ChannelTone;
    txTone: ChannelTone;
    squelch: number | null;
  },
): ChannelModeProfile[] {
  if (!typeParse.multiMode) return [];

  const fm = channelModeProfileDefaults('fm');
  fm.bandwidthKHz = fields.bandwidthKHz;
  fm.colourCode = 0;
  fm.timeslot = fields.timeslot;
  fm.rxTone = fields.rxTone;
  fm.txTone = fields.txTone;
  fm.squelch = fields.squelch;

  const dmr = channelModeProfileDefaults('dmr');
  dmr.bandwidthKHz = fields.bandwidthKHz;
  dmr.colourCode = fields.colourCode;
  dmr.timeslot = fields.timeslot;
  dmr.rxTone = fields.rxTone;
  dmr.txTone = fields.txTone;
  dmr.squelch = fields.squelch;

  return [fm, dmr];
}
