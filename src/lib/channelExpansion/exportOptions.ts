import type { ExportOptions } from '../import-export/types.ts';
import type { ExpandChannelOptions } from './index.ts';
import type { Codeplug } from '../../models/codeplug.ts';

/** Effective max name length — export override or profile default. */
export function effectiveMaxNameLength(
  options: ExportOptions | undefined,
  profileNameLimit: number,
): number {
  return options?.maxNameLength ?? profileNameLimit;
}

/** Map export UI options to channel expansion pass options. */
export function expandOptionsFromExport(
  codeplug: Codeplug,
  options?: ExportOptions,
  warnings?: string[],
): ExpandChannelOptions {
  return {
    expandModes: options?.expandModes ?? true,
    expandTalkGroups: options?.expandRxGroupLists === true,
    talkGroupMembers: options?.expandRxGroupListMembers ?? 'all',
    skipExpandWhenTxContactSet: options?.skipExpandWhenTxContactSet === true,
    nonExpandableRxGroupListNames: options?.nonExpandableRxGroupListNames,
    shortenNames: options?.shortenNames ?? true,
    nameModeOverride: options?.nameModeOverride,
    useTalkGroupAbbreviation: options?.useTalkGroupAbbreviation ?? false,
    useChannelAbbreviation: options?.useChannelAbbreviation ?? false,
    multiTalkGroupExportNameMode: options?.multiTalkGroupExportNameMode,
    exportScratchChannels: options?.exportScratchChannels,
    codeplug,
    warnings,
  };
}
