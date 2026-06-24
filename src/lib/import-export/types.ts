import type { Codeplug } from '../../models/codeplug.ts';
import type { ChannelExportNameMode } from '../../models/codeplug.ts';
import type { MultiTalkGroupExportNameMode } from '../channelExpansion/multiTalkGroupWireName.ts';

export type { MultiTalkGroupExportNameMode } from '../channelExpansion/multiTalkGroupWireName.ts';
export { DEFAULT_MULTI_TG_EXPORT_NAME_MODE } from '../channelExpansion/multiTalkGroupWireName.ts';

/** Canonical format ids — shared by UI, import registry, and export registry. */
export type VendorFormatId = 'opengd77' | 'chirp' | 'qdmr' | 'native-yaml' | 'dm32';

export type ImportEntityKind =
  | 'channels'
  | 'zones'
  | 'contacts'
  | 'talkGroups'
  | 'dtmfContacts'
  | 'rxGroupLists';

export type ImportFileKind = ImportEntityKind | 'unknown';

export type ImportDelivery = 'single-file' | 'multi-file';

export type ExportDelivery = 'single-file' | 'multi-file';

export interface ImportAdapterCapabilities {
  delivery: ImportDelivery;
  /** Entity kinds this adapter can parse (excluding `unknown`). */
  entityKinds: readonly ImportEntityKind[];
}

export type ExpandRxGroupListMembers = 'all' | 'talkGroupsOnly';

export interface ExportOptions {
  /** CHIRP and other profile-aware formats. */
  profileId?: string;
  /** Suggested download filename for single-file export. */
  fileName?: string;
  /** When false, multi-mode channels stay on one wire row (DM32). Default true. */
  expandModes?: boolean;
  /** Expand logical channels with RX group lists into one row per member (formats without native RGL). */
  expandRxGroupLists?: boolean;
  /** Which RX list members to expand when expandRxGroupLists is true. Default `all`. */
  expandRxGroupListMembers?: ExpandRxGroupListMembers;
  /** Skip TG expansion when row has both TX contact and RGL (DM32). */
  skipExpandWhenTxContactSet?: boolean;
  /** RGL names that must not fan out (e.g. DM32 `ALL`). */
  nonExpandableRxGroupListNames?: readonly string[];
  /** Target max channel wire name length; defaults to profile `nameLimit`. */
  maxNameLength?: number;
  /** Shorten names that exceed `maxNameLength`. Default true. */
  shortenNames?: boolean;
  /** Force all channels to this export name mode for this export only. */
  nameModeOverride?: ChannelExportNameMode;
  /** Use `TalkGroup.abbreviation` for multi-talkgroup member suffixes. */
  useTalkGroupAbbreviation?: boolean;
  /** Use `Channel.abbreviation` for the name qualifier in composed wire names. */
  useChannelAbbreviation?: boolean;
  /** How multi-TG expanded rows compose wire names. Default `callsign_tg_abbrev`. */
  multiTalkGroupExportNameMode?: MultiTalkGroupExportNameMode;
}

export interface ExportResult {
  warnings: string[];
}

export type ExportDownloadContext = {
  codeplug: Codeplug;
  options?: ExportOptions;
};
