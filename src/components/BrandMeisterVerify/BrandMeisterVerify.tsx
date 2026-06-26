import { Alert, Button, Checkbox, Group, Modal, Radio, Stack, Table, Text, TextInput } from '@mantine/core';
import { useMemo, useState } from 'react';
import {
  BrandMeisterDirectoryError,
  fetchDevicesByCallsign,
  fetchDeviceById,
  fetchStaticTalkgroups,
} from '../../lib/repeaterDirectories/registry.ts';
import type { BrandMeisterDevice } from '../../lib/repeaterDirectories/registry.ts';
import { matchDeviceForChannel } from '../../lib/repeaterDirectories/brandmeister/matchDevice.ts';
import {
  buildPatchFromDeviceDiff,
  brandMeisterProvenancePatch,
  diffChannelFromDevice,
  diffHasChanges,
} from '../../lib/repeaterDirectories/brandmeister/channelDiff.ts';
import type {
  ChannelDiffField,
  ChannelDiffRow,
} from '../../lib/repeaterDirectories/brandmeister/channelDiff.ts';
import {
  isMapDeviceSkip,
  mapDeviceToChannelInput,
} from '../../lib/repeaterDirectories/brandmeister/mapToChannel.ts';
import {
  prepareRxListCorrection,
  type RxListCorrectionPlan,
} from '../../lib/repeaterDirectories/brandmeister/prepareRxListCorrection.ts';
import { staticTalkgroupSlots } from '../../lib/repeaterDirectories/brandmeister/mapTalkGroups.ts';
import { toTitleCase } from '../../lib/titleCase.ts';
import { validateChannel } from '../../lib/validation/channel.ts';
import type { Channel, EntityMeta } from '../../models/codeplug.ts';
import type { ChannelInput } from '../../lib/codeplugMutations.ts';
import { applyBrandMeisterRxListCorrection as applyRxListCorrectionMutation } from '../../lib/codeplugMutations.ts';
import { findEntityById } from '../../lib/reportLookup.ts';
import { useCodeplug } from '../../state/codeplugStore.tsx';

export interface BrandMeisterVerifyEditBindings {
  rxGroupListId: string | null;
  onChannelPatch: (patch: Partial<ChannelInput>, meta?: EntityMeta) => void;
  onRxGroupListIdChange: (id: string) => void;
}

export interface BrandMeisterVerifyProps {
  channel: Channel;
  editBindings?: BrandMeisterVerifyEditBindings;
}

type RxListApplyMode = 'update' | 'create';

function formatDeviceLabel(device: BrandMeisterDevice, titleCaseNames: boolean): string {
  const city = device.city ? (titleCaseNames ? toTitleCase(device.city) : device.city) : '—';
  const status = device.statusText
    ? titleCaseNames
      ? toTitleCase(device.statusText)
      : device.statusText
    : '—';
  return `${device.callsign} — id ${device.id} — ${city} (${status})`;
}

export default function BrandMeisterVerify({
  channel,
  editBindings,
}: BrandMeisterVerifyProps) {
  const { codeplug, updateChannel, applyBrandMeisterRxListCorrection } = useCodeplug();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<BrandMeisterDevice[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [diffOpen, setDiffOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<BrandMeisterDevice | null>(null);
  const [selectedFields, setSelectedFields] = useState<Set<ChannelDiffField>>(new Set());
  const [applyRxList, setApplyRxList] = useState(false);
  const [rxListApplyMode, setRxListApplyMode] = useState<RxListApplyMode>('update');
  const [newRxListName, setNewRxListName] = useState('');
  const [rxListPlan, setRxListPlan] = useState<RxListCorrectionPlan | null>(null);
  const [staticSlots, setStaticSlots] = useState<
    ReturnType<typeof staticTalkgroupSlots>
  >([]);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [titleCaseNames, setTitleCaseNames] = useState(true);

  const rxGroupListId = editBindings?.rxGroupListId ?? channel.rxGroupListId;
  const rxGroupList = rxGroupListId
    ? findEntityById(codeplug.rxGroupLists, rxGroupListId)
    : null;

  const mapOptions = useMemo(() => ({ titleCaseText: titleCaseNames }), [titleCaseNames]);

  const diffRows: ChannelDiffRow[] = useMemo(() => {
    if (!selectedDevice) return [];
    return diffChannelFromDevice(channel, selectedDevice, mapOptions);
  }, [channel, selectedDevice, mapOptions]);

  const changedChannelRows = useMemo(() => diffRows.filter((r) => r.changed), [diffRows]);
  const changedRxRows = useMemo(
    () => rxListPlan?.diffRows.filter((r) => r.changed) ?? [],
    [rxListPlan],
  );

  const openDiffForDevice = async (device: BrandMeisterDevice) => {
    setSelectedDevice(device);
    const rows = diffChannelFromDevice(channel, device, mapOptions);
    const changed = rows.filter((r) => r.changed).map((r) => r.field);
    setSelectedFields(new Set(changed));

    const staticTalkgroups = await fetchStaticTalkgroups(device.id);
    setStaticSlots(staticTalkgroupSlots(staticTalkgroups));

    const plan = await prepareRxListCorrection(codeplug, device, rxGroupList);
    setRxListPlan(plan);
    setApplyRxList(plan?.hasRxListChanges ?? false);
    setNewRxListName(plan?.suggestedName ?? '');
    setRxListApplyMode(rxGroupList ? 'update' : 'create');
    setApplyError(null);
    setDiffOpen(true);
  };

  const handleCheck = async () => {
    setLoading(true);
    setError(null);
    try {
      let results: BrandMeisterDevice[] = [];
      const remoteId = channel.meta?.repeaterDirectory?.remoteListingId;
      if (remoteId != null && channel.meta?.repeaterDirectory?.sourceId === 'brandmeister') {
        const byId = await fetchDeviceById(remoteId);
        if (byId) results = [byId];
      }
      if (results.length === 0 && channel.callsign.trim()) {
        results = await fetchDevicesByCallsign(channel.callsign);
      }
      if (results.length === 0) {
        setError(`No BrandMeister devices found for ${channel.callsign || 'this channel'}.`);
        return;
      }

      const auto = matchDeviceForChannel(channel, results);
      if (auto) {
        await openDiffForDevice(auto);
        return;
      }

      setDevices(results);
      setPickerOpen(true);
    } catch (err) {
      if (err instanceof BrandMeisterDirectoryError) {
        setError(err.message);
      } else {
        setError('Could not query BrandMeister.');
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
    if (!selectedDevice) return;
    setApplyError(null);

    const fields = [...selectedFields];
    const channelPatch = buildPatchFromDeviceDiff(selectedDevice, fields, mapOptions);
    const hasChannelApply = fields.length > 0 && diffHasChanges(diffRows);

    if (fields.includes('name') && channelPatch.name) {
      const issues = validateChannel(
        { ...channel, ...channelPatch, name: channelPatch.name },
        codeplug,
        channel.id.startsWith('__') ? undefined : channel.id,
      );
      const nameIssue = issues.find((i) => i.field === 'name' && i.severity === 'error');
      if (nameIssue) {
        setApplyError(nameIssue.message);
        return;
      }
    }

    if (hasChannelApply) {
      const mapped = mapDeviceToChannelInput(selectedDevice, undefined, mapOptions);
      if (isMapDeviceSkip(mapped)) {
        setApplyError(mapped.reason);
        return;
      }

      const meta = {
        ...channel.meta,
        ...brandMeisterProvenancePatch(selectedDevice),
      };

      if (editBindings) {
        editBindings.onChannelPatch(channelPatch, meta);
      } else if (!channel.id.startsWith('__')) {
        updateChannel(channel.id, { ...channelPatch, meta });
      }
    }

    if (applyRxList && rxListPlan?.hasRxListChanges) {
      if (rxListPlan.memberRefs.length === 0 && rxListPlan.newTalkGroups.length === 0) {
        setApplyError(rxListPlan.warnings[0] ?? 'Cannot apply RX list — missing local talk groups.');
        return;
      }

      const memberSpecs = staticSlots.map(({ number, timeslot }) => ({ number, timeslot }));
      if (memberSpecs.length === 0) {
        setApplyError('No static talk groups on this repeater.');
        return;
      }

      const listName = newRxListName.trim() || rxListPlan.suggestedName;
      const correctionInput = {
        newTalkGroups: rxListPlan.newTalkGroups,
        rxListMembers: memberSpecs,
        action: rxListApplyMode,
        existingRxGroupListId: rxGroupListId,
        newListName: listName,
      } as const;

      const channelIdForLink =
        !channel.id.startsWith('__') && rxListApplyMode === 'create' ? channel.id : undefined;

      const simulated = applyRxListCorrectionMutation(codeplug, correctionInput);
      applyBrandMeisterRxListCorrection(correctionInput, channelIdForLink);

      if (editBindings && rxListApplyMode === 'create' && simulated.rxGroupListId) {
        editBindings.onRxGroupListIdChange(simulated.rxGroupListId);
      }
    }

    setDiffOpen(false);
  };

  const nameSelected = selectedFields.has('name');
  const hasChannelChanges = diffHasChanges(diffRows);
  const hasRxChanges = rxListPlan?.hasRxListChanges ?? false;
  const canApply =
    (hasChannelChanges && selectedFields.size > 0) ||
    (applyRxList && hasRxChanges && rxListPlan != null);

  return (
    <>
      <Stack gap={4}>
        <Button variant="light" size="sm" loading={loading} onClick={() => void handleCheck()}>
          Check BrandMeister
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
        title="Select BrandMeister device"
        size="lg"
      >
        <Checkbox
          label="Title case names"
          checked={titleCaseNames}
          onChange={(e) => setTitleCaseNames(e.currentTarget.checked)}
          mb="sm"
        />
        <Radio.Group
          value={selectedDevice ? String(selectedDevice.id) : null}
          onChange={(value) => {
            const device = devices.find((d) => String(d.id) === value) ?? null;
            setSelectedDevice(device);
          }}
        >
          <Stack gap="sm">
            {devices.map((device) => (
              <Radio
                key={device.id}
                value={String(device.id)}
                label={formatDeviceLabel(device, titleCaseNames)}
              />
            ))}
          </Stack>
        </Radio.Group>
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={() => setPickerOpen(false)}>
            Cancel
          </Button>
          <Button
            disabled={!selectedDevice}
            onClick={() => {
              if (selectedDevice) {
                setPickerOpen(false);
                void openDiffForDevice(selectedDevice);
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
        title="BrandMeister vs local"
        size="lg"
      >
        <Checkbox
          label="Title case names"
          checked={titleCaseNames}
          onChange={(e) => setTitleCaseNames(e.currentTarget.checked)}
          mb="sm"
        />

        <Stack gap="lg">
          {!hasChannelChanges && !hasRxChanges ? (
            <Text size="sm">Local channel and RX list match BrandMeister.</Text>
          ) : null}

          {hasChannelChanges ? (
            <Stack gap="sm">
              <Text size="sm" fw={500}>
                Channel
              </Text>
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
                  {changedChannelRows.map((row) => (
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
            </Stack>
          ) : null}

          {hasRxChanges && rxListPlan ? (
            <Stack gap="sm">
              <Text size="sm" fw={500}>
                RX group list
              </Text>
              <Table withTableBorder>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Field</Table.Th>
                    <Table.Th>Local</Table.Th>
                    <Table.Th>Remote</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {changedRxRows.map((row) => (
                    <Table.Tr key={row.field}>
                      <Table.Td>{row.label}</Table.Td>
                      <Table.Td>{row.local}</Table.Td>
                      <Table.Td>{row.remote}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
              <Checkbox
                label="Apply RX group list correction"
                checked={applyRxList}
                onChange={(e) => setApplyRxList(e.currentTarget.checked)}
              />
              {applyRxList ? (
                <Stack gap="xs">
                  {rxGroupList ? (
                    <Radio
                      checked={rxListApplyMode === 'update'}
                      onChange={() => setRxListApplyMode('update')}
                      label={`Update current list: ${rxGroupList.name}`}
                    />
                  ) : null}
                  <Radio
                    checked={rxListApplyMode === 'create'}
                    onChange={() => setRxListApplyMode('create')}
                    label="Create new RX group list"
                  />
                  {rxListApplyMode === 'create' ? (
                    <TextInput
                      label="New list name"
                      value={newRxListName}
                      onChange={(e) => setNewRxListName(e.currentTarget.value)}
                      description={`Suggested: ${rxListPlan.suggestedName}`}
                    />
                  ) : null}
                  {codeplug.rxGroupLists.length > 0 ? (
                    <Text size="xs" c="dimmed">
                      Existing lists: {codeplug.rxGroupLists.map((r) => r.name).join(', ')}
                    </Text>
                  ) : null}
                </Stack>
              ) : null}
              {rxListPlan.warnings.map((w) => (
                <Text key={w} size="xs" c="orange">
                  {w}
                </Text>
              ))}
            </Stack>
          ) : null}

          {nameSelected ? (
            <Text size="xs" c="dimmed">
              Applying a name change updates the CPS export label. Zone membership is unchanged.
            </Text>
          ) : null}

          {applyError ? (
            <Alert color="red" title="Cannot apply">
              {applyError}
            </Alert>
          ) : null}
        </Stack>

        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={() => setDiffOpen(false)}>
            Close
          </Button>
          {canApply ? <Button onClick={handleApply}>Apply selected</Button> : null}
        </Group>
      </Modal>
    </>
  );
}
