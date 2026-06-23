import { buildNameToChannelId, resolveZoneMembers } from './codeplug.ts';
import {
  channelsImportEqual,
  contactsImportEqual,
  memberNamesEqual,
  mergeChannelOntoExisting,
  mergeContactOntoExisting,
  mergeRxGroupListOntoExisting,
  mergeTalkGroupOntoExisting,
  rxGroupListsImportEqual,
  talkGroupsImportEqual,
} from './importEntityCompare.ts';
import type { ImportResult, ParsedRxGroupList, ParsedZone } from './import/types.ts';
import { getMemberWireNames, setMemberWireNames, stampImported } from './entityProvenance.ts';
import {
  resolveChannelContactRefs,
  resolveChannelRxGroupListIds,
  resolveRxGroupListMemberRefs,
} from './entityRefs.ts';
import {
  resolveMultiModeChannelProfiles,
  mergeImportChannelsMultiTalkgroupBestEffort,
} from './channelExpansion/index.ts';
import {
  newId,
  type Channel,
  type Codeplug,
  type Contact,
  type RxGroupList,
  type TalkGroup,
  type Zone,
} from '../models/codeplug.ts';

export type ImportApplyMode = 'merge' | 'overwrite';

export interface EntityImportStats {
  added: number;
  updated: number;
  unchanged: number;
  removed: number;
}

export interface UnresolvedZoneMembers {
  zoneName: string;
  memberNames: string[];
}

export interface ImportMergeReport {
  mode: ImportApplyMode;
  channels: EntityImportStats;
  zones: EntityImportStats;
  contacts: EntityImportStats;
  talkGroups: EntityImportStats;
  rxGroupLists: EntityImportStats;
  unresolvedZoneMembers: UnresolvedZoneMembers[];
  hasChanges: boolean;
}

export function emptyEntityStats(): EntityImportStats {
  return { added: 0, updated: 0, unchanged: 0, removed: 0 };
}

function dedupeByNameLastWins<T extends { name: string }>(items: T[]): T[] {
  const result: T[] = [];
  const seen = new Set<string>();
  for (let i = items.length - 1; i >= 0; i--) {
    const item = items[i];
    if (!seen.has(item.name)) {
      result.unshift(item);
      seen.add(item.name);
    }
  }
  return result;
}

function memberIdsEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function computeHasChanges(report: Omit<ImportMergeReport, 'hasChanges'>): boolean {
  for (const stats of [
    report.channels,
    report.zones,
    report.contacts,
    report.talkGroups,
    report.rxGroupLists,
  ]) {
    if (stats.added > 0 || stats.updated > 0 || stats.removed > 0) return true;
  }
  return false;
}

function mergeNamedEntities<T extends { id: string; name: string }>(
  existing: T[],
  incoming: T[] | undefined,
  mode: ImportApplyMode,
  isEqual: (a: T, b: T) => boolean,
  mergeOnto: (existing: T, incoming: T) => T,
): { items: T[]; stats: EntityImportStats } {
  if (!incoming) {
    return { items: existing, stats: emptyEntityStats() };
  }

  if (mode === 'overwrite') {
    return {
      items: incoming,
      stats: {
        added: incoming.length,
        updated: 0,
        unchanged: 0,
        removed: existing.length,
      },
    };
  }

  const deduped = dedupeByNameLastWins(incoming);
  const byName = new Map(existing.map((item) => [item.name, item]));
  const stats = emptyEntityStats();
  const result = [...existing];

  for (const inc of deduped) {
    const ex = byName.get(inc.name);
    if (ex) {
      if (isEqual(ex, inc)) {
        stats.unchanged++;
      } else {
        const idx = result.findIndex((item) => item.id === ex.id);
        result[idx] = mergeOnto(ex, inc);
        stats.updated++;
      }
    } else {
      result.push(inc);
      stats.added++;
    }
  }

  return { items: result, stats };
}

function mergeChannels(
  existing: Channel[],
  incoming: Channel[] | undefined,
  mode: ImportApplyMode,
): { channels: Channel[]; stats: EntityImportStats } {
  const { items, stats } = mergeNamedEntities(
    existing,
    incoming,
    mode,
    channelsImportEqual,
    mergeChannelOntoExisting,
  );
  return { channels: items, stats };
}

function mergeContacts(
  existing: Contact[],
  incoming: Contact[] | undefined,
  mode: ImportApplyMode,
): { items: Contact[]; stats: EntityImportStats } {
  return mergeNamedEntities(
    existing,
    incoming,
    mode,
    contactsImportEqual,
    mergeContactOntoExisting,
  );
}

function mergeTalkGroups(
  existing: TalkGroup[],
  incoming: TalkGroup[] | undefined,
  mode: ImportApplyMode,
): { items: TalkGroup[]; stats: EntityImportStats } {
  return mergeNamedEntities(
    existing,
    incoming,
    mode,
    talkGroupsImportEqual,
    mergeTalkGroupOntoExisting,
  );
}

function parsedRxToRxGroupList(
  parsed: ParsedRxGroupList,
  importedAt: string,
  formatId: string,
): RxGroupList {
  const base: RxGroupList = {
    id: newId(),
    name: parsed.name,
    memberRefs: [],
  };
  return stampImported(setMemberWireNames(base, parsed.memberWireNames), {
    formatId,
    sourceFile: 'TG_Lists.csv',
    importedAt,
    memberWireNames: parsed.memberWireNames,
  });
}

function mergeRxGroupLists(
  existing: RxGroupList[],
  incoming: ParsedRxGroupList[] | undefined,
  mode: ImportApplyMode,
  importedAt: string,
  formatId: string,
): { items: RxGroupList[]; stats: EntityImportStats } {
  if (!incoming) {
    return { items: existing, stats: emptyEntityStats() };
  }

  const asRx: RxGroupList[] = incoming.map((p) => parsedRxToRxGroupList(p, importedAt, formatId));
  return mergeNamedEntities(
    existing,
    asRx,
    mode,
    rxGroupListsImportEqual,
    mergeRxGroupListOntoExisting,
  );
}

function zoneFromParsed(parsed: ParsedZone, importedAt: string, formatId: string): Zone {
  const base: Zone = {
    id: newId(),
    name: parsed.name,
    memberChannelIds: [],
  };
  return stampImported(setMemberWireNames(base, parsed.memberNames), {
    formatId,
    sourceFile: 'Zones.csv',
    importedAt,
    memberWireNames: parsed.memberNames,
  });
}

function mergeZones(
  existing: Zone[],
  incoming: ParsedZone[] | undefined,
  mode: ImportApplyMode,
  importedAt: string,
  formatId: string,
): { zones: Zone[]; stats: EntityImportStats } {
  if (!incoming) {
    return { zones: existing, stats: emptyEntityStats() };
  }

  if (mode === 'overwrite') {
    const zones: Zone[] = incoming.map((parsed) => zoneFromParsed(parsed, importedAt, formatId));
    return {
      zones,
      stats: {
        added: incoming.length,
        updated: 0,
        unchanged: 0,
        removed: existing.length,
      },
    };
  }

  const deduped = dedupeByNameLastWins(incoming);
  const byName = new Map(existing.map((z) => [z.name, z]));
  const stats = emptyEntityStats();
  const result = [...existing];

  for (const parsed of deduped) {
    const ex = byName.get(parsed.name);
    if (ex) {
      if (memberNamesEqual(getMemberWireNames(ex), parsed.memberNames)) {
        stats.unchanged++;
      } else {
        const idx = result.findIndex((z) => z.id === ex.id);
        result[idx] = stampImported(setMemberWireNames(ex, parsed.memberNames), {
          formatId,
          sourceFile: 'Zones.csv',
          importedAt,
          memberWireNames: parsed.memberNames,
        });
        stats.updated++;
      }
    } else {
      result.push(zoneFromParsed(parsed, importedAt, formatId));
      stats.added++;
    }
  }

  return { zones: result, stats };
}

function resolveZones(
  zones: Zone[],
  nameToId: Map<string, string>,
): { zones: Zone[]; unresolved: UnresolvedZoneMembers[] } {
  const unresolved: UnresolvedZoneMembers[] = [];
  const resolved = zones.map((zone) => {
    const { memberChannelIds, unresolved: missing } = resolveZoneMembers(
      getMemberWireNames(zone),
      nameToId,
    );
    if (missing.length) {
      unresolved.push({ zoneName: zone.name, memberNames: missing });
    }
    if (memberIdsEqual(zone.memberChannelIds, memberChannelIds)) {
      return zone;
    }
    return { ...zone, memberChannelIds };
  });
  return { zones: resolved, unresolved };
}

function updateMeta(codeplug: Codeplug, result: ImportResult): Codeplug['meta'] {
  const sourceFiles = [...codeplug.meta.sourceFiles];
  for (const fileName of result.recognised) {
    if (!sourceFiles.includes(fileName)) sourceFiles.push(fileName);
  }
  return {
    ...codeplug.meta,
    importedAt: result.recognised.length ? new Date().toISOString() : codeplug.meta.importedAt,
    sourceFiles,
  };
}

function applyImportInternal(
  codeplug: Codeplug,
  result: ImportResult,
  mode: ImportApplyMode,
): { codeplug: Codeplug; report: ImportMergeReport } {
  const importedAt = new Date().toISOString();
  const formatId = result.formatId ?? 'opengd77';
  const { channels, stats: channelStats } = mergeChannels(codeplug.channels, result.channels, mode);
  const { items: contacts, stats: contactStats } = mergeContacts(
    codeplug.contacts,
    result.contacts,
    mode,
  );
  const { items: talkGroups, stats: talkGroupStats } = mergeTalkGroups(
    codeplug.talkGroups,
    result.talkGroups,
    mode,
  );
  const { items: rxGroupLists, stats: rxStats } = mergeRxGroupLists(
    codeplug.rxGroupLists,
    result.rxGroupLists,
    mode,
    importedAt,
    formatId,
  );
  const resolvedRxGroupLists = resolveRxGroupListMemberRefs(rxGroupLists, talkGroups, contacts);

  const { zones: mergedZones, stats: zoneStats } = mergeZones(
    codeplug.zones,
    result.zones,
    mode,
    importedAt,
    formatId,
  );

  const resolvedChannelsBeforeCollapse = resolveChannelContactRefs(
    resolveMultiModeChannelProfiles(
      resolveChannelRxGroupListIds(channels, resolvedRxGroupLists),
      talkGroups,
      contacts,
      resolvedRxGroupLists,
    ),
    talkGroups,
    contacts,
  );

  const tgCollapsed = mergeImportChannelsMultiTalkgroupBestEffort(
    resolvedChannelsBeforeCollapse,
    talkGroups,
    contacts,
    resolvedRxGroupLists,
  );
  const resolvedChannels = tgCollapsed.channels;
  const finalRxGroupLists = tgCollapsed.rxGroupLists;

  const nameToId = buildNameToChannelId(resolvedChannels, {
    codeplug: {
      ...codeplug,
      channels: resolvedChannels,
      talkGroups,
      contacts,
      rxGroupLists: finalRxGroupLists,
    },
    expandTalkGroups: true,
  });
  const { zones, unresolved } = resolveZones(mergedZones, nameToId);

  const reportBase = {
    mode,
    channels: channelStats,
    zones: zoneStats,
    contacts: contactStats,
    talkGroups: talkGroupStats,
    rxGroupLists: rxStats,
    unresolvedZoneMembers: unresolved,
  };

  return {
    codeplug: {
      ...codeplug,
      channels: resolvedChannels,
      zones,
      contacts,
      talkGroups,
      rxGroupLists: finalRxGroupLists,
      meta: updateMeta(codeplug, result),
    },
    report: {
      ...reportBase,
      hasChanges: computeHasChanges(reportBase),
    },
  };
}

export function previewImportMerge(
  codeplug: Codeplug,
  result: ImportResult,
  mode: ImportApplyMode = 'merge',
): ImportMergeReport {
  return applyImportInternal(codeplug, result, mode).report;
}

export function applyImportToCodeplug(
  codeplug: Codeplug,
  result: ImportResult,
  mode: ImportApplyMode = 'merge',
): { codeplug: Codeplug; report: ImportMergeReport } {
  return applyImportInternal(codeplug, result, mode);
}
