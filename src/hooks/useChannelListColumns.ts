import {
  CHANNEL_LIST_COLUMN_STORAGE_KEY,
  CHANNEL_OPTIONAL_COLUMNS,
  loadChannelVisibleColumns,
} from './channelListQueryUtils.ts';
import { useDataTableColumnVisibility } from './useDataTableColumnVisibility.ts';

const columnDefs = CHANNEL_OPTIONAL_COLUMNS.map((c) => ({
  key: c.key,
  header: c.header,
  defaultVisible: c.defaultVisible,
}));

export function useChannelListColumns(): [string[], (cols: string[]) => void] {
  return useDataTableColumnVisibility(CHANNEL_LIST_COLUMN_STORAGE_KEY, columnDefs, {
    load: loadChannelVisibleColumns,
  });
}
