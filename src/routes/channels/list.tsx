import { Button, Group, MultiSelect, Select, Slider, Stack, Switch, Text, TextInput } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import CodeplugMap from '../../components/CodeplugMap/CodeplugMap.tsx';
import { BandPillForChannel } from '../../components/crud/BandPill.tsx';
import EntityTable from '../../components/report/EntityTable.tsx';
import ReportPage from '../../components/report/ReportPage.tsx';
import UseMyLocationButton from '../../components/UseMyLocationButton/UseMyLocationButton.tsx';
import { applyFilters, channelHasGeolocation, DISTANCE_FILTER_MARKS_KM, filterChannelsByDistance } from '../../lib/channels.ts';
import { channelMatchesBandFilter, bandsFromFrequencies, UK_BANDS } from '../../lib/bands.ts';
import { modeFilterOptions } from '../../lib/channelModes.ts';
import ModePill from '../../components/crud/ModePill.tsx';
import { formatFrequencyMhz } from '../../lib/formatFrequency.ts';
import { formatDistanceM, haversineDistanceM } from '../../lib/geoDistance.ts';
import { ICON_SIZE_NAV, ICON_STROKE } from '../../lib/iconSizes.ts';
import { isSimplex } from '../../lib/validation/channel.ts';
import { coordsToLocator } from '../../lib/maidenhead.ts';
import { sortByName } from '../../lib/reportLookup.ts';
import type { Channel } from '../../models/codeplug.ts';
import { useCodeplug } from '../../state/codeplugStore.tsx';
import { useOperatorPosition, type OperatorPosition } from '../../state/operatorPosition.tsx';

const COLUMN_STORAGE_KEY = 'channels-list-columns';

type SortMode = 'name' | 'distance';

const OPTIONAL_COLUMNS = [
  { key: 'contact', header: 'Contact' },
  { key: 'rgl', header: 'RX group list' },
  { key: 'loc', header: 'Locator' },
  { key: 'distance', header: 'Distance from me' },
] as const;

function defaultVisibleColumns(): string[] {
  return OPTIONAL_COLUMNS.map((c) => c.key);
}

function loadVisibleColumns(): string[] {
  try {
    const raw = localStorage.getItem(COLUMN_STORAGE_KEY);
    if (raw) {
      const stored = JSON.parse(raw) as string[];
      if (!stored.includes('distance')) {
        return [...stored, 'distance'];
      }
      return stored;
    }
  } catch {
    /* ignore */
  }
  return defaultVisibleColumns();
}

function distanceForChannel(channel: Channel, position: OperatorPosition): string {
  if (!channelHasGeolocation(channel)) return '—';
  return formatDistanceM(
    haversineDistanceM(
      position.lat,
      position.lon,
      channel.location!.lat,
      channel.location!.lon,
    ),
  );
}

function sortChannels(
  rows: Channel[],
  sortMode: SortMode,
  position: OperatorPosition | null,
): Channel[] {
  if (sortMode === 'name' || !position) {
    return sortByName(rows);
  }

  const located: Channel[] = [];
  const unlocated: Channel[] = [];

  for (const ch of rows) {
    if (channelHasGeolocation(ch)) located.push(ch);
    else unlocated.push(ch);
  }

  located.sort((a, b) => {
    const da = haversineDistanceM(
      position.lat,
      position.lon,
      a.location!.lat,
      a.location!.lon,
    );
    const db = haversineDistanceM(
      position.lat,
      position.lon,
      b.location!.lat,
      b.location!.lon,
    );
    return da - db;
  });

  return [...located, ...sortByName(unlocated)];
}

export default function ChannelsList() {
  const { codeplug } = useCodeplug();
  const { channels, zones } = codeplug;
  const { position, setPosition, clearPosition } = useOperatorPosition();
  const [nameFilter, setNameFilter] = useState('');
  const [bandFilter, setBandFilter] = useState<string[]>([]);
  const [modeFilter, setModeFilter] = useState<string[]>([]);
  const [duplexFilter, setDuplexFilter] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>('name');
  const [distanceFilterEnabled, setDistanceFilterEnabled] = useState(false);
  const [maxDistanceKm, setMaxDistanceKm] = useState<number>(DISTANCE_FILTER_MARKS_KM[2]);
  const [visibleCols, setVisibleCols] = useState<string[]>(loadVisibleColumns);

  const nameFiltered = useMemo(() => {
    return channels.filter((ch) => {
      if (nameFilter && !ch.name.toLowerCase().includes(nameFilter.toLowerCase())) return false;
      if (!channelMatchesBandFilter(ch.rxFrequency, ch.txFrequency, bandFilter)) return false;
      if (modeFilter.length && !modeFilter.includes(ch.mode)) return false;
      if (duplexFilter === 'simplex' && !isSimplex(ch.rxFrequency, ch.txFrequency)) return false;
      if (duplexFilter === 'split' && isSimplex(ch.rxFrequency, ch.txFrequency)) return false;
      return true;
    });
  }, [channels, nameFilter, bandFilter, modeFilter, duplexFilter]);

  const distanceFiltered = useMemo(
    () =>
      filterChannelsByDistance(nameFiltered, {
        enabled: distanceFilterEnabled,
        operatorPosition: position,
        maxDistanceKm,
      }),
    [nameFiltered, distanceFilterEnabled, position, maxDistanceKm],
  );

  const filtered = useMemo(
    () => sortChannels(distanceFiltered, sortMode, position),
    [distanceFiltered, sortMode, position],
  );

  const mapChannels = distanceFilterEnabled ? filtered : channels;

  const { skipped } = applyFilters(channels, { requireUseLocation: true, skipZero: true });

  const bandOptions = useMemo(() => {
    const ids = new Set<string>();
    for (const ch of channels) {
      for (const band of bandsFromFrequencies(ch.rxFrequency, ch.txFrequency)) {
        ids.add(band.id);
      }
    }
    return UK_BANDS.filter((b) => ids.has(b.id)).map((b) => ({ value: b.id, label: b.label }));
  }, [channels]);

  const optionalColumnDefs = OPTIONAL_COLUMNS.filter((c) => visibleCols.includes(c.key)).map(
    (col) => {
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
          render: (ch: Channel) => (position ? distanceForChannel(ch, position) : '—'),
        };
      }
      return {
        key: col.key,
        header: col.header,
        render: (ch: Channel) =>
          ch.location && ch.useLocation
            ? coordsToLocator(ch.location.lat, ch.location.lon, 6)
            : '—',
      };
    },
  );

  const saveColumns = (cols: string[]) => {
    setVisibleCols(cols);
    localStorage.setItem(COLUMN_STORAGE_KEY, JSON.stringify(cols));
  };

  const distanceSortPending = sortMode === 'distance' && !position;
  const distanceFilterPending = distanceFilterEnabled && !position;

  const distanceFilterMarks = DISTANCE_FILTER_MARKS_KM.map((km) => ({
    value: km,
    label: `${km}`,
  }));

  return (
    <ReportPage title="Channels">
      <Stack gap="lg">
        <Group justify="space-between" align="flex-end" wrap="wrap">
          <Group gap="sm" wrap="wrap" style={{ flex: 1 }}>
            <TextInput
              label="Filter name"
              placeholder="Search…"
              value={nameFilter}
              onChange={(e) => setNameFilter(e.currentTarget.value)}
              style={{ minWidth: 160 }}
            />
            <Select
              label="Sort"
              data={[
                { value: 'name', label: 'Name' },
                { value: 'distance', label: 'Distance from me' },
              ]}
              value={sortMode}
              onChange={(value) => {
                if (value === 'name' || value === 'distance') setSortMode(value);
              }}
              style={{ minWidth: 180 }}
            />
            <MultiSelect
              label="Band"
              data={bandOptions}
              value={bandFilter}
              onChange={setBandFilter}
              clearable
              style={{ minWidth: 140 }}
            />
            <MultiSelect
              label="Mode"
              data={modeFilterOptions()}
              value={modeFilter}
              onChange={setModeFilter}
              clearable
              style={{ minWidth: 120 }}
            />
            <MultiSelect
              label="Simplex / split"
              data={[
                { value: 'simplex', label: 'Simplex' },
                { value: 'split', label: 'Split' },
              ]}
              value={duplexFilter ? [duplexFilter] : []}
              onChange={(v) => setDuplexFilter(v[0] ?? null)}
              clearable
              maxValues={1}
              style={{ minWidth: 140 }}
            />
            <MultiSelect
              label="Columns"
              data={OPTIONAL_COLUMNS.map((c) => ({ value: c.key, label: c.header }))}
              value={visibleCols}
              onChange={saveColumns}
              style={{ minWidth: 160 }}
            />
          </Group>
          <Button
            component={Link}
            to="/channels/new"
            leftSection={<IconPlus size={ICON_SIZE_NAV} stroke={ICON_STROKE} />}
          >
            New channel
          </Button>
        </Group>

        {distanceSortPending ? (
          <Stack gap="xs">
            <Text size="sm" c="dimmed">
              Distance sort needs your current location. Channels are sorted by name until location
              is set.
            </Text>
            <UseMyLocationButton
              onLocation={(lat, lon, accuracyMeters) =>
                setPosition({ lat, lon, accuracyMeters: accuracyMeters ?? null })
              }
            />
          </Stack>
        ) : null}

        {position ? (
          <Group gap="sm" align="center">
            <Text size="sm" c="dimmed">
              My location: {position.lat.toFixed(5)}, {position.lon.toFixed(5)}
              {position.accuracyMeters != null && Number.isFinite(position.accuracyMeters)
                ? ` (±${Math.round(position.accuracyMeters)} m)`
                : ''}
            </Text>
            <Button variant="subtle" size="compact-sm" onClick={clearPosition}>
              Clear my location
            </Button>
          </Group>
        ) : sortMode === 'name' && !distanceFilterEnabled ? (
          <UseMyLocationButton
            onLocation={(lat, lon, accuracyMeters) =>
              setPosition({ lat, lon, accuracyMeters: accuracyMeters ?? null })
            }
          />
        ) : null}

        <Switch
          label="Within distance"
          description="Hide channels without coordinates; limit by radius when your location is set"
          checked={distanceFilterEnabled}
          onChange={(e) => setDistanceFilterEnabled(e.currentTarget.checked)}
        />

        {distanceFilterEnabled ? (
          <Stack gap="xs" maw={480}>
            <Text size="sm" fw={500}>
              Within {maxDistanceKm} km
              {position
                ? ` — showing ${filtered.length} channel${filtered.length === 1 ? '' : 's'}`
                : ' — set your location to apply radius'}
            </Text>
            <Slider
              value={maxDistanceKm}
              onChange={setMaxDistanceKm}
              min={DISTANCE_FILTER_MARKS_KM[0]}
              max={DISTANCE_FILTER_MARKS_KM[DISTANCE_FILTER_MARKS_KM.length - 1]}
              marks={distanceFilterMarks}
              restrictToMarks
              label={(value) => `${value} km`}
              mb="lg"
            />
          </Stack>
        ) : null}

        {distanceFilterPending ? (
          <Stack gap="xs">
            <Text size="sm" c="dimmed">
              Distance filter hides channels without coordinates. Set your location to also limit by
              radius.
            </Text>
            <UseMyLocationButton
              onLocation={(lat, lon, accuracyMeters) =>
                setPosition({ lat, lon, accuracyMeters: accuracyMeters ?? null })
              }
            />
          </Stack>
        ) : null}

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
            { key: 'rx', header: 'RX MHz', render: (ch) => (ch.rxFrequency ? formatFrequencyMhz(ch.rxFrequency).replace(' MHz', '') : '—') },
            { key: 'tx', header: 'TX MHz', render: (ch) => (ch.txFrequency ? formatFrequencyMhz(ch.txFrequency).replace(' MHz', '') : '—') },
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
