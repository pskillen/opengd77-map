import { parseCsv, extractCallsign } from '../../csv.ts';
import {
  channelFieldDefaults,
  newId,
  type Channel,
  type Contact,
  type TalkGroup,
} from '../../../models/codeplug.ts';
import { stampImported, type WithEntityMeta } from '../../entityProvenance.ts';
import type { ImportParseContext } from '../../import-export/importAdapter.ts';
import type { ParsedRxGroupList, ParsedZone } from '../types.ts';
import {
  CHANNEL_COL,
  CONTACT_COL,
  DTMF_CONTACT_COL,
  RX_GROUP_LIST_COL,
  TALKGROUP_COL,
  ZONE_COL,
} from './columns.ts';
import {
  buildDm32ModeProfilesFromRow,
  parseDm32BandwidthWire,
  parseDm32ChannelTypeWire,
  parseDm32ColourCodeWire,
  parseDm32FlagWire,
  parseDm32FrequencyWire,
  parseDm32PowerWire,
  parseDm32SquelchWire,
  parseDm32TimeslotWire,
  parseDm32ToneWire,
} from './channelWire.ts';

const DM32_FORMAT = 'dm32';

function importStamp(sourceFile: string) {
  const importedAt = new Date().toISOString();
  return <T extends WithEntityMeta>(
    entity: T,
    perEntityExtra?: {
      memberWireNames?: string[];
      contactWireName?: string;
      rxGroupListWireName?: string;
      multiModeProfileWire?: import('../../entityProvenance.ts').ImportedProvenance['multiModeProfileWire'];
    },
  ): T =>
    stampImported(entity, {
      formatId: DM32_FORMAT,
      sourceFile,
      importedAt,
      ...perEntityExtra,
    });
}

function wireNameOrNull(wire: string): string | null {
  const trimmed = wire.trim();
  if (!trimmed || trimmed.toLowerCase() === 'none') return null;
  return trimmed;
}

export function parseChannels(text: string, ctx?: ImportParseContext): Channel[] {
  const profileId = ctx?.profileId ?? 'dm32-baofeng-dm32uv';
  const rows = parseCsv(text.replace(/^\uFEFF/, ''));
  if (!rows.length) throw new Error('Empty CSV');

  const headers = rows[0].map((h) => h.trim());
  if (!headers.includes(CHANNEL_COL.name)) {
    throw new Error(`Missing column "${CHANNEL_COL.name}". Is this a DM32 Channels.csv?`);
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

    const typeParse = parseDm32ChannelTypeWire(get(CHANNEL_COL.type));
    const bandwidthKHz = parseDm32BandwidthWire(get(CHANNEL_COL.bandwidth));
    const colourCode = parseDm32ColourCodeWire(get(CHANNEL_COL.colourCode));
    const timeslot = parseDm32TimeslotWire(get(CHANNEL_COL.timeslot));
    const rxTone = parseDm32ToneWire(get(CHANNEL_COL.rxTone));
    const txTone = parseDm32ToneWire(get(CHANNEL_COL.txTone));
    const squelch = parseDm32SquelchWire(get(CHANNEL_COL.squelch), profileId);
    const contactWire = wireNameOrNull(get(CHANNEL_COL.txContact));
    const rglWire = wireNameOrNull(get(CHANNEL_COL.rxGroupList));

    const modeProfiles = typeParse.multiMode
      ? buildDm32ModeProfilesFromRow(typeParse, {
          bandwidthKHz,
          colourCode,
          timeslot,
          rxTone,
          txTone,
          squelch,
        })
      : [];

    const channel: Channel = {
      ...channelFieldDefaults(),
      id: newId(),
      name,
      callsign: extractCallsign(name),
      mode: typeParse.mode,
      multiMode: typeParse.multiMode,
      modeProfiles,
      rxFrequency: parseDm32FrequencyWire(get(CHANNEL_COL.rx)),
      txFrequency: parseDm32FrequencyWire(get(CHANNEL_COL.tx)),
      bandwidthKHz,
      colourCode: typeParse.multiMode ? null : colourCode,
      timeslot: typeParse.multiMode ? null : timeslot,
      rxTone: typeParse.multiMode ? 'none' : rxTone,
      txTone: typeParse.multiMode ? 'none' : txTone,
      squelch,
      power: parseDm32PowerWire(get(CHANNEL_COL.power), profileId),
      txAdmit: get(CHANNEL_COL.txAdmit) || 'Channel Idle',
      aprsReportType: get(CHANNEL_COL.aprsReportType) || 'Off',
      forbidTransmit: parseDm32FlagWire(get(CHANNEL_COL.forbidTx)),
      aprsReceiveEnabled: parseDm32FlagWire(get(CHANNEL_COL.aprsReceive)),
      forbidTalkaround: parseDm32FlagWire(get(CHANNEL_COL.forbidTalkaround)),
      directDualMode: parseDm32FlagWire(get(CHANNEL_COL.directDualMode)),
      aprsReportChannel: (() => {
        const n = parseInt(get(CHANNEL_COL.aprsReportChannel), 10);
        return Number.isFinite(n) ? n : null;
      })(),
      contactRef: null,
      rxGroupListId: null,
    };

    out.push(
      stamp<Channel>(channel, {
        contactWireName: contactWire ?? undefined,
        rxGroupListWireName: rglWire ?? undefined,
        multiModeProfileWire: typeParse.multiMode
          ? [
              { mode: 'fm' as const },
              {
                mode: 'dmr' as const,
                contactWireName: contactWire ?? undefined,
                rxGroupListWireName: rglWire ?? undefined,
              },
            ]
          : undefined,
      }),
    );
  }

  return out;
}

export function parseZones(text: string): ParsedZone[] {
  const rows = parseCsv(text.replace(/^\uFEFF/, ''));
  if (!rows.length) throw new Error('Empty CSV');
  const headers = rows[0].map((h) => h.trim());
  const idx = Object.fromEntries(headers.map((h, i) => [h, i]));
  const out: ParsedZone[] = [];

  for (let r = 1; r < rows.length; r++) {
    const cells = rows[r];
    const name = (cells[idx[ZONE_COL.name]] ?? '').trim();
    if (!name) continue;
    const membersRaw = (cells[idx[ZONE_COL.members]] ?? '').trim();
    const memberNames = membersRaw
      ? membersRaw
          .split('|')
          .map((m) => m.trim())
          .filter(Boolean)
      : [];
    out.push({ name, memberNames });
  }
  return out;
}

export function parseTalkGroups(text: string): TalkGroup[] {
  const rows = parseCsv(text.replace(/^\uFEFF/, ''));
  if (!rows.length) throw new Error('Empty CSV');
  const headers = rows[0].map((h) => h.trim());
  const idx = Object.fromEntries(headers.map((h, i) => [h, i]));
  const stamp = importStamp('Talkgroups.csv');
  const out: TalkGroup[] = [];

  for (let r = 1; r < rows.length; r++) {
    const cells = rows[r];
    const name = (cells[idx[TALKGROUP_COL.name]] ?? '').trim();
    if (!name) continue;
    const typeWire = (cells[idx[TALKGROUP_COL.type]] ?? '').trim();
    out.push(
      stamp<TalkGroup>({
        id: newId(),
        name,
        number: (cells[idx[TALKGROUP_COL.id]] ?? '').trim(),
        timeslotOverride: '',
        callType: typeWire === 'Private Call' ? 'private' : 'group',
      }),
    );
  }
  return out;
}

export function parseContacts(text: string): { contacts: Contact[]; talkGroups: TalkGroup[] } {
  const rows = parseCsv(text.replace(/^\uFEFF/, ''));
  if (!rows.length) throw new Error('Empty CSV');
  const headers = rows[0].map((h) => h.trim());
  const idx = Object.fromEntries(headers.map((h, i) => [h, i]));
  const stamp = importStamp('Contacts.csv');
  const contacts: Contact[] = [];

  for (let r = 1; r < rows.length; r++) {
    const cells = rows[r];
    const name = (cells[idx[CONTACT_COL.name]] ?? '').trim();
    if (!name) continue;
    contacts.push(
      stamp<Contact>({
        id: newId(),
        name,
        identifier: (cells[idx[CONTACT_COL.id]] ?? '').trim(),
        signalingMode: 'dmr',
      }),
    );
  }
  return { contacts, talkGroups: [] };
}

export function parseDtmfContacts(text: string): Contact[] {
  const rows = parseCsv(text.replace(/^\uFEFF/, ''));
  if (!rows.length) throw new Error('Empty CSV');
  const headers = rows[0].map((h) => h.trim());
  const idx = Object.fromEntries(headers.map((h, i) => [h, i]));
  const stamp = importStamp('DTMFContacts.csv');
  const contacts: Contact[] = [];

  for (let r = 1; r < rows.length; r++) {
    const cells = rows[r];
    const name = (cells[idx[DTMF_CONTACT_COL.name]] ?? '').trim();
    if (!name) continue;
    contacts.push(
      stamp<Contact>({
        id: newId(),
        name,
        identifier: (cells[idx[DTMF_CONTACT_COL.id]] ?? '').trim(),
        signalingMode: 'dtmf',
      }),
    );
  }
  return contacts;
}

export function parseRxGroupLists(text: string): ParsedRxGroupList[] {
  const rows = parseCsv(text.replace(/^\uFEFF/, ''));
  if (!rows.length) throw new Error('Empty CSV');
  const headers = rows[0].map((h) => h.trim());
  const idx = Object.fromEntries(headers.map((h, i) => [h, i]));
  const out: ParsedRxGroupList[] = [];

  for (let r = 1; r < rows.length; r++) {
    const cells = rows[r];
    const name = (cells[idx[RX_GROUP_LIST_COL.name]] ?? '').trim();
    if (!name) continue;
    const membersRaw = (cells[idx[RX_GROUP_LIST_COL.members]] ?? '').trim();
    const memberWireNames = membersRaw ? membersRaw.split('|').map((m) => m.trim()) : [];
    out.push({ name, memberWireNames });
  }
  return out;
}
