import { Button, Group, Stack } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import EntityTable from '../components/report/EntityTable.tsx';
import ReportPage from '../components/report/ReportPage.tsx';
import {
  channelsWithContactName,
  formatReferenceCount,
  rxGroupListsContainingMember,
  sortByName,
} from '../lib/reportLookup.ts';
import { useCodeplug } from '../state/codeplugStore.tsx';
import { ICON_SIZE_NAV, ICON_STROKE } from '../lib/iconSizes.ts';

export default function ContactsList() {
  const { codeplug } = useCodeplug();
  const { channels, contacts, rxGroupLists } = codeplug;
  const sorted = sortByName(contacts);

  return (
    <ReportPage title="Contacts">
      <Stack gap="lg">
        <Group justify="flex-end">
          <Button
            component={Link}
            to="/contacts/new"
            leftSection={<IconPlus size={ICON_SIZE_NAV} stroke={ICON_STROKE} />}
          >
            New contact
          </Button>
        </Group>

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
              render: (c) =>
                formatReferenceCount(channelsWithContactName(c.name, channels).length),
            },
            {
              key: 'rgl',
              header: 'RX groups using',
              render: (c) =>
                formatReferenceCount(rxGroupListsContainingMember(c.name, rxGroupLists).length),
            },
          ]}
        />
      </Stack>
    </ReportPage>
  );
}
