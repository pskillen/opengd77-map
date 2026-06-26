import { mergeTalkGroupsIntoOne } from './codeplugMutations.ts';
import { parseTalkGroupSlotWireName } from './import/opengd77/collapseTalkGroupTimeslotDuplicates.ts';
import type { Channel, Codeplug, TalkGroup } from '../models/codeplug.ts';
import { validateTalkGroup } from './validation/talkGroup.ts';
import type { ValidationIssue } from './validation/channel.ts';

export type TalkGroupMergeKind = 'timeslotFamily' | 'ambiguous';

export interface TalkGroupMergeCandidateGroup {
  id: string;
  mergeKind: TalkGroupMergeKind;
  sourceTalkGroupIds: string[];
  suggestedName: string;
  ambiguousReason?: string;
}

export interface TalkGroupMergeSelection {
  groupId: string;
  sourceTalkGroupIds: string[];
  resultName: string;
  enabled: boolean;
}

export interface TalkGroupMergeRglImpact {
  rglId: string;
  rglName: string;
  absorbedMemberLabels: string[];
  survivorLabel: string;
}

export interface TalkGroupMergeChannelImpact {
  channelId: string;
  channelName: string;
}

export interface TalkGroupMergePreview {
  groupId: string;
  resultName: string;
  mergedTalkGroup: TalkGroup;
  validationIssues: ValidationIssue[];
  rglImpacts: TalkGroupMergeRglImpact[];
  channelImpacts: TalkGroupMergeChannelImpact[];
}

export interface TalkGroupMergeApplyReport {
  mergedCount: number;
  skippedAmbiguous: number;
  skippedValidation: number;
  mergedNames: string[];
}

function talkGroupById(codeplug: Codeplug, id: string): TalkGroup | undefined {
  return codeplug.talkGroups.find((tg) => tg.id === id);
}

function talkGroupNumberKey(tg: TalkGroup): string | null {
  const number = tg.number.trim();
  return number.length > 0 ? number : null;
}

function pickSurvivor(members: TalkGroup[], stem: string): TalkGroup {
  return (
    members.find((tg) => tg.name.trim() === stem) ??
    members.find((tg) => parseTalkGroupSlotWireName(tg.name).slot === null) ??
    members[0]
  );
}

/** Scan talk groups for per-slot duplicate families (same DMR ID, compatible name stem). */
export function findTalkGroupMergeCandidateGroups(
  codeplug: Codeplug,
): TalkGroupMergeCandidateGroup[] {
  const byNumber = new Map<string, TalkGroup[]>();

  for (const tg of codeplug.talkGroups) {
    const key = talkGroupNumberKey(tg);
    if (!key) continue;
    const list = byNumber.get(key) ?? [];
    list.push(tg);
    byNumber.set(key, list);
  }

  const groups: TalkGroupMergeCandidateGroup[] = [];

  for (const members of byNumber.values()) {
    if (members.length < 2) continue;

    const stems = members.map((tg) => parseTalkGroupSlotWireName(tg.name).stem);
    const uniqueStems = [...new Set(stems.filter((s) => s.length > 0))];
    const ids = members.map((tg) => tg.id);
    const id = ids.sort().join('|');

    if (uniqueStems.length !== 1) {
      groups.push({
        id,
        mergeKind: 'ambiguous',
        sourceTalkGroupIds: ids,
        suggestedName: members[0].name,
        ambiguousReason: 'Same DMR ID but incompatible name stems',
      });
      continue;
    }

    groups.push({
      id,
      mergeKind: 'timeslotFamily',
      sourceTalkGroupIds: ids,
      suggestedName: uniqueStems[0],
    });
  }

  return groups.sort((a, b) => a.suggestedName.localeCompare(b.suggestedName));
}

function buildMergedTalkGroup(
  sources: TalkGroup[],
  survivorId: string,
  resultName: string,
): TalkGroup {
  const survivor = sources.find((tg) => tg.id === survivorId) ?? sources[0];
  return {
    ...survivor,
    id: survivorId,
    name: resultName.trim() || parseTalkGroupSlotWireName(survivor.name).stem || survivor.name,
  };
}

function rglImpactsForMerge(
  codeplug: Codeplug,
  sourceTalkGroupIds: string[],
  resultName: string,
): TalkGroupMergeRglImpact[] {
  const touched = new Set(sourceTalkGroupIds);
  const impacts: TalkGroupMergeRglImpact[] = [];

  for (const rgl of codeplug.rxGroupLists) {
    const affectedLabels: string[] = [];

    for (const member of rgl.memberRefs) {
      if (member.ref.kind !== 'talkGroup') continue;
      if (touched.has(member.ref.id)) {
        const tg = talkGroupById(codeplug, member.ref.id);
        if (tg) affectedLabels.push(tg.name);
      }
    }

    if (affectedLabels.length === 0) continue;
    impacts.push({
      rglId: rgl.id,
      rglName: rgl.name,
      absorbedMemberLabels: affectedLabels,
      survivorLabel: resultName,
    });
  }

  return impacts;
}

function channelImpactsForMerge(
  codeplug: Codeplug,
  sourceTalkGroupIds: string[],
): TalkGroupMergeChannelImpact[] {
  const touched = new Set(sourceTalkGroupIds);
  const impacts: TalkGroupMergeChannelImpact[] = [];

  const channelUsesSource = (ch: Channel): boolean => {
    if (ch.contactRef?.kind === 'talkGroup' && touched.has(ch.contactRef.id)) return true;
    return ch.modeProfiles.some(
      (profile) => profile.contactRef?.kind === 'talkGroup' && touched.has(profile.contactRef.id),
    );
  };

  for (const ch of codeplug.channels) {
    if (!channelUsesSource(ch)) continue;
    impacts.push({ channelId: ch.id, channelName: ch.name });
  }

  return impacts;
}

/** Preview survivor talk group and downstream impacts for selected merge groups. */
export function previewTalkGroupMerges(
  codeplug: Codeplug,
  selections: TalkGroupMergeSelection[],
  candidates: TalkGroupMergeCandidateGroup[] = [],
): TalkGroupMergePreview[] {
  const candidateById = new Map(candidates.map((g) => [g.id, g]));
  const previews: TalkGroupMergePreview[] = [];

  for (const selection of selections) {
    if (!selection.enabled) continue;

    const group = candidateById.get(selection.groupId);
    if (!group || group.mergeKind !== 'timeslotFamily') continue;

    const sources = selection.sourceTalkGroupIds
      .map((id) => talkGroupById(codeplug, id))
      .filter((tg): tg is TalkGroup => tg != null);
    if (sources.length < 2) continue;

    const stem = group.suggestedName;
    const survivor = pickSurvivor(sources, stem);
    const resultName = selection.resultName.trim() || stem;
    const mergedTalkGroup = buildMergedTalkGroup(sources, survivor.id, resultName);

    previews.push({
      groupId: selection.groupId,
      resultName: mergedTalkGroup.name,
      mergedTalkGroup,
      validationIssues: validateTalkGroup(mergedTalkGroup, codeplug, survivor.id),
      rglImpacts: rglImpactsForMerge(codeplug, selection.sourceTalkGroupIds, mergedTalkGroup.name),
      channelImpacts: channelImpactsForMerge(codeplug, selection.sourceTalkGroupIds),
    });
  }

  return previews;
}

/** Apply selected talk-group merges into the active codeplug. */
export function applyTalkGroupMerges(
  codeplug: Codeplug,
  selections: TalkGroupMergeSelection[],
  candidates: TalkGroupMergeCandidateGroup[],
): { codeplug: Codeplug; report: TalkGroupMergeApplyReport } {
  const candidateById = new Map(candidates.map((g) => [g.id, g]));
  const report: TalkGroupMergeApplyReport = {
    mergedCount: 0,
    skippedAmbiguous: 0,
    skippedValidation: 0,
    mergedNames: [],
  };

  let next = codeplug;

  for (const selection of selections) {
    if (!selection.enabled) continue;

    const group = candidateById.get(selection.groupId);
    if (!group || group.mergeKind !== 'timeslotFamily') {
      report.skippedAmbiguous++;
      continue;
    }

    const preview = previewTalkGroupMerges(next, [selection], candidates)[0];
    if (!preview) continue;

    if (preview.validationIssues.some((i) => i.severity === 'error')) {
      report.skippedValidation++;
      continue;
    }

    const sources = selection.sourceTalkGroupIds
      .map((id) => talkGroupById(next, id))
      .filter((tg): tg is TalkGroup => tg != null);
    const stem = group.suggestedName;
    const survivor = pickSurvivor(sources, stem);
    const absorbedIds = sources.filter((tg) => tg.id !== survivor.id).map((tg) => tg.id);

    next = mergeTalkGroupsIntoOne(next, survivor.id, absorbedIds, preview.mergedTalkGroup);
    report.mergedCount++;
    report.mergedNames.push(preview.resultName);
  }

  return { codeplug: next, report };
}

export function formatTalkGroupMergeReportLines(report: TalkGroupMergeApplyReport): string[] {
  const lines: string[] = [];
  if (report.mergedCount > 0) {
    lines.push(
      `Merged ${report.mergedCount} talk group${report.mergedCount === 1 ? '' : 's'}: ${report.mergedNames.join(', ')}`,
    );
  }
  if (report.skippedAmbiguous > 0) {
    lines.push(`Skipped ${report.skippedAmbiguous} ambiguous group(s)`);
  }
  if (report.skippedValidation > 0) {
    lines.push(`Skipped ${report.skippedValidation} group(s) with validation errors`);
  }
  return lines;
}
