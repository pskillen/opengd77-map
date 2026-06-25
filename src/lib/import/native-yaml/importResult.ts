import type { CodeplugProject } from '../../../models/codeplugProject.ts';
import type { EntityRef } from '../../entityRefs.ts';
import type { ImportResult } from '../../import/types.ts';
import type { VendorFormatId } from '../../import-export/types.ts';

/** Build a CPS-style ImportResult from a native project for merge/overwrite paths. */
export function importResultFromNativeProject(
  project: CodeplugProject,
  fileName: string,
  formatId: VendorFormatId = 'native-yaml',
): ImportResult {
  const cp = project.codeplug;
  const channelById = new Map(cp.channels.map((ch) => [ch.id, ch]));
  const tgById = new Map(cp.talkGroups.map((tg) => [tg.id, tg]));
  const ctById = new Map(cp.contacts.map((c) => [c.id, c]));

  const refToWireName = (ref: EntityRef): string => {
    if (ref.kind === 'talkGroup') return tgById.get(ref.id)?.name ?? '';
    return ctById.get(ref.id)?.name ?? '';
  };

  return {
    nativeProject: project,
    channels: cp.channels,
    zones: cp.zones.map((zone) => ({
      name: zone.name,
      memberNames: zone.memberChannelIds
        .map((id) => channelById.get(id)?.name ?? '')
        .filter((name) => name.length > 0),
    })),
    contacts: cp.contacts,
    talkGroups: cp.talkGroups,
    rxGroupLists: cp.rxGroupLists.map((rgl) => ({
      name: rgl.name,
      memberWireNames: rgl.memberRefs
        .map((ref) => refToWireName(ref))
        .filter((name) => name.length > 0),
    })),
    recognised: [fileName],
    skipped: [],
    errors: [],
    suggestedProjectName: project.name,
    formatId,
  };
}
