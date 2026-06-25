import type { Channel, Contact, TalkGroup } from '../../models/codeplug.ts';
import type { CodeplugProject } from '../../models/codeplugProject.ts';
import type { ParsedRxGroupList, ParsedZone } from '../import/types.ts';
import type {
  ImportAdapterCapabilities,
  ImportEntityKind,
  ImportFileKind,
  VendorFormatId,
} from './types.ts';

/** Passed to profile-aware parsers (CHIRP, OpenGD77). */
export interface ImportParseContext {
  profileId: string;
}

export interface ImportAdapter {
  readonly id: VendorFormatId;
  readonly label: string;
  /** Short label for default new-project names — `{projectNameLabel} YYYY-MM-DD`. */
  readonly projectNameLabel: string;
  readonly capabilities: ImportAdapterCapabilities;
  detectKind(fileName: string, headerRow: string[]): ImportFileKind;
  parseChannels(text: string, ctx?: ImportParseContext): Channel[];
  parseZones?(text: string, ctx?: ImportParseContext): ParsedZone[];
  parseContacts?(
    text: string,
    ctx?: ImportParseContext,
  ): { contacts: Contact[]; talkGroups: TalkGroup[] };
  parseTalkGroups?(text: string, ctx?: ImportParseContext): TalkGroup[];
  parseDtmfContacts?(text: string, ctx?: ImportParseContext): Contact[];
  parseRxGroupLists?(text: string, ctx?: ImportParseContext): ParsedRxGroupList[];
  /** Full project parse for native-document interchange formats. */
  parseDocument?(text: string): CodeplugProject;
}

export function isNativeDocumentAdapter(
  adapter: ImportAdapter,
): adapter is ImportAdapter & { parseDocument: (text: string) => CodeplugProject } {
  return (
    adapter.capabilities.interchange === 'native-document' &&
    typeof adapter.parseDocument === 'function'
  );
}

export function adapterSupportsKind(
  adapter: ImportAdapter,
  kind: ImportFileKind,
): kind is ImportEntityKind {
  return kind !== 'unknown' && adapter.capabilities.entityKinds.includes(kind);
}
