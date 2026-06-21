import type { Codeplug } from '../../../models/codeplug.ts';
import { mapModeToOpenGd77ChannelType } from '../../channelModes.ts';
import { formatCsv } from '../csvWrite.ts';
import {
  formatOpenGd77BandwidthWire,
  formatOpenGd77ColourCodeWire,
  formatOpenGd77DmrIdWire,
  formatOpenGd77FrequencyWire,
  formatOpenGd77PowerWire,
  formatOpenGd77SquelchWire,
  formatOpenGd77TimeslotWire,
  formatOpenGd77ToneWire,
  formatOpenGd77TransmitTimeoutWire,
} from './channelWire.ts';

/** OpenGD77 CSV serialisers — wire format in docs/reference/opengd77/;
 *  1701 profile limits in docs/reference/opengd77/radios/baofeng-1701.md. */
import {
  CHANNEL_COL,
  CHANNEL_HEADERS,
  CONTACT_COL,
  CONTACT_HEADERS,
  RX_GROUP_LIST_COL,
  RX_GROUP_LIST_HEADERS,
  VENDOR_EXTRA_HEADERS,
  wireVoxEnabled,
  wireYesNo,
  ZONE_HEADERS,
  zoneMemberHeaders,
  rxGroupListMemberHeaders,
  DTMF_HEADERS,
  APRS_HEADERS,
} from '../../import/opengd77/columns.ts';

function padRow(headers: string[], values: Record<string, string>): string[] {
  return headers.map((h) => values[h] ?? '');
}

export function serialiseChannels(codeplug: Codeplug): string {
  // Channel Number is assigned at export (1..n in channel list order), not stored in the model.
  // OpenGD77 allows 1–1023; over-limit warning tracked in codeplug-tool#95.
  const rows = codeplug.channels.map((ch, i) => {
    const values: Record<string, string> = {
      [CHANNEL_COL.number]: String(i + 1),
      [CHANNEL_COL.name]: ch.name,
      [CHANNEL_COL.type]: mapModeToOpenGd77ChannelType(ch.mode),
      [CHANNEL_COL.rx]: formatOpenGd77FrequencyWire(ch.rxFrequency),
      [CHANNEL_COL.tx]: formatOpenGd77FrequencyWire(ch.txFrequency),
      [CHANNEL_COL.bandwidth]: formatOpenGd77BandwidthWire(ch.bandwidthKHz),
      [CHANNEL_COL.colourCode]: formatOpenGd77ColourCodeWire(ch.colourCode),
      [CHANNEL_COL.timeslot]: formatOpenGd77TimeslotWire(ch.timeslot),
      [CHANNEL_COL.contact]: ch.contactName,
      [CHANNEL_COL.tgList]: ch.rxGroupListName,
      [CHANNEL_COL.dmrId]: formatOpenGd77DmrIdWire(ch.dmrId),
      [CHANNEL_COL.rxTone]: formatOpenGd77ToneWire(ch.rxTone),
      [CHANNEL_COL.txTone]: formatOpenGd77ToneWire(ch.txTone),
      [CHANNEL_COL.squelch]: formatOpenGd77SquelchWire(ch.squelch),
      [CHANNEL_COL.power]: formatOpenGd77PowerWire(ch.power),
      [CHANNEL_COL.rxOnly]: wireYesNo(ch.rxOnly),
      [CHANNEL_COL.allSkip]: wireYesNo(ch.scanSkip),
      [CHANNEL_COL.tot]: formatOpenGd77TransmitTimeoutWire(ch.transmitTimeout),
      [CHANNEL_COL.vox]: wireVoxEnabled(ch.voxEnabled),
      [CHANNEL_COL.aprs]: ch.aprsConfigName,
      [CHANNEL_COL.lat]: ch.location ? String(ch.location.lat) : '',
      [CHANNEL_COL.lon]: ch.location ? String(ch.location.lon) : '',
      [CHANNEL_COL.useLocation]: wireYesNo(ch.useLocation),
    };

    for (const header of VENDOR_EXTRA_HEADERS) {
      values[header] = ch.vendorExtras[header] ?? '';
    }

    return padRow(CHANNEL_HEADERS, values);
  });

  return formatCsv(CHANNEL_HEADERS, rows);
}

export function serialiseZones(codeplug: Codeplug): string {
  const memberHeaders = zoneMemberHeaders();
  const rows = codeplug.zones.map((zone) => {
    const values: Record<string, string> = { 'Zone Name': zone.name };
    zone.sourceMemberNames.forEach((name, i) => {
      if (i < memberHeaders.length) values[memberHeaders[i]] = name;
    });
    return padRow(ZONE_HEADERS, values);
  });
  return formatCsv(ZONE_HEADERS, rows);
}

export function serialiseContacts(codeplug: Codeplug): string {
  const rows: string[][] = [];

  for (const tg of codeplug.talkGroups) {
    rows.push(
      padRow(CONTACT_HEADERS, {
        [CONTACT_COL.name]: tg.name,
        [CONTACT_COL.id]: tg.number,
        [CONTACT_COL.idType]: 'Group',
        [CONTACT_COL.tsOverride]: tg.timeslotOverride,
      }),
    );
  }

  for (const contact of codeplug.contacts) {
    rows.push(
      padRow(CONTACT_HEADERS, {
        [CONTACT_COL.name]: contact.name,
        [CONTACT_COL.id]: contact.number,
        [CONTACT_COL.idType]: 'Private',
        [CONTACT_COL.tsOverride]: contact.timeslotOverride,
      }),
    );
  }

  return formatCsv(CONTACT_HEADERS, rows);
}

export function serialiseRxGroupLists(codeplug: Codeplug): string {
  const memberHeaders = rxGroupListMemberHeaders();
  const rows = codeplug.rxGroupLists.map((list) => {
    const values: Record<string, string> = { [RX_GROUP_LIST_COL.name]: list.name };
    list.sourceMemberNames.forEach((name, i) => {
      if (i < memberHeaders.length) values[memberHeaders[i]] = name;
    });
    return padRow(RX_GROUP_LIST_HEADERS, values);
  });
  return formatCsv(RX_GROUP_LIST_HEADERS, rows);
}

export function serialiseDtmfHeaderOnly(): string {
  return formatCsv(DTMF_HEADERS, []);
}

export function serialiseAprsHeaderOnly(): string {
  return formatCsv(APRS_HEADERS, []);
}

export interface OpenGd77ExportFiles {
  'Channels.csv': string;
  'Zones.csv': string;
  'Contacts.csv': string;
  'TG_Lists.csv': string;
  'DTMF.csv': string;
  'APRS.csv': string;
}

export function serialiseOpenGd77Files(codeplug: Codeplug): OpenGd77ExportFiles {
  return {
    'Channels.csv': serialiseChannels(codeplug),
    'Zones.csv': serialiseZones(codeplug),
    'Contacts.csv': serialiseContacts(codeplug),
    'TG_Lists.csv': serialiseRxGroupLists(codeplug),
    'DTMF.csv': serialiseDtmfHeaderOnly(),
    'APRS.csv': serialiseAprsHeaderOnly(),
  };
}
