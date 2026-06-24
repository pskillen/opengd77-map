import { Alert, Button, Checkbox, Group, Modal, Radio, Stack, Table, Text } from '@mantine/core';
import { useMemo, useState } from 'react';
import {
  buildPatchFromDiff,
  diffChannelFromListing,
  diffHasChanges,
  EtccDirectoryError,
  fetchByCallsign,
  isMapListingSkip,
  mapListingToChannelInput,
} from '../../lib/repeaterDirectories/registry.ts';
import type {
  ChannelDiffField,
  ChannelDiffRow,
  MapListingOptions,
} from '../../lib/repeaterDirectories/registry.ts';
import type { EtccListing } from '../../lib/repeaterDirectories/registry.ts';
import { matchListingForChannel } from '../../lib/repeaterDirectories/ukrepeater/matchListing.ts';
import { toTitleCase } from '../../lib/titleCase.ts';
import { validateChannel } from '../../lib/validation/channel.ts';
import type { Channel } from '../../models/codeplug.ts';
import { listingToSnapshot } from '../../lib/repeaterDirectories/ukrepeater/types.ts';
import { useCodeplug } from '../../state/codeplugStore.tsx';

export interface UkRepeaterVerifyProps {
  channel: Channel;
}

function formatListingLabel(listing: EtccListing, titleCaseNames: boolean): string {
  const town = listing.town ? (titleCaseNames ? toTitleCase(listing.town) : listing.town) : '—';
  const status = titleCaseNames ? toTitleCase(listing.status) : listing.status;
  return `${listing.repeater} — ${listing.band} — ${town} (${status})`;
}

export default function UkRepeaterVerify({ channel }: UkRepeaterVerifyProps) {
  const { codeplug, updateChannel } = useCodeplug();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listings, setListings] = useState<EtccListing[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [diffOpen, setDiffOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<EtccListing | null>(null);
  const [selectedFields, setSelectedFields] = useState<Set<ChannelDiffField>>(new Set());
  const [applyError, setApplyError] = useState<string | null>(null);
  const [titleCaseNames, setTitleCaseNames] = useState(true);

  const mapOptions: MapListingOptions = useMemo(
    () => ({ titleCaseText: titleCaseNames }),
    [titleCaseNames],
  );

  const diffRows: ChannelDiffRow[] = useMemo(() => {
    if (!selectedListing) return [];
    return diffChannelFromListing(channel, selectedListing, mapOptions);
  }, [channel, selectedListing, mapOptions]);

  const changedRows = useMemo(() => diffRows.filter((r) => r.changed), [diffRows]);

  const openDiffForListing = (listing: EtccListing) => {
    setSelectedListing(listing);
    const rows = diffChannelFromListing(channel, listing, mapOptions);
    const changed = rows.filter((r) => r.changed).map((r) => r.field);
    setSelectedFields(new Set(changed));
    setApplyError(null);
    setDiffOpen(true);
  };

  const handleCheck = async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await fetchByCallsign(channel.callsign);
      if (results.length === 0) {
        setError(`No listings found for ${channel.callsign} on ukrepeater.net.`);
        return;
      }

      const auto = matchListingForChannel(channel, results);
      if (auto) {
        openDiffForListing(auto);
        return;
      }

      setListings(results);
      setPickerOpen(true);
    } catch (err) {
      if (err instanceof EtccDirectoryError) {
        setError(err.message);
      } else {
        setError('Could not query ukrepeater.net.');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleField = (field: ChannelDiffField, checked: boolean) => {
    setSelectedFields((prev) => {
      const next = new Set(prev);
      if (checked) next.add(field);
      else next.delete(field);
      return next;
    });
  };

  const handleApply = () => {
    if (!selectedListing) return;
    setApplyError(null);

    const fields = [...selectedFields];
    const patch = buildPatchFromDiff(channel, selectedListing, fields, mapOptions);

    if (fields.includes('name') && patch.name) {
      const issues = validateChannel(
        { ...channel, ...patch, name: patch.name },
        codeplug,
        channel.id,
      );
      const nameIssue = issues.find((i) => i.field === 'name' && i.severity === 'error');
      if (nameIssue) {
        setApplyError(nameIssue.message);
        return;
      }
    }

    const mapped = mapListingToChannelInput(selectedListing, undefined, mapOptions);
    if (isMapListingSkip(mapped)) {
      setApplyError(mapped.reason);
      return;
    }

    updateChannel(channel.id, {
      ...patch,
      meta: {
        ...channel.meta,
        repeaterDirectory: {
          sourceId: 'ukrepeater',
          remoteListingId: selectedListing.id,
          fetchedAt: new Date().toISOString(),
          snapshot: listingToSnapshot(selectedListing),
        },
      },
    });
    setDiffOpen(false);
  };

  const nameSelected = selectedFields.has('name');

  return (
    <>
      <Stack gap={4}>
        <Button variant="light" size="sm" loading={loading} onClick={() => void handleCheck()}>
          Check ukrepeater.net
        </Button>
        {error ? (
          <Text size="xs" c="red" maw={220}>
            {error}
          </Text>
        ) : null}
      </Stack>

      <Modal
        opened={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title="Select repeater listing"
        size="lg"
      >
        <Checkbox
          label="Title case names"
          checked={titleCaseNames}
          onChange={(e) => setTitleCaseNames(e.currentTarget.checked)}
          mb="sm"
        />
        <Radio.Group
          value={selectedListing ? String(selectedListing.id) : null}
          onChange={(value) => {
            const listing = listings.find((l) => String(l.id) === value) ?? null;
            setSelectedListing(listing);
          }}
        >
          <Stack gap="sm">
            {listings.map((listing) => (
              <Radio
                key={listing.id}
                value={String(listing.id)}
                label={formatListingLabel(listing, titleCaseNames)}
              />
            ))}
          </Stack>
        </Radio.Group>
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={() => setPickerOpen(false)}>
            Cancel
          </Button>
          <Button
            disabled={!selectedListing}
            onClick={() => {
              if (selectedListing) {
                setPickerOpen(false);
                openDiffForListing(selectedListing);
              }
            }}
          >
            Compare
          </Button>
        </Group>
      </Modal>

      <Modal
        opened={diffOpen}
        onClose={() => setDiffOpen(false)}
        title="ukrepeater.net vs local"
        size="lg"
      >
        <Checkbox
          label="Title case names"
          checked={titleCaseNames}
          onChange={(e) => setTitleCaseNames(e.currentTarget.checked)}
          mb="sm"
        />
        {!diffHasChanges(diffRows) ? (
          <Text size="sm">Local channel matches the remote listing.</Text>
        ) : (
          <Stack gap="md">
            <Table withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th />
                  <Table.Th>Field</Table.Th>
                  <Table.Th>Local</Table.Th>
                  <Table.Th>Remote</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {changedRows.map((row) => (
                  <Table.Tr key={row.field}>
                    <Table.Td>
                      <Checkbox
                        checked={selectedFields.has(row.field)}
                        onChange={(e) => toggleField(row.field, e.currentTarget.checked)}
                        aria-label={`Apply ${row.label}`}
                      />
                    </Table.Td>
                    <Table.Td>{row.label}</Table.Td>
                    <Table.Td>{row.local}</Table.Td>
                    <Table.Td>{row.remote}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>

            {nameSelected ? (
              <Text size="xs" c="dimmed">
                Applying a name change updates the CPS export label and import-merge identity. Zone
                membership is unchanged.
              </Text>
            ) : null}

            {applyError ? (
              <Alert color="red" title="Cannot apply">
                {applyError}
              </Alert>
            ) : null}
          </Stack>
        )}

        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={() => setDiffOpen(false)}>
            Close
          </Button>
          {diffHasChanges(diffRows) ? (
            <Button disabled={selectedFields.size === 0} onClick={handleApply}>
              Apply selected
            </Button>
          ) : null}
        </Group>
      </Modal>
    </>
  );
}
