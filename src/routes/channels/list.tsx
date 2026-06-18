import { Stack, Text } from '@mantine/core';
import CodeplugMap from '../../components/CodeplugMap/CodeplugMap.tsx';
import EntityTable from '../../components/report/EntityTable.tsx';
import ReportPage from '../../components/report/ReportPage.tsx';
import { applyFilters } from '../../lib/channels.ts';
import { sortByName } from '../../lib/reportLookup.ts';
import type { Channel } from '../../models/codeplug.ts';
import { useCodeplug } from '../../state/codeplugStore.tsx';

function modeLabel(mode: Channel['mode']): string {
  if (mode === 'digital') return 'Digital';
  if (mode === 'analogue') return 'Analogue';
  return 'Other';
}

export default function ChannelsList() {
  const { codeplug } = useCodeplug();
  const { channels, zones } = codeplug;
  const sorted = sortByName(channels);
  const { skipped } = applyFilters(channels, { requireUseLocation: true, skipZero: true });

  return (
    <ReportPage title="Channels">
      <Stack gap="lg">
        <EntityTable
          rows={sorted}
          rowKey={(ch) => ch.id}
          nameColumn={{
            getName: (ch) => ch.name,
            getPath: (ch) => `/channels/${ch.id}`,
          }}
          columns={[
            { key: 'mode', header: 'Mode', render: (ch) => modeLabel(ch.mode) },
            { key: 'rx', header: 'RX MHz', render: (ch) => ch.rxFrequency || '—' },
            { key: 'tx', header: 'TX MHz', render: (ch) => ch.txFrequency || '—' },
            { key: 'contact', header: 'Contact', render: (ch) => ch.contactName || '—' },
            { key: 'rgl', header: 'RX group list', render: (ch) => ch.rxGroupListName || '—' },
            {
              key: 'loc',
              header: 'Location',
              render: (ch) => (ch.location && ch.useLocation ? 'Yes' : 'No'),
            },
          ]}
        />

        {skipped.length > 0 ? (
          <Text size="sm" c="dimmed">
            {skipped.length} channel{skipped.length === 1 ? '' : 's'} not shown on map (missing
            coordinates, Use Location = No, or 0,0).
          </Text>
        ) : null}

        <CodeplugMap channels={channels} zones={zones} allChannels={channels} />
      </Stack>
    </ReportPage>
  );
}
