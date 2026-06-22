import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { emptyCodeplug } from '../models/codeplug.ts';
import { getMemberWireNames } from '../lib/entityProvenance.ts';
import { newProject } from '../models/codeplugProject.ts';
import {
  CODEPLUG_STORAGE_KEY,
  CODEPLUG_STORAGE_VERSION,
  clearProjectsStorage,
  deserializeProjects,
  isPersistableProjects,
  isValidCodeplug,
  isValidProject,
  loadProjectsFromStorage,
  makeSampleProjectsState,
  saveProjectsToStorage,
  seedProjectsStorage,
  serializeProjects,
  StorageQuotaError,
} from './codeplugStorage.ts';

describe('codeplugStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('round-trips the projects envelope', () => {
    const state = makeSampleProjectsState();
    const json = serializeProjects(state);
    const parsed = JSON.parse(json) as {
      version: number;
      activeProjectId: string | null;
      projects: unknown[];
    };

    expect(parsed.version).toBe(CODEPLUG_STORAGE_VERSION);
    expect(parsed.activeProjectId).toBe(state.activeProjectId);
    expect(parsed.projects).toHaveLength(2);
    expect(deserializeProjects(json)).toEqual(state);
  });

  it('persists and loads via localStorage', () => {
    const state = makeSampleProjectsState();
    saveProjectsToStorage(state);
    expect(loadProjectsFromStorage()).toEqual(state);
  });

  it('removes the key when the project set is empty', () => {
    saveProjectsToStorage({ activeProjectId: null, projects: [] });
    expect(localStorage.getItem(CODEPLUG_STORAGE_KEY)).toBeNull();
    expect(loadProjectsFromStorage()).toBeNull();
  });

  it('returns null for invalid JSON and clears the key on load', () => {
    localStorage.setItem(CODEPLUG_STORAGE_KEY, 'not-json');
    expect(loadProjectsFromStorage()).toBeNull();
    expect(localStorage.getItem(CODEPLUG_STORAGE_KEY)).toBeNull();
  });

  it('returns null for unknown envelope versions', () => {
    localStorage.setItem(
      CODEPLUG_STORAGE_KEY,
      JSON.stringify({ version: 99, activeProjectId: null, projects: [] }),
    );
    expect(loadProjectsFromStorage()).toBeNull();
  });

  it('filters invalid projects and fixes activeProjectId', () => {
    const good = newProject('Good');
    const bad = { id: 'x', name: 'Bad' };
    const json = JSON.stringify({
      version: CODEPLUG_STORAGE_VERSION,
      activeProjectId: 'missing-id',
      projects: [good, bad],
    });

    const state = deserializeProjects(json);
    expect(state?.projects).toHaveLength(1);
    expect(state?.projects[0].name).toBe('Good');
    expect(state?.activeProjectId).toBe(good.id);
  });

  it('sets activeProjectId to null when all projects are invalid', () => {
    const json = JSON.stringify({
      version: CODEPLUG_STORAGE_VERSION,
      activeProjectId: 'missing',
      projects: [{ id: 'x' }],
    });
    expect(deserializeProjects(json)).toEqual({ activeProjectId: null, projects: [] });
  });

  it('validates codeplug and project shapes', () => {
    expect(isValidCodeplug(emptyCodeplug())).toBe(true);
    expect(isValidCodeplug({ meta: { schemaVersion: 999 } })).toBe(false);

    const project = newProject('Test');
    expect(isValidProject(project)).toBe(true);
    expect(isValidProject({ ...project, name: 1 })).toBe(false);
  });

  it('migrates v1 codeplugs with tgLists to rxGroupLists', () => {
    const v1 = {
      channels: [],
      zones: [],
      talkGroups: [],
      tgLists: [{ id: 'tg-1', name: 'Scotland', memberContactNames: ['Scotland TS1'] }],
      contacts: [],
      meta: { schemaVersion: 1, importedAt: null, sourceFiles: [] },
    };
    const json = JSON.stringify({
      version: CODEPLUG_STORAGE_VERSION,
      activeProjectId: null,
      projects: [
        {
          id: 'p1',
          name: 'Legacy',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
          codeplug: v1,
        },
      ],
    });

    const state = deserializeProjects(json);
    expect(state?.projects[0].codeplug.meta.schemaVersion).toBe(7);
    expect(state?.projects[0].codeplug.rxGroupLists[0]).toMatchObject({
      id: 'tg-1',
      name: 'Scotland',
    });
    expect(getMemberWireNames(state!.projects[0].codeplug.rxGroupLists[0])).toEqual([
      'Scotland TS1',
    ]);
  });

  it('migrates v2 channel modes to specific modes', () => {
    const v2 = {
      channels: [
        { id: 'c1', name: 'FM Ch', callsign: 'FM', mode: 'analogue' },
        { id: 'c2', name: 'DMR Ch', callsign: 'DMR', mode: 'digital' },
      ],
      zones: [],
      talkGroups: [],
      rxGroupLists: [],
      contacts: [],
      meta: { schemaVersion: 2, importedAt: null, sourceFiles: [] },
    };
    const json = JSON.stringify({
      version: CODEPLUG_STORAGE_VERSION,
      activeProjectId: null,
      projects: [
        {
          id: 'p1',
          name: 'Legacy',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
          codeplug: v2,
        },
      ],
    });

    const state = deserializeProjects(json);
    expect(state?.projects[0].codeplug.meta.schemaVersion).toBe(7);
    expect(state?.projects[0].codeplug.channels[0].mode).toBe('fm');
    expect(state?.projects[0].codeplug.channels[1].mode).toBe('dmr');
  });

  it('migrates v3 channels by discarding number', () => {
    const v3 = {
      channels: [
        {
          id: 'c1',
          name: 'Test',
          callsign: 'Test',
          mode: 'dmr',
          number: '5',
        },
      ],
      zones: [],
      talkGroups: [],
      rxGroupLists: [],
      contacts: [],
      meta: { schemaVersion: 3, importedAt: null, sourceFiles: [] },
    };
    const json = JSON.stringify({
      version: CODEPLUG_STORAGE_VERSION,
      activeProjectId: null,
      projects: [
        {
          id: 'p1',
          name: 'Legacy',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
          codeplug: v3,
        },
      ],
    });

    const state = deserializeProjects(json);
    expect(state?.projects[0].codeplug.meta.schemaVersion).toBe(7);
    expect(state?.projects[0].codeplug.channels[0]).not.toHaveProperty('number');
    expect(state?.projects[0].codeplug.channels[0].name).toBe('Test');
  });

  it('migrates v4 string channel fields to typed v5 values', () => {
    const v4 = {
      channels: [
        {
          id: 'c1',
          name: 'Legacy',
          callsign: 'Legacy',
          mode: 'dmr',
          rxFrequency: '430.0',
          txFrequency: '430.0',
          power: 'Master',
          squelch: '75%',
          rxOnly: 'Yes',
          colourCode: '2',
          timeslot: '1',
          transmitTimeout: '0',
          rxTone: 'None',
          txTone: 'None',
        },
      ],
      zones: [],
      talkGroups: [],
      rxGroupLists: [],
      contacts: [],
      meta: { schemaVersion: 4, importedAt: null, sourceFiles: [] },
    };
    const json = JSON.stringify({
      version: CODEPLUG_STORAGE_VERSION,
      activeProjectId: null,
      projects: [
        {
          id: 'p1',
          name: 'Legacy',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
          codeplug: v4,
        },
      ],
    });

    const state = deserializeProjects(json);
    const ch = state?.projects[0].codeplug.channels[0];
    expect(state?.projects[0].codeplug.meta.schemaVersion).toBe(7);
    expect(ch?.rxFrequency).toBe(430_000_000);
    expect(ch?.power).toBeNull();
    expect(ch?.squelch).toBe(75);
    expect(ch?.rxOnly).toBe(true);
    expect(ch?.colourCode).toBe(2);
    expect(ch?.timeslot).toBe(1);
    expect(ch?.transmitTimeout).toBe(0);
    expect(ch?.rxTone).toBe('none');
  });

  it('migrates v5 sourceMemberNames to meta.imported.memberWireNames', () => {
    const v5 = {
      channels: [],
      zones: [
        {
          id: 'z-1',
          name: 'North',
          memberChannelIds: ['c-1'],
          sourceMemberNames: ['CH1', 'CH2'],
        },
      ],
      talkGroups: [],
      rxGroupLists: [{ id: 'rgl-1', name: 'Scotland', sourceMemberNames: ['TG1'] }],
      contacts: [],
      meta: { schemaVersion: 5, importedAt: '2026-01-01T00:00:00.000Z', sourceFiles: [] },
    };
    const json = JSON.stringify({
      version: CODEPLUG_STORAGE_VERSION,
      activeProjectId: null,
      projects: [
        {
          id: 'p1',
          name: 'Legacy',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
          codeplug: v5,
        },
      ],
    });

    const state = deserializeProjects(json);
    expect(state?.projects[0].codeplug.meta.schemaVersion).toBe(7);
    expect(state?.projects[0].codeplug.zones[0]).not.toHaveProperty('sourceMemberNames');
    expect(getMemberWireNames(state!.projects[0].codeplug.zones[0])).toEqual(['CH1', 'CH2']);
    expect(state?.projects[0].codeplug.rxGroupLists[0]).not.toHaveProperty('sourceMemberNames');
    expect(getMemberWireNames(state!.projects[0].codeplug.rxGroupLists[0])).toEqual(['TG1']);
  });

  it('migrates v6 contactName to contactRef with provenance wire name', () => {
    const v6 = {
      channels: [
        {
          id: 'ch-1',
          name: 'GB3DA',
          callsign: 'GB3DA',
          mode: 'dmr',
          contactName: 'Scotland',
          rxGroupListName: 'RGL1',
        },
        {
          id: 'ch-2',
          name: 'GB3BF',
          callsign: 'GB3BF',
          mode: 'dmr',
          contactName: 'Dangling',
        },
      ],
      zones: [],
      talkGroups: [{ id: 'tg-1', name: 'Scotland', number: '950', timeslotOverride: '' }],
      rxGroupLists: [{ id: 'rgl-1', name: 'RGL1' }],
      contacts: [],
      meta: { schemaVersion: 6, importedAt: null, sourceFiles: [] },
    };
    const json = JSON.stringify({
      version: CODEPLUG_STORAGE_VERSION,
      activeProjectId: null,
      projects: [
        {
          id: 'p1',
          name: 'Legacy',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
          codeplug: v6,
        },
      ],
    });

    const state = deserializeProjects(json);
    const cp = state!.projects[0].codeplug;
    expect(cp.meta.schemaVersion).toBe(7);
    expect(cp.channels[0].contactRef).toEqual({ kind: 'talkGroup', id: 'tg-1' });
    expect(cp.channels[0].meta?.imported?.contactWireName).toBe('Scotland');
    expect(cp.channels[0]).not.toHaveProperty('contactName');
    expect(cp.channels[1].contactRef).toBeNull();
    expect(cp.channels[0].rxGroupListId).toBe('rgl-1');
    expect(cp.channels[0].meta?.imported?.rxGroupListWireName).toBe('RGL1');
    expect(cp.channels[0]).not.toHaveProperty('rxGroupListName');
    expect(cp.channels[1].meta?.imported?.contactWireName).toBe('Dangling');
  });

  it('migrates v6 RGL provenance memberWireNames to memberRefs', () => {
    const v6 = {
      channels: [],
      zones: [],
      talkGroups: [{ id: 'tg-1', name: 'Scotland', number: '950', timeslotOverride: '' }],
      contacts: [{ id: 'ct-1', name: 'MM9PDY', number: '123', timeslotOverride: '' }],
      rxGroupLists: [
        {
          id: 'rgl-1',
          name: 'Scotland',
          meta: {
            imported: {
              formatId: 'opengd77',
              sourceFile: 'TG_Lists.csv',
              importedAt: '2026-01-01T00:00:00.000Z',
              memberWireNames: ['Scotland', 'MM9PDY', 'Missing'],
            },
          },
        },
      ],
      meta: { schemaVersion: 6, importedAt: null, sourceFiles: [] },
    };
    const json = JSON.stringify({
      version: CODEPLUG_STORAGE_VERSION,
      activeProjectId: null,
      projects: [
        {
          id: 'p1',
          name: 'Legacy',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
          codeplug: v6,
        },
      ],
    });

    const state = deserializeProjects(json);
    const rgl = state!.projects[0].codeplug.rxGroupLists[0];
    expect(rgl.memberRefs).toEqual([
      { kind: 'talkGroup', id: 'tg-1' },
      { kind: 'contact', id: 'ct-1' },
    ]);
    expect(getMemberWireNames(rgl)).toEqual(['Scotland', 'MM9PDY', 'Missing']);
  });

  it('isPersistableProjects is false for an empty set', () => {
    expect(isPersistableProjects({ activeProjectId: null, projects: [] })).toBe(false);
    expect(isPersistableProjects(makeSampleProjectsState())).toBe(true);
  });

  it('throws StorageQuotaError when setItem hits quota', () => {
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new DOMException('quota', 'QuotaExceededError');
    });

    expect(() => saveProjectsToStorage(makeSampleProjectsState())).toThrow(StorageQuotaError);
    vi.restoreAllMocks();
  });

  it('clearProjectsStorage removes the key', () => {
    seedProjectsStorage(makeSampleProjectsState());
    clearProjectsStorage();
    expect(localStorage.getItem(CODEPLUG_STORAGE_KEY)).toBeNull();
  });

  it('normalizes legacy projects without metadata fields', () => {
    const legacy = {
      id: 'p-legacy',
      name: 'Legacy project',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      codeplug: emptyCodeplug(),
    };
    const json = JSON.stringify({
      version: CODEPLUG_STORAGE_VERSION,
      activeProjectId: 'p-legacy',
      projects: [legacy],
    });

    const state = deserializeProjects(json);
    expect(state?.projects[0]).toMatchObject({
      description: '',
      notes: '',
      author: '',
      targetRadios: [],
    });
  });

  it('normalizes targetRadios by trimming and dropping empties', () => {
    const project = newProject('With radios');
    project.targetRadios = ['  Baofeng 1701  ', '', 'DM-32UV', 42 as unknown as string];
    const json = serializeProjects({ activeProjectId: project.id, projects: [project] });

    const state = deserializeProjects(json);
    expect(state?.projects[0].targetRadios).toEqual(['Baofeng 1701', 'DM-32UV']);
  });
});
