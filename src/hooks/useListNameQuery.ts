import { useCallback } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { useHydrateListPrefsOnce } from '../lib/listPrefs/hydration.ts';
import type { EntityListEntity } from '../lib/listPrefs/types.ts';
import {
  debouncedMergeEntityListPrefs,
  loadChannelListPrefs,
  loadEntityListPrefs,
  mergeChannelListPrefs,
  mergeEntityListPrefs,
} from '../lib/listPrefs/storage.ts';
import { entityListPrefsToSearchParams, hasEntityListUrlParams } from '../lib/listPrefs/urlSync.ts';
import { useProjects } from '../state/codeplugStore.tsx';

export function useListNameQuery(entity: EntityListEntity): {
  nameFilter: string;
  setNameFilter: (value: string) => void;
} {
  const { activeProjectId } = useProjects();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  const hydrateFromStorage = useCallback(() => {
    if (!activeProjectId) return;
    const stored = loadEntityListPrefs(entity, activeProjectId);
    if (stored?.q) {
      const next = entityListPrefsToSearchParams(stored);
      setSearchParams((prev) => (prev.toString() === next.toString() ? prev : next), {
        replace: true,
      });
    }
  }, [activeProjectId, entity, setSearchParams]);

  useHydrateListPrefsOnce(
    activeProjectId,
    location.search,
    hasEntityListUrlParams,
    hydrateFromStorage,
  );

  const nameFilter = searchParams.get('q') ?? '';

  const setNameFilter = useCallback(
    (value: string) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (value) next.set('q', value);
          else next.delete('q');
          return next;
        },
        { replace: true },
      );
      if (!activeProjectId) return;
      if (value) debouncedMergeEntityListPrefs(entity, activeProjectId, { q: value });
      else mergeEntityListPrefs(entity, activeProjectId, { q: value });
    },
    [activeProjectId, entity, setSearchParams],
  );

  return { nameFilter, setNameFilter };
}

export function filterRowsByName<T>(
  rows: T[],
  nameFilter: string,
  getName: (row: T) => string,
): T[] {
  if (!nameFilter) return rows;
  const lower = nameFilter.toLowerCase();
  return rows.filter((row) => getName(row).toLowerCase().includes(lower));
}

/** Persist entity list column sort without URL round-trip. */
export function persistEntityListColumnSort(
  entity: EntityListEntity,
  projectId: string,
  columnSort: import('../lib/dataTable/sort.ts').DataTableSortState | null,
): void {
  if (!columnSort) return;
  mergeEntityListPrefs(entity, projectId, { columnSort });
}

/** Load persisted column sort for an entity list. */
export function loadEntityListColumnSort(
  entity: EntityListEntity,
  projectId: string,
): import('../lib/dataTable/sort.ts').DataTableSortState | null {
  return loadEntityListPrefs(entity, projectId)?.columnSort ?? null;
}

/** Persist channel list column sort. */
export function persistChannelListColumnSort(
  projectId: string,
  columnSort: import('../lib/dataTable/sort.ts').DataTableSortState | null,
): void {
  mergeChannelListPrefs(projectId, { columnSort });
}

/** Load persisted channel list column sort. */
export function loadChannelListColumnSort(
  projectId: string,
): import('../lib/dataTable/sort.ts').DataTableSortState | null {
  const stored = loadChannelListPrefs(projectId)?.columnSort;
  return stored ?? null;
}
