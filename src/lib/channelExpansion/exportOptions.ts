import type { ExportOptions } from '../import-export/types.ts';
import type { ExpandChannelOptions } from './index.ts';
import type { Codeplug } from '../../models/codeplug.ts';

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
    codeplug,
    warnings,
  };
}
