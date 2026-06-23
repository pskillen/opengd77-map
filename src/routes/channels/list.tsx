import { Button, Group, Stack, Text } from '@mantine/core';
import CodeplugMap from '../../components/CodeplugMap/CodeplugMap.tsx';
import { BandPillForChannel } from '../../components/crud/BandPill.tsx';
import { DataTable, ListPage } from '../../components/ui/index.ts';
import UseMyLocationButton from '../../components/UseMyLocationButton/UseMyLocationButton.tsx';
import { applyFilters } from '../../lib/channels.ts';
import ModePill from '../../components/crud/ModePill.tsx';
import { resolveChannelModeProfiles } from '../../lib/channelExpansion/index.ts';
import { formatChannelRxTxListCell } from '../../lib/formatFrequency.ts';
import { formatSquelchListCell, percentLabel } from '../../lib/channelFields/percent.ts';
import { coordsToLocator } from '../../lib/maidenhead.ts';
import { CHANNEL_OPTIONAL_COLUMNS } from '../../hooks/channelListQueryUtils.ts';
import { useChannelListColumns } from '../../hooks/useChannelListColumns.ts';
import { useChannelListQuery } from '../../hooks/useChannelListQuery.ts';
import { distanceLabelForChannel, useFilteredChannels } from '../../hooks/useChannelListFilters.ts';
import type { Channel } from '../../models/codeplug.ts';
import { entityRefDisplayName } from '../../lib/entityRefs.ts';
import { useCodeplug } from '../../state/codeplugStore.tsx';
import { useOperatorPosition } from '../../state/operatorPosition.tsx';

export default function ChannelsList() {
  const { codeplug } = useCodeplug();
  const { channels, zones } = codeplug;
  const { position, setPosition, clearPosition } = useOperatorPosition();
  const query = useChannelListQuery();
  const filtered = useFilteredChannels(channels, query, position);
  const [visibleCols] = useChannelListColumns();

  const mapChannels = query.distanceFilterEnabled ? filtered : channels;
  const { skipped } = applyFilters(channels, { requireUseLocation: true, skipZero: true });

  const optionalColumnDefs = CHANNEL_OPTIONAL_COLUMNS.filter((c) =>
    visibleCols.includes(c.key),
  ).map((col) => {
    if (col.key === 'rxTx') {
      return {
        key: col.key,
        header: col.header,
        render: (ch: Channel) => formatChannelRxTxListCell(ch.rxFrequency, ch.txFrequency),
      };
    }
    if (col.key === 'contact') {
      return {
        key: col.key,
        header: col.header,
        render: (ch: Channel) =>
          entityRefDisplayName(ch.contactRef, codeplug.talkGroups, codeplug.contacts) || '—',
      };
    }
    if (col.key === 'rgl') {
      return {
        key: col.key,
        header: col.header,
        render: (ch: Channel) => {
          if (!ch.rxGroupListId) return '—';
          const list = codeplug.rxGroupLists.find((r) => r.id === ch.rxGroupListId);
          return list?.name ?? '—';
        },
      };
    }
    if (col.key === 'distance') {
      return {
        key: col.key,
        header: col.header,
        render: (ch: Channel) => (position ? distanceLabelForChannel(ch, position) : '—'),
      };
    }
    if (col.key === 'power') {
      return {
        key: col.key,
        header: col.header,
        render: (ch: Channel) => percentLabel(ch.power),
      };
    }
    if (col.key === 'squelch') {
      return {
        key: col.key,
        header: col.header,
        render: (ch: Channel) => formatSquelchListCell(ch.squelch),
      };
    }
    if (col.key === 'comment') {
      return {
        key: col.key,
        header: col.header,
        render: (ch: Channel) => ch.comment || '—',
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
    <ListPage title="Channels">
      <Stack gap="lg">
        <DataTable
          rows={filtered}
          rowKey={(ch) => ch.id}
          callsignColumn={{
            getName: (ch) => ch.callsign || '—',
            getPath: (ch) => `/channels/${ch.id}`,
          }}
          nameColumn={{
            getName: (ch) => ch.name || '—',
            getPath: (ch) => `/channels/${ch.id}`,
          }}
          columns={[
            { key: 'band', header: 'Band', render: (ch) => <BandPillForChannel channel={ch} /> },
            {
              key: 'mode',
              header: 'Mode',
              render: (ch) =>
                ch.multiMode ? (
                  <Group gap={4}>
                    {resolveChannelModeProfiles(ch).map((p) => (
                      <ModePill key={p.mode} mode={p.mode} size="xs" />
                    ))}
                  </Group>
                ) : (
                  <ModePill mode={ch.mode} />
                ),
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

        {position ? (
          <Group gap="sm" align="center">
            {position.accuracyMeters != null && Number.isFinite(position.accuracyMeters) ? (
              <Text size="sm" c="dimmed">
                My location accuracy ±{Math.round(position.accuracyMeters)} m
              </Text>
            ) : null}
            <Button variant="subtle" size="compact-sm" onClick={clearPosition}>
              Clear my location
            </Button>
          </Group>
        ) : (
          <UseMyLocationButton
            label="Show my location"
            onLocation={(lat, lon, accuracyMeters) =>
              setPosition({ lat, lon, accuracyMeters: accuracyMeters ?? null })
            }
          />
        )}

        <CodeplugMap
          channels={mapChannels}
          zones={zones}
          allChannels={channels}
          talkGroups={codeplug.talkGroups}
          contacts={codeplug.contacts}
          rxGroupLists={codeplug.rxGroupLists}
          operatorPosition={position}
        />
      </Stack>
    </ListPage>
  );
}
