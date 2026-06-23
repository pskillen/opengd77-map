import { mergeImportChannelsBestEffort } from '../../channelExpansion/index.ts';
import { parseCsv } from '../../csv.ts';
import { channelFieldDefaults, newId, type Channel } from '../../../models/codeplug.ts';
import { mapOpenGd77ChannelType } from '../../channelModes.ts';
import type { Contact, TalkGroup } from '../../../models/codeplug.ts';
import type { ParsedRxGroupList, ParsedZone } from '../types.ts';
import { stampImported, type WithEntityMeta } from '../../entityProvenance.ts';
import type { ImportParseContext } from '../../import-export/importAdapter.ts';
import {
  CHANNEL_COL,
  CONTACT_COL,
  parseVoxEnabled,
  parseYesNo,
  RX_GROUP_LIST_COL,
  VENDOR_EXTRA_HEADERS,
} from './columns.ts';
import {
  parseOpenGd77BandwidthWire,
  parseOpenGd77ColourCodeWire,
  parseOpenGd77DmrIdWire,
  parseOpenGd77FrequencyWire,
  parseOpenGd77PowerWire,
  parseOpenGd77SquelchWire,
  parseOpenGd77TimeslotWire,
  parseOpenGd77ToneWire,
  parseOpenGd77TransmitTimeoutWire,
} from './channelWire.ts';

const OPENGD77_FORMAT = 'opengd77';

function importStamp(
  sourceFile: string,
  defaultExtra?: {
    memberWireNames?: string[];
    contactWireName?: string;
    rxGroupListWireName?: string;
    channelWireName?: string;
  },
) {
  const importedAt = new Date().toISOString();
  return <T extends WithEntityMeta>(
    entity: T,
    perEntityExtra?: {
      memberWireNames?: string[];
      contactWireName?: string;
      rxGroupListWireName?: string;
      channelWireName?: string;
    },
  ): T =>
    stampImported(entity, {
      formatId: OPENGD77_FORMAT,
      sourceFile,
      importedAt,
      ...defaultExtra,
      ...perEntityExtra,
    });
}

export function parseChannels(text: string, ctx?: ImportParseContext): Channel[] {
  const profileId = ctx?.profileId;
  if (!profileId) {
    throw new Error('OpenGD77 import requires a radio profile');
  }
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
  const stamp = importStamp('Channels.csv');

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

    const opengd77Extras: Record<string, string> = {};
    for (const header of VENDOR_EXTRA_HEADERS) {
      if (headers.includes(header)) {
        opengd77Extras[header] = get(header);
      }
    }

    out.push(
      stamp(
        {
          id: newId(),
          ...channelFieldDefaults(),
          name,
          callsign: '',
          mode: mapOpenGd77ChannelType(get(CHANNEL_COL.type)),
          rxFrequency: parseOpenGd77FrequencyWire(get(CHANNEL_COL.rx)),
          txFrequency: parseOpenGd77FrequencyWire(get(CHANNEL_COL.tx)),
          bandwidthKHz: parseOpenGd77BandwidthWire(get(CHANNEL_COL.bandwidth)),
          colourCode: parseOpenGd77ColourCodeWire(get(CHANNEL_COL.colourCode)),
          timeslot: parseOpenGd77TimeslotWire(get(CHANNEL_COL.timeslot)),
          contactRef: null,
          rxGroupListId: null,
          dmrId: parseOpenGd77DmrIdWire(get(CHANNEL_COL.dmrId)),
          rxTone: parseOpenGd77ToneWire(get(CHANNEL_COL.rxTone)),
          txTone: parseOpenGd77ToneWire(get(CHANNEL_COL.txTone)),
          squelch: parseOpenGd77SquelchWire(get(CHANNEL_COL.squelch)),
          power: parseOpenGd77PowerWire(get(CHANNEL_COL.power), profileId),
          rxOnly: parseYesNo(get(CHANNEL_COL.rxOnly)),
          aprsConfigName: get(CHANNEL_COL.aprs),
          voxEnabled: parseVoxEnabled(get(CHANNEL_COL.vox)),
          transmitTimeout: parseOpenGd77TransmitTimeoutWire(get(CHANNEL_COL.tot)),
          scanSkip: parseYesNo(get(CHANNEL_COL.allSkip)),
          location: hasLat && hasLon ? { lat, lon } : null,
          useLocation: parseYesNo(get(CHANNEL_COL.useLocation)),
          opengd77Extras,
        },
        {
          channelWireName: name,
          contactWireName: get(CHANNEL_COL.contact),
          rxGroupListWireName: get(CHANNEL_COL.tgList),
        },
      ),
    );
  }
  return mergeImportChannelsBestEffort(out).channels;
}

export interface ParsedContacts {
  contacts: Contact[];
  talkGroups: TalkGroup[];
}

export function parseContacts(text: string): ParsedContacts {
  const rows = parseCsv(text.replace(/^\uFEFF/, ''));
  if (!rows.length) throw new Error('Empty CSV');

  const headers = rows[0].map((h) => h.trim());
  for (const key of [CONTACT_COL.name, CONTACT_COL.id, CONTACT_COL.idType]) {
    if (!headers.includes(key)) {
      throw new Error(`Missing column "${key}". Is this an OpenGD77 Contacts.csv?`);
    }
  }

  const idx = Object.fromEntries(headers.map((h, i) => [h, i]));
  const contacts: Contact[] = [];
  const talkGroups: TalkGroup[] = [];
  const stamp = importStamp('Contacts.csv');

  for (let r = 1; r < rows.length; r++) {
    const cells = rows[r];
    if (!cells.length || (cells.length === 1 && !cells[0].trim())) continue;

    const get = (col: string) => (cells[idx[col]] ?? '').trim();
    const name = get(CONTACT_COL.name);
    if (!name) continue;

    const number = get(CONTACT_COL.id);
    const idType = get(CONTACT_COL.idType);
    const timeslotOverride = get(CONTACT_COL.tsOverride);

    if (idType.toLowerCase() === 'group') {
      const base: TalkGroup = { id: newId(), name, number, timeslotOverride };
      talkGroups.push(stamp(base));
    } else {
      const base: Contact = {
        id: newId(),
        name,
        identifier: number,
        signalingMode: 'dmr',
        ...(timeslotOverride.trim() !== '' ? { timeslotOverride } : {}),
      };
      contacts.push(stamp(base));
    }
  }

  return { contacts, talkGroups };
}

export function parseRxGroupLists(text: string): ParsedRxGroupList[] {
  const rows = parseCsv(text.replace(/^\uFEFF/, ''));
  if (!rows.length) throw new Error('Empty CSV');

  const headers = rows[0].map((h) => h.trim());
  if (!headers.includes(RX_GROUP_LIST_COL.name)) {
    throw new Error(
      `Missing column "${RX_GROUP_LIST_COL.name}". Is this an OpenGD77 TG_Lists.csv?`,
    );
  }

  const idx = Object.fromEntries(headers.map((h, i) => [h, i]));
  const memberCols = headers
    .map((h, i) => (/^Contact\d+$/i.test(h) ? i : -1))
    .filter((i) => i >= 0);

  const out: ParsedRxGroupList[] = [];
  for (let r = 1; r < rows.length; r++) {
    const cells = rows[r];
    if (!cells.length || (cells.length === 1 && !cells[0].trim())) continue;

    const name = (cells[idx[RX_GROUP_LIST_COL.name]] ?? '').trim();
    if (!name) continue;

    const memberWireNames: string[] = [];
    for (const ci of memberCols) {
      const member = (cells[ci] ?? '').trim();
      if (member) memberWireNames.push(member);
    }
    out.push({ name, memberWireNames });
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
