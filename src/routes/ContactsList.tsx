import { useMemo } from 'react';
import EntityTable from '../components/report/EntityTable.tsx';
import ReportPage from '../components/report/ReportPage.tsx';
import { filterRowsByName, useListNameQuery } from '../hooks/useListNameQuery.ts';
import {
  channelsWithContactName,
  formatReferenceCount,
  rxGroupListsContainingMember,
  sortByName,
} from '../lib/reportLookup.ts';
import { useCodeplug } from '../state/codeplugStore.tsx';

export default function ContactsList() {
  const { codeplug } = useCodeplug();
  const { channels, contacts, rxGroupLists } = codeplug;
  const { nameFilter } = useListNameQuery();
  const sorted = useMemo(() => {
    return filterRowsByName(sortByName(contacts), nameFilter, (c) => c.name);
  }, [contacts, nameFilter]);

  return (
    <ReportPage title="Contacts">
      <EntityTable
        rows={sorted}
        rowKey={(c) => c.id}
        nameColumn={{
          getName: (c) => c.name,
          getPath: (c) => `/contacts/${c.id}`,
        }}
        columns={[
          { key: 'number', header: 'DMR ID', render: (c) => c.number || '—' },
          { key: 'ts', header: 'Timeslot', render: (c) => c.timeslotOverride || '—' },
          {
            key: 'channels',
            header: 'Channels using',
            render: (c) => formatReferenceCount(channelsWithContactName(c.name, channels).length),
          },
          {
            key: 'rgl',
            header: 'RX groups using',
            render: (c) =>
              formatReferenceCount(rxGroupListsContainingMember(c.name, rxGroupLists).length),
          },
        ]}
      />
    </ReportPage>
  );
}
