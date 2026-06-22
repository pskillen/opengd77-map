import type { Channel, Contact, TalkGroup } from '../../models/codeplug.ts';
import type { ParsedRxGroupList, ParsedZone } from '../import/types.ts';
import type {
  ImportAdapterCapabilities,
  ImportEntityKind,
  ImportFileKind,
  VendorFormatId,
} from './types.ts';

export interface ImportAdapter {
  readonly id: VendorFormatId;
  readonly label: string;
  /** Short label for default new-project names — `{projectNameLabel} YYYY-MM-DD`. */
  readonly projectNameLabel: string;
  readonly capabilities: ImportAdapterCapabilities;
  detectKind(fileName: string, headerRow: string[]): ImportFileKind;
  parseChannels(text: string): Channel[];
  parseZones?(text: string): ParsedZone[];
  parseContacts?(text: string): { contacts: Contact[]; talkGroups: TalkGroup[] };
  parseRxGroupLists?(text: string): ParsedRxGroupList[];
}

export function adapterSupportsKind(
  adapter: ImportAdapter,
  kind: ImportFileKind,
): kind is ImportEntityKind {
  return kind !== 'unknown' && adapter.capabilities.entityKinds.includes(kind);
}
