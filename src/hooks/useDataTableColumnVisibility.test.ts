import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  CHANNEL_LIST_COLUMNS_SCHEMA_VERSION,
  loadChannelVisibleColumns,
} from './channelListQueryUtils.ts';
import { channelListColumnsKey, channelListColumnsSchemaKey } from '../lib/listPrefs/keys.ts';
import { useDataTableColumnVisibility } from './useDataTableColumnVisibility.ts';

describe('useDataTableColumnVisibility customLoad caching', () => {
  it('returns a stable snapshot reference when customLoad output is unchanged', () => {
    let loadCount = 0;
    const { result, rerender } = renderHook(() =>
      useDataTableColumnVisibility(
        'test-cols-stable',
        [{ key: 'a', header: 'A', defaultVisible: true }],
        {
          load: () => {
            loadCount += 1;
            return ['a'];
          },
        },
      ),
    );

    const first = result.current[0];
    const countAfterMount = loadCount;
    rerender();
    rerender();
    expect(result.current[0]).toBe(first);
    expect(loadCount).toBe(countAfterMount);
  });
});

describe('loadChannelVisibleColumns', () => {
  it('returns empty array when stored as []', () => {
    const projectId = 'proj-cols-test';
    const key = channelListColumnsKey(projectId);
    const schemaKey = channelListColumnsSchemaKey(projectId);
    const previous = localStorage.getItem(key);
    const previousSchema = localStorage.getItem(schemaKey);
    localStorage.setItem(key, JSON.stringify([]));
    localStorage.setItem(schemaKey, String(CHANNEL_LIST_COLUMNS_SCHEMA_VERSION));

    try {
      expect(loadChannelVisibleColumns(projectId)).toEqual([]);
    } finally {
      if (previous == null) localStorage.removeItem(key);
      else localStorage.setItem(key, previous);
      if (previousSchema == null) localStorage.removeItem(schemaKey);
      else localStorage.setItem(schemaKey, previousSchema);
    }
  });
});
