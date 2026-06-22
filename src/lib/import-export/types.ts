import type { Codeplug } from '../../models/codeplug.ts';

/** Canonical format ids — shared by UI, import registry, and export registry. */
export type VendorFormatId = 'opengd77' | 'chirp' | 'qdmr' | 'native-yaml' | 'dm32';

export type ImportEntityKind = 'channels' | 'zones' | 'contacts' | 'rxGroupLists';

export type ImportFileKind = ImportEntityKind | 'unknown';

export type ImportDelivery = 'single-file' | 'multi-file';

export type ExportDelivery = 'single-file' | 'multi-file';

export interface ImportAdapterCapabilities {
  delivery: ImportDelivery;
  /** Entity kinds this adapter can parse (excluding `unknown`). */
  entityKinds: readonly ImportEntityKind[];
}

export interface ExportOptions {
  /** CHIRP and other profile-aware formats. */
  profileId?: string;
  /** Suggested download filename for single-file export. */
  fileName?: string;
}

export interface ExportResult {
  warnings: string[];
}

export type ExportDownloadContext = {
  codeplug: Codeplug;
  options?: ExportOptions;
};
