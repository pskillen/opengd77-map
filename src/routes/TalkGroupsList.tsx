import { useMemo } from 'react';
import { DataTable, ListPage } from '../components/ui/index.ts';
import { filterRowsByName, useListNameQuery } from '../hooks/useListNameQuery.ts';
import {
  channelsReferencingTalkGroupId,
  formatReferenceCount,
  rxGroupListsContainingMemberRef,
} from '../lib/reportLookup.ts';
import { useCodeplug } from '../state/codeplugStore.tsx';

export default function TalkGroupsList() {
  const { codeplug } = useCodeplug();
  const { channels, talkGroups, rxGroupLists } = codeplug;
  const { nameFilter, setNameFilter } = useListNameQuery();
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
        rowKey={(tg) => tg.id}
        nameColumn={{
          getName: (tg) => tg.name,
          getPath: (tg) => `/talk-groups/${tg.id}`,
        }}
        columns={[
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
            key: 'channels',
            header: 'Channels using',
            render: (tg) =>
              formatReferenceCount(channelsReferencingTalkGroupId(tg.id, channels).length),
            sortValue: (tg) => channelsReferencingTalkGroupId(tg.id, channels).length,
          },
          {
            key: 'rgl',
            header: 'RX groups using',
            render: (tg) =>
              formatReferenceCount(
                rxGroupListsContainingMemberRef({ kind: 'talkGroup', id: tg.id }, rxGroupLists)
                  .length,
              ),
            sortValue: (tg) =>
              rxGroupListsContainingMemberRef({ kind: 'talkGroup', id: tg.id }, rxGroupLists)
                .length,
          },
        ]}
      />
    </ListPage>
  );
}
