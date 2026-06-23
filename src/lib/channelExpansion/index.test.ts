import { describe, expect, it } from 'vitest';
import {
  buildChannel,
  buildCodeplug,
  buildRxGroupList,
  buildTalkGroup,
} from '../../test/builders/codeplug.ts';
import {
  channelMergeNameStem,
  channelNameStem,
  channelsAreMultiModeMergeCandidates,
  expandAllChannelsForExport,
  expandChannelForExport,
  expandTalkGroupsForExport,
  expandZoneMemberWireNames,
  levenshteinRatio,
  mergeChannelsToMultiMode,
  mergeImportChannelsBestEffort,
  mergeImportChannelsMultiTalkgroupBestEffort,
  modeExportNameSuffix,
  resolveChannelModeProfiles,
  stripModeExportSuffix,
  stripTalkGroupExportSuffix,
  syncChannelFromPrimaryProfile,
} from './index.ts';
import { buildZone } from '../../test/builders/codeplug.ts';
import { channelModeProfileDefaults } from '../../models/codeplug.ts';

describe('channelExpansion', () => {
  it('resolveChannelModeProfiles returns synthetic profile for single-mode', () => {
    const ch = buildChannel({
      id: '1',
      name: 'GB7GL',
      mode: 'dmr',
      colourCode: 1,
    });
    const profiles = resolveChannelModeProfiles(ch);
    expect(profiles).toHaveLength(1);
    expect(profiles[0].mode).toBe('dmr');
    expect(profiles[0].colourCode).toBe(1);
  });

  it('expandChannelForExport emits one row for single-mode', () => {
    const ch = buildChannel({ id: '1', name: 'Test', mode: 'fm' });
    const rows = expandChannelForExport(ch);
    expect(rows).toHaveLength(1);
    expect(rows[0].wireName).toBe('Test');
    expect(rows[0].mode).toBe('fm');
  });

  it('expandChannelForExport emits -F and -D rows for multi-mode', () => {
    const ch = buildChannel({
      id: '1',
      name: 'GB7GL',
      mode: 'fm',
      multiMode: true,
      modeProfiles: [
        { ...channelModeProfileDefaults('fm'), rxTone: '88.5' },
        { ...channelModeProfileDefaults('dmr'), colourCode: 1 },
      ],
    });
    const rows = expandChannelForExport(ch);
    expect(rows).toHaveLength(2);
    expect(rows.map((r) => r.wireName).sort()).toEqual(['GB7GL-D', 'GB7GL-F']);
    expect(rows.find((r) => r.wireName === 'GB7GL-F')?.rxTone).toBe('88.5');
    expect(rows.find((r) => r.wireName === 'GB7GL-D')?.colourCode).toBe(1);
  });

  it('modeExportNameSuffix uses -F for analog and -D for digital', () => {
    expect(modeExportNameSuffix('fm')).toBe('-F');
    expect(modeExportNameSuffix('dmr')).toBe('-D');
  });

  it('stripModeExportSuffix removes known suffixes', () => {
    expect(stripModeExportSuffix('GB7GL-F')).toBe('GB7GL');
    expect(stripModeExportSuffix('GB7GL-D')).toBe('GB7GL');
    expect(stripModeExportSuffix('GB7GL')).toBe('GB7GL');
  });

  it('channelMergeNameStem strips trailing space + mode label', () => {
    expect(channelMergeNameStem('GB7GL-F')).toBe('GB7GL');
    expect(channelMergeNameStem('GB123 Meep FM')).toBe('GB123 Meep');
    expect(channelMergeNameStem('GB123 Meep DMR')).toBe('GB123 Meep');
    expect(channelMergeNameStem('GB7GL')).toBe('GB7GL');
  });

  it('channelNameStem does not strip trailing mode words (import-safe)', () => {
    expect(channelNameStem('GB123 Meep DMR')).toBe('GB123 Meep DMR');
  });

  it('expandAllChannelsForExport avoids name collisions', () => {
    const channels = [
      buildChannel({ id: '1', name: 'GB7GL', mode: 'fm' }),
      buildChannel({ id: '2', name: 'GB7GL', mode: 'dmr' }),
    ];
    const rows = expandAllChannelsForExport(channels);
    expect(rows[0].wireName).toBe('GB7GL');
    expect(rows[1].wireName).toBe('GB7GL 2');
  });

  it('expandZoneMemberWireNames expands multi-mode member', () => {
    const ch = buildChannel({
      id: 'c1',
      name: 'GB7GL',
      mode: 'fm',
      multiMode: true,
      modeProfiles: [channelModeProfileDefaults('fm'), channelModeProfileDefaults('dmr')],
    });
    const zone = buildZone({ id: 'z1', name: 'Zone', memberChannelIds: ['c1'] });
    const { names } = expandZoneMemberWireNames(zone, [ch]);
    expect(names).toEqual(['GB7GL-F', 'GB7GL-D']);
  });

  it('mergeImportChannelsBestEffort merges paired analog+digital rows', () => {
    const fm = buildChannel({
      id: '1',
      name: 'GB7GL-F',
      mode: 'fm',
      rxFrequency: 430_000_000,
      txFrequency: 430_000_000,
    });
    const dmr = buildChannel({
      id: '2',
      name: 'GB7GL-D',
      mode: 'dmr',
      rxFrequency: 430_000_000,
      txFrequency: 430_000_000,
    });
    const { channels, merged } = mergeImportChannelsBestEffort([fm, dmr]);
    expect(channels).toHaveLength(1);
    expect(channels[0].multiMode).toBe(true);
    expect(channels[0].name).toBe('GB7GL');
    expect(channels[0].modeProfiles).toHaveLength(2);
    expect(merged).toHaveLength(1);
  });

  it('syncChannelFromPrimaryProfile mirrors primary profile to top-level', () => {
    const ch = buildChannel({
      id: '1',
      name: 'GB7GL',
      mode: 'dmr',
      multiMode: true,
      modeProfiles: [
        channelModeProfileDefaults('fm'),
        { ...channelModeProfileDefaults('dmr'), colourCode: 7 },
      ],
    });
    const synced = syncChannelFromPrimaryProfile(ch);
    expect(synced.colourCode).toBe(7);
  });

  it('levenshteinRatio returns 0 for identical strings', () => {
    expect(levenshteinRatio('GB7GL', 'GB7GL')).toBe(0);
  });

  it('channelsAreMultiModeMergeCandidates accepts fuzzy name near-miss', () => {
    const a = buildChannel({
      id: '1',
      name: 'REPEATER01-F',
      mode: 'fm',
      rxFrequency: 430_000_000,
      txFrequency: 430_000_000,
    });
    const b = buildChannel({
      id: '2',
      name: 'REPEATER02-D',
      mode: 'dmr',
      rxFrequency: 430_000_000,
      txFrequency: 430_000_000,
    });
    expect(channelsAreMultiModeMergeCandidates(a, b, { nameFuzzyThreshold: 0 })).toBe(false);
    expect(channelsAreMultiModeMergeCandidates(a, b, { nameFuzzyThreshold: 0.15 })).toBe(true);
  });

  it('channelsAreMultiModeMergeCandidates rejects same-mode pair', () => {
    const a = buildChannel({ id: '1', name: 'GB7GL-F', mode: 'fm' });
    const b = buildChannel({ id: '2', name: 'GB7GL-D', mode: 'fm' });
    expect(channelsAreMultiModeMergeCandidates(a, b)).toBe(false);
  });

  it('mergeChannelsToMultiMode builds N-way FM+DMR+YSF with profile opengd77Extras', () => {
    const fm = buildChannel({
      id: '1',
      name: 'GB7GL-F',
      mode: 'fm',
      rxFrequency: 430_000_000,
      txFrequency: 430_000_000,
      opengd77Extras: { 'Scan List': 'Z1' },
    });
    const dmr = buildChannel({
      id: '2',
      name: 'GB7GL-D',
      mode: 'dmr',
      rxFrequency: 430_000_000,
      txFrequency: 430_000_000,
      colourCode: 1,
      opengd77Extras: { 'DMR ID': '123' },
    });
    const ysf = buildChannel({
      id: '3',
      name: 'GB7GL-D',
      mode: 'ysf',
      rxFrequency: 430_000_000,
      txFrequency: 430_000_000,
    });
    const merged = mergeChannelsToMultiMode([fm, dmr, ysf], { survivorId: '1' });
    expect(merged.multiMode).toBe(true);
    expect(merged.id).toBe('1');
    expect(merged.name).toBe('GB7GL');
    expect(merged.modeProfiles).toHaveLength(3);
    expect(merged.modeProfiles.find((p) => p.mode === 'fm')?.opengd77Extras).toEqual({
      'Scan List': 'Z1',
    });
    expect(merged.modeProfiles.find((p) => p.mode === 'dmr')?.colourCode).toBe(1);
    expect(merged.meta?.imported).toBeUndefined();
  });

  it('expandTalkGroupsForExport emits one row per RGL talk group on DMR channels', () => {
    const tg1 = buildTalkGroup({ id: 'tg1', name: 'Scotland TS1' });
    const tg2 = buildTalkGroup({ id: 'tg2', name: 'Local 9' });
    const rgl = buildRxGroupList({
      id: 'rgl1',
      name: 'GB7GL',
      memberRefs: [
        { kind: 'talkGroup', id: 'tg1' },
        { kind: 'talkGroup', id: 'tg2' },
      ],
    });
    const codeplug = buildCodeplug({
      talkGroups: [tg1, tg2],
      rxGroupLists: [rgl],
    });
    const ch = buildChannel({
      id: 'c1',
      name: 'GB7GL',
      mode: 'dmr',
      rxGroupListId: 'rgl1',
      contactRef: null,
    });
    const modeRows = expandChannelForExport(ch);
    const rows = expandTalkGroupsForExport(modeRows, {
      expandTalkGroups: true,
      codeplug,
    });
    expect(rows).toHaveLength(2);
    expect(rows.map((r) => r.wireName).sort()).toEqual(['GB7GL Local 9', 'GB7GL Scotland TS1']);
    expect(rows.every((r) => r.rxGroupListId === null)).toBe(true);
    expect(rows.map((r) => r.contactRef?.id).sort()).toEqual(['tg1', 'tg2']);
  });

  it('expandTalkGroupsForExport skips analog rows', () => {
    const tg1 = buildTalkGroup({ id: 'tg1', name: 'Scotland TS1' });
    const rgl = buildRxGroupList({
      id: 'rgl1',
      name: 'List',
      memberRefs: [{ kind: 'talkGroup', id: 'tg1' }],
    });
    const codeplug = buildCodeplug({ talkGroups: [tg1], rxGroupLists: [rgl] });
    const ch = buildChannel({
      id: 'c1',
      name: 'GB7GL-F',
      mode: 'fm',
      rxGroupListId: 'rgl1',
    });
    const rows = expandTalkGroupsForExport(expandChannelForExport(ch), {
      expandTalkGroups: true,
      codeplug,
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].wireName).toBe('GB7GL-F');
  });

  it('expandTalkGroupsForExport respects talkGroupsOnly filter', () => {
    const tg1 = buildTalkGroup({ id: 'tg1', name: 'Scotland TS1' });
    const rgl = buildRxGroupList({
      id: 'rgl1',
      name: 'List',
      memberRefs: [
        { kind: 'talkGroup', id: 'tg1' },
        { kind: 'contact', id: 'ct1' },
      ],
    });
    const codeplug = buildCodeplug({
      talkGroups: [tg1],
      contacts: [{ id: 'ct1', name: 'Private', number: '', timeslotOverride: '' }],
      rxGroupLists: [rgl],
    });
    const ch = buildChannel({
      id: 'c1',
      name: 'GB7GL',
      mode: 'dmr',
      rxGroupListId: 'rgl1',
    });
    const rows = expandTalkGroupsForExport(expandChannelForExport(ch), {
      expandTalkGroups: true,
      talkGroupMembers: 'talkGroupsOnly',
      codeplug,
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].wireName).toBe('GB7GL Scotland TS1');
  });

  it('expandAllChannelsForExport combines multi-mode and multi-talkgroup', () => {
    const tg1 = buildTalkGroup({ id: 'tg1', name: 'Scotland TS1' });
    const tg2 = buildTalkGroup({ id: 'tg2', name: 'Local 9' });
    const rgl = buildRxGroupList({
      id: 'rgl1',
      name: 'GB7GL',
      memberRefs: [
        { kind: 'talkGroup', id: 'tg1' },
        { kind: 'talkGroup', id: 'tg2' },
      ],
    });
    const codeplug = buildCodeplug({ talkGroups: [tg1, tg2], rxGroupLists: [rgl] });
    const ch = buildChannel({
      id: 'c1',
      name: 'GB7GL',
      mode: 'fm',
      multiMode: true,
      modeProfiles: [
        channelModeProfileDefaults('fm'),
        { ...channelModeProfileDefaults('dmr'), rxGroupListId: 'rgl1', colourCode: 7 },
      ],
    });
    const rows = expandAllChannelsForExport([ch], {
      expandTalkGroups: true,
      codeplug,
    });
    expect(rows.map((r) => r.wireName).sort()).toEqual([
      'GB7GL-D Local 9',
      'GB7GL-D Scotland TS1',
      'GB7GL-F',
    ]);
  });

  it('stripTalkGroupExportSuffix removes known member suffixes', () => {
    expect(stripTalkGroupExportSuffix('GB7GL Scotland TS1', ['Scotland TS1', 'Local 9'])).toBe(
      'GB7GL',
    );
    expect(stripTalkGroupExportSuffix('GB7GL', ['Scotland TS1'])).toBe('GB7GL');
  });

  it('expandZoneMemberWireNames fans out TG-expanded digital members', () => {
    const tg1 = buildTalkGroup({ id: 'tg1', name: 'Scotland TS1' });
    const tg2 = buildTalkGroup({ id: 'tg2', name: 'Local 9' });
    const rgl = buildRxGroupList({
      id: 'rgl1',
      name: 'GB7GL',
      memberRefs: [
        { kind: 'talkGroup', id: 'tg1' },
        { kind: 'talkGroup', id: 'tg2' },
      ],
    });
    const codeplug = buildCodeplug({ talkGroups: [tg1, tg2], rxGroupLists: [rgl] });
    const ch = buildChannel({
      id: 'c1',
      name: 'GB7GL',
      mode: 'dmr',
      rxGroupListId: 'rgl1',
    });
    const zone = buildZone({ id: 'z1', name: 'Zone', memberChannelIds: ['c1'] });
    const { names } = expandZoneMemberWireNames(zone, [ch], {
      expandTalkGroups: true,
      codeplug,
    });
    expect(names).toEqual(['GB7GL Scotland TS1', 'GB7GL Local 9']);
  });

  it('mergeImportChannelsMultiTalkgroupBestEffort collapses flat per-TG rows', () => {
    const tg1 = buildTalkGroup({ id: 'tg1', name: 'Scotland TS1' });
    const tg2 = buildTalkGroup({ id: 'tg2', name: 'Local 9' });
    const ch1 = buildChannel({
      id: '1',
      name: 'GB7GL Scotland TS1',
      mode: 'dmr',
      rxFrequency: 430_850_000,
      txFrequency: 438_450_000,
      colourCode: 7,
      timeslot: 2,
      contactRef: { kind: 'talkGroup', id: 'tg1' },
    });
    const ch2 = buildChannel({
      id: '2',
      name: 'GB7GL Local 9',
      mode: 'dmr',
      rxFrequency: 430_850_000,
      txFrequency: 438_450_000,
      colourCode: 7,
      timeslot: 2,
      contactRef: { kind: 'talkGroup', id: 'tg2' },
    });
    const { channels, merged, rxGroupLists } = mergeImportChannelsMultiTalkgroupBestEffort(
      [ch1, ch2],
      [tg1, tg2],
      [],
      [],
    );
    expect(channels).toHaveLength(1);
    expect(channels[0].name).toBe('GB7GL');
    expect(channels[0].contactRef).toBeNull();
    expect(channels[0].rxGroupListId).toBeTruthy();
    expect(rxGroupLists).toHaveLength(1);
    expect(rxGroupLists[0].memberRefs).toHaveLength(2);
    expect(merged).toHaveLength(1);
  });
});
