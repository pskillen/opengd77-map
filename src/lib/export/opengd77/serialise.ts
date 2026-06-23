import type { Codeplug } from '../../../models/codeplug.ts';
import { mapModeToOpenGd77ChannelType } from '../../channelModes.ts';
import {
  expandAllChannelsForExport,
  type ExpandedChannelRow,
} from '../../channelExpansion/index.ts';
import { formatCsv } from '../csvWrite.ts';
import type { ExportOptions } from '../../import-export/types.ts';
import {
  DEFAULT_OPENGD77_PROFILE_ID,
  getOpenGd77Profile,
  type OpenGd77RadioProfile,
} from '../../opengd77/profiles.ts';
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
import { contactRefWireNameForExport, rxGroupListWireNameForExport } from '../../entityRefs.ts';
import { rxGroupListExportMemberNames, zoneExportMemberNames } from './listWire.ts';

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

function channelRowValues(
  row: ExpandedChannelRow,
  codeplug: Codeplug,
  profile: OpenGd77RadioProfile,
  rowNumber: number,
): Record<string, string> {
  const values: Record<string, string> = {
    [CHANNEL_COL.number]: String(rowNumber),
    [CHANNEL_COL.name]: row.wireName,
    [CHANNEL_COL.type]: mapModeToOpenGd77ChannelType(row.mode),
    [CHANNEL_COL.rx]: formatOpenGd77FrequencyWire(row.rxFrequency),
    [CHANNEL_COL.tx]: formatOpenGd77FrequencyWire(row.txFrequency),
    [CHANNEL_COL.bandwidth]: formatOpenGd77BandwidthWire(row.bandwidthKHz),
    [CHANNEL_COL.colourCode]: formatOpenGd77ColourCodeWire(row.colourCode),
    [CHANNEL_COL.timeslot]: formatOpenGd77TimeslotWire(row.timeslot),
    [CHANNEL_COL.contact]: contactRefWireNameForExport(row, codeplug),
    [CHANNEL_COL.tgList]: rxGroupListWireNameForExport(row, codeplug),
    [CHANNEL_COL.dmrId]: formatOpenGd77DmrIdWire(row.mode, row.dmrId),
    [CHANNEL_COL.rxTone]: formatOpenGd77ToneWire(row.mode, row.rxTone),
    [CHANNEL_COL.txTone]: formatOpenGd77ToneWire(row.mode, row.txTone),
    [CHANNEL_COL.squelch]: formatOpenGd77SquelchWire(row.mode, row.squelch),
    [CHANNEL_COL.power]: formatOpenGd77PowerWire(row.power, profile.id),
    [CHANNEL_COL.rxOnly]: wireYesNo(row.rxOnly),
    [CHANNEL_COL.allSkip]: wireYesNo(row.scanSkip),
    [CHANNEL_COL.tot]: formatOpenGd77TransmitTimeoutWire(row.transmitTimeout),
    [CHANNEL_COL.vox]: wireVoxEnabled(row.voxEnabled),
    [CHANNEL_COL.aprs]: row.aprsConfigName,
    [CHANNEL_COL.lat]: row.location ? String(row.location.lat) : '',
    [CHANNEL_COL.lon]: row.location ? String(row.location.lon) : '',
    [CHANNEL_COL.useLocation]: wireYesNo(row.useLocation),
  };

  for (const header of VENDOR_EXTRA_HEADERS) {
    values[header] = row.opengd77Extras[header] ?? '';
  }

  return values;
}

export function serialiseChannels(codeplug: Codeplug, profileId?: string): string {
  const profile = getOpenGd77Profile(profileId ?? DEFAULT_OPENGD77_PROFILE_ID);
  const expanded = expandAllChannelsForExport(codeplug.channels, {
    maxNameLength: 16,
  });
  const rows = expanded.map((row, i) =>
    padRow(CHANNEL_HEADERS, channelRowValues(row, codeplug, profile, i + 1)),
  );
  return formatCsv(CHANNEL_HEADERS, rows);
}

export function serialiseZones(codeplug: Codeplug, profileId?: string): string {
  const profile = getOpenGd77Profile(profileId ?? DEFAULT_OPENGD77_PROFILE_ID);
  const memberHeaders = zoneMemberHeaders(profile.zoneMembers);
  const rows = codeplug.zones.map((zone) => {
    const values: Record<string, string> = { 'Zone Name': zone.name };
    zoneExportMemberNames(zone, codeplug.channels, profileId).forEach((name, i) => {
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
        [CONTACT_COL.id]: contact.identifier,
        [CONTACT_COL.idType]: 'Private',
        [CONTACT_COL.tsOverride]: contact.timeslotOverride ?? '',
      }),
    );
  }

  return formatCsv(CONTACT_HEADERS, rows);
}

export function serialiseRxGroupLists(codeplug: Codeplug, profileId?: string): string {
  const profile = getOpenGd77Profile(profileId ?? DEFAULT_OPENGD77_PROFILE_ID);
  const memberHeaders = rxGroupListMemberHeaders(profile.tgListMembers);
  const rows = codeplug.rxGroupLists.map((list) => {
    const values: Record<string, string> = { [RX_GROUP_LIST_COL.name]: list.name };
    rxGroupListExportMemberNames(list, codeplug.talkGroups, codeplug.contacts).forEach(
      (name, i) => {
        if (i < memberHeaders.length) values[memberHeaders[i]] = name;
      },
    );
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

export function serialiseOpenGd77Files(
  codeplug: Codeplug,
  options?: ExportOptions,
): OpenGd77ExportFiles {
  const profileId = options?.profileId ?? DEFAULT_OPENGD77_PROFILE_ID;
  return {
    'Channels.csv': serialiseChannels(codeplug, profileId),
    'Zones.csv': serialiseZones(codeplug, profileId),
    'Contacts.csv': serialiseContacts(codeplug),
    'TG_Lists.csv': serialiseRxGroupLists(codeplug, profileId),
    'DTMF.csv': serialiseDtmfHeaderOnly(),
    'APRS.csv': serialiseAprsHeaderOnly(),
  };
}
