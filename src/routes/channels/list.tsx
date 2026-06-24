import { Button, Group, Stack, Text } from '@mantine/core';
import { useCallback, useMemo, useState } from 'react';
import CodeplugMap from '../../components/CodeplugMap/CodeplugMap.tsx';
import { BandPillForChannel } from '../../components/crud/BandPill.tsx';
import { DataTable, ListPage } from '../../components/ui/index.ts';
import type { DataTableColumn, DataTableSortState } from '../../components/ui/DataTable.tsx';
import UseMyLocationButton from '../../components/UseMyLocationButton/UseMyLocationButton.tsx';
import { applyFilters, channelHasGeolocation } from '../../lib/channels.ts';
import ModePill from '../../components/crud/ModePill.tsx';
import { resolveChannelModeProfiles } from '../../lib/channelExpansion/index.ts';
import { formatChannelRxTxListCell } from '../../lib/formatFrequency.ts';
import { formatSquelchListCell, percentLabel } from '../../lib/channelFields/percent.ts';
import { haversineDistanceM } from '../../lib/geoDistance.ts';
import { coordsToLocator } from '../../lib/maidenhead.ts';
import {
  CHANNEL_LIST_COLUMN_STORAGE_KEY,
  CHANNEL_OPTIONAL_COLUMNS,
} from '../../hooks/channelListQueryUtils.ts';
import { useChannelListQuery } from '../../hooks/useChannelListQuery.ts';
import { DATATABLE_CALLSIGN_SORT_KEY, DATATABLE_NAME_SORT_KEY } from '../../lib/dataTable/sort.ts';
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
  const filtered = useFilteredChannels(channels, query, position, { skipSort: true });
  const [columnSortOverride, setColumnSortOverride] = useState<DataTableSortState | null>(null);

  const mapChannels = query.distanceFilterEnabled ? filtered : channels;
  const { skipped } = applyFilters(channels, { requireUseLocation: true, skipZero: true });

  const effectiveSort = useMemo((): DataTableSortState => {
    if (columnSortOverride) return columnSortOverride;
    if (query.sortMode === 'distance' && position) {
      return { columnKey: 'distance', direction: 'asc' };
    }
    return { columnKey: DATATABLE_NAME_SORT_KEY, direction: 'asc' };
  }, [columnSortOverride, query.sortMode, position]);

  const handleSortChange = useCallback(
    (state: DataTableSortState | null) => {
      if (!state) return;
      if (
        state.columnKey === DATATABLE_NAME_SORT_KEY ||
        state.columnKey === DATATABLE_CALLSIGN_SORT_KEY
      ) {
        setColumnSortOverride(state);
        if (query.sortMode === 'distance') {
          query.setSortMode('name');
        }
        return;
      }
      if (state.columnKey === 'distance') {
        setColumnSortOverride(state);
        query.setSortMode('distance');
        return;
      }
      setColumnSortOverride(state);
      if (query.sortMode === 'distance') {
        query.setSortMode('name');
      }
    },
    [query],
  );

  const optionalColumnDefs = useMemo((): DataTableColumn<Channel>[] => {
    return CHANNEL_OPTIONAL_COLUMNS.map((col) => {
      const base = {
        key: col.key,
        header: col.header,
        hideable: true,
        defaultVisible: col.defaultVisible,
      };

      if (col.key === 'band') {
        return {
          ...base,
          render: (ch: Channel) => <BandPillForChannel channel={ch} />,
          sortValue: (ch: Channel) => ch.rxFrequency ?? ch.txFrequency ?? 0,
        };
      }
      if (col.key === 'mode') {
        return {
          ...base,
          render: (ch: Channel) =>
            ch.multiMode ? (
              <Group gap={4}>
                {resolveChannelModeProfiles(ch).map((p) => (
                  <ModePill key={p.mode} mode={p.mode} size="xs" />
                ))}
              </Group>
            ) : (
              <ModePill mode={ch.mode} />
            ),
          sortValue: (ch: Channel) => ch.mode,
        };
      }
      if (col.key === 'rxTx') {
        return {
          ...base,
          render: (ch: Channel) => formatChannelRxTxListCell(ch.rxFrequency, ch.txFrequency),
          sortValue: (ch: Channel) => ch.rxFrequency ?? ch.txFrequency,
        };
      }
      if (col.key === 'contact') {
        return {
          ...base,
          render: (ch: Channel) =>
            entityRefDisplayName(ch.contactRef, codeplug.talkGroups, codeplug.contacts) || '—',
          sortValue: (ch: Channel) =>
            entityRefDisplayName(ch.contactRef, codeplug.talkGroups, codeplug.contacts) || '',
        };
      }
      if (col.key === 'rgl') {
        return {
          ...base,
          render: (ch: Channel) => {
            if (!ch.rxGroupListId) return '—';
            const list = codeplug.rxGroupLists.find((r) => r.id === ch.rxGroupListId);
            return list?.name ?? '—';
          },
          sortValue: (ch: Channel) => {
            if (!ch.rxGroupListId) return '';
            const list = codeplug.rxGroupLists.find((r) => r.id === ch.rxGroupListId);
            return list?.name ?? '';
          },
        };
      }
      if (col.key === 'distance') {
        return {
          ...base,
          render: (ch: Channel) => (position ? distanceLabelForChannel(ch, position) : '—'),
          sortValue: (ch: Channel) => {
            if (!position || !channelHasGeolocation(ch)) return null;
            return haversineDistanceM(
              position.lat,
              position.lon,
              ch.location!.lat,
              ch.location!.lon,
            );
          },
        };
      }
      if (col.key === 'power') {
        return {
          ...base,
          render: (ch: Channel) => percentLabel(ch.power),
          sortValue: (ch: Channel) => ch.power,
        };
      }
      if (col.key === 'squelch') {
        return {
          ...base,
          render: (ch: Channel) => formatSquelchListCell(ch.squelch),
          sortValue: (ch: Channel) => ch.squelch,
        };
      }
      if (col.key === 'comment') {
        return {
          ...base,
          render: (ch: Channel) => ch.comment || '—',
          sortValue: (ch: Channel) => ch.comment || '',
        };
      }
      if (col.key === 'abbreviation') {
        return {
          ...base,
          render: (ch: Channel) => ch.abbreviation?.trim() || '—',
          sortValue: (ch: Channel) => ch.abbreviation?.trim() || '',
        };
      }
      return {
        ...base,
        render: (ch: Channel) =>
          ch.location && ch.useLocation
            ? coordsToLocator(ch.location.lat, ch.location.lon, 6)
            : '—',
        sortValue: (ch: Channel) =>
          ch.location && ch.useLocation ? coordsToLocator(ch.location.lat, ch.location.lon, 6) : '',
      };
    });
  }, [codeplug.contacts, codeplug.rxGroupLists, codeplug.talkGroups, position]);

  const tableColumns = optionalColumnDefs;

  const sortCtx = useMemo(
    () => ({
      columns: tableColumns,
      callsignColumn: {
        getName: (ch: Channel) => ch.callsign || '—',
        getPath: (ch: Channel) => `/channels/${ch.id}`,
        sortValue: (ch: Channel) => ch.callsign || '',
      },
      nameColumn: {
        getName: (ch: Channel) => ch.name || '—',
        getPath: (ch: Channel) => `/channels/${ch.id}`,
      },
    }),
    [tableColumns],
  );

  const displayedRows = filtered;

  const distanceSortPending = query.sortMode === 'distance' && !position;

  return (
    <ListPage title="Channels">
      <Stack gap="lg">
        {distanceSortPending ? (
          <Text size="sm" c="dimmed">
            Distance sort needs your location. Sorted by name until set — use the Distance column
            header after setting location.
          </Text>
        ) : null}

        <DataTable
          variant="list"
          rows={displayedRows}
          totalRowCount={channels.length}
          rowKey={(ch) => ch.id}
          sort={effectiveSort}
          onSortChange={handleSortChange}
          columnVisibilityStorageKey={CHANNEL_LIST_COLUMN_STORAGE_KEY}
          callsignColumn={sortCtx.callsignColumn}
          nameColumn={sortCtx.nameColumn}
          columns={tableColumns}
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
