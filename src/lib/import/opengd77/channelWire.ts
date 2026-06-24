import {
  clampPercent,
  normalizeToneValue,
  parseFrequencyHzFromMhzWire,
} from '../../channelFields/index.ts';
import { opengd77WireToPercent, DEFAULT_OPENGD77_PROFILE_ID } from '../../opengd77/profiles.ts';

/** OpenGD77 `Power` column → internal percent via profile ladder. */
export function parseOpenGd77PowerWire(
  wire: string,
  profileId: string = DEFAULT_OPENGD77_PROFILE_ID,
): number | null {
  return opengd77WireToPercent(profileId, wire);
}

/** OpenGD77 `Squelch` column → internal percent (`null` = radio default / Disabled wire). */
export function parseOpenGd77SquelchWire(wire: string): number | null {
  const trimmed = wire.trim();
  if (!trimmed) return null;
  if (trimmed.toLowerCase() === 'disabled') return null;
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
    case 'forbidTransmit':
      return wire.trim().toLowerCase() === 'yes';
    default:
      return wire;
  }
}
