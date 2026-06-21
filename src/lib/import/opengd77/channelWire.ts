import {
  clampPercent,
  normalizeToneValue,
  parseFrequencyHzFromMhzWire,
} from '../../channelFields/index.ts';

/** OpenGD77 `Power` column → internal percent (null = radio default). */
const OPENGD77_POWER_WIRE_TO_PERCENT: Record<string, number | null> = {
  Master: null,
  P1: null,
  P2: 25,
  P3: 35,
  P4: 50,
  P5: 55,
  P6: 60,
  P7: 65,
  P8: 75,
  P10: 80,
  P15: 85,
  P20: 90,
  P25: 95,
  P30: 97,
  P50: 98,
  P100: 100,
};

export function parseOpenGd77PowerWire(wire: string): number | null {
  const key = wire.trim();
  if (!key) return null;
  if (key in OPENGD77_POWER_WIRE_TO_PERCENT) {
    return OPENGD77_POWER_WIRE_TO_PERCENT[key];
  }
  const match = /^P(\d+)$/i.exec(key);
  if (match) {
    const n = parseInt(match[1], 10);
    if (Number.isFinite(n)) return clampPercent(n);
  }
  return null;
}

/** OpenGD77 `Squelch` column → internal percent (0 = open/disabled, null = radio default). */
export function parseOpenGd77SquelchWire(wire: string): number | null {
  const trimmed = wire.trim();
  if (!trimmed) return null;
  if (trimmed.toLowerCase() === 'disabled') return 0;
  if (trimmed.toLowerCase() === 'master') return null;
  const pct = trimmed.endsWith('%') ? parseInt(trimmed.slice(0, -1), 10) : parseInt(trimmed, 10);
  if (Number.isFinite(pct)) return clampPercent(pct);
  return null;
}

export function parseOpenGd77BandwidthWire(wire: string): number | null {
  const trimmed = wire.trim().replace(',', '.');
  if (!trimmed) return null;
  const n = parseFloat(trimmed);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function parseOpenGd77ColourCodeWire(wire: string): number | null {
  const trimmed = wire.trim();
  if (!trimmed) return null;
  const n = parseInt(trimmed, 10);
  return Number.isFinite(n) && n >= 0 && n <= 15 ? n : null;
}

export function parseOpenGd77TimeslotWire(wire: string): 1 | 2 | null {
  const trimmed = wire.trim();
  if (trimmed === '1') return 1;
  if (trimmed === '2') return 2;
  return null;
}

export function parseOpenGd77DmrIdWire(wire: string): number | null {
  const trimmed = wire.trim();
  if (!trimmed) return null;
  const n = parseInt(trimmed, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function parseOpenGd77TransmitTimeoutWire(wire: string): number | null {
  const trimmed = wire.trim();
  if (!trimmed) return null;
  const n = parseInt(trimmed, 10);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function parseOpenGd77ToneWire(wire: string): ReturnType<typeof normalizeToneValue> {
  return normalizeToneValue(wire);
}

export function parseOpenGd77FrequencyWire(wire: string): number | null {
  return parseFrequencyHzFromMhzWire(wire);
}

/** Coerce legacy v4 string field values (historically OpenGD77-shaped) during migration. */
export function coerceLegacyStringField(
  field: string,
  value: unknown,
): string | number | boolean | null {
  if (value == null) return null;
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  const wire = String(value);
  switch (field) {
    case 'rxFrequency':
    case 'txFrequency':
      return parseOpenGd77FrequencyWire(wire);
    case 'bandwidthKHz':
      return parseOpenGd77BandwidthWire(wire);
    case 'power':
      return parseOpenGd77PowerWire(wire);
    case 'squelch':
      return parseOpenGd77SquelchWire(wire);
    case 'colourCode':
      return parseOpenGd77ColourCodeWire(wire);
    case 'timeslot':
      return parseOpenGd77TimeslotWire(wire);
    case 'dmrId':
      return parseOpenGd77DmrIdWire(wire);
    case 'transmitTimeout':
      return parseOpenGd77TransmitTimeoutWire(wire);
    case 'rxTone':
    case 'txTone':
      return parseOpenGd77ToneWire(wire);
    case 'rxOnly':
      return wire.trim().toLowerCase() === 'yes';
    default:
      return wire;
  }
}
