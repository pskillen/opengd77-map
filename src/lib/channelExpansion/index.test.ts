import { describe, expect, it } from 'vitest';
import { buildChannel } from '../../test/builders/codeplug.ts';
import {
  channelMergeNameStem,
  channelNameStem,
  channelsAreMultiModeMergeCandidates,
  expandAllChannelsForExport,
  expandChannelForExport,
  expandZoneMemberWireNames,
  levenshteinRatio,
  mergeChannelsToMultiMode,
  mergeImportChannelsBestEffort,
  modeExportNameSuffix,
  resolveChannelModeProfiles,
  stripModeExportSuffix,
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
});
