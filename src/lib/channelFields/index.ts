export {
  formatFrequencyMhzWireFromHz,
  frequencyHzToMhz,
  parseFrequencyHzFromMhzInput,
  parseFrequencyHzFromMhzWire,
} from './frequencies.ts';
export {
  clampPercent,
  percentLabel,
  POWER_PERCENT_OPTIONS,
  SQUELCH_PERCENT_OPTIONS,
} from './percent.ts';
export {
  CTCSS_TONE_OPTIONS,
  DCS_TONE_OPTIONS,
  NONE_TONE,
  normalizeToneValue,
  toneSelectOptions,
  type ChannelTone,
} from './tones.ts';

export type ChannelTimeslot = 1 | 2;

export const BANDWIDTH_KHZ_OPTIONS: readonly number[] = [12.5, 25];
