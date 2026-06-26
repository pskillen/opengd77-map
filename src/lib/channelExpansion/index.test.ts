import { describe, expect, it } from 'vitest';
import {
  buildChannel,
  buildCodeplug,
  buildContact,
  buildRxGroupList,
  buildRglMember,
  buildTalkGroup,
} from '../../test/builders/codeplug.ts';
import {
  canonicalOpenGd77ChannelWireForCompare,
  channelLocationsMatch,
  channelMergeNameStem,
  channelNameStem,
  channelCallsignTypoMatch,
  channelsAreMultiModeMergeCandidates,
  channelsAreRelaxedImportMergeCandidates,
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
  resolveMultiModeChannelProfiles,
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

  it('expandChannelForExport keeps one row for multi-mode when expandModes is false', () => {
    const ch = buildChannel({
      id: '1',
      name: 'GB3FE',
      mode: 'dmr',
      multiMode: true,
      modeProfiles: [channelModeProfileDefaults('fm'), channelModeProfileDefaults('dmr')],
    });
    const rows = expandChannelForExport(ch, { expandModes: false });
    expect(rows).toHaveLength(1);
    expect(rows[0].wireName).toBe('GB3FE');
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

  it('channelLocationsMatch allows small CPS coordinate drift between FM and DMR rows', () => {
    const a = buildChannel({ id: 'a', name: 'a', location: { lat: 55.997, lon: -3.646 } });
    const b = buildChannel({ id: 'b', name: 'b', location: { lat: 55.996, lon: -3.646 } });
    expect(channelLocationsMatch(a, b)).toBe(true);
  });

  it('channelLocationsMatch rejects clearly different sites', () => {
    const a = buildChannel({ id: 'a', name: 'a', location: { lat: 55.997, lon: -3.646 } });
    const b = buildChannel({ id: 'b', name: 'b', location: { lat: 55.9, lon: -3.646 } });
    expect(channelLocationsMatch(a, b)).toBe(false);
  });

  it('canonicalOpenGd77ChannelWireForCompare normalizes FM/DMR word suffix to -F/-D', () => {
    expect(canonicalOpenGd77ChannelWireForCompare("GB7GX P'pan FM")).toBe('GB7GX-F');
    expect(canonicalOpenGd77ChannelWireForCompare("GB7GX P'pan DMR")).toBe('GB7GX-D');
    expect(canonicalOpenGd77ChannelWireForCompare('GB7DG Ppatrick-F')).toBe('GB7DG-F');
    expect(canonicalOpenGd77ChannelWireForCompare("FIRE Serv Def'd")).toBe("FIRE Serv Def'd");
  });

  it('channelMergeNameStem strips trailing space + mode label', () => {
    expect(channelMergeNameStem('GB7GL-F')).toBe('GB7GL');
    expect(channelMergeNameStem('GB123 Meep FM')).toBe('GB123 Meep');
    expect(channelMergeNameStem('GB123 Meep DMR')).toBe('GB123 Meep');
    expect(channelMergeNameStem("GB7DM M'feith DM")).toBe("GB7DM M'feith");
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

  it('mergeImportChannelsBestEffort merges apostrophe FM/DMR word-suffix pairs', () => {
    const loc = { lat: 55.86, lon: -4.25 };
    const fm = buildChannel({
      id: '1',
      name: "GB7GX P'pan FM",
      mode: 'fm',
      rxFrequency: 439_362_500,
      txFrequency: 430_362_500,
      location: loc,
    });
    const dmr = buildChannel({
      id: '2',
      name: "GB7GX P'pan DMR",
      mode: 'dmr',
      rxFrequency: 439_362_500,
      txFrequency: 430_362_500,
      location: loc,
    });
    const { channels, merged } = mergeImportChannelsBestEffort([fm, dmr]);
    expect(channels).toHaveLength(1);
    expect(channels[0].multiMode).toBe(true);
    expect(merged).toHaveLength(1);
  });

  it('mergeImportChannelsBestEffort merges apostrophe -F/-D suffix pairs', () => {
    const loc = { lat: 54.9, lon: -5.05 };
    const fm = buildChannel({
      id: '1',
      name: "GB7RG Stran'r-F",
      mode: 'fm',
      rxFrequency: 430_937_500,
      txFrequency: 438_537_500,
      location: loc,
    });
    const dmr = buildChannel({
      id: '2',
      name: "GB7RG Stran'r-D",
      mode: 'dmr',
      rxFrequency: 430_937_500,
      txFrequency: 438_537_500,
      location: loc,
    });
    const { channels, merged } = mergeImportChannelsBestEffort([fm, dmr]);
    expect(channels).toHaveLength(1);
    expect(channels[0].multiMode).toBe(true);
    expect(merged).toHaveLength(1);
  });

  it('mergeImportChannelsBestEffort merges when qualifier spellings differ but callsign matches', () => {
    const loc = { lat: 54.9, lon: -5.05 };
    const fm = buildChannel({
      id: '1',
      name: "GB7RG Stran'r-F",
      mode: 'fm',
      rxFrequency: 430_937_500,
      txFrequency: 438_537_500,
      location: loc,
    });
    const dmr = buildChannel({
      id: '2',
      name: "GB7RG Stranr'r-D",
      mode: 'dmr',
      rxFrequency: 430_937_500,
      txFrequency: 438_537_500,
      location: loc,
    });
    const { channels, merged } = mergeImportChannelsBestEffort([fm, dmr]);
    expect(channels).toHaveLength(1);
    expect(channels[0].multiMode).toBe(true);
    expect(merged).toHaveLength(1);
  });

  it('channelsAreMultiModeMergeCandidates accepts matching callsign despite qualifier typo', () => {
    const fm = buildChannel({
      id: '1',
      name: "Stran'r-F",
      callsign: 'GB7RG',
      mode: 'fm',
      rxFrequency: 430_937_500,
      txFrequency: 438_537_500,
      location: { lat: 54.9, lon: -5.05 },
    });
    const dmr = buildChannel({
      id: '2',
      name: "Stranr'r-D",
      callsign: 'GB7RG',
      mode: 'dmr',
      rxFrequency: 430_937_500,
      txFrequency: 438_537_500,
      location: { lat: 54.9, lon: -5.05 },
    });
    expect(
      channelsAreMultiModeMergeCandidates(fm, dmr, {
        nameFuzzyThreshold: 0,
        stripTrailingModeLabel: true,
      }),
    ).toBe(true);
  });

  it('channelCallsignTypoMatch rejects same callsign with unrelated qualifiers', () => {
    const fm = buildChannel({ id: '1', name: 'GB7AC Largs Scot West-F', mode: 'fm' });
    const dmr = buildChannel({ id: '2', name: 'GB7AC Largs Sc-D', mode: 'dmr' });
    expect(channelCallsignTypoMatch(fm, dmr, true)).toBe(false);
  });

  it('channelCallsignTypoMatch accepts qualifier typos when callsign matches', () => {
    const fm = buildChannel({ id: '1', name: "GB7DM M'fieth FM", mode: 'fm' });
    const dmr = buildChannel({ id: '2', name: "GB7DM M'feith DM", mode: 'dmr' });
    expect(channelCallsignTypoMatch(fm, dmr, true)).toBe(true);
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

  it('channelsAreMultiModeMergeCandidates ignores name when ignoreNameMatch is set', () => {
    const loc = { lat: 55.86, lon: -4.25 };
    const a = buildChannel({
      id: '1',
      name: 'GB7AC Largs Scot West',
      mode: 'fm',
      rxFrequency: 430_125_000,
      txFrequency: 430_125_000,
      location: loc,
    });
    const b = buildChannel({
      id: '2',
      name: 'GB7AC Largs Sc',
      mode: 'dmr',
      rxFrequency: 430_125_000,
      txFrequency: 430_125_000,
      location: loc,
    });
    expect(channelsAreMultiModeMergeCandidates(a, b)).toBe(false);
    expect(channelsAreMultiModeMergeCandidates(a, b, { ignoreNameMatch: true })).toBe(true);
  });

  it('channelsAreRelaxedImportMergeCandidates matches frequency and location only', () => {
    const loc = { lat: 55.86, lon: -4.25 };
    const a = buildChannel({
      id: '1',
      name: 'GB7AC Largs Scot West',
      mode: 'dmr',
      rxFrequency: 430_125_000,
      txFrequency: 430_125_000,
      colourCode: 1,
      timeslot: 1,
      location: loc,
    });
    const b = buildChannel({
      id: '2',
      name: 'GB7AC Largs Sc',
      mode: 'dmr',
      rxFrequency: 430_125_000,
      txFrequency: 430_125_000,
      colourCode: 1,
      timeslot: 1,
      location: loc,
    });
    expect(channelsAreRelaxedImportMergeCandidates(a, b)).toBe(true);
    expect(channelsAreRelaxedImportMergeCandidates({ ...b, colourCode: 2 }, a)).toBe(false);
  });

  it('mergeImportChannelsBestEffort pairs FM+DMR with ignoreNameMatch', () => {
    const loc = { lat: 55.86, lon: -4.25 };
    const fm = buildChannel({
      id: '1',
      name: 'GB7AC Largs Scot West-F',
      mode: 'fm',
      rxFrequency: 430_125_000,
      txFrequency: 430_125_000,
      location: loc,
    });
    const dmr = buildChannel({
      id: '2',
      name: 'GB7AC Largs Sc-D',
      mode: 'dmr',
      rxFrequency: 430_125_000,
      txFrequency: 430_125_000,
      location: loc,
    });
    const strict = mergeImportChannelsBestEffort([fm, dmr]);
    expect(strict.channels).toHaveLength(2);
    const relaxed = mergeImportChannelsBestEffort([fm, dmr], { ignoreNameMatch: true });
    expect(relaxed.channels).toHaveLength(1);
    expect(relaxed.channels[0].multiMode).toBe(true);
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

  it('resolveMultiModeChannelProfiles promotes opengd77Extras from import provenance to profiles', () => {
    const fmDefaults = channelModeProfileDefaults('fm');
    const dmrDefaults = channelModeProfileDefaults('dmr');
    const ch = buildChannel({
      id: 'c1',
      name: 'GB7GL',
      multiMode: true,
      mode: 'fm',
      modeProfiles: [
        { ...fmDefaults, mode: 'fm', opengd77Extras: {} },
        { ...dmrDefaults, mode: 'dmr', opengd77Extras: {} },
      ],
      meta: {
        imported: {
          formatId: 'opengd77',
          sourceFile: 'Channels.csv',
          importedAt: '2026-01-01T00:00:00.000Z',
          multiModeProfileWire: [
            { mode: 'fm', opengd77Extras: { 'Scan List': 'Z1' } },
            { mode: 'dmr', opengd77Extras: { 'DMR ID': '123' } },
          ],
        },
      },
    });
    const [resolved] = resolveMultiModeChannelProfiles([ch], [], [], []);
    expect(resolved.modeProfiles.find((p) => p.mode === 'fm')?.opengd77Extras).toEqual({
      'Scan List': 'Z1',
    });
    expect(resolved.modeProfiles.find((p) => p.mode === 'dmr')?.opengd77Extras).toEqual({
      'DMR ID': '123',
    });
    const rows = expandChannelForExport(resolved);
    const fmRow = rows.find((r) => r.mode === 'fm');
    expect(fmRow?.opengd77Extras).toEqual({ 'Scan List': 'Z1' });
  });

  it('expandTalkGroupsForExport emits one row per RGL talk group on DMR channels', () => {
    const tg1 = buildTalkGroup({ id: 'tg1', name: 'Scotland TS1' });
    const tg2 = buildTalkGroup({ id: 'tg2', name: 'Local 9' });
    const rgl = buildRxGroupList({
      id: 'rgl1',
      name: 'GB7GL',
      memberRefs: [
        buildRglMember({ kind: 'talkGroup', id: 'tg1' }),
        buildRglMember({ kind: 'talkGroup', id: 'tg2' }),
      ],
    });
    const ch = buildChannel({
      id: 'c1',
      name: 'GB7GL',
      mode: 'dmr',
      rxGroupListId: 'rgl1',
      contactRef: null,
    });
    const codeplug = buildCodeplug({
      channels: [ch],
      talkGroups: [tg1, tg2],
      rxGroupLists: [rgl],
    });
    const modeRows = expandChannelForExport(ch);
    const rows = expandTalkGroupsForExport(modeRows, {
      expandTalkGroups: true,
      codeplug,
      channelById: new Map([[ch.id, ch]]),
    });
    expect(rows).toHaveLength(2);
    expect(rows.map((r) => r.wireName).sort()).toEqual(['GB7GL Local 9', 'GB7GL Scotland TS1']);
    expect(rows.every((r) => r.rxGroupListId === null)).toBe(true);
    expect(rows.map((r) => r.contactRef?.id).sort()).toEqual(['tg1', 'tg2']);
  });

  it('expandTalkGroupsForExport applies member timeslot to expanded rows', () => {
    const tgTs2 = buildTalkGroup({
      id: 'tg1',
      name: 'Scotland TS2',
    });
    const tgTs1 = buildTalkGroup({
      id: 'tg2',
      name: 'Scot West TS1',
    });
    const rgl = buildRxGroupList({
      id: 'rgl1',
      name: 'GB7GL',
      memberRefs: [
        buildRglMember({ kind: 'talkGroup', id: 'tg1' }, 2),
        buildRglMember({ kind: 'talkGroup', id: 'tg2' }, 1),
      ],
    });
    const ch = buildChannel({
      id: 'c1',
      name: 'Glasgow',
      callsign: 'GB7GL',
      mode: 'dmr',
      rxGroupListId: 'rgl1',
      timeslot: null,
    });
    const codeplug = buildCodeplug({
      channels: [ch],
      talkGroups: [tgTs2, tgTs1],
      rxGroupLists: [rgl],
    });
    const rows = expandTalkGroupsForExport(expandChannelForExport(ch), {
      expandTalkGroups: true,
      codeplug,
      channelById: new Map([[ch.id, ch]]),
    });
    expect(rows).toHaveLength(2);
    const byTg = new Map(rows.map((r) => [r.contactRef?.id, r.timeslot]));
    expect(byTg.get('tg1')).toBe(2);
    expect(byTg.get('tg2')).toBe(1);
  });

  it('expandTalkGroupsForExport falls back to lean channel timeslot when member slot unset', () => {
    const tg = buildTalkGroup({ id: 'tg1', name: 'Scotland TS1' });
    const tgDisabled = buildTalkGroup({
      id: 'tg2',
      name: 'Local 9',
    });
    const rgl = buildRxGroupList({
      id: 'rgl1',
      name: 'GB7GL',
      memberRefs: [
        buildRglMember({ kind: 'talkGroup', id: 'tg1' }),
        buildRglMember({ kind: 'talkGroup', id: 'tg2' }),
      ],
    });
    const ch = buildChannel({
      id: 'c1',
      name: 'GB7GL',
      mode: 'dmr',
      rxGroupListId: 'rgl1',
      timeslot: 2,
    });
    const codeplug = buildCodeplug({
      channels: [ch],
      talkGroups: [tg, tgDisabled],
      rxGroupLists: [rgl],
    });
    const rows = expandTalkGroupsForExport(expandChannelForExport(ch), {
      expandTalkGroups: true,
      codeplug,
      channelById: new Map([[ch.id, ch]]),
    });
    expect(rows.every((r) => r.timeslot === 2)).toBe(true);
  });

  it('expandTalkGroupsForExport applies Contact.timeslotOverride for private RGL members', () => {
    const contact = buildContact({
      id: 'ct1',
      name: 'Parrot',
      timeslotOverride: 'Slot 1',
    });
    const rgl = buildRxGroupList({
      id: 'rgl1',
      name: 'List',
      memberRefs: [buildRglMember({ kind: 'contact', id: 'ct1' })],
    });
    const ch = buildChannel({
      id: 'c1',
      name: 'GB7GL',
      mode: 'dmr',
      rxGroupListId: 'rgl1',
      timeslot: 2,
    });
    const codeplug = buildCodeplug({
      channels: [ch],
      contacts: [contact],
      rxGroupLists: [rgl],
    });
    const rows = expandTalkGroupsForExport(expandChannelForExport(ch), {
      expandTalkGroups: true,
      codeplug,
      channelById: new Map([[ch.id, ch]]),
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].timeslot).toBe(1);
  });

  it('expandTalkGroupsForExport skips analog rows', () => {
    const tg1 = buildTalkGroup({ id: 'tg1', name: 'Scotland TS1' });
    const rgl = buildRxGroupList({
      id: 'rgl1',
      name: 'List',
      memberRefs: [buildRglMember({ kind: 'talkGroup', id: 'tg1' })],
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
        buildRglMember({ kind: 'talkGroup', id: 'tg1' }),
        buildRglMember({ kind: 'contact', id: 'ct1' }),
      ],
    });
    const codeplug = buildCodeplug({
      talkGroups: [tg1],
      contacts: [{ id: 'ct1', name: 'Private', identifier: '', signalingMode: 'dmr' as const }],
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
      channelById: new Map([[ch.id, ch]]),
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
        buildRglMember({ kind: 'talkGroup', id: 'tg1' }),
        buildRglMember({ kind: 'talkGroup', id: 'tg2' }),
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
        buildRglMember({ kind: 'talkGroup', id: 'tg1' }),
        buildRglMember({ kind: 'talkGroup', id: 'tg2' }),
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

  it('shortens long export names when shortenNames is enabled', () => {
    const ch = buildChannel({
      id: 'c1',
      name: 'Largs Scotland West TS1',
      callsign: 'GB7AC',
      exportNameMode: 'callsign_name',
      mode: 'dmr',
    });
    const rows = expandChannelForExport(ch, { maxNameLength: 16, shortenNames: true });
    expect(rows).toHaveLength(1);
    expect(rows[0].wireName.length).toBeLessThanOrEqual(16);
    expect(rows[0].wireName).toMatch(/^AC /);
  });

  it('zone member names match shortened channel export names', () => {
    const ch = buildChannel({
      id: 'c1',
      name: 'Largs Scotland West TS1',
      callsign: 'GB7AC',
      exportNameMode: 'callsign_name',
      mode: 'dmr',
    });
    const zone = buildZone({ id: 'z1', name: 'Zone', memberChannelIds: ['c1'] });
    const expandOpts = { maxNameLength: 16, shortenNames: true };
    const channelRows = expandAllChannelsForExport([ch], expandOpts);
    const { names } = expandZoneMemberWireNames(zone, [ch], expandOpts);
    expect(names).toEqual(channelRows.map((r) => r.wireName));
  });

  it('uses channel abbreviation for name qualifier when enabled', () => {
    const ch = buildChannel({
      id: 'c1',
      name: 'Largs Scotland West',
      abbreviation: 'Largs',
      callsign: 'GB7AC',
      exportNameMode: 'callsign_name',
      mode: 'dmr',
    });
    const rows = expandChannelForExport(ch, {
      useChannelAbbreviation: true,
      shortenNames: false,
      maxNameLength: 64,
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].wireName).toBe('GB7AC Largs');
  });

  it('ignores channel abbreviation when useChannelAbbreviation is false', () => {
    const ch = buildChannel({
      id: 'c1',
      name: 'Largs Scotland West',
      abbreviation: 'Largs',
      callsign: 'GB7AC',
      exportNameMode: 'callsign_name',
      mode: 'dmr',
    });
    const rows = expandChannelForExport(ch, {
      useChannelAbbreviation: false,
      shortenNames: false,
      maxNameLength: 64,
    });
    expect(rows[0].wireName).toBe('GB7AC Largs Scotland West');
  });

  it('appends multi-mode suffix after channel abbreviation base', () => {
    const ch = buildChannel({
      id: 'c1',
      name: 'Glasgow Scotland',
      abbreviation: 'Glas',
      callsign: 'GB7GL',
      exportNameMode: 'callsign_name',
      mode: 'fm',
      multiMode: true,
      modeProfiles: [
        { ...channelModeProfileDefaults('fm'), rxTone: '88.5' },
        { ...channelModeProfileDefaults('dmr'), colourCode: 1 },
      ],
    });
    const rows = expandChannelForExport(ch, {
      useChannelAbbreviation: true,
      shortenNames: false,
      maxNameLength: 64,
    });
    expect(rows.map((r) => r.wireName).sort()).toEqual(['GB7GL Glas-D', 'GB7GL Glas-F']);
  });

  it('stacks channel and talk group abbreviations on multi-TG fan-out', () => {
    const tg1 = buildTalkGroup({
      id: 'tg1',
      name: 'Scotland TS1',
      abbreviation: 'Sco TS1',
    });
    const rgl = buildRxGroupList({
      id: 'rgl1',
      name: 'GB7GL',
      memberRefs: [buildRglMember({ kind: 'talkGroup', id: 'tg1' })],
    });
    const ch = buildChannel({
      id: 'c1',
      name: 'Glasgow Scotland',
      abbreviation: 'Glas',
      callsign: 'GB7GL',
      exportNameMode: 'callsign_name',
      mode: 'dmr',
      rxGroupListId: 'rgl1',
    });
    const codeplug = buildCodeplug({ channels: [ch], talkGroups: [tg1], rxGroupLists: [rgl] });
    const rows = expandTalkGroupsForExport(
      expandChannelForExport(ch, {
        useChannelAbbreviation: true,
        shortenNames: true,
        maxNameLength: 16,
      }),
      {
        expandTalkGroups: true,
        codeplug,
        channelById: new Map([[ch.id, ch]]),
        shortenNames: true,
        maxNameLength: 16,
        useChannelAbbreviation: true,
        useTalkGroupAbbreviation: true,
      },
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].wireName.length).toBeLessThanOrEqual(16);
    expect(rows[0].wireName).not.toContain('Glasgow Scotland');
    expect(rows[0].wireName).not.toContain('Scotland TS1');
  });

  it('preserves TG identity when shortening multi-TG fan-out (GB7GL Glasgow)', () => {
    const tgScotland = buildTalkGroup({
      id: 'tg1',
      name: 'Scotland TS2',
      abbreviation: 'Sco TS2',
      number: '950',
    });
    const tgWest = buildTalkGroup({
      id: 'tg2',
      name: 'Scot West TS1',
      abbreviation: 'Sco W TS1',
      number: '2355',
    });
    const tgEast = buildTalkGroup({
      id: 'tg3',
      name: 'Scot East TS1',
      abbreviation: 'Sco E TS1',
      number: '2356',
    });
    const tgNorth = buildTalkGroup({
      id: 'tg4',
      name: 'Scot North TS1',
      abbreviation: 'Sco N TS1',
      number: '2357',
    });
    const rgl = buildRxGroupList({
      id: 'rgl1',
      name: 'GB7GL',
      memberRefs: [
        buildRglMember({ kind: 'talkGroup', id: 'tg1' }, 2),
        buildRglMember({ kind: 'talkGroup', id: 'tg2' }, 1),
        buildRglMember({ kind: 'talkGroup', id: 'tg3' }, 1),
        buildRglMember({ kind: 'talkGroup', id: 'tg4' }, 1),
      ],
    });
    const ch = buildChannel({
      id: 'c1',
      name: 'Glasgow',
      abbreviation: 'Glas',
      callsign: 'GB7GL',
      exportNameMode: 'callsign_name',
      mode: 'dmr',
      rxGroupListId: 'rgl1',
    });
    const codeplug = buildCodeplug({
      channels: [ch],
      talkGroups: [tgScotland, tgWest, tgEast, tgNorth],
      rxGroupLists: [rgl],
    });
    const expandOpts = {
      expandTalkGroups: true as const,
      codeplug,
      channelById: new Map([[ch.id, ch]]),
      shortenNames: true,
      maxNameLength: 16,
      useChannelAbbreviation: true,
      useTalkGroupAbbreviation: true,
    };
    const rows = expandTalkGroupsForExport(
      expandChannelForExport(ch, {
        useChannelAbbreviation: true,
        shortenNames: true,
        maxNameLength: 16,
      }),
      expandOpts,
    );
    expect(rows).toHaveLength(4);
    const names = rows.map((r) => r.wireName);
    expect(new Set(names).size).toBe(4);
    for (const name of names) {
      expect(name.length).toBeLessThanOrEqual(16);
      expect(name).not.toMatch(/ 2$| 3$| 4$/);
    }
    expect(names.some((n) => n.includes('Sco TS2') || n.includes('950'))).toBe(true);
    expect(names.some((n) => n.includes('Sco W') || n.includes('2355'))).toBe(true);

    const zone = buildZone({ id: 'z1', name: 'Zone', memberChannelIds: ['c1'] });
    const { names: zoneNames } = expandZoneMemberWireNames(zone, [ch], expandOpts);
    expect(zoneNames.sort()).toEqual(names.sort());
  });

  it('expandTalkGroupsForExport shortens TG member suffix with abbreviation', () => {
    const tg1 = buildTalkGroup({
      id: 'tg1',
      name: 'Scotland TS1',
      abbreviation: 'Sco TS1',
    });
    const rgl = buildRxGroupList({
      id: 'rgl1',
      name: 'GB7GL',
      memberRefs: [buildRglMember({ kind: 'talkGroup', id: 'tg1' })],
    });
    const ch = buildChannel({
      id: 'c1',
      name: 'Glasgow',
      callsign: 'GB7GL',
      exportNameMode: 'callsign_name',
      mode: 'dmr',
      rxGroupListId: 'rgl1',
    });
    const codeplug = buildCodeplug({ channels: [ch], talkGroups: [tg1], rxGroupLists: [rgl] });
    const rows = expandTalkGroupsForExport(expandChannelForExport(ch), {
      expandTalkGroups: true,
      codeplug,
      channelById: new Map([[ch.id, ch]]),
      maxNameLength: 16,
      shortenNames: true,
      useTalkGroupAbbreviation: true,
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].wireName.length).toBeLessThanOrEqual(16);
    expect(rows[0].wireName).not.toContain('Scotland TS1');
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
