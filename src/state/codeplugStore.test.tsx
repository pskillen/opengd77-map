import { renderHook, act, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { ReactNode } from 'react';
import type { ImportResult } from '../lib/import/types.ts';
import {
  channelFieldDefaults,
  emptyCodeplug,
  resetIdGenerator,
  setIdGenerator,
} from '../models/codeplug.ts';
import { CODEPLUG_STORAGE_KEY } from './codeplugStorage.ts';
import { serializeProjects } from './codeplugStorage.ts';
import { newProject } from '../models/codeplugProject.ts';
import {
  applyImportToCodeplug,
  CodeplugProvider,
  projectsReducer,
  useCodeplug,
  useProjects,
} from './codeplugStore.tsx';

function channelsCsvResult(): ImportResult {
  const base = channelFieldDefaults();
  return {
    channels: [
      {
        id: 'ch-1',
        name: 'A',
        callsign: 'A',
        mode: 'dmr',
        ...base,
        location: { lat: 56.5, lon: -4.0 },
        useLocation: true,
        number: '1',
      },
      {
        id: 'ch-2',
        name: 'B',
        callsign: 'B',
        mode: 'dmr',
        ...base,
        location: { lat: 57.0, lon: -3.5 },
        useLocation: true,
        number: '2',
      },
    ],
    recognised: ['Channels.csv'],
    skipped: [],
    errors: [],
  };
}

function wrapper({ children }: { children: ReactNode }) {
  return <CodeplugProvider>{children}</CodeplugProvider>;
}

describe('codeplug import merge semantics', () => {
  beforeEach(() => {
    let n = 0;
    setIdGenerator(() => `zone-${++n}`);
  });

  afterEach(() => {
    resetIdGenerator();
    localStorage.clear();
  });

  it('resolves zone member names to channel ids', () => {
    let state = emptyCodeplug();
    state = applyImportToCodeplug(state, channelsCsvResult());
    state = applyImportToCodeplug(state, {
      zones: [{ name: 'North', memberNames: ['A', 'B'] }],
      recognised: ['Zones.csv'],
      skipped: [],
      errors: [],
    });
    expect(state.zones).toHaveLength(1);
    expect(state.zones[0].memberChannelIds).toEqual(['ch-1', 'ch-2']);
    expect(state.zones[0].sourceMemberNames).toEqual(['A', 'B']);
  });

  it('preserves channel ids on channels-only re-import when names match', () => {
    let state = emptyCodeplug();
    state = applyImportToCodeplug(state, channelsCsvResult());
    state = applyImportToCodeplug(state, {
      zones: [{ name: 'North', memberNames: ['A', 'B'] }],
      recognised: ['Zones.csv'],
      skipped: [],
      errors: [],
    });
    const zoneId = state.zones[0].id;

    state = applyImportToCodeplug(state, {
      channels: [
        {
          id: 'ch-new-a',
          name: 'A',
          callsign: 'A',
          mode: 'dmr',
          ...channelFieldDefaults(),
          location: { lat: 56.5, lon: -4.0 },
          useLocation: true,
          number: '1',
        },
      ],
      recognised: ['Channels.csv'],
      skipped: [],
      errors: [],
    });

    expect(state.zones[0].id).toBe(zoneId);
    expect(state.channels.find((c) => c.name === 'A')?.id).toBe('ch-1');
    expect(state.zones[0].memberChannelIds).toEqual(['ch-1', 'ch-2']);
  });
});

describe('projectsReducer', () => {
  beforeEach(() => {
    setIdGenerator(() => 'proj-1');
    localStorage.clear();
  });

  afterEach(() => {
    resetIdGenerator();
    localStorage.clear();
  });

  it('imports a new project and sets it active', () => {
    const state = projectsReducer(
      { activeProjectId: null, projects: [] },
      { type: 'IMPORT_NEW_PROJECT', result: channelsCsvResult() },
    );
    expect(state.projects).toHaveLength(1);
    expect(state.activeProjectId).toBe('proj-1');
    expect(state.projects[0].codeplug.channels).toHaveLength(2);
  });

  it('applies import to the active project only', () => {
    setIdGenerator(() => 'proj-1');
    let state = projectsReducer(
      { activeProjectId: null, projects: [] },
      { type: 'IMPORT_NEW_PROJECT', result: channelsCsvResult() },
    );

    setIdGenerator(() => 'proj-2');
    state = projectsReducer(state, {
      type: 'IMPORT_NEW_PROJECT',
      result: channelsCsvResult(),
      name: 'Second',
    });

    setIdGenerator(() => 'zone-1');
    state = projectsReducer(state, {
      type: 'APPLY_IMPORT',
      result: {
        zones: [{ name: 'Updated', memberNames: ['A'] }],
        recognised: ['Zones.csv'],
        skipped: [],
        errors: [],
      },
    });

    const active = state.projects.find((p) => p.id === state.activeProjectId);
    expect(active?.name).toBe('Second');
    expect(active?.codeplug.zones[0].name).toBe('Updated');
    expect(state.projects.find((p) => p.name === 'Channels')?.codeplug.zones).toHaveLength(0);
  });

  it('reassigns active when the active project is deleted', () => {
    setIdGenerator(() => 'a');
    const first = newProject('First');
    setIdGenerator(() => 'b');
    const second = newProject('Second');
    const state = projectsReducer(
      { activeProjectId: 'a', projects: [first, second] },
      { type: 'DELETE_PROJECT', id: 'a' },
    );
    expect(state.projects).toHaveLength(1);
    expect(state.activeProjectId).toBe('b');
  });
});

describe('CodeplugProvider persistence', () => {
  beforeEach(() => {
    localStorage.clear();
    setIdGenerator(() => 'hydrate-proj');
  });

  afterEach(() => {
    resetIdGenerator();
    localStorage.clear();
  });

  it('hydrates from localStorage', () => {
    const a = newProject('Alpha');
    const b = newProject('Beta');
    localStorage.setItem(
      CODEPLUG_STORAGE_KEY,
      serializeProjects({ activeProjectId: b.id, projects: [a, b] }),
    );

    const { result } = renderHook(() => useProjects(), { wrapper });
    expect(result.current.projects).toHaveLength(2);
    expect(result.current.activeProjectId).toBe(b.id);
  });

  it('persists after importNewProject', async () => {
    const { result } = renderHook(
      () => ({
        projects: useProjects(),
        codeplug: useCodeplug(),
      }),
      { wrapper },
    );

    act(() => {
      result.current.projects.importNewProject(channelsCsvResult());
    });

    await waitFor(() => {
      expect(localStorage.getItem(CODEPLUG_STORAGE_KEY)).not.toBeNull();
    });

    expect(result.current.projects.projects).toHaveLength(1);
    expect(result.current.codeplug.codeplug.channels).toHaveLength(2);
  });

  it('returns empty codeplug when no active project', () => {
    const { result } = renderHook(() => useCodeplug(), { wrapper });
    expect(result.current.codeplug).toEqual(emptyCodeplug());
  });
});
