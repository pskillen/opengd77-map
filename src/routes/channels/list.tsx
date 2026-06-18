import { Badge, Button, Group, MultiSelect, Stack, Text, TextInput } from '@mantine/core';
import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import CodeplugMap from '../../components/CodeplugMap/CodeplugMap.tsx';
import { BandPillForChannel } from '../../components/crud/BandPill.tsx';
import EntityTable from '../../components/report/EntityTable.tsx';
import ReportPage from '../../components/report/ReportPage.tsx';
import { applyFilters, CHANNEL_COLORS } from '../../lib/channels.ts';
import { bandFromChannel } from '../../lib/bands.ts';
import { isSimplex } from '../../lib/validation/channel.ts';
import { coordsToLocator } from '../../lib/maidenhead.ts';
import { sortByName } from '../../lib/reportLookup.ts';
import type { Channel } from '../../models/codeplug.ts';
import { useCodeplug } from '../../state/codeplugStore.tsx';

const COLUMN_STORAGE_KEY = 'channels-list-columns';

const OPTIONAL_COLUMNS = [
  { key: 'contact', header: 'Contact' },
  { key: 'rgl', header: 'RX group list' },
  { key: 'loc', header: 'Locator' },
] as const;

function modeLabel(mode: Channel['mode']): string {
  if (mode === 'digital') return 'Digital';
  if (mode === 'analogue') return 'Analogue';
  return 'Other';
}

function ModePill({ mode }: { mode: Channel['mode'] }) {
  const color = CHANNEL_COLORS[mode === 'other' ? 'other' : mode];
  return (
    <Badge size="sm" style={{ backgroundColor: color, color: '#1a1b1e' }}>
      {modeLabel(mode)}
    </Badge>
  );
}

function loadVisibleColumns(): string[] {
  try {
    const raw = localStorage.getItem(COLUMN_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as string[];
  } catch {
    /* ignore */
  }
  return OPTIONAL_COLUMNS.map((c) => c.key);
}

export default function ChannelsList() {
  const { codeplug } = useCodeplug();
  const { channels, zones } = codeplug;
  const [nameFilter, setNameFilter] = useState('');
  const [bandFilter, setBandFilter] = useState<string[]>([]);
  const [modeFilter, setModeFilter] = useState<string[]>([]);
  const [duplexFilter, setDuplexFilter] = useState<string | null>(null);
  const [visibleCols, setVisibleCols] = useState<string[]>(loadVisibleColumns);

  const filtered = useMemo(() => {
    return sortByName(channels).filter((ch) => {
      if (nameFilter && !ch.name.toLowerCase().includes(nameFilter.toLowerCase())) return false;
      const band = bandFromChannel(ch.rxFrequency, ch.txFrequency);
      if (bandFilter.length && (!band || !bandFilter.includes(band.id))) return false;
      if (modeFilter.length && !modeFilter.includes(ch.mode)) return false;
      if (duplexFilter === 'simplex' && !isSimplex(ch.rxFrequency, ch.txFrequency)) return false;
      if (duplexFilter === 'split' && isSimplex(ch.rxFrequency, ch.txFrequency)) return false;
      return true;
    });
  }, [channels, nameFilter, bandFilter, modeFilter, duplexFilter]);

  const { skipped } = applyFilters(channels, { requireUseLocation: true, skipZero: true });

  const bandOptions = [...new Set(channels.map((ch) => bandFromChannel(ch.rxFrequency, ch.txFrequency)?.id).filter(Boolean))].map(
    (id) => {
      const band = bandFromChannel(
        channels.find((c) => bandFromChannel(c.rxFrequency, c.txFrequency)?.id === id)?.rxFrequency ?? '',
      );
      return { value: id!, label: band?.label ?? id! };
    },
  );

  const optionalColumnDefs = OPTIONAL_COLUMNS.filter((c) => visibleCols.includes(c.key)).map((col) => {
    if (col.key === 'contact') {
      return { key: col.key, header: col.header, render: (ch: Channel) => ch.contactName || '—' };
    }
    if (col.key === 'rgl') {
      return { key: col.key, header: col.header, render: (ch: Channel) => ch.rxGroupListName || '—' };
    }
    return {
      key: col.key,
      header: col.header,
      render: (ch: Channel) =>
        ch.location && ch.useLocation ? coordsToLocator(ch.location.lat, ch.location.lon, 6) : '—',
    };
  });

  const saveColumns = (cols: string[]) => {
    setVisibleCols(cols);
    localStorage.setItem(COLUMN_STORAGE_KEY, JSON.stringify(cols));
  };

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
              data={[
                { value: 'digital', label: 'Digital' },
                { value: 'analogue', label: 'Analogue' },
                { value: 'other', label: 'Other' },
              ]}
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
          <Button component={Link} to="/channels/new">
            New channel
          </Button>
        </Group>

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
            { key: 'rx', header: 'RX MHz', render: (ch) => ch.rxFrequency || '—' },
            { key: 'tx', header: 'TX MHz', render: (ch) => ch.txFrequency || '—' },
            ...optionalColumnDefs,
          ]}
        />

        {skipped.length > 0 ? (
          <Text size="sm" c="dimmed">
            {skipped.length} channel{skipped.length === 1 ? '' : 's'} not shown on map (missing
            coordinates, Use Location = No, hidden from map, or 0,0).
          </Text>
        ) : null}

        <CodeplugMap channels={channels} zones={zones} allChannels={channels} />
      </Stack>
    </ReportPage>
  );
}
