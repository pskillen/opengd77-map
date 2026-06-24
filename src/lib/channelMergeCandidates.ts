import {
  channelCallsignTypoMatch,
  channelFrequenciesMatch,
  channelLocationsMatch,
  channelMergeNameStem,
  channelsAreMultiModeMergeCandidates,
  channelsAreMultiTalkgroupMergeCandidates,
  channelTalkGroupStem,
  levenshteinRatio,
  mergeChannelsToMultiMode,
  mergeChannelsToMultiTalkgroup,
  type ChannelMergeCandidateOptions,
} from './channelExpansion/index.ts';
import { frequencyHzToMhz } from './channelFields/frequencies.ts';
import { isAnalogMode, isDmrMode } from './channelModes.ts';
import { formatMhzNumber } from './formatFrequency.ts';
import { mergeChannelsIntoOne } from './codeplugMutations.ts';
import type { Channel, Codeplug, RxGroupList } from '../models/codeplug.ts';
import { validateChannel, type ValidationIssue } from './validation/channel.ts';

export type ChannelMergeKind = 'multiMode' | 'multiTalkgroup' | 'ambiguous';

export interface ChannelMergeCandidateGroup {
  id: string;
  mergeKind: ChannelMergeKind;
  sourceChannelIds: string[];
  suggestedName: string;
  ambiguousReason?: string;
}

export interface ChannelMergeSelection {
  groupId: string;
  sourceChannelIds: string[];
  resultName: string;
  enabled: boolean;
  /** Survivor RX/TX Hz — set when operator edits merge result frequencies. */
  rxFrequency?: number | null;
  txFrequency?: number | null;
}

/** Default logical-channel frequencies from the FM primary (or first source). */
export function suggestedMergeResultFrequencies(sources: Channel[]): {
  rxFrequency: number | null;
  txFrequency: number | null;
} {
  if (sources.length === 0) {
    return { rxFrequency: null, txFrequency: null };
  }
  const primary = sources.find((ch) => isAnalogMode(ch.mode)) ?? sources[0];
  return { rxFrequency: primary.rxFrequency, txFrequency: primary.txFrequency };
}

export function formatMhzInputFromHz(hz: number | null): string {
  if (hz == null) return '';
  const mhz = frequencyHzToMhz(hz);
  return mhz != null ? formatMhzNumber(mhz) : '';
}

function withSelectionFrequencies(channel: Channel, selection: ChannelMergeSelection): Channel {
  if (selection.rxFrequency === undefined && selection.txFrequency === undefined) {
    return channel;
  }
  return {
    ...channel,
    ...(selection.rxFrequency !== undefined ? { rxFrequency: selection.rxFrequency } : {}),
    ...(selection.txFrequency !== undefined ? { txFrequency: selection.txFrequency } : {}),
  };
}

export interface ChannelMergeZoneImpact {
  zoneId: string;
  zoneName: string;
  absorbedMemberIds: string[];
  survivorMemberId: string;
}

export interface ChannelMergePreview {
  groupId: string;
  resultName: string;
  mergedChannel: Channel;
  validationIssues: ValidationIssue[];
  zoneImpacts: ChannelMergeZoneImpact[];
  /** Present when merge creates or selects an RX group list. */
  rxGroupLists?: RxGroupList[];
}

export interface ChannelMergeApplyReport {
  mergedCount: number;
  skippedAmbiguous: number;
  skippedValidation: number;
  zoneNotes: string[];
  mergedNames: string[];
}

const DEFAULT_NAME_FUZZY_THRESHOLD = 0.15;
const MERGE_NAME_THRESHOLD_MIN = 0;
const MERGE_NAME_THRESHOLD_MAX = 0.35;

const MERGE_CANDIDATE_MATCH_OPTIONS: Pick<ChannelMergeCandidateOptions, 'stripTrailingModeLabel'> =
  {
    stripTrailingModeLabel: true,
  };

/** Ephemeral find settings for one merge-modal session. */
export interface ChannelMergeFindSettings {
  nameFuzzyThreshold: number;
  matchRxFrequency: boolean;
  matchTxFrequency: boolean;
}

export function defaultChannelMergeFindSettings(): ChannelMergeFindSettings {
  return {
    nameFuzzyThreshold: DEFAULT_NAME_FUZZY_THRESHOLD,
    matchRxFrequency: true,
    matchTxFrequency: true,
  };
}

/** Map slider position 0–100 to name fuzzy threshold (no numeric labels in UI). */
export function nameSimilaritySliderToThreshold(slider: number): number {
  const t = slider / 100;
  return MERGE_NAME_THRESHOLD_MIN + t * (MERGE_NAME_THRESHOLD_MAX - MERGE_NAME_THRESHOLD_MIN);
}

export function nameSimilarityThresholdToSlider(threshold: number): number {
  const span = MERGE_NAME_THRESHOLD_MAX - MERGE_NAME_THRESHOLD_MIN;
  if (span <= 0) return 0;
  return Math.round(((threshold - MERGE_NAME_THRESHOLD_MIN) / span) * 100);
}

function findOptionsFromSettings(settings: ChannelMergeFindSettings): ChannelMergeCandidateOptions {
  return {
    nameFuzzyThreshold: settings.nameFuzzyThreshold,
    matchRxFrequency: settings.matchRxFrequency,
    matchTxFrequency: settings.matchTxFrequency,
    ...MERGE_CANDIDATE_MATCH_OPTIONS,
  };
}

function bucketKey(ch: Channel, settings: ChannelMergeFindSettings): string | null {
  const { matchRxFrequency, matchTxFrequency } = settings;
  if (!matchRxFrequency && !matchTxFrequency) return 'all';
  if (matchRxFrequency && matchTxFrequency) {
    if (ch.rxFrequency == null || ch.txFrequency == null) return null;
    return `${ch.rxFrequency}:${ch.txFrequency}`;
  }
  if (matchRxFrequency) {
    if (ch.rxFrequency == null) return null;
    return `rx:${ch.rxFrequency}`;
  }
  if (ch.txFrequency == null) return null;
  return `tx:${ch.txFrequency}`;
}

function stemsAreCompatible(stems: string[], threshold: number): boolean {
  if (stems.length < 2) return true;
  const canonical = stems[0];
  return stems.every((stem) =>
    threshold <= 0 ? stem === canonical : levenshteinRatio(stem, canonical) <= threshold,
  );
}

function membersShareCallsignTypo(members: Channel[]): boolean {
  if (members.length < 2) return false;
  const first = members[0];
  return members.every((ch) => channelCallsignTypoMatch(first, ch, true));
}

function mergeNameStem(name: string): string {
  return channelMergeNameStem(name);
}

function hasLocationConflict(channels: Channel[]): boolean {
  for (let i = 0; i < channels.length; i++) {
    for (let j = i + 1; j < channels.length; j++) {
      if (!channelLocationsMatch(channels[i], channels[j])) return true;
    }
  }
  return false;
}

function hasDuplicateModes(channels: Channel[]): boolean {
  const modes = channels.map((ch) => ch.mode);
  return new Set(modes).size !== modes.length;
}

function classifyGroup(channels: Channel[]): {
  mergeKind: ChannelMergeKind;
  ambiguousReason?: string;
} {
  if (channels.length < 2) {
    return { mergeKind: 'ambiguous', ambiguousReason: 'Fewer than two channels' };
  }
  if (hasLocationConflict(channels)) {
    return { mergeKind: 'ambiguous', ambiguousReason: 'Conflicting coordinates' };
  }

  const modes = new Set(channels.map((ch) => ch.mode));
  if (modes.size === 1 && isDmrMode(channels[0].mode)) {
    const tgRefs = channels.map((ch) => ch.contactRef);
    const allTalkGroups = tgRefs.every((ref) => ref?.kind === 'talkGroup');
    const distinctTgs = new Set(tgRefs.map((ref) => ref?.id)).size === channels.length;
    if (allTalkGroups && distinctTgs) {
      return { mergeKind: 'multiTalkgroup' };
    }
    return {
      mergeKind: 'ambiguous',
      ambiguousReason: 'Same-mode group is not all distinct talk groups',
    };
  }

  if (hasDuplicateModes(channels)) {
    return { mergeKind: 'ambiguous', ambiguousReason: 'Duplicate modes in group' };
  }
  return { mergeKind: 'multiMode' };
}

function buildMultiModeGroupsInBucket(
  bucket: Channel[],
  options: ChannelMergeCandidateOptions,
): ChannelMergeCandidateGroup[] {
  const threshold = options.nameFuzzyThreshold ?? DEFAULT_NAME_FUZZY_THRESHOLD;
  const groups: ChannelMergeCandidateGroup[] = [];
  const used = new Set<string>();

  for (const seed of bucket) {
    if (used.has(seed.id)) continue;

    const members: Channel[] = [seed];
    used.add(seed.id);

    for (const candidate of bucket) {
      if (used.has(candidate.id)) continue;
      const matchesAll = members.every((member) =>
        channelsAreMultiModeMergeCandidates(member, candidate, options),
      );
      if (matchesAll) {
        members.push(candidate);
        used.add(candidate.id);
      }
    }

    if (members.length < 2) continue;

    const stems = members.map((ch) => mergeNameStem(ch.name));
    const stemsOk = stemsAreCompatible(stems, threshold) || membersShareCallsignTypo(members);
    if (!stemsOk) continue;

    const { mergeKind, ambiguousReason } = classifyGroup(members);
    if (mergeKind !== 'multiMode') continue;

    const suggestedName = mergeNameStem(members[0].name);
    groups.push({
      id: members
        .map((ch) => ch.id)
        .sort()
        .join('|'),
      mergeKind,
      sourceChannelIds: members.map((ch) => ch.id),
      suggestedName,
      ambiguousReason,
    });
  }

  return groups;
}

function buildMultiTalkgroupGroupsInBucket(
  bucket: Channel[],
  options: ChannelMergeCandidateOptions,
  codeplug: Codeplug,
): ChannelMergeCandidateGroup[] {
  const threshold = options.nameFuzzyThreshold ?? DEFAULT_NAME_FUZZY_THRESHOLD;
  const groups: ChannelMergeCandidateGroup[] = [];
  const used = new Set<string>();
  const eligible = bucket.filter((ch) => !ch.multiMode && isDmrMode(ch.mode));

  for (const seed of eligible) {
    if (used.has(seed.id)) continue;

    const members: Channel[] = [seed];
    used.add(seed.id);

    for (const candidate of eligible) {
      if (used.has(candidate.id)) continue;
      const matchesAll = members.every((member) =>
        channelsAreMultiTalkgroupMergeCandidates(
          member,
          candidate,
          codeplug.talkGroups,
          codeplug.contacts,
          options,
        ),
      );
      if (matchesAll) {
        members.push(candidate);
        used.add(candidate.id);
      }
    }

    if (members.length < 2) continue;

    const stems = members.map((ch) =>
      channelTalkGroupStem(mergeNameStem(ch.name), codeplug.talkGroups, codeplug.contacts),
    );
    if (!stemsAreCompatible(stems, threshold)) continue;

    const { mergeKind, ambiguousReason } = classifyGroup(members);
    if (mergeKind !== 'multiTalkgroup') continue;

    const suggestedName = channelTalkGroupStem(
      mergeNameStem(members[0].name),
      codeplug.talkGroups,
      codeplug.contacts,
    );
    groups.push({
      id: members
        .map((ch) => ch.id)
        .sort()
        .join('|'),
      mergeKind,
      sourceChannelIds: members.map((ch) => ch.id),
      suggestedName,
      ambiguousReason,
    });
  }

  return groups;
}

/** Scan active channels for post-hoc multi-mode merge candidate groups. */
export function findChannelMergeCandidates(
  codeplug: Codeplug,
  settings: ChannelMergeFindSettings = defaultChannelMergeFindSettings(),
): ChannelMergeCandidateGroup[] {
  const options = findOptionsFromSettings(settings);
  const eligible = codeplug.channels.filter((ch) => !ch.multiMode);
  const byBucket = new Map<string, Channel[]>();

  for (const ch of eligible) {
    const key = bucketKey(ch, settings);
    if (key == null) continue;
    const bucket = byBucket.get(key) ?? [];
    bucket.push(ch);
    byBucket.set(key, bucket);
  }

  const groups: ChannelMergeCandidateGroup[] = [];
  for (const bucket of byBucket.values()) {
    if (bucket.length < 2) continue;
    groups.push(...buildMultiModeGroupsInBucket(bucket, options));
    groups.push(...buildMultiTalkgroupGroupsInBucket(bucket, options, codeplug));
  }

  return groups.sort((a, b) => a.suggestedName.localeCompare(b.suggestedName));
}

function channelById(codeplug: Codeplug, id: string): Channel | undefined {
  return codeplug.channels.find((ch) => ch.id === id);
}

function zoneImpactsForMerge(
  codeplug: Codeplug,
  survivorId: string,
  absorbedIds: string[],
): ChannelMergeZoneImpact[] {
  const absorbed = new Set(absorbedIds);
  const impacts: ChannelMergeZoneImpact[] = [];

  for (const zone of codeplug.zones) {
    const absorbedInZone = zone.memberChannelIds.filter((id) => absorbed.has(id));
    if (absorbedInZone.length === 0) continue;
    impacts.push({
      zoneId: zone.id,
      zoneName: zone.name,
      absorbedMemberIds: absorbedInZone,
      survivorMemberId: survivorId,
    });
  }

  return impacts;
}

/** Preview survivor channel and zone impacts for selected merge groups. */
export function previewChannelMerges(
  codeplug: Codeplug,
  selections: ChannelMergeSelection[],
  candidates: ChannelMergeCandidateGroup[] = [],
): ChannelMergePreview[] {
  const candidateById = new Map(candidates.map((g) => [g.id, g]));
  const previews: ChannelMergePreview[] = [];

  for (const selection of selections) {
    if (!selection.enabled) continue;

    const sources = selection.sourceChannelIds
      .map((id) => channelById(codeplug, id))
      .filter((ch): ch is Channel => ch != null);
    if (sources.length < 2) continue;

    const group = candidateById.get(selection.groupId);
    const survivorId = sources[0].id;
    let mergedChannel: Channel;
    let rxGroupLists: RxGroupList[] | undefined;

    if (group?.mergeKind === 'multiTalkgroup') {
      const result = mergeChannelsToMultiTalkgroup(sources, {
        survivorId,
        resultName: selection.resultName.trim() || group.suggestedName,
        talkGroups: codeplug.talkGroups,
        contacts: codeplug.contacts,
        rxGroupLists: codeplug.rxGroupLists,
      });
      mergedChannel = result.channel;
      rxGroupLists = result.rxGroupLists;
    } else {
      mergedChannel = mergeChannelsToMultiMode(sources, {
        survivorId,
        resultName: selection.resultName.trim() || mergeNameStem(sources[0].name),
      });
    }

    mergedChannel = withSelectionFrequencies(mergedChannel, selection);

    const absorbedIds = sources.slice(1).map((ch) => ch.id);
    const validationIssues = validateChannel(mergedChannel, codeplug, survivorId);

    previews.push({
      groupId: selection.groupId,
      resultName: mergedChannel.name,
      mergedChannel,
      validationIssues,
      zoneImpacts: zoneImpactsForMerge(codeplug, survivorId, absorbedIds),
      rxGroupLists,
    });
  }

  return previews;
}

/** Apply selected merges into the active codeplug. */
export function applyChannelMerges(
  codeplug: Codeplug,
  selections: ChannelMergeSelection[],
  candidates: ChannelMergeCandidateGroup[],
): { codeplug: Codeplug; report: ChannelMergeApplyReport } {
  const candidateById = new Map(candidates.map((g) => [g.id, g]));
  const report: ChannelMergeApplyReport = {
    mergedCount: 0,
    skippedAmbiguous: 0,
    skippedValidation: 0,
    zoneNotes: [],
    mergedNames: [],
  };

  let next = codeplug;

  for (const selection of selections) {
    if (!selection.enabled) continue;

    const group = candidateById.get(selection.groupId);
    if (!group || (group.mergeKind !== 'multiMode' && group.mergeKind !== 'multiTalkgroup')) {
      report.skippedAmbiguous++;
      continue;
    }

    const preview = previewChannelMerges(next, [selection], candidates)[0];
    if (!preview) continue;

    if (preview.validationIssues.some((i) => i.severity === 'error')) {
      report.skippedValidation++;
      continue;
    }

    const survivorId = preview.mergedChannel.id;
    const absorbedIds = selection.sourceChannelIds.filter((id) => id !== survivorId);

    for (const impact of preview.zoneImpacts) {
      report.zoneNotes.push(
        `Zone "${impact.zoneName}": replaced ${impact.absorbedMemberIds.length} member id(s) with survivor`,
      );
    }

    next = mergeChannelsIntoOne(next, survivorId, absorbedIds, preview.mergedChannel);
    if (preview.rxGroupLists) {
      next = { ...next, rxGroupLists: preview.rxGroupLists };
    }
    report.mergedCount++;
    report.mergedNames.push(preview.resultName);
  }

  return { codeplug: next, report };
}

export function formatChannelMergeReportLines(report: ChannelMergeApplyReport): string[] {
  const lines: string[] = [];
  if (report.mergedCount > 0) {
    lines.push(
      `Merged ${report.mergedCount} channel group${report.mergedCount === 1 ? '' : 's'}: ${report.mergedNames.join(', ')}`,
    );
  }
  if (report.skippedAmbiguous > 0) {
    lines.push(`Skipped ${report.skippedAmbiguous} ambiguous or unsupported group(s)`);
  }
  if (report.skippedValidation > 0) {
    lines.push(`Skipped ${report.skippedValidation} group(s) with validation errors`);
  }
  return [...lines, ...report.zoneNotes];
}

/** Whether every pair in a group shares frequencies (for tests). */
export function groupFrequenciesMatch(channels: Channel[]): boolean {
  if (channels.length < 2) return true;
  const first = channels[0];
  return channels.every((ch) => channelFrequenciesMatch(first, ch));
}
