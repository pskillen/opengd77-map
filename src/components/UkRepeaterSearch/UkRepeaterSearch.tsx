import {
  Alert,
  Anchor,
  Button,
  Checkbox,
  Group,
  ScrollArea,
  Select,
  Stack,
  Switch,
  Table,
  Text,
  TextInput,
} from '@mantine/core';
import { IconArrowLeft, IconSearch } from '@tabler/icons-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FormPage } from '../ui/index.ts';
import { formatFrequencyHz } from '../../lib/formatFrequency.ts';
import { ICON_SIZE_NAV, ICON_STROKE } from '../../lib/iconSizes.ts';
import { toTitleCase } from '../../lib/titleCase.ts';
import {
  formatModeCodesSummary,
  isMapListingSkip,
  isOperationalStatus,
  mapListingToChannelInput,
} from '../../lib/repeaterDirectories/registry.ts';
import type { EtccListing } from '../../lib/repeaterDirectories/registry.ts';
import { useUkRepeaterSearch } from '../../hooks/useUkRepeaterSearch.ts';
import { useCodeplug } from '../../state/codeplugStore.tsx';

const BAND_OPTIONS = [
  { value: '2M', label: '2 m' },
  { value: '70CM', label: '70 cm' },
  { value: '4M', label: '4 m' },
  { value: '6M', label: '6 m' },
  { value: '23CM', label: '23 cm' },
];

function listingKey(listing: EtccListing): string {
  return String(listing.id);
}

export default function UkRepeaterSearch() {
  const navigate = useNavigate();
  const { codeplug, addChannel } = useCodeplug();
  const search = useUkRepeaterSearch();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [addMessage, setAddMessage] = useState<string | null>(null);
  const [titleCaseNames, setTitleCaseNames] = useState(true);

  const mapOptions = useMemo(() => ({ titleCaseText: titleCaseNames }), [titleCaseNames]);

  const existingNames = useMemo(
    () => new Set(codeplug.channels.map((ch) => ch.name)),
    [codeplug.channels],
  );

  const rows = useMemo(() => {
    return search.listings.map((listing) => {
      const mapped = mapListingToChannelInput(listing, undefined, mapOptions);
      const skip = isMapListingSkip(mapped);
      const name = skip ? listing.repeater : mapped.input.name;
      return {
        listing,
        key: listingKey(listing),
        skip,
        skipReason: skip ? mapped.reason : undefined,
        warnings: skip ? mapped.warnings : mapped.warnings,
        nameCollision: !skip && existingNames.has(name),
        mappable: !skip,
      };
    });
  }, [search.listings, existingNames, mapOptions]);

  const toggleRow = (key: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(key);
      else next.delete(key);
      return next;
    });
  };

  const toggleAll = (checked: boolean) => {
    if (!checked) {
      setSelected(new Set());
      return;
    }
    const keys = rows.filter((r) => r.mappable && !r.nameCollision).map((r) => r.key);
    setSelected(new Set(keys));
  };

  const handleAdd = () => {
    let added = 0;
    let skipped = 0;
    for (const row of rows) {
      if (!selected.has(row.key)) continue;
      if (!row.mappable || row.nameCollision) {
        skipped++;
        continue;
      }
      const mapped = mapListingToChannelInput(row.listing, undefined, mapOptions);
      if (isMapListingSkip(mapped)) {
        skipped++;
        continue;
      }
      addChannel({ ...mapped.input, meta: mapped.meta });
      added++;
    }
    setAddMessage(
      added > 0
        ? `Added ${added} channel${added === 1 ? '' : 's'}${skipped ? ` (${skipped} skipped)` : ''}.`
        : 'No channels were added.',
    );
    setSelected(new Set());
    if (added > 0) {
      navigate('/channels');
    }
  };

  const kindHint =
    search.kind === 'callsign'
      ? 'Searching by callsign'
      : search.kind === 'locator'
        ? 'Searching by locator'
        : search.kind === 'band'
          ? 'Searching by band'
          : search.kind === 'town'
            ? 'Searching by town (geocoded to locator)'
            : null;

  return (
    <FormPage
      title="Add from ukrepeater.net"
      description="Search RSGB ETCC listings and add repeaters to your codeplug."
    >
      <Stack gap="md">
        <Anchor component={Link} to="/channels" size="sm">
          <Group gap={4} wrap="nowrap">
            <IconArrowLeft size={ICON_SIZE_NAV} stroke={ICON_STROKE} />
            Channels
          </Group>
        </Anchor>

        <Group align="flex-end" wrap="wrap">
          <TextInput
            label="Search"
            placeholder="Callsign, locator, band (2m), or town"
            value={search.query}
            onChange={(e) => search.setQuery(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void search.search();
            }}
            style={{ flex: 1, minWidth: 200 }}
          />
          <Select
            label="Band filter"
            placeholder="Any band"
            data={BAND_OPTIONS}
            value={search.bandFilter}
            onChange={search.setBandFilter}
            clearable
            style={{ minWidth: 120 }}
          />
          <Switch
            label="Operational only"
            checked={search.operationalOnly}
            onChange={(e) => search.setOperationalOnly(e.currentTarget.checked)}
          />
          <Checkbox
            label="Title case names"
            checked={titleCaseNames}
            onChange={(e) => setTitleCaseNames(e.currentTarget.checked)}
          />
          <Button
            leftSection={<IconSearch size={ICON_SIZE_NAV} stroke={ICON_STROKE} />}
            loading={search.loading}
            onClick={() => void search.search()}
          >
            Search
          </Button>
        </Group>

        {kindHint ? (
          <Text size="sm" c="dimmed">
            {kindHint}
          </Text>
        ) : null}

        {search.error ? (
          <Alert color="red" title="Search">
            {search.error}{' '}
            <Anchor href="https://ukrepeater.net" target="_blank" rel="noopener noreferrer">
              ukrepeater.net
            </Anchor>
          </Alert>
        ) : null}

        {addMessage ? (
          <Alert color="green" title="Add channels">
            {addMessage}
          </Alert>
        ) : null}

        {rows.length > 0 ? (
          <>
            <ScrollArea>
              <Table striped highlightOnHover withTableBorder>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>
                      <Checkbox
                        aria-label="Select all mappable"
                        checked={
                          rows.filter((r) => r.mappable && !r.nameCollision).length > 0 &&
                          rows
                            .filter((r) => r.mappable && !r.nameCollision)
                            .every((r) => selected.has(r.key))
                        }
                        indeterminate={
                          selected.size > 0 &&
                          !rows
                            .filter((r) => r.mappable && !r.nameCollision)
                            .every((r) => selected.has(r.key))
                        }
                        onChange={(e) => toggleAll(e.currentTarget.checked)}
                      />
                    </Table.Th>
                    <Table.Th>Callsign</Table.Th>
                    <Table.Th>Band</Table.Th>
                    <Table.Th>Town</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Modes</Table.Th>
                    <Table.Th>RX</Table.Th>
                    <Table.Th>Locator</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {rows.map((row) => {
                    const disabled = !row.mappable || row.nameCollision;
                    return (
                      <Table.Tr key={row.key} opacity={disabled ? 0.6 : 1}>
                        <Table.Td>
                          <Checkbox
                            checked={selected.has(row.key)}
                            disabled={disabled}
                            onChange={(e) => toggleRow(row.key, e.currentTarget.checked)}
                            aria-label={`Select ${row.listing.repeater}`}
                          />
                        </Table.Td>
                        <Table.Td>{row.listing.repeater}</Table.Td>
                        <Table.Td>{row.listing.band}</Table.Td>
                        <Table.Td>
                          {row.listing.town
                            ? titleCaseNames
                              ? toTitleCase(row.listing.town)
                              : row.listing.town
                            : '—'}
                        </Table.Td>
                        <Table.Td>
                          <Text
                            size="sm"
                            c={isOperationalStatus(row.listing.status) ? undefined : 'orange'}
                          >
                            {titleCaseNames ? toTitleCase(row.listing.status) : row.listing.status}
                          </Text>
                        </Table.Td>
                        <Table.Td>{formatModeCodesSummary(row.listing.modeCodes ?? [])}</Table.Td>
                        <Table.Td>
                          {formatFrequencyHz(row.listing.tx).replace(' MHz', '') || '—'}
                        </Table.Td>
                        <Table.Td>{row.listing.locator ?? '—'}</Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            </ScrollArea>

            {rows.some((r) => r.skipReason || r.nameCollision) ? (
              <Stack gap={4}>
                {rows
                  .filter((r) => r.skipReason)
                  .map((r) => (
                    <Text key={r.key} size="xs" c="dimmed">
                      {r.listing.repeater}: {r.skipReason}
                    </Text>
                  ))}
                {rows
                  .filter((r) => r.nameCollision)
                  .map((r) => (
                    <Text key={`dup-${r.key}`} size="xs" c="orange">
                      {r.listing.repeater}: channel name already exists in this codeplug
                    </Text>
                  ))}
              </Stack>
            ) : null}

            <Group justify="space-between">
              <Button disabled={selected.size === 0} onClick={handleAdd}>
                Add selected ({selected.size})
              </Button>
            </Group>
          </>
        ) : null}

        <Text size="xs" c="dimmed">
          Data from{' '}
          <Anchor href="https://ukrepeater.net" target="_blank" rel="noopener noreferrer">
            ukrepeater.net
          </Anchor>{' '}
          (RSGB ETCC beta API). For amateur programming convenience — not authoritative for
          emergency operations.
        </Text>
      </Stack>
    </FormPage>
  );
}
