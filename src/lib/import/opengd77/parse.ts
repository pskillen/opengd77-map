import { extractCallsign, parseCsv } from '../../csv.ts';
import {
  channelFieldDefaults,
  mapChannelMode,
  newId,
  type Channel,
} from '../../../models/codeplug.ts';
import type { ParsedZone } from '../types.ts';
import {
  CHANNEL_COL,
  parseVoxEnabled,
  parseYesNo,
  VENDOR_EXTRA_HEADERS,
} from './columns.ts';

export function parseChannels(text: string): Channel[] {
  const rows = parseCsv(text.replace(/^\uFEFF/, ''));
  if (!rows.length) throw new Error('Empty CSV');

  const headers = rows[0].map((h) => h.trim());
  const required = [CHANNEL_COL.name, CHANNEL_COL.lat, CHANNEL_COL.lon];
  for (const key of required) {
    if (!headers.includes(key)) {
      throw new Error(`Missing column "${key}". Is this an OpenGD77 Channels.csv?`);
    }
  }

  const idx = Object.fromEntries(headers.map((h, i) => [h, i]));
  const out: Channel[] = [];

  for (let r = 1; r < rows.length; r++) {
    const cells = rows[r];
    if (!cells.length || (cells.length === 1 && !cells[0].trim())) continue;

    const get = (col: string) => (cells[idx[col]] ?? '').trim().replace(/\t/g, '');

    const name = get(CHANNEL_COL.name);
    if (!name) continue;

    const lat = parseFloat(get(CHANNEL_COL.lat));
    const lon = parseFloat(get(CHANNEL_COL.lon));
    const hasLat = Number.isFinite(lat);
    const hasLon = Number.isFinite(lon);

    const vendorExtras: Record<string, string> = {};
    for (const header of VENDOR_EXTRA_HEADERS) {
      if (headers.includes(header)) {
        vendorExtras[header] = get(header);
      }
    }

    out.push({
      id: newId(),
      ...channelFieldDefaults(),
      number: get(CHANNEL_COL.number),
      name,
      callsign: extractCallsign(name),
      mode: mapChannelMode(get(CHANNEL_COL.type)),
      rxFrequency: get(CHANNEL_COL.rx),
      txFrequency: get(CHANNEL_COL.tx),
      bandwidthKHz: get(CHANNEL_COL.bandwidth),
      colourCode: get(CHANNEL_COL.colourCode),
      timeslot: get(CHANNEL_COL.timeslot),
      contactName: get(CHANNEL_COL.contact),
      rxGroupListName: get(CHANNEL_COL.tgList),
      dmrId: get(CHANNEL_COL.dmrId),
      rxTone: get(CHANNEL_COL.rxTone),
      txTone: get(CHANNEL_COL.txTone),
      squelch: get(CHANNEL_COL.squelch),
      power: get(CHANNEL_COL.power),
      rxOnly: get(CHANNEL_COL.rxOnly),
      aprsConfigName: get(CHANNEL_COL.aprs),
      voxEnabled: parseVoxEnabled(get(CHANNEL_COL.vox)),
      transmitTimeout: get(CHANNEL_COL.tot),
      scanSkip: parseYesNo(get(CHANNEL_COL.allSkip)),
      location: hasLat && hasLon ? { lat, lon } : null,
      useLocation: parseYesNo(get(CHANNEL_COL.useLocation)),
      vendorExtras,
    });
  }
  return out;
}

export function parseZones(text: string): ParsedZone[] {
  const rows = parseCsv(text.replace(/^\uFEFF/, ''));
  if (!rows.length) throw new Error('Empty CSV');

  const headers = rows[0].map((h) => h.trim());
  if (!headers.includes('Zone Name')) {
    throw new Error('Missing column "Zone Name". Is this an OpenGD77 Zones.csv?');
  }

  const idx = Object.fromEntries(headers.map((h, i) => [h, i]));
  const channelCols = headers
    .map((h, i) => (/^Channel\d+$/i.test(h) ? i : -1))
    .filter((i) => i >= 0);

  const out: ParsedZone[] = [];
  for (let r = 1; r < rows.length; r++) {
    const cells = rows[r];
    if (!cells.length || (cells.length === 1 && !cells[0].trim())) continue;

    const name = (cells[idx['Zone Name']] ?? '').trim();
    if (!name) continue;

    const memberNames: string[] = [];
    for (const ci of channelCols) {
      const ch = (cells[ci] ?? '').trim();
      if (ch) memberNames.push(ch);
    }
    out.push({ name, memberNames });
  }
  return out;
}
