import { Button, Group, Stack } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import EntityTable from '../components/report/EntityTable.tsx';
import ReportPage from '../components/report/ReportPage.tsx';
import { channelsWithRxGroupList, formatReferenceCount, sortByName } from '../lib/reportLookup.ts';
import { useCodeplug } from '../state/codeplugStore.tsx';
import { ICON_SIZE_NAV, ICON_STROKE } from '../lib/iconSizes.ts';

export default function RxGroupListsList() {
  const { codeplug } = useCodeplug();
  const { channels, rxGroupLists } = codeplug;
  const sorted = sortByName(rxGroupLists);

  return (
    <ReportPage title="RX Group Lists">
      <Stack gap="lg">
        <Group justify="flex-end">
          <Button
            component={Link}
            to="/rx-group-lists/new"
            leftSection={<IconPlus size={ICON_SIZE_NAV} stroke={ICON_STROKE} />}
          >
            New RX group list
          </Button>
        </Group>

        <EntityTable
          rows={sorted}
          rowKey={(r) => r.id}
          nameColumn={{
            getName: (r) => r.name,
            getPath: (r) => `/rx-group-lists/${r.id}`,
          }}
          columns={[
            {
              key: 'members',
              header: 'Members',
              render: (r) => formatReferenceCount(r.sourceMemberNames.length),
            },
            {
              key: 'channels',
              header: 'Channels using',
              render: (r) => formatReferenceCount(channelsWithRxGroupList(r.name, channels).length),
            },
          ]}
        />
      </Stack>
    </ReportPage>
  );
}
