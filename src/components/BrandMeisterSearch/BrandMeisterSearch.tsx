import {
  Alert,
  Anchor,
  Button,
  Checkbox,
  Group,
  ScrollArea,
  Stack,
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
  isMapDeviceSkip,
  mapDeviceToChannelInput,
} from '../../lib/repeaterDirectories/brandmeister/mapToChannel.ts';
import { buildBrandMeisterBundlePlan } from '../../lib/repeaterDirectories/brandmeister/orchestrateAdd.ts';
import { addBrandMeisterRepeaterBundle } from '../../lib/codeplugMutations.ts';
import type { Codeplug } from '../../models/codeplug.ts';
import type { BrandMeisterDevice } from '../../lib/repeaterDirectories/registry.ts';
import { useBrandMeisterSearch } from '../../hooks/useBrandMeisterSearch.ts';
import { useCodeplug } from '../../state/codeplugStore.tsx';

function deviceKey(device: BrandMeisterDevice): string {
  return String(device.id);
}

export default function BrandMeisterSearch() {
  const navigate = useNavigate();
  const { codeplug, addChannel, addBrandMeisterBundle } = useCodeplug();
  const search = useBrandMeisterSearch();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [addMessage, setAddMessage] = useState<string | null>(null);
  const [titleCaseNames, setTitleCaseNames] = useState(true);
  const [includeTalkGroups, setIncludeTalkGroups] = useState(true);
  const [adding, setAdding] = useState(false);

  const mapOptions = useMemo(() => ({ titleCaseText: titleCaseNames }), [titleCaseNames]);

  const existingNames = useMemo(
    () => new Set(codeplug.channels.map((ch) => ch.name)),
    [codeplug.channels],
  );

  const rows = useMemo(() => {
    return search.devices.map((device) => {
      const mapped = mapDeviceToChannelInput(device, undefined, mapOptions);
      const skip = isMapDeviceSkip(mapped);
      const name = skip ? device.callsign : mapped.input.name;
      return {
        device,
        key: deviceKey(device),
        skip,
        skipReason: skip ? mapped.reason : undefined,
        warnings: skip ? mapped.warnings : mapped.warnings,
        nameCollision: !skip && existingNames.has(name),
        mappable: !skip,
      };
    });
  }, [search.devices, existingNames, mapOptions]);

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

  const handleAdd = async () => {
    let added = 0;
    let skipped = 0;
    const warningNotes: string[] = [];
    setAdding(true);
    try {
      let workingCodeplug: Codeplug = codeplug;
      for (const row of rows) {
        if (!selected.has(row.key)) continue;
        if (!row.mappable || row.nameCollision) {
          skipped++;
          continue;
        }
        const mapped = mapDeviceToChannelInput(row.device, undefined, mapOptions);
        if (isMapDeviceSkip(mapped)) {
          skipped++;
          continue;
        }

        if (includeTalkGroups) {
          const plan = await buildBrandMeisterBundlePlan(
            workingCodeplug,
            row.device,
            mapped.input,
            mapped.meta,
            true,
          );
          warningNotes.push(...plan.warnings);
          addBrandMeisterBundle(plan.bundle);
          workingCodeplug = addBrandMeisterRepeaterBundle(workingCodeplug, plan.bundle);
        } else {
          addChannel({ ...mapped.input, meta: mapped.meta });
        }
        added++;
      }
    } finally {
      setAdding(false);
    }

    setAddMessage(
      added > 0
        ? `Added ${added} channel${added === 1 ? '' : 's'}${skipped ? ` (${skipped} skipped)` : ''}.${warningNotes.length ? ` ${warningNotes[0]}` : ''}`
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
      : search.kind === 'deviceId'
        ? 'Searching by BrandMeister device id'
        : null;

  return (
    <FormPage
      title="Add from BrandMeister"
      description="Search BrandMeister network devices and add DMR repeaters to your codeplug."
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
            placeholder="Callsign (e.g. GB7HH) or device id"
            value={search.query}
            onChange={(e) => search.setQuery(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void search.search();
            }}
            style={{ flex: 1, minWidth: 200 }}
          />
          <Checkbox
            label="Title case names"
            checked={titleCaseNames}
            onChange={(e) => setTitleCaseNames(e.currentTarget.checked)}
          />
          <Checkbox
            label="Also create talk groups and RX list"
            checked={includeTalkGroups}
            onChange={(e) => setIncludeTalkGroups(e.currentTarget.checked)}
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
            <Anchor
              href="https://brandmeister.network"
              target="_blank"
              rel="noopener noreferrer"
            >
              BrandMeister
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
                    <Table.Th>Device id</Table.Th>
                    <Table.Th>City</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>CC</Table.Th>
                    <Table.Th>RX MHz</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {rows.map((row) => {
                    const disabled = !row.mappable || row.nameCollision;
                    const rxHz = row.device.tx
                      ? Math.round(Number.parseFloat(row.device.tx) * 1_000_000)
                      : null;
                    return (
                      <Table.Tr key={row.key} opacity={disabled ? 0.6 : 1}>
                        <Table.Td>
                          <Checkbox
                            checked={selected.has(row.key)}
                            disabled={disabled}
                            onChange={(e) => toggleRow(row.key, e.currentTarget.checked)}
                            aria-label={`Select ${row.device.callsign}`}
                          />
                        </Table.Td>
                        <Table.Td>{row.device.callsign}</Table.Td>
                        <Table.Td>{row.device.id}</Table.Td>
                        <Table.Td>
                          {row.device.city
                            ? titleCaseNames
                              ? toTitleCase(row.device.city)
                              : row.device.city
                            : '—'}
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">
                            {row.device.statusText
                              ? titleCaseNames
                                ? toTitleCase(row.device.statusText)
                                : row.device.statusText
                              : '—'}
                          </Text>
                        </Table.Td>
                        <Table.Td>{row.device.colorcode ?? '—'}</Table.Td>
                        <Table.Td>{formatFrequencyHz(rxHz).replace(' MHz', '') || '—'}</Table.Td>
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
                      {r.device.callsign}: {r.skipReason}
                    </Text>
                  ))}
                {rows
                  .filter((r) => r.nameCollision)
                  .map((r) => (
                    <Text key={`dup-${r.key}`} size="xs" c="orange">
                      {r.device.callsign}: channel name already exists in this codeplug
                    </Text>
                  ))}
              </Stack>
            ) : null}

            <Group justify="space-between">
              <Button disabled={selected.size === 0 || adding} loading={adding} onClick={() => void handleAdd()}>
                Add selected ({selected.size})
              </Button>
            </Group>
          </>
        ) : null}

        <Text size="xs" c="dimmed">
          Data from{' '}
          <Anchor href="https://brandmeister.network" target="_blank" rel="noopener noreferrer">
            BrandMeister
          </Anchor>{' '}
          (Halligan API v2). For amateur programming convenience — not authoritative for emergency
          operations.
        </Text>
      </Stack>
    </FormPage>
  );
}
