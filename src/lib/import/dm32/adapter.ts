import {
  parseChannels,
  parseContacts,
  parseDtmfContacts,
  parseRxGroupLists,
  parseTalkGroups,
  parseZones,
} from './parse.ts';
import {
  CHANNEL_COL,
  CONTACT_COL,
  DTMF_CONTACT_COL,
  RX_GROUP_LIST_COL,
  TALKGROUP_COL,
  ZONE_COL,
} from './columns.ts';

/** DM32 import adapter — docs/features/import-export/dm32/README.md */

export type Dm32FileKind =
  | 'channels'
  | 'zones'
  | 'talkGroups'
  | 'contacts'
  | 'dtmfContacts'
  | 'rxGroupLists'
  | 'unknown';

export function detectKind(_fileName: string, headerRow: string[]): Dm32FileKind {
  const headers = headerRow.map((h) => h.trim());

  const isDm32Channels =
    headers.includes(CHANNEL_COL.rx) && headers.includes(CHANNEL_COL.bandwidth);

  if (headers.includes(DTMF_CONTACT_COL.name)) return 'dtmfContacts';
  if (headers.includes(CONTACT_COL.alertCall)) return 'contacts';
  if (headers.includes(TALKGROUP_COL.name) && headers.includes(TALKGROUP_COL.type)) {
    return 'talkGroups';
  }
  if (headers.includes(RX_GROUP_LIST_COL.name) && headers.includes(RX_GROUP_LIST_COL.members)) {
    return 'rxGroupLists';
  }
  if (headers.includes(ZONE_COL.members)) return 'zones';
  if (isDm32Channels) return 'channels';

  return 'unknown';
}

export const dm32Adapter = {
  id: 'dm32' as const,
  label: 'Baofeng DM32 CPS CSV',
  projectNameLabel: 'DM32',
  capabilities: {
    delivery: 'multi-file' as const,
    entityKinds: [
      'channels',
      'zones',
      'talkGroups',
      'contacts',
      'dtmfContacts',
      'rxGroupLists',
    ] as const,
  },
  detectKind,
  parseChannels,
  parseZones,
  parseTalkGroups,
  parseContacts,
  parseDtmfContacts,
  parseRxGroupLists,
} satisfies import('../../import-export/importAdapter.ts').ImportAdapter;
