import { describe, expect, it } from 'vitest';
import {
  buildChannel,
  buildCodeplug,
  buildTalkGroup,
  buildZone,
} from '../test/builders/codeplug.ts';
import {
  applyChannelMerges,
  findChannelMergeCandidates,
  nameSimilaritySliderToThreshold,
  previewChannelMerges,
  type ChannelMergeSelection,
} from './channelMergeCandidates.ts';

describe('channelMergeCandidates', () => {
  it('findChannelMergeCandidates groups GB7GL-F / GB7GL-D style split rows', () => {
    const fm = buildChannel({
      id: 'fm',
      name: 'GB7GL-F',
      mode: 'fm',
      rxFrequency: 430_000_000,
      txFrequency: 430_000_000,
    });
    const dmr = buildChannel({
      id: 'dmr',
      name: 'GB7GL-D',
      mode: 'dmr',
      rxFrequency: 430_000_000,
      txFrequency: 430_000_000,
      colourCode: 1,
    });
    const codeplug = buildCodeplug({ channels: [fm, dmr] });

    const groups = findChannelMergeCandidates(codeplug);
    expect(groups).toHaveLength(1);
    expect(groups[0].mergeKind).toBe('multiMode');
    expect(groups[0].sourceChannelIds.sort()).toEqual(['dmr', 'fm']);
    expect(groups[0].suggestedName).toBe('GB7GL');
  });

  it('findChannelMergeCandidates strips trailing mode words from suggested name', () => {
    const fm = buildChannel({
      id: 'fm',
      name: 'GB123 Meep FM',
      mode: 'fm',
      rxFrequency: 430_000_000,
      txFrequency: 430_000_000,
    });
    const dmr = buildChannel({
      id: 'dmr',
      name: 'GB123 Meep DMR',
      mode: 'dmr',
      rxFrequency: 430_000_000,
      txFrequency: 430_000_000,
    });
    const groups = findChannelMergeCandidates(buildCodeplug({ channels: [fm, dmr] }));
    expect(groups).toHaveLength(1);
    expect(groups[0].suggestedName).toBe('GB123 Meep');
  });

  it('findChannelMergeCandidates skips existing multi-mode channels', () => {
    const multi = buildChannel({
      id: 'mm',
      name: 'GB7GL',
      mode: 'fm',
      multiMode: true,
      modeProfiles: [
        {
          mode: 'fm',
          bandwidthKHz: null,
          colourCode: null,
          timeslot: null,
          dmrId: null,
          rxTone: 'none',
          txTone: 'none',
          squelch: null,
          contactRef: null,
          rxGroupListId: null,
        },
        {
          mode: 'dmr',
          bandwidthKHz: null,
          colourCode: 1,
          timeslot: null,
          dmrId: null,
          rxTone: 'none',
          txTone: 'none',
          squelch: null,
          contactRef: null,
          rxGroupListId: null,
        },
      ],
      rxFrequency: 430_000_000,
      txFrequency: 430_000_000,
    });
    const codeplug = buildCodeplug({ channels: [multi] });
    expect(findChannelMergeCandidates(codeplug)).toHaveLength(0);
  });

  it('findChannelMergeCandidates marks same-mode groups ambiguous', () => {
    const a = buildChannel({
      id: 'a',
      name: 'GB7GL-F',
      mode: 'fm',
      rxFrequency: 430_000_000,
      txFrequency: 430_000_000,
    });
    const b = buildChannel({
      id: 'b',
      name: 'GB7GL-D',
      mode: 'fm',
      rxFrequency: 430_000_000,
      txFrequency: 430_000_000,
    });
    const groups = findChannelMergeCandidates(buildCodeplug({ channels: [a, b] }));
    expect(groups).toHaveLength(0);
  });

  it('findChannelMergeCandidates pairs FM+DMR when CPS coords differ slightly (GB3OH L\'gow)', () => {
    const fm = buildChannel({
      id: 'fm',
      name: "L'gow FM",
      callsign: 'GB3OH',
      mode: 'fm',
      rxFrequency: 430_950_000,
      txFrequency: 438_550_000,
      location: { lat: 55.997, lon: -3.646 },
    });
    const dmr = buildChannel({
      id: 'dmr',
      name: "L'gow DMR",
      callsign: 'GB3OH',
      mode: 'dmr',
      rxFrequency: 430_950_000,
      txFrequency: 438_550_000,
      location: { lat: 55.996, lon: -3.646 },
    });
    const groups = findChannelMergeCandidates(buildCodeplug({ channels: [fm, dmr] }));
    expect(groups).toHaveLength(1);
    expect(groups[0].mergeKind).toBe('multiMode');
    expect(groups[0].suggestedName).toBe("L'gow");
  });

  it('findChannelMergeCandidates pairs FM+DMR when only RX must match', () => {
    const dmr = buildChannel({
      id: 'dmr',
      name: 'FIRE Repeaters/P',
      mode: 'dmr',
      rxFrequency: 462_587_500,
      txFrequency: 457_037_500,
    });
    const fm = buildChannel({
      id: 'fm',
      name: 'FIRE Repeaters-F',
      mode: 'fm',
      rxFrequency: 462_587_500,
      txFrequency: 462_587_500,
    });
    const strict = findChannelMergeCandidates(buildCodeplug({ channels: [dmr, fm] }));
    expect(strict).toHaveLength(0);

    const rxOnly = findChannelMergeCandidates(buildCodeplug({ channels: [dmr, fm] }), {
      nameFuzzyThreshold: 0.15,
      matchRxFrequency: true,
      matchTxFrequency: false,
    });
    expect(rxOnly).toHaveLength(1);
    expect(rxOnly[0].mergeKind).toBe('multiMode');
  });

  it('nameSimilaritySliderToThreshold maps slider ends', () => {
    expect(nameSimilaritySliderToThreshold(0)).toBe(0);
    expect(nameSimilaritySliderToThreshold(100)).toBe(0.35);
  });

  it('previewChannelMerges applies operator-edited result frequencies', () => {
    const fm = buildChannel({
      id: 'fm',
      name: 'FIRE Repeaters-F',
      mode: 'fm',
      rxFrequency: 462_587_500,
      txFrequency: 462_587_500,
    });
    const dmr = buildChannel({
      id: 'dmr',
      name: 'FIRE Repeaters/P',
      mode: 'dmr',
      rxFrequency: 462_587_500,
      txFrequency: 457_037_500,
    });
    const codeplug = buildCodeplug({ channels: [fm, dmr] });
    const previews = previewChannelMerges(codeplug, [
      {
        groupId: 'dmr|fm',
        sourceChannelIds: ['fm', 'dmr'],
        resultName: 'FIRE Repeaters',
        enabled: true,
        rxFrequency: 462_587_500,
        txFrequency: 457_037_500,
      },
    ]);
    expect(previews[0].mergedChannel.rxFrequency).toBe(462_587_500);
    expect(previews[0].mergedChannel.txFrequency).toBe(457_037_500);
  });

  it('previewChannelMerges builds multi-mode survivor and zone impacts', () => {
    const fm = buildChannel({
      id: 'fm',
      name: 'GB7GL-F',
      mode: 'fm',
      rxFrequency: 430_000_000,
      txFrequency: 430_000_000,
    });
    const dmr = buildChannel({
      id: 'dmr',
      name: 'GB7GL-D',
      mode: 'dmr',
      rxFrequency: 430_000_000,
      txFrequency: 430_000_000,
    });
    const zone = buildZone({ id: 'z1', name: 'Local', memberChannelIds: ['fm', 'dmr'] });
    const codeplug = buildCodeplug({ channels: [fm, dmr], zones: [zone] });

    const selections: ChannelMergeSelection[] = [
      {
        groupId: 'dmr|fm',
        sourceChannelIds: ['fm', 'dmr'],
        resultName: 'GB7GL',
        enabled: true,
      },
    ];
    const previews = previewChannelMerges(codeplug, selections);
    expect(previews).toHaveLength(1);
    expect(previews[0].mergedChannel.multiMode).toBe(true);
    expect(previews[0].mergedChannel.name).toBe('GB7GL');
    expect(previews[0].zoneImpacts).toHaveLength(1);
    expect(previews[0].zoneImpacts[0].absorbedMemberIds).toContain('dmr');
  });

  it('applyChannelMerges merges channels and rewires zone member ids', () => {
    const fm = buildChannel({
      id: 'fm',
      name: 'GB7GL-F',
      mode: 'fm',
      rxFrequency: 430_000_000,
      txFrequency: 430_000_000,
    });
    const dmr = buildChannel({
      id: 'dmr',
      name: 'GB7GL-D',
      mode: 'dmr',
      rxFrequency: 430_000_000,
      txFrequency: 430_000_000,
    });
    const zone = buildZone({ id: 'z1', name: 'Local', memberChannelIds: ['fm', 'dmr'] });
    const codeplug = buildCodeplug({ channels: [fm, dmr], zones: [zone] });
    const candidates = findChannelMergeCandidates(codeplug);

    const { codeplug: merged, report } = applyChannelMerges(
      codeplug,
      [
        {
          groupId: candidates[0].id,
          sourceChannelIds: candidates[0].sourceChannelIds,
          resultName: 'GB7GL',
          enabled: true,
        },
      ],
      candidates,
    );

    expect(report.mergedCount).toBe(1);
    expect(merged.channels).toHaveLength(1);
    expect(merged.channels[0].multiMode).toBe(true);
    expect(merged.zones[0].memberChannelIds).toEqual(['fm']);
  });

  it('findChannelMergeCandidates groups flat per-TG DMR rows as multiTalkgroup', () => {
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
    const codeplug = buildCodeplug({
      channels: [ch1, ch2],
      talkGroups: [tg1, tg2],
    });

    const groups = findChannelMergeCandidates(codeplug);
    expect(groups).toHaveLength(1);
    expect(groups[0].mergeKind).toBe('multiTalkgroup');
    expect(groups[0].suggestedName).toBe('GB7GL');
  });

  it('applyChannelMerges merges multi-talkgroup group into one channel + RGL', () => {
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
    const zone = buildZone({ id: 'z1', name: 'Local', memberChannelIds: ['1', '2'] });
    const codeplug = buildCodeplug({
      channels: [ch1, ch2],
      talkGroups: [tg1, tg2],
      zones: [zone],
    });
    const candidates = findChannelMergeCandidates(codeplug);

    const { codeplug: merged, report } = applyChannelMerges(
      codeplug,
      [
        {
          groupId: candidates[0].id,
          sourceChannelIds: candidates[0].sourceChannelIds,
          resultName: 'GB7GL',
          enabled: true,
        },
      ],
      candidates,
    );

    expect(report.mergedCount).toBe(1);
    expect(merged.channels).toHaveLength(1);
    expect(merged.channels[0].name).toBe('GB7GL');
    expect(merged.channels[0].contactRef).toBeNull();
    expect(merged.channels[0].rxGroupListId).toBeTruthy();
    expect(merged.rxGroupLists).toHaveLength(1);
    expect(merged.rxGroupLists[0].memberRefs).toHaveLength(2);
    expect(merged.zones[0].memberChannelIds).toEqual(['1']);
  });
});
