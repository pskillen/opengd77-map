import { resolveContactRefByWireName, resolveRxGroupListIdByName } from '../entityRefs.ts';
import { CHANNEL_MODES, isAnalogMode, type ChannelMode } from '../channelModes.ts';
import type {
  Channel,
  ChannelModeProfile,
  Contact,
  RxGroupList,
  TalkGroup,
  Zone,
} from '../../models/codeplug.ts';
import { channelModeProfileDefaults } from '../../models/codeplug.ts';

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

export interface ExpandChannelOptions {
  /** Wire names already reserved (other channels + prior expanded rows). */
  reservedWireNames?: ReadonlySet<string>;
  /** Max display length before export warning (e.g. 1701 LCD). */
  maxNameLength?: number;
  warnings?: string[];
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

function uniqueWireName(base: string, reserved: Set<string>): string {
  if (!reserved.has(base)) return base;
  let n = 2;
  while (reserved.has(`${base} ${n}`)) n++;
  return `${base} ${n}`;
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
  const warnings = options.warnings;
  const profiles = resolveChannelModeProfiles(channel);

  if (!channel.multiMode || profiles.length <= 1) {
    const name = uniqueWireName(channel.name, reserved);
    reserved.add(name);
    if (options.maxNameLength != null && name.length > options.maxNameLength) {
      warnings?.push(`Channel name "${name}" exceeds ${options.maxNameLength} characters`);
    }
    return [rowFromProfile(channel, profiles[0], name)];
  }

  const rows: ExpandedChannelRow[] = [];
  for (const profile of profiles) {
    const suffix = modeExportNameSuffix(profile.mode);
    const candidate = uniqueWireName(`${channel.name}${suffix}`, reserved);
    reserved.add(candidate);
    if (options.maxNameLength != null && candidate.length > options.maxNameLength) {
      warnings?.push(
        `Derived channel name "${candidate}" exceeds ${options.maxNameLength} characters`,
      );
    }
    rows.push(rowFromProfile(channel, profile, candidate));
  }
  return rows;
}

/** Expand all channels for export, preserving order and unique wire names. */
export function expandAllChannelsForExport(
  channels: Channel[],
  options: Omit<ExpandChannelOptions, 'reservedWireNames'> = {},
): ExpandedChannelRow[] {
  const reserved = new Set<string>();
  const rows: ExpandedChannelRow[] = [];
  for (const ch of channels) {
    const expanded = expandChannelForExport(ch, { ...options, reservedWireNames: reserved });
    for (const row of expanded) {
      reserved.add(row.wireName);
      rows.push(row);
    }
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

  for (const memberId of zone.memberChannelIds) {
    const ch = byId.get(memberId);
    if (!ch) continue;
    const expanded = expandChannelForExport(ch, {
      ...options,
      reservedWireNames: reserved,
      warnings,
    });
    for (const row of expanded) {
      if (options.maxMembers != null && names.length >= options.maxMembers) {
        warnings.push(
          `Zone "${zone.name}" exceeds ${options.maxMembers} members after multi-mode expansion`,
        );
        return { names, warnings };
      }
      names.push(row.wireName);
      reserved.add(row.wireName);
    }
  }

  return { names, warnings };
}

export interface MergeImportChannelsResult {
  channels: Channel[];
  merged: { sourceNames: string[]; resultName: string }[];
}

/** Mode display labels longest-first for trailing suffix stripping. */
const TRAILING_MODE_LABELS = [...CHANNEL_MODES]
  .map((m) => m.label)
  .sort((a, b) => b.length - a.length);

export function channelNameStem(name: string): string {
  return stripModeExportSuffix(name);
}

/** Post-hoc merge candidate stem — also strips trailing space + mode label (e.g. ` FM`, ` DMR`). */
export function channelMergeNameStem(name: string): string {
  let stem = stripModeExportSuffix(name);
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

export function channelLocationsMatch(a: Channel, b: Channel): boolean {
  if (a.location == null && b.location == null) return true;
  if (a.location == null || b.location == null) return false;
  return a.location.lat === b.location.lat && a.location.lon === b.location.lon;
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

/** Whether two single-mode channels are candidates for a multi-mode merge. */
export function channelsAreMultiModeMergeCandidates(
  a: Channel,
  b: Channel,
  options: ChannelMergeCandidateOptions = {},
): boolean {
  if (a.mode === b.mode) return false;
  const threshold = options.nameFuzzyThreshold ?? 0;
  const stripTrailingModeLabel = options.stripTrailingModeLabel ?? false;
  if (!channelNameStemsMatch(a, b, threshold, stripTrailingModeLabel)) return false;
  if (!channelFrequenciesMatchWithOptions(a, b, options)) return false;
  if (!channelLocationsMatch(a, b)) return false;
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
  const resultName = options.resultName ?? channelNameStem(primary.name);
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

  return syncChannelFromPrimaryProfile(base);
}

function canMergePair(a: Channel, b: Channel): boolean {
  return channelsAreMultiModeMergeCandidates(a, b, { nameFuzzyThreshold: 0 });
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
export function mergeImportChannelsBestEffort(channels: Channel[]): MergeImportChannelsResult {
  const merged: MergeImportChannelsResult['merged'] = [];
  const used = new Set<string>();
  const result: Channel[] = [];

  for (let i = 0; i < channels.length; i++) {
    if (used.has(channels[i].id)) continue;
    let combined: Channel | null = null;

    for (let j = i + 1; j < channels.length; j++) {
      if (used.has(channels[j].id)) continue;
      if (canMergePair(channels[i], channels[j])) {
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
