import { useMemo } from 'react';
import EntityTable from '../components/report/EntityTable.tsx';
import ReportPage from '../components/report/ReportPage.tsx';
import { filterRowsByName, useListNameQuery } from '../hooks/useListNameQuery.ts';
import {
  channelsReferencingTalkGroupId,
  formatReferenceCount,
  rxGroupListsContainingMemberRef,
  sortByName,
} from '../lib/reportLookup.ts';
import { useCodeplug } from '../state/codeplugStore.tsx';

export default function TalkGroupsList() {
  const { codeplug } = useCodeplug();
  const { channels, talkGroups, rxGroupLists } = codeplug;
  const { nameFilter } = useListNameQuery();
  const sorted = useMemo(() => {
    return filterRowsByName(sortByName(talkGroups), nameFilter, (tg) => tg.name);
  }, [talkGroups, nameFilter]);

  return (
    <ReportPage title="Talk groups">
      <EntityTable
        rows={sorted}
        rowKey={(tg) => tg.id}
        nameColumn={{
          getName: (tg) => tg.name,
          getPath: (tg) => `/talk-groups/${tg.id}`,
        }}
        columns={[
          { key: 'number', header: 'DMR ID', render: (tg) => tg.number || '—' },
          { key: 'ts', header: 'Timeslot', render: (tg) => tg.timeslotOverride || '—' },
          {
            key: 'channels',
            header: 'Channels using',
            render: (tg) =>
              formatReferenceCount(channelsReferencingTalkGroupId(tg.id, channels).length),
          },
          {
            key: 'rgl',
            header: 'RX groups using',
            render: (tg) =>
              formatReferenceCount(
                rxGroupListsContainingMemberRef({ kind: 'talkGroup', id: tg.id }, rxGroupLists)
                  .length,
              ),
          },
        ]}
      />
    </ReportPage>
  );
}
