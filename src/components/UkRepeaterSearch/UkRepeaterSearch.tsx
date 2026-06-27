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
import type { UkRepeaterSearchMode } from '../../lib/repeaterDirectories/ukrepeater/queryRouter.ts';
import {
  formatModeCodesSummary,
  isMapListingSkip,
  isOperationalStatus,
  mapListingToChannelInput,
} from '../../lib/repeaterDirectories/registry.ts';
import type { EtccListing } from '../../lib/repeaterDirectories/registry.ts';
import { useUkRepeaterSearch } from '../../hooks/useUkRepeaterSearch.ts';
import { useCodeplug } from '../../state/codeplugStore.tsx';
import { rowAddStatus } from './rowAddStatus.ts';

const BAND_OPTIONS = [
  { value: '2M', label: '2 m' },
  { value: '70CM', label: '70 cm' },
  { value: '4M', label: '4 m' },
  { value: '6M', label: '6 m' },
  { value: '23CM', label: '23 cm' },
];

const SEARCH_MODE_OPTIONS: { value: UkRepeaterSearchMode; label: string }[] = [
  { value: 'auto', label: 'Auto' },
  { value: 'postcode', label: 'Postcode' },
  { value: 'address', label: 'Address' },
  { value: 'town', label: 'Town' },
  { value: 'callsign', label: 'Repeater callsign' },
  { value: 'keeper', label: 'Keeper callsign' },
  { value: 'locator', label: 'Locator' },
  { value: 'band', label: 'Band' },
];

const SEARCH_PLACEHOLDERS: Record<UkRepeaterSearchMode, string> = {
  auto: 'Callsign, locator, band (2m), postcode, address, or town',
  postcode: 'DE1 1AA',
  address: '10 High Street, Derby',
  town: 'Derby',
  callsign: 'GB7DC',
  keeper: 'G7NPW',
  locator: 'IO92 or IO92PP',
  band: '2m or 70cm',
};

function listingKey(listing: EtccListing): string {
  return String(listing.id);
}

function formatProviderLabel(provider: string): string {
  return provider === 'mapbox' ? 'Mapbox' : 'Photon';
}

export default function UkRepeaterSearch() {
  const navigate = useNavigate();
  const { codeplug, addChannel } = useCodeplug();
  const search = useUkRepeaterSearch();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [addMessage, setAddMessage] = useState<string | null>(null);
  const [titleCaseNames, setTitleCaseNames] = useState(true);

  const mapOptions = useMemo(() => ({ titleCaseText: titleCaseNames }), [titleCaseNames]);

  const existingCallsigns = useMemo(
    () => new Set(codeplug.channels.map((ch) => ch.callsign.trim().toUpperCase()).filter(Boolean)),
    [codeplug.channels],
  );

  const rows = useMemo(() => {
    return search.listings.map((listing) => {
      const mapped = mapListingToChannelInput(listing, undefined, mapOptions);
      const skip = isMapListingSkip(mapped);
      const callsign = listing.repeater.trim().toUpperCase();
      return {
        listing,
        key: listingKey(listing),
        skip,
        skipReason: skip ? mapped.reason : undefined,
        warnings: skip ? mapped.warnings : mapped.warnings,
        callsignCollision: !skip && existingCallsigns.has(callsign),
        mappable: !skip,
      };
    });
  }, [search.listings, existingCallsigns, mapOptions]);

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
    const keys = rows.filter((r) => r.mappable && !r.callsignCollision).map((r) => r.key);
    setSelected(new Set(keys));
  };

  const handleAdd = () => {
    let added = 0;
    let skipped = 0;
    for (const row of rows) {
      if (!selected.has(row.key)) continue;
      if (!row.mappable || row.callsignCollision) {
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
    search.resolvedLocation != null
      ? `${formatProviderLabel(search.resolvedLocation.provider)} resolved "${search.resolvedLocation.label}" → locator ${search.resolvedLocation.locator.toUpperCase()}`
      : search.kind === 'callsign'
        ? 'Searching by repeater callsign'
        : search.kind === 'keeper'
          ? 'Searching by keeper callsign'
          : search.kind === 'locator'
            ? 'Searching by locator'
            : search.kind === 'band'
              ? 'Searching by band'
              : search.kind === 'location'
                ? 'Searching by location (geocoded to locator)'
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
          <Select
            label="Search mode"
            data={SEARCH_MODE_OPTIONS}
            value={search.searchMode}
            onChange={(value) => search.setSearchMode((value as UkRepeaterSearchMode) ?? 'auto')}
            style={{ minWidth: 160 }}
          />
          <TextInput
            label="Search"
            placeholder={SEARCH_PLACEHOLDERS[search.searchMode]}
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

        {search.kind === 'band' && search.listings.length > 0 ? (
          <Alert color="blue" title="Large result set">
            Band searches can return many listings. Keep operational-only enabled to reduce noise.
          </Alert>
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
                          rows.filter((r) => r.mappable && !r.callsignCollision).length > 0 &&
                          rows
                            .filter((r) => r.mappable && !r.callsignCollision)
                            .every((r) => selected.has(r.key))
                        }
                        indeterminate={
                          selected.size > 0 &&
                          !rows
                            .filter((r) => r.mappable && !r.callsignCollision)
                            .every((r) => selected.has(r.key))
                        }
                        onChange={(e) => toggleAll(e.currentTarget.checked)}
                      />
                    </Table.Th>
                    <Table.Th>Callsign</Table.Th>
                    <Table.Th>Band</Table.Th>
                    <Table.Th>Town</Table.Th>
                    <Table.Th>Repeater status</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Modes</Table.Th>
                    <Table.Th>RX</Table.Th>
                    <Table.Th>Locator</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {rows.map((row) => {
                    const disabled = !row.mappable || row.callsignCollision;
                    const addStatus = rowAddStatus(row);
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
                        <Table.Td>
                          <Text size="sm" c={addStatus.color}>
                            {addStatus.label}
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
