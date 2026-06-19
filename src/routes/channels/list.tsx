import { Stack, Text } from '@mantine/core';
import CodeplugMap from '../../components/CodeplugMap/CodeplugMap.tsx';
import { BandPillForChannel } from '../../components/crud/BandPill.tsx';
import EntityTable from '../../components/report/EntityTable.tsx';
import ReportPage from '../../components/report/ReportPage.tsx';
import { applyFilters } from '../../lib/channels.ts';
import ModePill from '../../components/crud/ModePill.tsx';
import { formatFrequencyMhz } from '../../lib/formatFrequency.ts';
import { coordsToLocator } from '../../lib/maidenhead.ts';
import { CHANNEL_OPTIONAL_COLUMNS } from '../../hooks/channelListQueryUtils.ts';
import { useChannelListColumns } from '../../hooks/useChannelListColumns.ts';
import { useChannelListQuery } from '../../hooks/useChannelListQuery.ts';
import { distanceLabelForChannel, useFilteredChannels } from '../../hooks/useChannelListFilters.ts';
import type { Channel } from '../../models/codeplug.ts';
import { useCodeplug } from '../../state/codeplugStore.tsx';
import { useOperatorPosition } from '../../state/operatorPosition.tsx';

export default function ChannelsList() {
  const { codeplug } = useCodeplug();
  const { channels, zones } = codeplug;
  const { position } = useOperatorPosition();
  const query = useChannelListQuery();
  const filtered = useFilteredChannels(channels, query, position);
  const [visibleCols] = useChannelListColumns();

  const mapChannels = query.distanceFilterEnabled ? filtered : channels;
  const { skipped } = applyFilters(channels, { requireUseLocation: true, skipZero: true });

  const optionalColumnDefs = CHANNEL_OPTIONAL_COLUMNS.filter((c) =>
    visibleCols.includes(c.key),
  ).map((col) => {
    if (col.key === 'contact') {
      return { key: col.key, header: col.header, render: (ch: Channel) => ch.contactName || '—' };
    }
    if (col.key === 'rgl') {
      return {
        key: col.key,
        header: col.header,
        render: (ch: Channel) => ch.rxGroupListName || '—',
      };
    }
    if (col.key === 'distance') {
      return {
        key: col.key,
        header: col.header,
        render: (ch: Channel) => (position ? distanceLabelForChannel(ch, position) : '—'),
      };
    }
    return {
      key: col.key,
      header: col.header,
      render: (ch: Channel) =>
        ch.location && ch.useLocation ? coordsToLocator(ch.location.lat, ch.location.lon, 6) : '—',
    };
  });

  return (
    <ReportPage title="Channels">
      <Stack gap="lg">
        <EntityTable
          rows={filtered}
          rowKey={(ch) => ch.id}
          nameColumn={{
            getName: (ch) => ch.name,
            getPath: (ch) => `/channels/${ch.id}`,
          }}
          columns={[
            { key: 'band', header: 'Band', render: (ch) => <BandPillForChannel channel={ch} /> },
            { key: 'mode', header: 'Mode', render: (ch) => <ModePill mode={ch.mode} /> },
            {
              key: 'rx',
              header: 'RX MHz',
              render: (ch) =>
                ch.rxFrequency ? formatFrequencyMhz(ch.rxFrequency).replace(' MHz', '') : '—',
            },
            {
              key: 'tx',
              header: 'TX MHz',
              render: (ch) =>
                ch.txFrequency ? formatFrequencyMhz(ch.txFrequency).replace(' MHz', '') : '—',
            },
            ...optionalColumnDefs,
          ]}
        />

        {skipped.length > 0 ? (
          <Text size="sm" c="dimmed">
            {skipped.length} channel{skipped.length === 1 ? '' : 's'} not shown on map (missing
            coordinates, Use Location = No, hidden from map, or 0,0).
          </Text>
        ) : null}

        <CodeplugMap
          channels={mapChannels}
          zones={zones}
          allChannels={channels}
          operatorPosition={position}
        />
      </Stack>
    </ReportPage>
  );
}
