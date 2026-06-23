import { describe, expect, it } from 'vitest';
import { loadChannelVisibleColumns } from './channelListQueryUtils.ts';

// loadFromStorage is exercised via loadChannelVisibleColumns custom path in channels;
// generic hook behaviour is covered by the channels empty-array test and DataTable tests.

describe('useDataTableColumnVisibility storage', () => {
  it('loadChannelVisibleColumns returns empty array when stored as []', () => {
    const key = 'channels-list-columns';
    const schemaKey = 'channels-list-columns-schema';
    const previous = localStorage.getItem(key);
    const previousSchema = localStorage.getItem(schemaKey);
    localStorage.setItem(key, JSON.stringify([]));
    localStorage.setItem(schemaKey, '5');

    try {
      expect(loadChannelVisibleColumns()).toEqual([]);
    } finally {
      if (previous == null) localStorage.removeItem(key);
      else localStorage.setItem(key, previous);
      if (previousSchema == null) localStorage.removeItem(schemaKey);
      else localStorage.setItem(schemaKey, previousSchema);
    }
  });
});
