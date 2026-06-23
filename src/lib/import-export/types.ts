import type { Codeplug } from '../../models/codeplug.ts';

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
}

export interface ExportResult {
  warnings: string[];
}

export type ExportDownloadContext = {
  codeplug: Codeplug;
  options?: ExportOptions;
};
