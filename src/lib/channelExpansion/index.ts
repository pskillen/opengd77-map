import type { EntityRef } from '../entityRefs.ts';
import {
  entityRefDisplayName,
  entityRefExportLabel,
  entityRefKey,
  entityRefsEqual,
  resolveContactRefByWireName,
  resolveRxGroupListIdByName,
} from '../entityRefs.ts';
import { CHANNEL_MODES, isAnalogMode, isDmrMode, type ChannelMode } from '../channelModes.ts';
import type {
  Channel,
  ChannelExportNameMode,
  ChannelModeProfile,
  Codeplug,
  Contact,
  RxGroupList,
  TalkGroup,
  Zone,
} from '../../models/codeplug.ts';
import { channelModeProfileDefaults, newId } from '../../models/codeplug.ts';
import {
  channelPickForWireExport,
  composeChannelWireName,
  withMergedChannelWireProvenance,
  channelCallsignsMatch,
  parseChannelWireName,
} from '../channelNaming.ts';
import { haversineDistanceM } from '../geoDistance.ts';
import {
  finalizeWireName,
  uniqueWireName,
  type ShortenWireNameOptions,
  type TalkGroupMemberSuffixReplacement,
} from './shortenName.ts';
import {
  composeMultiTalkGroupWireName,
  DEFAULT_MULTI_TG_EXPORT_NAME_MODE,
  escalateMultiTalkGroupExportNameMode,
  multiTalkGroupProtectedSuffix,
  type MultiTalkGroupExportNameMode,
} from './multiTalkGroupWireName.ts';

export {
  disambiguationSuffixLength,
  finalizeWireName,
  shortenWireName,
  uniqueWireName,
  type ShortenWireNameOptions,
  type TalkGroupMemberSuffixReplacement,
} from './shortenName.ts';

export {
  DEFAULT_MULTI_TG_EXPORT_NAME_MODE,
  type MultiTalkGroupExportNameMode,
} from './multiTalkGroupWireName.ts';

/** Resolved export row — shared channel fields merged with one mode profile. */
export interface ExpandedChannelRow {
  sourceChannelId: string;
  wireName: string;
  mode: ChannelMode;
  bandwidthKHz: number | null;
  colourCode: number | null;
  timeslot: Channel['timeslot'];
  dmrId: number | null;
  rxTone: Channel['rxTone'];
  txTone: Channel['txTone'];
  squelch: number | null;
  contactRef: Channel['contactRef'];
  rxGroupListId: string | null;
  rxFrequency: number | null;
  txFrequency: number | null;
  location: Channel['location'];
  useLocation: boolean;
  power: number | null;
  rxOnly: boolean;
  aprsConfigName: string;
  voxEnabled: boolean;
  transmitTimeout: number | null;
  scanSkip: boolean;
  opengd77Extras: Record<string, string>;
}

export type TalkGroupMemberFilter = 'all' | 'talkGroupsOnly';

export interface ExpandChannelOptions {
  /** Wire names already reserved (other channels + prior expanded rows). */
  reservedWireNames?: ReadonlySet<string>;
  /** Max display length before export warning (e.g. 1701 LCD). */
  maxNameLength?: number;
  /** Apply shortening strategies when a name exceeds `maxNameLength`. Default false unless set by export. */
  shortenNames?: boolean;
  /** Force all channels to this export name mode for this export pass only. */
  nameModeOverride?: ChannelExportNameMode;
  /** Use `TalkGroup.abbreviation` for multi-talkgroup member suffixes. */
  useTalkGroupAbbreviation?: boolean;
  /** Use `Channel.abbreviation` for the name qualifier in composed wire names. */
  useChannelAbbreviation?: boolean;
  /** How multi-TG expanded rows compose wire names. Default `callsign_tg_abbrev`. */
  multiTalkGroupExportNameMode?: MultiTalkGroupExportNameMode;
  warnings?: string[];
  /** When false, keep multi-mode channels on one wire name (DM32 native dual-mode). Default true. */
  expandModes?: boolean;
  /** Expand RX group list members into per-TG rows (formats without native RGL). */
  expandTalkGroups?: boolean;
  /** Skip TG expansion when row has both TX contact and RGL (DM32 native Scotland-style rows). */
  skipExpandWhenTxContactSet?: boolean;
  /** RGL wire names that must not fan out on export (e.g. DM32 `ALL`). */
  nonExpandableRxGroupListNames?: readonly string[];
  /** Which RX list members to expand. Default `all`. */
  talkGroupMembers?: TalkGroupMemberFilter;
  /** Required when expandTalkGroups is true — resolves RGL member refs. */
  codeplug?: Codeplug;
  /** Channel lookup for TG expansion shortening — defaults to `codeplug.channels`. */
  channelById?: ReadonlyMap<string, Channel>;
}

/** Build a profile from top-level channel mode-specific fields (single-mode path). */
export function profileFromChannelFields(channel: Channel): ChannelModeProfile {
  const profile: ChannelModeProfile = {
    mode: channel.mode,
    bandwidthKHz: channel.bandwidthKHz,
    colourCode: channel.colourCode,
    timeslot: channel.timeslot,
    dmrId: channel.dmrId,
    rxTone: channel.rxTone,
    txTone: channel.txTone,
    squelch: channel.squelch,
    contactRef: channel.contactRef,
    rxGroupListId: channel.rxGroupListId,
  };
  if (Object.keys(channel.opengd77Extras).length > 0) {
    profile.opengd77Extras = { ...channel.opengd77Extras };
  }
  return profile;
}

/** Effective mode profiles for a channel — synthetic from top-level when not multi-mode. */
export function resolveChannelModeProfiles(channel: Channel): ChannelModeProfile[] {
  if (channel.multiMode && channel.modeProfiles.length > 0) {
    return channel.modeProfiles;
  }
  return [profileFromChannelFields(channel)];
}

/** Suffix for derived export wire names per mode category. */
export function modeExportNameSuffix(mode: ChannelMode): string {
  return isAnalogMode(mode) ? '-F' : '-D';
}

/** Strip known multi-mode export suffixes for import grouping. */
export function stripModeExportSuffix(name: string): string {
  if (name.endsWith('-F') || name.endsWith('-D')) {
    return name.slice(0, -2);
  }
  return name;
}

function openGd77WireModeTag(wire: string): '' | '-F' | '-D' {
  const trimmed = wire.trim();
  if (trimmed.endsWith('-F') || /\sFM$/i.test(trimmed)) return '-F';
  if (trimmed.endsWith('-D') || /\sDMR$/i.test(trimmed) || /\sDM$/i.test(trimmed)) return '-D';
  return '';
}

/**
 * Canonical OpenGD77 channel wire name for multiset round-trip compare.
 * Callsign channels with a mode suffix compare by callsign + mode (qualifier typos may merge on import).
 * Otherwise treats trailing ` FM` / ` DMR` / ` DM` and `-F` / `-D` as equivalent.
 */
export function canonicalOpenGd77ChannelWireForCompare(wire: string): string {
  const trimmed = wire.trim();
  const modeTag = openGd77WireModeTag(trimmed);
  const parsed = parseChannelWireName(trimmed);
  if (parsed.callsign && modeTag) {
    return `${parsed.callsign}${modeTag}`;
  }
  const stem = channelMergeNameStem(trimmed);
  if (stem !== trimmed && modeTag) return `${stem}${modeTag}`;
  return trimmed;
}

function channelForWireName(
  channel: Channel,
  options: ExpandChannelOptions,
): Pick<Channel, 'callsign' | 'name' | 'exportNameMode'> {
  return channelPickForWireExport(channel, {
    nameModeOverride: options.nameModeOverride,
    useChannelAbbreviation: options.useChannelAbbreviation,
  });
}

function shortenOptsForChannel(
  channel: Channel,
  options: ExpandChannelOptions,
  extra?: Partial<ShortenWireNameOptions>,
): ShortenWireNameOptions {
  const ch = channelForWireName(channel, options);
  return {
    exportNameMode: ch.exportNameMode,
    recomposeWithMode: (mode) => composeChannelWireName({ ...ch, exportNameMode: mode }),
    ...extra,
  };
}

function assignExportWireName(
  base: string,
  channel: Channel,
  reserved: Set<string>,
  options: ExpandChannelOptions,
  extraShortenOpts?: Partial<ShortenWireNameOptions>,
): string {
  if (options.shortenNames !== true || options.maxNameLength == null) {
    const name = uniqueWireName(base, reserved);
    reserved.add(name);
    if (options.maxNameLength != null && name.length > options.maxNameLength) {
      options.warnings?.push(`Channel name "${name}" exceeds ${options.maxNameLength} characters`);
    }
    return name;
  }
  return finalizeWireName(
    base,
    reserved,
    options.maxNameLength,
    { ...shortenOptsForChannel(channel, options), ...extraShortenOpts },
    options.warnings,
  );
}

function profileOpenGd77Extras(
  channel: Channel,
  profile: ChannelModeProfile,
): Record<string, string> {
  if (profile.opengd77Extras && Object.keys(profile.opengd77Extras).length > 0) {
    return { ...profile.opengd77Extras };
  }
  const wire = channel.meta?.imported?.multiModeProfileWire?.find((w) => w.mode === profile.mode);
  if (wire?.opengd77Extras) {
    return { ...channel.opengd77Extras, ...wire.opengd77Extras };
  }
  return channel.opengd77Extras;
}

function rowFromProfile(
  channel: Channel,
  profile: ChannelModeProfile,
  wireName: string,
): ExpandedChannelRow {
  return {
    sourceChannelId: channel.id,
    wireName,
    mode: profile.mode,
    bandwidthKHz: profile.bandwidthKHz,
    colourCode: profile.colourCode,
    timeslot: profile.timeslot,
    dmrId: profile.dmrId,
    rxTone: profile.rxTone,
    txTone: profile.txTone,
    squelch: profile.squelch,
    contactRef: profile.contactRef,
    rxGroupListId: profile.rxGroupListId,
    rxFrequency: channel.rxFrequency,
    txFrequency: channel.txFrequency,
    location: channel.location,
    useLocation: channel.useLocation,
    power: channel.power,
    rxOnly: channel.rxOnly,
    aprsConfigName: channel.aprsConfigName,
    voxEnabled: channel.voxEnabled,
    transmitTimeout: channel.transmitTimeout,
    scanSkip: channel.scanSkip,
    opengd77Extras: profileOpenGd77Extras(channel, profile),
  };
}

/** Expand one logical channel into export rows (1 row when single-mode). */
export function expandChannelForExport(
  channel: Channel,
  options: ExpandChannelOptions = {},
): ExpandedChannelRow[] {
  const reserved = new Set(options.reservedWireNames ?? []);
  const profiles = resolveChannelModeProfiles(channel);
  const expandModes = options.expandModes ?? true;
  const baseWireName = composeChannelWireName(channelForWireName(channel, options));

  if (!channel.multiMode || profiles.length <= 1) {
    const name = assignExportWireName(baseWireName, channel, reserved, options);
    return [rowFromProfile(channel, profiles[0], name)];
  }

  if (!expandModes) {
    const name = assignExportWireName(baseWireName, channel, reserved, options);

    let tgFanOut = false;
    const dmrProfile = profiles.find((p) => isDmrMode(p.mode));
    const fmProfile = profiles.find((p) => isAnalogMode(p.mode));
    if (
      options.expandTalkGroups &&
      options.codeplug &&
      dmrProfile?.rxGroupListId &&
      !(options.skipExpandWhenTxContactSet && channel.contactRef && dmrProfile.rxGroupListId)
    ) {
      const rgl = options.codeplug.rxGroupLists.find((r) => r.id === dmrProfile.rxGroupListId);
      if (rgl && !options.nonExpandableRxGroupListNames?.includes(rgl.name)) {
        const filter = options.talkGroupMembers ?? 'all';
        const members = filterRglMemberRefs(rgl.memberRefs, filter);
        tgFanOut = members.length > 0;
      }
    }

    if (tgFanOut && fmProfile && dmrProfile) {
      return [rowFromProfile(channel, fmProfile, name), rowFromProfile(channel, dmrProfile, name)];
    }

    const primary = profiles.find((p) => p.mode === channel.mode) ?? profiles[0];
    return [rowFromProfile(channel, primary, name)];
  }

  const rows: ExpandedChannelRow[] = [];
  for (const profile of profiles) {
    const suffix = modeExportNameSuffix(profile.mode);
    const candidate = assignExportWireName(`${baseWireName}${suffix}`, channel, reserved, options);
    rows.push(rowFromProfile(channel, profile, candidate));
  }
  return rows;
}

function resolveSourceChannel(
  row: ExpandedChannelRow,
  options: ExpandChannelOptions,
): Channel | undefined {
  return (
    options.channelById?.get(row.sourceChannelId) ??
    options.codeplug?.channels.find((ch) => ch.id === row.sourceChannelId)
  );
}

function channelByIdFromChannels(channels: Channel[]): Map<string, Channel> {
  return new Map(channels.map((ch) => [ch.id, ch]));
}

function filterRglMemberRefs(memberRefs: EntityRef[], filter: TalkGroupMemberFilter): EntityRef[] {
  if (filter === 'all') return memberRefs;
  return memberRefs.filter((ref) => ref.kind === 'talkGroup');
}

function expandableRglMembers(
  row: ExpandedChannelRow,
  codeplug: Codeplug,
  filter: TalkGroupMemberFilter,
  warnings?: string[],
): EntityRef[] {
  if (!row.rxGroupListId) return [];
  const rgl = codeplug.rxGroupLists.find((r) => r.id === row.rxGroupListId);
  if (!rgl) return [];
  const filtered = filterRglMemberRefs(rgl.memberRefs, filter);
  if (filter === 'talkGroupsOnly' && filtered.length < rgl.memberRefs.length) {
    warnings?.push(
      `Channel "${row.wireName}" skipped ${rgl.memberRefs.length - filtered.length} non-talk-group RX list member(s)`,
    );
  }
  return filtered;
}

/** Strip trailing ` {memberWireName}` suffixes used on TG-expanded export rows. */
export function stripTalkGroupExportSuffix(
  name: string,
  knownMemberWireNames: readonly string[],
): string {
  const sorted = [...knownMemberWireNames].sort((a, b) => b.length - a.length);
  for (const memberName of sorted) {
    const suffix = ` ${memberName}`;
    if (name.endsWith(suffix)) {
      return name.slice(0, -suffix.length);
    }
  }
  return name;
}

/** Second pass: expand digital rows with RX group lists into one row per member. */
export function expandTalkGroupsForExport(
  rows: ExpandedChannelRow[],
  options: ExpandChannelOptions = {},
): ExpandedChannelRow[] {
  if (!options.expandTalkGroups || !options.codeplug) {
    return rows;
  }

  const codeplug = options.codeplug;
  const filter = options.talkGroupMembers ?? 'all';
  const reserved = new Set(options.reservedWireNames ?? []);
  const warnings = options.warnings;
  const result: ExpandedChannelRow[] = [];

  for (const row of rows) {
    if (!isDmrMode(row.mode)) {
      result.push(row);
      reserved.add(row.wireName);
      continue;
    }

    if (options.skipExpandWhenTxContactSet && row.contactRef && row.rxGroupListId) {
      result.push(row);
      reserved.add(row.wireName);
      continue;
    }

    const members = expandableRglMembers(row, codeplug, filter, warnings);
    if (members.length === 0) {
      if (row.rxGroupListId) {
        warnings?.push(`Channel "${row.wireName}" has no expandable RX list members`);
      }
      result.push(row);
      reserved.add(row.wireName);
      continue;
    }

    const rgl = codeplug.rxGroupLists.find((r) => r.id === row.rxGroupListId);
    if (rgl && options.nonExpandableRxGroupListNames?.includes(rgl.name)) {
      result.push(row);
      reserved.add(row.wireName);
      continue;
    }

    const sourceChannel = resolveSourceChannel(row, options);
    if (!sourceChannel) {
      result.push(row);
      reserved.add(row.wireName);
      continue;
    }

    for (const member of members) {
      const fullMemberName = entityRefDisplayName(member, codeplug.talkGroups, codeplug.contacts);
      if (!fullMemberName) continue;

      const tgMode = options.multiTalkGroupExportNameMode ?? DEFAULT_MULTI_TG_EXPORT_NAME_MODE;
      const wireCtx = {
        talkGroups: codeplug.talkGroups,
        contacts: codeplug.contacts,
        useChannelAbbreviation: options.useChannelAbbreviation,
        useTalkGroupAbbreviation: options.useTalkGroupAbbreviation,
        nameModeOverride: options.nameModeOverride,
        siteWireName: row.wireName,
      };

      let effectiveMode = tgMode;
      let base: string;
      let fixedSuffix: string | undefined;

      if (tgMode === 'append') {
        base = `${row.wireName} ${fullMemberName}`;
      } else {
        base = composeMultiTalkGroupWireName(sourceChannel, member, effectiveMode, wireCtx);
        fixedSuffix = multiTalkGroupProtectedSuffix(sourceChannel, member, effectiveMode, wireCtx);
        const maxLen = options.maxNameLength;
        while (maxLen != null && base.length > maxLen) {
          const next = escalateMultiTalkGroupExportNameMode(effectiveMode);
          if (!next) break;
          effectiveMode = next;
          base = composeMultiTalkGroupWireName(sourceChannel, member, effectiveMode, wireCtx);
          fixedSuffix = multiTalkGroupProtectedSuffix(
            sourceChannel,
            member,
            effectiveMode,
            wireCtx,
          );
        }
      }

      const exportMemberLabel = entityRefExportLabel(
        member,
        codeplug.talkGroups,
        codeplug.contacts,
        {
          useAbbreviation: options.useTalkGroupAbbreviation,
        },
      );
      const tgSuffix: TalkGroupMemberSuffixReplacement | undefined =
        tgMode === 'append' &&
        options.useTalkGroupAbbreviation &&
        exportMemberLabel &&
        exportMemberLabel !== fullMemberName
          ? { full: fullMemberName, abbreviated: exportMemberLabel }
          : undefined;
      const shortenExtra: Partial<ShortenWireNameOptions> = {};
      if (tgSuffix) shortenExtra.talkGroupMemberSuffix = tgSuffix;
      if (fixedSuffix) shortenExtra.fixedSuffix = fixedSuffix;
      const candidate = assignExportWireName(
        base,
        sourceChannel,
        reserved,
        options,
        Object.keys(shortenExtra).length > 0 ? shortenExtra : undefined,
      );
      result.push({
        ...row,
        wireName: candidate,
        contactRef: member,
        rxGroupListId: null,
      });
    }
  }

  return result;
}

function expandChannelRowsForExport(
  channel: Channel,
  options: ExpandChannelOptions,
  reserved: Set<string>,
): ExpandedChannelRow[] {
  const channelById = new Map(
    options.channelById ?? channelByIdFromChannels(options.codeplug?.channels ?? []),
  );
  channelById.set(channel.id, channel);
  const withLookup = { ...options, channelById };
  const modeRows = expandChannelForExport(channel, { ...withLookup, reservedWireNames: reserved });
  for (const row of modeRows) {
    reserved.add(row.wireName);
  }
  const tgRows = expandTalkGroupsForExport(modeRows, {
    ...withLookup,
    reservedWireNames: reserved,
  });
  for (const row of tgRows) {
    reserved.add(row.wireName);
  }
  return tgRows;
}

/** Expand all channels for export, preserving order and unique wire names. */
export function expandAllChannelsForExport(
  channels: Channel[],
  options: Omit<ExpandChannelOptions, 'reservedWireNames'> = {},
): ExpandedChannelRow[] {
  const reserved = new Set<string>();
  const channelById = new Map(options.channelById ?? channelByIdFromChannels(channels));
  const withLookup = { ...options, channelById };
  const rows: ExpandedChannelRow[] = [];
  for (const ch of channels) {
    channelById.set(ch.id, ch);
    rows.push(...expandChannelRowsForExport(ch, withLookup, reserved));
  }
  return rows;
}

export interface ExpandZoneMembersOptions extends ExpandChannelOptions {
  maxMembers?: number;
}

/** Map zone logical member ids to export wire names (expanded for multi-mode). */
export function expandZoneMemberWireNames(
  zone: Zone,
  channels: Channel[],
  options: ExpandZoneMembersOptions = {},
): { names: string[]; warnings: string[] } {
  const byId = new Map(channels.map((ch) => [ch.id, ch]));
  const reserved = new Set(options.reservedWireNames ?? []);
  const warnings: string[] = [];
  const names: string[] = [];
  const channelById = new Map(options.channelById ?? byId);
  const withLookup = { ...options, channelById, warnings: options.warnings ?? warnings };

  for (const memberId of zone.memberChannelIds) {
    const ch = byId.get(memberId);
    if (!ch) continue;
    channelById.set(ch.id, ch);
    const expanded = expandChannelRowsForExport(ch, withLookup, reserved);
    for (const row of expanded) {
      if (options.maxMembers != null && names.length >= options.maxMembers) {
        warnings.push(
          `Zone "${zone.name}" exceeds ${options.maxMembers} members after channel expansion`,
        );
        return { names, warnings };
      }
      names.push(row.wireName);
    }
  }

  return { names, warnings };
}

export interface MergeImportChannelsResult {
  channels: Channel[];
  merged: { sourceNames: string[]; resultName: string }[];
}

export interface MergeImportMultiTalkgroupResult extends MergeImportChannelsResult {
  rxGroupLists: RxGroupList[];
}

function knownMemberWireNames(talkGroups: TalkGroup[], contacts: Contact[]): string[] {
  return [...talkGroups.map((t) => t.name), ...contacts.map((c) => c.name)];
}

/** Stem for multi-talkgroup grouping — strips mode and TG member suffixes. */
export function channelTalkGroupStem(
  name: string,
  talkGroups: TalkGroup[],
  contacts: Contact[],
): string {
  return stripTalkGroupExportSuffix(
    channelMergeNameStem(name),
    knownMemberWireNames(talkGroups, contacts),
  );
}

function memberRefsSetEqual(a: EntityRef[], b: EntityRef[]): boolean {
  if (a.length !== b.length) return false;
  const keysA = a.map(entityRefKey).sort();
  const keysB = b.map(entityRefKey).sort();
  return keysA.every((k, i) => k === keysB[i]);
}

function findRxGroupListByMembers(
  memberRefs: EntityRef[],
  rxGroupLists: RxGroupList[],
): RxGroupList | null {
  return rxGroupLists.find((rgl) => memberRefsSetEqual(rgl.memberRefs, memberRefs)) ?? null;
}

function digitalRfContextMatch(a: Channel, b: Channel): boolean {
  if (a.colourCode !== b.colourCode) return false;
  if (a.timeslot !== b.timeslot) return false;
  return true;
}

/** Whether two single-mode DMR channels differ only by TX talk group. */
export function channelsAreMultiTalkgroupMergeCandidates(
  a: Channel,
  b: Channel,
  talkGroups: TalkGroup[],
  contacts: Contact[],
  options: ChannelMergeCandidateOptions = {},
): boolean {
  if (a.multiMode || b.multiMode) return false;
  if (a.mode !== b.mode || !isDmrMode(a.mode)) return false;
  const threshold = options.nameFuzzyThreshold ?? 0;
  const stripTrailingModeLabel = options.stripTrailingModeLabel ?? false;
  if (!channelFrequenciesMatchWithOptions(a, b, options)) return false;
  if (!channelLocationsMatch(a, b)) return false;
  if (!digitalRfContextMatch(a, b)) return false;

  const refA = a.contactRef;
  const refB = b.contactRef;
  if (!refA || !refB || refA.kind !== 'talkGroup' || refB.kind !== 'talkGroup') return false;
  if (entityRefsEqual(refA, refB)) return false;

  if (options.ignoreNameMatch) return true;

  const stem = stripTrailingModeLabel ? channelMergeNameStem : channelNameStem;
  const stemA = channelTalkGroupStem(stem(a.name), talkGroups, contacts);
  const stemB = channelTalkGroupStem(stem(b.name), talkGroups, contacts);
  if (threshold <= 0) return stemA === stemB;
  return levenshteinRatio(stemA, stemB) <= threshold;
}

export interface MergeChannelsToMultiTalkgroupOptions {
  resultName?: string;
  survivorId?: string;
  talkGroups: TalkGroup[];
  contacts: Contact[];
  rxGroupLists: RxGroupList[];
}

/** Merge N same-site DMR channels (distinct TX talk groups) into one logical channel + RGL. */
export function mergeChannelsToMultiTalkgroup(
  sources: Channel[],
  options: MergeChannelsToMultiTalkgroupOptions,
): { channel: Channel; rxGroupLists: RxGroupList[] } {
  if (sources.length < 2) {
    throw new Error('mergeChannelsToMultiTalkgroup requires at least two source channels');
  }

  const primary = sources[0];
  const memberRefs: EntityRef[] = [];
  const seen = new Set<string>();
  for (const ch of sources) {
    const ref = ch.contactRef;
    if (ref?.kind === 'talkGroup') {
      const key = entityRefKey(ref);
      if (!seen.has(key)) {
        seen.add(key);
        memberRefs.push(ref);
      }
    }
  }

  const stem =
    options.resultName ?? channelTalkGroupStem(primary.name, options.talkGroups, options.contacts);

  let rxGroupLists = [...options.rxGroupLists];
  const existing = findRxGroupListByMembers(memberRefs, rxGroupLists);
  let rxGroupListId: string;
  if (existing) {
    rxGroupListId = existing.id;
  } else {
    const newList: RxGroupList = { id: newId(), name: stem, memberRefs };
    rxGroupLists = [...rxGroupLists, newList];
    rxGroupListId = newList.id;
  }

  const channel: Channel = {
    ...primary,
    id: options.survivorId ?? primary.id,
    name: stem,
    contactRef: null,
    rxGroupListId,
  };

  return { channel: withMergedChannelWireProvenance(channel, sources), rxGroupLists };
}

function canMergeMultiTalkgroupPair(
  a: Channel,
  b: Channel,
  talkGroups: TalkGroup[],
  contacts: Contact[],
  options: ChannelMergeCandidateOptions = {},
): boolean {
  return channelsAreMultiTalkgroupMergeCandidates(a, b, talkGroups, contacts, {
    nameFuzzyThreshold: 0,
    ...options,
  });
}

function mergeMultiTalkgroupGroup(
  sources: Channel[],
  talkGroups: TalkGroup[],
  contacts: Contact[],
  rxGroupLists: RxGroupList[],
): { channel: Channel; rxGroupLists: RxGroupList[] } {
  return mergeChannelsToMultiTalkgroup(sources, {
    survivorId: sources[0].id,
    talkGroups,
    contacts,
    rxGroupLists,
  });
}

/** Best-effort collapse of flat per-TG import rows into logical channels + RGL. */
export function mergeImportChannelsMultiTalkgroupBestEffort(
  channels: Channel[],
  talkGroups: TalkGroup[],
  contacts: Contact[],
  rxGroupLists: RxGroupList[],
  mergeOptions: ChannelMergeCandidateOptions = {},
): MergeImportMultiTalkgroupResult {
  const merged: MergeImportChannelsResult['merged'] = [];
  const used = new Set<string>();
  const result: Channel[] = [];
  let lists = [...rxGroupLists];

  for (let i = 0; i < channels.length; i++) {
    if (used.has(channels[i].id)) continue;

    const group: Channel[] = [channels[i]];
    used.add(channels[i].id);

    for (let j = i + 1; j < channels.length; j++) {
      if (used.has(channels[j].id)) continue;
      const matchesAll = group.every((member) =>
        canMergeMultiTalkgroupPair(member, channels[j], talkGroups, contacts, mergeOptions),
      );
      if (matchesAll) {
        group.push(channels[j]);
        used.add(channels[j].id);
      }
    }

    if (group.length >= 2) {
      const { channel, rxGroupLists: nextLists } = mergeMultiTalkgroupGroup(
        group,
        talkGroups,
        contacts,
        lists,
      );
      lists = nextLists;
      merged.push({
        sourceNames: group.map((ch) => ch.name),
        resultName: channel.name,
      });
      result.push(channel);
    } else {
      result.push(channels[i]);
    }
  }

  return { channels: result, merged, rxGroupLists: lists };
}

/** Mode display labels longest-first for trailing suffix stripping. */
const TRAILING_MODE_LABELS = [...CHANNEL_MODES]
  .map((m) => m.label)
  .sort((a, b) => b.length - a.length);

export function channelNameStem(name: string): string {
  return stripModeExportSuffix(name);
}

/** Post-hoc merge candidate stem — also strips trailing space + mode label (e.g. ` FM`, ` DMR`, ` DM`). */
export function channelMergeNameStem(name: string): string {
  let stem = stripModeExportSuffix(name);
  if (/\sDM$/i.test(stem)) {
    stem = stem.slice(0, -3);
  }
  for (const label of TRAILING_MODE_LABELS) {
    const suffix = ` ${label}`;
    if (stem.endsWith(suffix)) {
      stem = stem.slice(0, -suffix.length);
      break;
    }
  }
  return stem;
}

/** Normalised Levenshtein distance ratio in [0, 1] — 0 means identical. */
export function levenshteinRatio(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (m === 0) return 1;
  if (n === 0) return 1;
  const row = new Array<number>(n + 1);
  for (let j = 0; j <= n; j++) row[j] = j;
  for (let i = 1; i <= m; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= n; j++) {
      const temp = row[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + cost);
      prev = temp;
    }
  }
  return row[n] / Math.max(m, n);
}

export interface ChannelMergeCandidateOptions {
  /** Max normalised Levenshtein ratio for name stems (0 = exact match). Default 0. */
  nameFuzzyThreshold?: number;
  /** Strip trailing mode labels (` FM`, ` DMR`, …) when comparing stems. Default false. */
  stripTrailingModeLabel?: boolean;
  /** Require equal RX frequency Hz. Default true. */
  matchRxFrequency?: boolean;
  /** Require equal TX frequency Hz. Default true. */
  matchTxFrequency?: boolean;
  /** Skip name/stem comparison — match on RF context only (freq, location, DMR CC/TS). */
  ignoreNameMatch?: boolean;
}

export function channelFrequenciesMatch(a: Channel, b: Channel): boolean {
  return channelFrequenciesMatchWithOptions(a, b, {
    matchRxFrequency: true,
    matchTxFrequency: true,
  });
}

export function channelFrequenciesMatchWithOptions(
  a: Channel,
  b: Channel,
  options: Pick<ChannelMergeCandidateOptions, 'matchRxFrequency' | 'matchTxFrequency'> = {},
): boolean {
  const matchRx = options.matchRxFrequency ?? true;
  const matchTx = options.matchTxFrequency ?? true;
  if (!matchRx && !matchTx) return true;
  if (matchRx && a.rxFrequency !== b.rxFrequency) return false;
  if (matchTx && a.txFrequency !== b.txFrequency) return false;
  return true;
}

/**
 * Max great-circle distance (m) to treat two channel locations as the same site for merge.
 * CPS FM/DMR rows for one repeater often differ by one lat/lon decimal place.
 */
export const CHANNEL_MERGE_LOCATION_TOLERANCE_M = 250;

export function channelLocationsMatch(a: Channel, b: Channel): boolean {
  if (a.location == null && b.location == null) return true;
  if (a.location == null || b.location == null) return false;
  const distanceM = haversineDistanceM(
    a.location.lat,
    a.location.lon,
    b.location.lat,
    b.location.lon,
  );
  return distanceM <= CHANNEL_MERGE_LOCATION_TOLERANCE_M;
}

function channelNameStemsMatch(
  a: Channel,
  b: Channel,
  threshold: number,
  stripTrailingModeLabel: boolean,
): boolean {
  const stem = stripTrailingModeLabel ? channelMergeNameStem : channelNameStem;
  const stemA = stem(a.name);
  const stemB = stem(b.name);
  if (threshold <= 0) return stemA === stemB;
  return levenshteinRatio(stemA, stemB) <= threshold;
}

function channelQualifierStemForMerge(channel: Channel, stripTrailingModeLabel: boolean): string {
  const stemFn = stripTrailingModeLabel ? channelMergeNameStem : channelNameStem;
  const wire = channel.meta?.imported?.channelWireName ?? channel.name;
  const parsed = parseChannelWireName(wire.trim());
  if (parsed.callsign && parsed.name) {
    return stemFn(parsed.name);
  }
  const stampedCallsign = (channel.callsign ?? '').trim();
  const stampedName = (channel.name ?? '').trim();
  if (stampedCallsign && stampedName) {
    return stemFn(stampedName);
  }
  return stemFn((parsed.name || wire).trim());
}

/** Max normalised Levenshtein ratio between qualifier stems when callsigns match (CPS typos). */
export const CALLSIGN_TYPO_QUALIFIER_THRESHOLD = 0.3;

/** Matching callsign plus typo-level qualifier similarity — not unrelated names at the same site. */
export function channelCallsignTypoMatch(
  a: Channel,
  b: Channel,
  stripTrailingModeLabel: boolean,
  typoThreshold = CALLSIGN_TYPO_QUALIFIER_THRESHOLD,
): boolean {
  if (!channelCallsignsMatch(a, b)) return false;
  const stemA = channelQualifierStemForMerge(a, stripTrailingModeLabel);
  const stemB = channelQualifierStemForMerge(b, stripTrailingModeLabel);
  if (stemA === stemB) return true;
  return levenshteinRatio(stemA, stemB) <= typoThreshold;
}

function channelMergeIdentityMatch(
  a: Channel,
  b: Channel,
  threshold: number,
  stripTrailingModeLabel: boolean,
): boolean {
  if (channelCallsignTypoMatch(a, b, stripTrailingModeLabel)) return true;
  return channelNameStemsMatch(a, b, threshold, stripTrailingModeLabel);
}

/** Whether two single-mode channels are candidates for a multi-mode merge. */
export function channelsAreMultiModeMergeCandidates(
  a: Channel,
  b: Channel,
  options: ChannelMergeCandidateOptions = {},
): boolean {
  if (a.mode === b.mode) return false;
  const threshold = options.nameFuzzyThreshold ?? 0;
  const stripTrailingModeLabel = options.stripTrailingModeLabel ?? false;
  if (
    !options.ignoreNameMatch &&
    !channelMergeIdentityMatch(a, b, threshold, stripTrailingModeLabel)
  ) {
    return false;
  }
  if (!channelFrequenciesMatchWithOptions(a, b, options)) return false;
  if (!channelLocationsMatch(a, b)) return false;
  return true;
}

/** Whether an incoming import row likely matches an existing channel when wire names differ (e.g. shortened export). */
export function channelsAreRelaxedImportMergeCandidates(a: Channel, b: Channel): boolean {
  if (a.multiMode !== b.multiMode) return false;
  if (!a.multiMode && a.mode !== b.mode) return false;
  if (!channelFrequenciesMatch(a, b)) return false;
  if (!channelLocationsMatch(a, b)) return false;
  if (isDmrMode(a.mode) && isDmrMode(b.mode) && !digitalRfContextMatch(a, b)) return false;
  return true;
}

export interface MergeChannelsToMultiModeOptions {
  resultName?: string;
  survivorId?: string;
  /** Import-only: stamp legacy multiModeProfileWire provenance for round-trip. */
  importProvenance?: {
    formatId: string;
    sourceFile: string;
    importedAt: string;
  };
}

function pickPrimarySource(sources: Channel[]): Channel {
  const analog = sources.find((ch) => isAnalogMode(ch.mode));
  return analog ?? sources[0];
}

/** Merge N single-mode sources (≥2, unique modes) into one multi-mode channel. */
export function mergeChannelsToMultiMode(
  sources: Channel[],
  options: MergeChannelsToMultiModeOptions = {},
): Channel {
  if (sources.length < 2) {
    throw new Error('mergeChannelsToMultiMode requires at least two source channels');
  }
  const modes = new Set(sources.map((ch) => ch.mode));
  if (modes.size !== sources.length) {
    throw new Error('mergeChannelsToMultiMode requires unique modes per source');
  }

  const primary = pickPrimarySource(sources);
  const survivorId = options.survivorId ?? primary.id;
  const resultName = options.resultName ?? channelMergeNameStem(primary.name);
  const modeProfiles = sources.map((ch) => profileFromChannelFields(ch));

  const base: Channel = {
    ...primary,
    id: survivorId,
    name: resultName,
    multiMode: true,
    mode: primary.mode,
    modeProfiles,
    opengd77Extras: {},
  };

  if (options.importProvenance) {
    const prov = options.importProvenance;
    base.meta = {
      imported: {
        formatId: prov.formatId,
        sourceFile: prov.sourceFile,
        importedAt: prov.importedAt,
        multiModeProfileWire: sources.map((ch) => ({
          mode: ch.mode,
          contactWireName: ch.meta?.imported?.contactWireName,
          rxGroupListWireName: ch.meta?.imported?.rxGroupListWireName,
          opengd77Extras: ch.opengd77Extras,
        })),
      },
    };
  }

  return syncChannelFromPrimaryProfile(withMergedChannelWireProvenance(base, sources));
}

const IMPORT_MERGE_MATCH_OPTIONS: ChannelMergeCandidateOptions = {
  stripTrailingModeLabel: true,
  nameFuzzyThreshold: 0,
};

function canMergePair(a: Channel, b: Channel, options: ChannelMergeCandidateOptions = {}): boolean {
  return channelsAreMultiModeMergeCandidates(a, b, { ...IMPORT_MERGE_MATCH_OPTIONS, ...options });
}

function mergeTwoChannels(primary: Channel, secondary: Channel): Channel {
  const fmSource = isAnalogMode(primary.mode) ? primary : secondary;
  const dmrSource = isAnalogMode(primary.mode) ? secondary : primary;
  const imported = primary.meta?.imported ?? secondary.meta?.imported;
  return mergeChannelsToMultiMode([fmSource, dmrSource], {
    importProvenance: {
      formatId: imported?.formatId ?? 'opengd77',
      sourceFile: imported?.sourceFile ?? 'Channels.csv',
      importedAt: imported?.importedAt ?? new Date().toISOString(),
    },
  });
}

/** Best-effort collapse of paired flat import rows into multi-mode channels. */
export function mergeImportChannelsBestEffort(
  channels: Channel[],
  mergeOptions: ChannelMergeCandidateOptions = {},
): MergeImportChannelsResult {
  const merged: MergeImportChannelsResult['merged'] = [];
  const used = new Set<string>();
  const result: Channel[] = [];

  for (let i = 0; i < channels.length; i++) {
    if (used.has(channels[i].id)) continue;
    let combined: Channel | null = null;

    for (let j = i + 1; j < channels.length; j++) {
      if (used.has(channels[j].id)) continue;
      if (canMergePair(channels[i], channels[j], mergeOptions)) {
        combined = mergeTwoChannels(channels[i], channels[j]);
        used.add(channels[i].id);
        used.add(channels[j].id);
        merged.push({
          sourceNames: [channels[i].name, channels[j].name],
          resultName: combined.name,
        });
        break;
      }
    }

    if (combined) {
      result.push(combined);
    } else if (!used.has(channels[i].id)) {
      result.push(channels[i]);
      used.add(channels[i].id);
    }
  }

  return { channels: result, merged };
}

/** Sync top-level mode-specific fields from the primary profile (channel.mode). */
export function syncChannelFromPrimaryProfile(channel: Channel): Channel {
  if (!channel.multiMode || channel.modeProfiles.length === 0) {
    return channel;
  }
  const primary =
    channel.modeProfiles.find((p) => p.mode === channel.mode) ?? channel.modeProfiles[0];
  return {
    ...channel,
    mode: primary.mode,
    bandwidthKHz: primary.bandwidthKHz,
    colourCode: primary.colourCode,
    timeslot: primary.timeslot,
    dmrId: primary.dmrId,
    rxTone: primary.rxTone,
    txTone: primary.txTone,
    squelch: primary.squelch,
    contactRef: primary.contactRef,
    rxGroupListId: primary.rxGroupListId,
  };
}

/** Update or insert a profile on a multi-mode channel. */
export function upsertModeProfile(channel: Channel, profile: ChannelModeProfile): Channel {
  const existing = channel.modeProfiles.findIndex((p) => p.mode === profile.mode);
  const modeProfiles =
    existing >= 0
      ? channel.modeProfiles.map((p, i) => (i === existing ? profile : p))
      : [...channel.modeProfiles, profile];
  return syncChannelFromPrimaryProfile({ ...channel, multiMode: true, modeProfiles });
}

export function emptyModeProfile(mode: ChannelMode): ChannelModeProfile {
  return channelModeProfileDefaults(mode);
}

/** Resolve per-profile contact/RGL refs from multi-mode import merge wire stash. */
export function resolveMultiModeChannelProfiles(
  channels: Channel[],
  talkGroups: TalkGroup[],
  contacts: Contact[],
  rxGroupLists: RxGroupList[],
): Channel[] {
  return channels.map((ch) => {
    const wires = ch.meta?.imported?.multiModeProfileWire;
    if (!ch.multiMode || !wires?.length) return ch;

    const modeProfiles = ch.modeProfiles.map((profile) => {
      const wire = wires.find((w) => w.mode === profile.mode);
      if (!wire) return profile;

      let contactRef = profile.contactRef;
      if (!contactRef && wire.contactWireName) {
        contactRef = resolveContactRefByWireName(wire.contactWireName, talkGroups, contacts);
      }

      let rxGroupListId = profile.rxGroupListId;
      if (!rxGroupListId && wire.rxGroupListWireName) {
        rxGroupListId = resolveRxGroupListIdByName(wire.rxGroupListWireName, rxGroupLists);
      }

      return { ...profile, contactRef, rxGroupListId };
    });

    return syncChannelFromPrimaryProfile({ ...ch, modeProfiles });
  });
}
