import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { applyImportToCodeplug } from '../../lib/importMerge.ts';
import { emptyCodeplug, resetIdGenerator, setIdGenerator } from '../../models/codeplug.ts';
import { newProject } from '../../models/codeplugProject.ts';
import {
  channelsOnlyBundle,
  filesFromBundle,
  filesFromBundleNames,
  minimalBundle,
  modifiedChannelBundle,
  reducedChannelsBundle,
  unresolvedZoneBundle,
  zonesOnlyBundle,
} from '../opengd77/loadFixture.ts';
import {
  channelIds,
  runActiveImportWorkflow,
  runNewProjectImportWorkflow,
  runStoreActiveImport,
} from './importWorkflow.ts';

function assertPreviewMatchesApply(
  preview: ReturnType<typeof applyImportToCodeplug>['report'],
  apply: ReturnType<typeof applyImportToCodeplug>['report'],
): void {
  expect(preview.mode).toBe(apply.mode);
  expect(preview.channels).toEqual(apply.channels);
  expect(preview.zones).toEqual(apply.zones);
  expect(preview.contacts).toEqual(apply.contacts);
  expect(preview.talkGroups).toEqual(apply.talkGroups);
  expect(preview.rxGroupLists).toEqual(apply.rxGroupLists);
  expect(preview.hasChanges).toBe(apply.hasChanges);
}

describe('active import system workflow', () => {
  beforeEach(() => {
    let n = 0;
    setIdGenerator(() => `sys-${++n}`);
    localStorage.clear();
  });

  afterEach(() => {
    resetIdGenerator();
    localStorage.clear();
  });

  describe('incremental build', () => {
    it('imports channels then zones then contacts then TG lists', async () => {
      let cp = emptyCodeplug();

      const step1 = await runActiveImportWorkflow({
        codeplug: cp,
        files: filesFromBundle(channelsOnlyBundle),
        mode: 'merge',
      });
      expect(step1.applyReport.channels.added).toBe(2);
      cp = step1.codeplugAfter;

      const step2 = await runActiveImportWorkflow({
        codeplug: cp,
        files: filesFromBundle(zonesOnlyBundle),
        mode: 'merge',
      });
      expect(step2.applyReport.zones.added).toBe(1);
      expect(step2.codeplugAfter.zones[0].memberChannelIds).toHaveLength(2);
      cp = step2.codeplugAfter;

      const step3 = await runActiveImportWorkflow({
        codeplug: cp,
        files: filesFromBundleNames(minimalBundle, ['Contacts.csv']),
        mode: 'merge',
      });
      expect(step3.applyReport.contacts.added).toBe(1);
      expect(step3.applyReport.talkGroups.added).toBe(2);
      cp = step3.codeplugAfter;

      const step4 = await runActiveImportWorkflow({
        codeplug: cp,
        files: filesFromBundleNames(minimalBundle, ['TG_Lists.csv']),
        mode: 'merge',
      });
      expect(step4.applyReport.rxGroupLists.added).toBe(1);
      assertPreviewMatchesApply(step4.previewReport, step4.applyReport);
    });
  });

  describe('idempotent re-import', () => {
    it('second full bundle import is unchanged', async () => {
      const first = await runActiveImportWorkflow({
        codeplug: emptyCodeplug(),
        files: filesFromBundle(minimalBundle),
        mode: 'merge',
      });
      const idsBefore = channelIds(first.codeplugAfter);

      const second = await runActiveImportWorkflow({
        codeplug: first.codeplugAfter,
        files: filesFromBundle(minimalBundle),
        mode: 'merge',
      });

      expect(second.applyReport.channels).toEqual({
        added: 0,
        updated: 0,
        unchanged: 2,
        removed: 0,
      });
      expect(channelIds(second.codeplugAfter)).toEqual(idsBefore);
      expect(second.applyReport.hasChanges).toBe(false);
    });
  });

  describe('delta update', () => {
    it('updates one channel when frequency changes', async () => {
      const base = await runActiveImportWorkflow({
        codeplug: emptyCodeplug(),
        files: filesFromBundle(minimalBundle),
        mode: 'merge',
      });

      const delta = await runActiveImportWorkflow({
        codeplug: base.codeplugAfter,
        files: filesFromBundle(modifiedChannelBundle),
        mode: 'merge',
      });

      expect(delta.applyReport.channels.updated).toBe(1);
      expect(delta.applyReport.channels.unchanged).toBe(1);
      expect(delta.codeplugAfter.channels.find((c) => c.name === 'GB3DA DMR')?.rxFrequency).toBe(
        '431.0',
      );
    });
  });

  describe('partial file import', () => {
    it('zones-only leaves channels untouched', async () => {
      const base = await runActiveImportWorkflow({
        codeplug: emptyCodeplug(),
        files: filesFromBundle(channelsOnlyBundle),
        mode: 'merge',
      });

      const zones = await runActiveImportWorkflow({
        codeplug: base.codeplugAfter,
        files: filesFromBundle(zonesOnlyBundle),
        mode: 'merge',
      });

      expect(zones.codeplugAfter.channels).toHaveLength(2);
      expect(zones.applyReport.zones.added).toBe(1);
    });
  });

  describe('overwrite channels', () => {
    it('removes extra channels', async () => {
      const base = await runActiveImportWorkflow({
        codeplug: emptyCodeplug(),
        files: filesFromBundle(minimalBundle),
        mode: 'merge',
      });

      const overwrite = await runActiveImportWorkflow({
        codeplug: base.codeplugAfter,
        files: filesFromBundle(reducedChannelsBundle),
        mode: 'overwrite',
      });

      expect(overwrite.applyReport.channels.removed).toBe(2);
      expect(overwrite.codeplugAfter.channels).toHaveLength(1);
    });
  });

  describe('overwrite zones only', () => {
    it('leaves channels and contacts unchanged', async () => {
      const base = await runActiveImportWorkflow({
        codeplug: emptyCodeplug(),
        files: filesFromBundle(minimalBundle),
        mode: 'merge',
      });

      const overwrite = await runActiveImportWorkflow({
        codeplug: base.codeplugAfter,
        files: filesFromBundle(zonesOnlyBundle),
        mode: 'overwrite',
      });

      expect(overwrite.codeplugAfter.channels).toHaveLength(2);
      expect(overwrite.codeplugAfter.contacts).toHaveLength(1);
      expect(overwrite.applyReport.zones.removed).toBe(1);
      expect(overwrite.codeplugAfter.zones).toHaveLength(1);
    });
  });

  describe('multi-project isolation', () => {
    it('applies import to active project only', async () => {
      const first = newProject('First');
      const second = newProject('Second');
      const parse = await runNewProjectImportWorkflow({
        files: filesFromBundle(zonesOnlyBundle),
      });

      const state = runStoreActiveImport({
        activeProjectId: second.id,
        projects: [first, second],
        result: parse.parseResult,
        mode: 'merge',
      });

      const active = state.projects.find((p) => p.id === second.id);
      const inactive = state.projects.find((p) => p.id === first.id);
      expect(active?.codeplug.zones).toHaveLength(1);
      expect(inactive?.codeplug.zones).toHaveLength(0);
    });
  });

  describe('persistence round-trip', () => {
    it('reloads applied codeplug from localStorage', async () => {
      const result = await runActiveImportWorkflow({
        codeplug: emptyCodeplug(),
        files: filesFromBundle(minimalBundle),
        mode: 'merge',
        steps: ['parse', 'preview', 'apply', 'persist'],
      });

      expect(result.codeplugAfterReload?.channels).toHaveLength(2);
      expect(result.codeplugAfterReload?.zones[0].memberChannelIds).toHaveLength(2);
    });
  });

  describe('unresolved members', () => {
    it('reports missing channel names in zones', async () => {
      const result = await runActiveImportWorkflow({
        codeplug: emptyCodeplug(),
        files: filesFromBundle(unresolvedZoneBundle),
        mode: 'merge',
      });

      expect(result.applyReport.unresolvedZoneMembers).toEqual([
        { zoneName: 'Ghost', memberNames: ['Missing Channel'] },
      ]);
    });
  });

  describe('hideFromMap preserved', () => {
    it('keeps internal flag when merging channel updates', async () => {
      const base = await runActiveImportWorkflow({
        codeplug: emptyCodeplug(),
        files: filesFromBundle(channelsOnlyBundle),
        mode: 'merge',
      });
      const cp = {
        ...base.codeplugAfter,
        channels: base.codeplugAfter.channels.map((c) =>
          c.name === 'GB3DA DMR' ? { ...c, hideFromMap: true } : c,
        ),
      };

      const merged = await runActiveImportWorkflow({
        codeplug: cp,
        files: filesFromBundle(modifiedChannelBundle),
        mode: 'merge',
      });

      expect(merged.codeplugAfter.channels.find((c) => c.name === 'GB3DA DMR')?.hideFromMap).toBe(
        true,
      );
    });
  });
});
