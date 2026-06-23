import { describe, expect, it } from 'vitest';
import { buildChannel, buildCodeplug, buildZone } from '../test/builders/codeplug.ts';
import {
  applyChannelMerges,
  findChannelMergeCandidates,
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
});
