import { Button, Group, Stack } from '@mantine/core';
import { Link } from 'react-router-dom';
import CodeplugMap from '../../components/CodeplugMap/CodeplugMap.tsx';
import EntityTable from '../../components/report/EntityTable.tsx';
import ReportPage from '../../components/report/ReportPage.tsx';
import { sortByName } from '../../lib/reportLookup.ts';
import { useCodeplug } from '../../state/codeplugStore.tsx';

export default function ZonesList() {
  const { codeplug } = useCodeplug();
  const { channels, zones } = codeplug;
  const sorted = sortByName(zones);

  return (
    <ReportPage title="Zones">
      <Stack gap="lg">
        <Group justify="flex-end">
          <Button component={Link} to="/zones/new">
            New zone
          </Button>
        </Group>

        <EntityTable
          rows={sorted}
          rowKey={(z) => z.id}
          nameColumn={{
            getName: (z) => z.name,
            getPath: (z) => `/zones/${z.id}`,
          }}
          columns={[
            {
              key: 'members',
              header: 'Members',
              render: (z) => z.memberChannelIds.length,
            },
          ]}
        />

        <CodeplugMap channels={channels} zones={zones} allChannels={channels} />
      </Stack>
    </ReportPage>
  );
}
