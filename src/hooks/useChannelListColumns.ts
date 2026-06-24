import { useProjects } from '../state/codeplugStore.tsx';
import {
  CHANNEL_OPTIONAL_COLUMNS,
  channelListColumnsKey,
  loadChannelVisibleColumns,
} from './channelListQueryUtils.ts';
import { useDataTableColumnVisibility } from './useDataTableColumnVisibility.ts';

const columnDefs = CHANNEL_OPTIONAL_COLUMNS.map((c) => ({
  key: c.key,
  header: c.header,
  defaultVisible: c.defaultVisible,
}));

export function useChannelListColumns(): [string[], (cols: string[]) => void] {
  const { activeProjectId } = useProjects();
  const storageKey = activeProjectId ? channelListColumnsKey(activeProjectId) : '__channels-noop__';

  return useDataTableColumnVisibility(storageKey, columnDefs, {
    enabled: !!activeProjectId,
    load: activeProjectId ? () => loadChannelVisibleColumns(activeProjectId) : undefined,
  });
}
