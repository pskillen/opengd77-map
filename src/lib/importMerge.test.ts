import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { resetIdGenerator, setIdGenerator } from '../models/codeplug.ts';
import type { Channel } from '../models/codeplug.ts';
import { buildChannel } from '../test/builders/index.ts';
import type { ImportResult } from './import/types.ts';
import { applyImportToCodeplug, emptyEntityStats, previewImportMerge } from './importMerge.ts';

function channelsResult(channels: Channel[]): ImportResult {
  return { channels, recognised: ['Channels.csv'], skipped: [], errors: [] };
}

describe('importMerge', () => {
  beforeEach(() => {
    let n = 0;
    setIdGenerator(() => `gen-${++n}`);
  });

  afterEach(() => {
    resetIdGenerator();
  });

  describe('merge mode — channels', () => {
    it('is idempotent when re-importing identical channels', () => {
      const existing = buildChannel({ id: 'ch-1', name: 'A' });
      const cp = applyImportToCodeplug(
        { ...emptyCodeplug(), channels: [existing] },
        channelsResult([buildChannel({ id: 'new-id', name: 'A' })]),
        'merge',
      ).codeplug;

      const second = applyImportToCodeplug(
        cp,
        channelsResult([buildChannel({ id: 'another-id', name: 'A' })]),
        'merge',
      );

      expect(second.report.channels).toEqual({ added: 0, updated: 0, unchanged: 1, removed: 0 });
      expect(second.codeplug.channels[0].id).toBe('ch-1');
      expect(second.report.hasChanges).toBe(false);
    });

    it('applies delta when one field changes', () => {
      const existing = buildChannel({ id: 'ch-1', name: 'A', rxFrequency: 430_000_000 });
      const cp = {
        ...emptyCodeplug(),
        channels: [existing, buildChannel({ id: 'ch-2', name: 'B' })],
      };

      const { codeplug, report } = applyImportToCodeplug(
        cp,
        channelsResult([
          buildChannel({ id: 'x', name: 'A', rxFrequency: 431_000_000 }),
          buildChannel({ id: 'y', name: 'B' }),
        ]),
        'merge',
      );

      expect(report.channels).toEqual({ added: 0, updated: 1, unchanged: 1, removed: 0 });
      expect(codeplug.channels.find((c) => c.name === 'A')?.rxFrequency).toBe(431_000_000);
      expect(codeplug.channels.find((c) => c.name === 'A')?.id).toBe('ch-1');
    });

    it('appends new names and leaves existing unchanged', () => {
      const cp = { ...emptyCodeplug(), channels: [buildChannel({ id: 'ch-1', name: 'A' })] };

      const { codeplug, report } = applyImportToCodeplug(
        cp,
        channelsResult([buildChannel({ id: 'new', name: 'B' })]),
        'merge',
      );

      expect(report.channels.added).toBe(1);
      expect(report.channels.unchanged).toBe(0);
      expect(codeplug.channels).toHaveLength(2);
      expect(codeplug.channels.find((c) => c.name === 'A')?.id).toBe('ch-1');
    });

    it('preserves hideFromMap on merge update', () => {
      const existing = buildChannel({
        id: 'ch-1',
        name: 'A',
        hideFromMap: true,
        rxFrequency: 430_000_000,
      });
      const cp = { ...emptyCodeplug(), channels: [existing] };

      const { codeplug } = applyImportToCodeplug(
        cp,
        channelsResult([buildChannel({ id: 'x', name: 'A', rxFrequency: 431_000_000 })]),
        'merge',
      );

      expect(codeplug.channels[0].hideFromMap).toBe(true);
    });

    it('last duplicate name in batch wins', () => {
      const cp = emptyCodeplug();

      const { codeplug, report } = applyImportToCodeplug(
        cp,
        channelsResult([
          buildChannel({ id: 'a', name: 'Dup', rxFrequency: 100_000_000 }),
          buildChannel({ id: 'b', name: 'Dup', rxFrequency: 200_000_000 }),
        ]),
        'merge',
      );

      expect(report.channels.added).toBe(1);
      expect(codeplug.channels[0].rxFrequency).toBe(200_000_000);
    });
  });

  describe('merge mode — zones', () => {
    it('preserves zone id on upsert and resolves members', () => {
      const cp = applyImportToCodeplug(
        emptyCodeplug(),
        channelsResult([
          buildChannel({ id: 'ch-1', name: 'A' }),
          buildChannel({ id: 'ch-2', name: 'B' }),
        ]),
        'merge',
      ).codeplug;

      const withZone = applyImportToCodeplug(
        cp,
        {
          zones: [{ name: 'North', memberNames: ['A', 'B'] }],
          recognised: ['Zones.csv'],
          skipped: [],
          errors: [],
        },
        'merge',
      );

      const zoneId = withZone.codeplug.zones[0].id;

      const reimport = applyImportToCodeplug(
        withZone.codeplug,
        {
          zones: [{ name: 'North', memberNames: ['A', 'B'] }],
          recognised: ['Zones.csv'],
          skipped: [],
          errors: [],
        },
        'merge',
      );

      expect(reimport.report.zones).toEqual({ added: 0, updated: 0, unchanged: 1, removed: 0 });
      expect(reimport.codeplug.zones[0].id).toBe(zoneId);
      expect(reimport.codeplug.zones[0].memberChannelIds).toEqual(['ch-1', 'ch-2']);
    });
  });

  describe('overwrite mode', () => {
    it('replaces channels and reports removed count', () => {
      const cp = {
        ...emptyCodeplug(),
        channels: [
          buildChannel({ id: 'ch-1', name: 'A' }),
          buildChannel({ id: 'ch-2', name: 'B' }),
          buildChannel({ id: 'ch-3', name: 'C' }),
        ],
      };

      const { codeplug, report } = applyImportToCodeplug(
        cp,
        channelsResult([buildChannel({ id: 'new-1', name: 'A' })]),
        'overwrite',
      );

      expect(report.channels).toEqual({ added: 1, updated: 0, unchanged: 0, removed: 3 });
      expect(codeplug.channels).toHaveLength(1);
      expect(codeplug.channels[0].name).toBe('A');
    });

    it('leaves other entity types when only zones overwritten', () => {
      const cp = applyImportToCodeplug(
        emptyCodeplug(),
        channelsResult([buildChannel({ id: 'ch-1', name: 'A' })]),
        'merge',
      ).codeplug;

      const populated = {
        ...cp,
        zones: [{ id: 'z-old', name: 'Old', sourceMemberNames: ['A'], memberChannelIds: ['ch-1'] }],
        contacts: [{ id: 'c1', name: 'Local', number: '9', timeslotOverride: '' }],
      };

      const { codeplug, report } = applyImportToCodeplug(
        populated,
        {
          zones: [{ name: 'NewZone', memberNames: ['A'] }],
          recognised: ['Zones.csv'],
          skipped: [],
          errors: [],
        },
        'overwrite',
      );

      expect(report.zones.removed).toBe(1);
      expect(codeplug.channels).toHaveLength(1);
      expect(codeplug.contacts).toHaveLength(1);
      expect(codeplug.zones[0].name).toBe('NewZone');
    });
  });

  describe('preview matches apply', () => {
    it('returns same stats as apply', () => {
      const cp = { ...emptyCodeplug(), channels: [buildChannel({ id: 'ch-1', name: 'A' })] };
      const result = channelsResult([buildChannel({ id: 'x', name: 'B' })]);

      const preview = previewImportMerge(cp, result, 'merge');
      const applied = applyImportToCodeplug(cp, result, 'merge');

      expect(preview).toEqual(applied.report);
    });
  });

  describe('unresolved zone members', () => {
    it('surfaces missing channel names', () => {
      const { report } = applyImportToCodeplug(
        emptyCodeplug(),
        {
          zones: [{ name: 'North', memberNames: ['Missing'] }],
          recognised: ['Zones.csv'],
          skipped: [],
          errors: [],
        },
        'merge',
      );

      expect(report.unresolvedZoneMembers).toEqual([
        { zoneName: 'North', memberNames: ['Missing'] },
      ]);
    });
  });

  it('exports emptyEntityStats helper', () => {
    expect(emptyEntityStats()).toEqual({ added: 0, updated: 0, unchanged: 0, removed: 0 });
  });
});

function emptyCodeplug() {
  return {
    channels: [],
    zones: [],
    talkGroups: [],
    rxGroupLists: [],
    contacts: [],
    meta: { schemaVersion: 3, importedAt: null, sourceFiles: [] },
  };
}
