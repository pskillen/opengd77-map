import { useMemo } from 'react';
import { DataTable, ListPage } from '../components/ui/index.ts';
import { filterRowsByName, useListNameQuery } from '../hooks/useListNameQuery.ts';
import { usePersistedEntityListSort } from '../hooks/usePersistedEntityListSort.ts';
import { DATATABLE_NAME_SORT_KEY } from '../lib/dataTable/sort.ts';
import {
  channelsReferencingTalkGroupId,
  rxGroupListsContainingMemberRef,
} from '../lib/reportLookup.ts';
import { useCodeplug } from '../state/codeplugStore.tsx';

export default function TalkGroupsList() {
  const { codeplug } = useCodeplug();
  const { channels, talkGroups, rxGroupLists } = codeplug;
  const { nameFilter, setNameFilter } = useListNameQuery('talk-groups');
  const [sort, setSort] = usePersistedEntityListSort('talk-groups', {
    columnKey: DATATABLE_NAME_SORT_KEY,
    direction: 'asc',
  });
  const filtered = useMemo(() => {
    return filterRowsByName(talkGroups, nameFilter, (tg) => tg.name);
  }, [talkGroups, nameFilter]);

  return (
    <ListPage title="Talk groups">
      <DataTable
        variant="list"
        rows={filtered}
        totalRowCount={talkGroups.length}
        search={nameFilter}
        onSearchChange={setNameFilter}
        searchPlaceholder="Filter name…"
        sort={sort}
        onSortChange={setSort}
        rowKey={(tg) => tg.id}
        nameColumn={{
          getName: (tg) => tg.name,
          getPath: (tg) => `/talk-groups/${tg.id}`,
        }}
        columns={[
          {
            key: 'abbreviation',
            header: 'Abbreviation',
            render: (tg) => tg.abbreviation?.trim() || '—',
            sortValue: (tg) => tg.abbreviation?.trim() || '',
          },
          {
            key: 'number',
            header: 'DMR ID',
            render: (tg) => tg.number || '—',
            sortValue: (tg) => tg.number || '',
          },
          {
            key: 'ts',
            header: 'Timeslot',
            render: (tg) => tg.timeslotOverride || '—',
            sortValue: (tg) => tg.timeslotOverride || '',
          },
          {
            key: 'usage',
            header: 'Channels / Groups using',
            render: (tg) => {
              const channelCount = channelsReferencingTalkGroupId(tg.id, channels).length;
              const groupCount = rxGroupListsContainingMemberRef(
                { kind: 'talkGroup', id: tg.id },
                rxGroupLists,
              ).length;
              if (channelCount === 0 && groupCount === 0) return '';
              return `${channelCount} / ${groupCount}`;
            },
            sortValue: (tg) => {
              const channelCount = channelsReferencingTalkGroupId(tg.id, channels).length;
              const groupCount = rxGroupListsContainingMemberRef(
                { kind: 'talkGroup', id: tg.id },
                rxGroupLists,
              ).length;
              return channelCount * 10_000 + groupCount;
            },
          },
        ]}
      />
    </ListPage>
  );
}
