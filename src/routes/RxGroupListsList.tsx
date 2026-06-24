import { useMemo } from 'react';
import { DataTable, ListPage } from '../components/ui/index.ts';
import { getMemberWireNames } from '../lib/entityProvenance.ts';
import { filterRowsByName, useListNameQuery } from '../hooks/useListNameQuery.ts';
import { usePersistedEntityListSort } from '../hooks/usePersistedEntityListSort.ts';
import { DATATABLE_NAME_SORT_KEY } from '../lib/dataTable/sort.ts';
import { channelsWithRxGroupListId, formatReferenceCount } from '../lib/reportLookup.ts';
import { useCodeplug } from '../state/codeplugStore.tsx';

export default function RxGroupListsList() {
  const { codeplug } = useCodeplug();
  const { channels, rxGroupLists } = codeplug;
  const { nameFilter, setNameFilter } = useListNameQuery('rx-group-lists');
  const [sort, setSort] = usePersistedEntityListSort('rx-group-lists', {
    columnKey: DATATABLE_NAME_SORT_KEY,
    direction: 'asc',
  });
  const filtered = useMemo(() => {
    return filterRowsByName(rxGroupLists, nameFilter, (r) => r.name);
  }, [rxGroupLists, nameFilter]);

  return (
    <ListPage title="RX Group Lists">
      <DataTable
        variant="list"
        rows={filtered}
        totalRowCount={rxGroupLists.length}
        search={nameFilter}
        onSearchChange={setNameFilter}
        searchPlaceholder="Filter name…"
        sort={sort}
        onSortChange={setSort}
        rowKey={(r) => r.id}
        nameColumn={{
          getName: (r) => r.name,
          getPath: (r) => `/rx-group-lists/${r.id}`,
        }}
        columns={[
          {
            key: 'members',
            header: 'Members',
            render: (r) => formatReferenceCount(getMemberWireNames(r).length),
            sortValue: (r) => getMemberWireNames(r).length,
          },
          {
            key: 'channels',
            header: 'Channels using',
            render: (r) => formatReferenceCount(channelsWithRxGroupListId(r.id, channels).length),
            sortValue: (r) => channelsWithRxGroupListId(r.id, channels).length,
          },
        ]}
      />
    </ListPage>
  );
}
