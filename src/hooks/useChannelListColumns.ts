import { useCallback, useSyncExternalStore } from 'react';
import {
  CHANNEL_LIST_COLUMN_STORAGE_KEY,
  loadChannelVisibleColumns,
} from './channelListQueryUtils.ts';

const columnListeners = new Set<() => void>();

let cachedSnapshot: string[] | null = null;
let cachedStorageValue: string | null | undefined;

function subscribeColumnStore(listener: () => void) {
  columnListeners.add(listener);
  return () => columnListeners.delete(listener);
}

function readStorageValue(): string | null {
  return localStorage.getItem(CHANNEL_LIST_COLUMN_STORAGE_KEY);
}

function getColumnSnapshot(): string[] {
  const raw = readStorageValue();
  if (cachedSnapshot && raw === cachedStorageValue) {
    return cachedSnapshot;
  }
  cachedStorageValue = raw;
  cachedSnapshot = loadChannelVisibleColumns();
  return cachedSnapshot;
}

function invalidateColumnCache() {
  cachedSnapshot = null;
  cachedStorageValue = undefined;
}

function emitColumnChange() {
  invalidateColumnCache();
  for (const listener of columnListeners) listener();
}

export function useChannelListColumns(): [string[], (cols: string[]) => void] {
  const visibleCols = useSyncExternalStore(
    subscribeColumnStore,
    getColumnSnapshot,
    getColumnSnapshot,
  );

  const setVisibleCols = useCallback((cols: string[]) => {
    localStorage.setItem(CHANNEL_LIST_COLUMN_STORAGE_KEY, JSON.stringify(cols));
    emitColumnChange();
  }, []);

  return [visibleCols, setVisibleCols];
}
