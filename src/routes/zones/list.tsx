import { Stack } from '@mantine/core';
import CodeplugMap from '../../components/CodeplugMap/CodeplugMap.tsx';
import EntityTable from '../../components/report/EntityTable.tsx';
import ReportPage from '../../components/report/ReportPage.tsx';
import { sortByName, unresolvedZoneMemberCount } from '../../lib/reportLookup.ts';
import { useCodeplug } from '../../state/codeplugStore.tsx';

export default function ZonesList() {
  const { codeplug } = useCodeplug();
  const { channels, zones } = codeplug;
  const sorted = sortByName(zones);

  return (
    <ReportPage title="Zones">
      <Stack gap="lg">
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
            {
              key: 'unresolved',
              header: 'Unresolved',
              render: (z) => unresolvedZoneMemberCount(z, channels),
            },
          ]}
        />

        <CodeplugMap channels={channels} zones={zones} allChannels={channels} />
      </Stack>
    </ReportPage>
  );
}
