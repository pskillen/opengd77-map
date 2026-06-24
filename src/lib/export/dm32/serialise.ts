import type { Codeplug } from '../../../models/codeplug.ts';
import {
  expandAllChannelsForExport,
  expandZoneMemberWireNames,
} from '../../channelExpansion/index.ts';
import {
  expandOptionsFromExport,
  effectiveMaxNameLength,
} from '../../channelExpansion/exportOptions.ts';
import { formatCsv } from '../csvWrite.ts';
import type { ExportOptions } from '../../import-export/types.ts';
import { DEFAULT_DM32_PROFILE_ID, getDm32Profile } from '../../dm32/profiles.ts';
import {
  CHANNEL_HEADERS,
  CONTACT_COL,
  CONTACT_HEADERS,
  DTMF_CONTACT_COL,
  DTMF_CONTACT_HEADERS,
  DM32_EXPORT_FILE_NAMES,
  DM32_NON_EXPANDABLE_RX_GROUP_LISTS,
  RX_GROUP_LIST_COL,
  RX_GROUP_LIST_HEADERS,
  TALKGROUP_COL,
  TALKGROUP_HEADERS,
  ZONE_COL,
  ZONE_HEADERS,
  type Dm32ExportFileName,
} from '../../import/dm32/columns.ts';
import { serialiseDm32ChannelRow } from './channelWire.ts';
import { rxGroupListExportMemberNames } from './listWire.ts';

export type Dm32ExportFiles = Record<Dm32ExportFileName, string>;

function padRow(headers: string[], values: Record<string, string>): string[] {
  return headers.map((h) => values[h] ?? '');
}

function dm32ExpandOptions(codeplug: Codeplug, options?: ExportOptions, warnings?: string[]) {
  return expandOptionsFromExport(
    codeplug,
    {
      expandModes: false,
      expandRxGroupLists: true,
      skipExpandWhenTxContactSet: true,
      nonExpandableRxGroupListNames: [...DM32_NON_EXPANDABLE_RX_GROUP_LISTS],
      profileId: options?.profileId,
      shortenNames: options?.shortenNames,
      maxNameLength: options?.maxNameLength,
      nameModeOverride: options?.nameModeOverride,
      useTalkGroupAbbreviation: options?.useTalkGroupAbbreviation,
      useChannelAbbreviation: options?.useChannelAbbreviation,
      multiTalkGroupExportNameMode: options?.multiTalkGroupExportNameMode,
    },
    warnings,
  );
}

function dm32MaxNameLength(options: ExportOptions | undefined, profileId: string): number {
  const profile = getDm32Profile(profileId);
  return effectiveMaxNameLength(options, profile.nameLimit);
}

export function serialiseDm32Files(codeplug: Codeplug, options?: ExportOptions): Dm32ExportFiles {
  return {
    'Channels.csv': serialiseChannels(codeplug, options),
    'Zones.csv': serialiseZones(codeplug, options),
    'Talkgroups.csv': serialiseTalkGroups(codeplug),
    'Contacts.csv': serialiseDmrContacts(codeplug),
    'RXGroupLists.csv': serialiseRxGroupLists(codeplug),
    'DTMFContacts.csv': serialiseDtmfContacts(codeplug),
  };
}

export function serialiseChannels(codeplug: Codeplug, options?: ExportOptions): string {
  const profileId = options?.profileId ?? DEFAULT_DM32_PROFILE_ID;
  const expandOpts = dm32ExpandOptions(codeplug, options);
  const expanded = expandAllChannelsForExport(codeplug.channels, {
    ...expandOpts,
    maxNameLength: dm32MaxNameLength(options, profileId),
  });
  const byId = new Map(codeplug.channels.map((ch) => [ch.id, ch]));
  const rows = expanded.map((row, i) => {
    const source = byId.get(row.sourceChannelId);
    if (!source) throw new Error(`Missing source channel ${row.sourceChannelId}`);
    return padRow(
      CHANNEL_HEADERS,
      serialiseDm32ChannelRow(row, source, codeplug, profileId, i + 1),
    );
  });
  return formatCsv(CHANNEL_HEADERS, rows);
}

export function serialiseZones(codeplug: Codeplug, options?: ExportOptions): string {
  const profileId = options?.profileId ?? DEFAULT_DM32_PROFILE_ID;
  const expandOpts = dm32ExpandOptions(codeplug, options);
  const rows = codeplug.zones.map((zone, i) => {
    const { names } = expandZoneMemberWireNames(zone, codeplug.channels, {
      ...expandOpts,
      maxNameLength: dm32MaxNameLength(options, profileId),
    });
    return padRow(ZONE_HEADERS, {
      [ZONE_COL.number]: String(i + 1),
      [ZONE_COL.name]: zone.name,
      [ZONE_COL.members]: names.join('|'),
    });
  });
  return formatCsv(ZONE_HEADERS, rows);
}

export function serialiseTalkGroups(codeplug: Codeplug): string {
  const rows = codeplug.talkGroups.map((tg, i) =>
    padRow(TALKGROUP_HEADERS, {
      [TALKGROUP_COL.number]: String(i + 1),
      [TALKGROUP_COL.name]: tg.name,
      [TALKGROUP_COL.id]: tg.number,
      [TALKGROUP_COL.type]: tg.callType === 'private' ? 'Private Call' : 'Group Call',
    }),
  );
  return formatCsv(TALKGROUP_HEADERS, rows);
}

export function serialiseDmrContacts(codeplug: Codeplug): string {
  const dmr = codeplug.contacts.filter((c) => c.signalingMode === 'dmr');
  const rows = dmr.map((contact, i) =>
    padRow(CONTACT_HEADERS, {
      [CONTACT_COL.number]: String(i + 1),
      [CONTACT_COL.id]: contact.identifier,
      [CONTACT_COL.repeater]: '',
      [CONTACT_COL.name]: contact.name,
      [CONTACT_COL.city]: '',
      [CONTACT_COL.province]: '',
      [CONTACT_COL.country]: '',
      [CONTACT_COL.remark]: '',
      [CONTACT_COL.type]: 'Private Call',
      [CONTACT_COL.alertCall]: '0',
    }),
  );
  return formatCsv(CONTACT_HEADERS, rows);
}

export function serialiseDtmfContacts(codeplug: Codeplug): string {
  const dtmf = codeplug.contacts.filter((c) => c.signalingMode === 'dtmf');
  const rows = dtmf.map((contact, i) =>
    padRow(DTMF_CONTACT_HEADERS, {
      [DTMF_CONTACT_COL.number]: String(i + 1),
      [DTMF_CONTACT_COL.name]: contact.name,
      [DTMF_CONTACT_COL.id]: contact.identifier,
    }),
  );
  return formatCsv(DTMF_CONTACT_HEADERS, rows);
}

export function serialiseRxGroupLists(codeplug: Codeplug): string {
  const rows = codeplug.rxGroupLists.map((list, i) =>
    padRow(RX_GROUP_LIST_HEADERS, {
      [RX_GROUP_LIST_COL.number]: String(i + 1),
      [RX_GROUP_LIST_COL.name]: list.name,
      [RX_GROUP_LIST_COL.members]: rxGroupListExportMemberNames(list, codeplug).join('|'),
    }),
  );
  return formatCsv(RX_GROUP_LIST_HEADERS, rows);
}

export { DM32_EXPORT_FILE_NAMES };
