import { Button, Group, Modal, Stack, Table, Text } from '@mantine/core';
import { useMemo, useState } from 'react';
import {
  BrandMeisterDirectoryError,
  fetchStaticTalkgroups,
} from '../../lib/repeaterDirectories/registry.ts';
import {
  diffRxGroupListFromBrandMeister,
  findBrandMeisterDeviceIdForRxList,
} from '../../lib/repeaterDirectories/brandmeister/rxListDiff.ts';
import { entityDiffHasChanges } from '../../lib/repeaterDirectories/brandmeister/entityDiff.ts';
import { staticTalkgroupSlots } from '../../lib/repeaterDirectories/brandmeister/mapTalkGroups.ts';
import { prepareRxListCorrection } from '../../lib/repeaterDirectories/brandmeister/prepareRxListCorrection.ts';
import type { RxGroupList } from '../../models/codeplug.ts';
import { useCodeplug } from '../../state/codeplugStore.tsx';

export interface BrandMeisterRxListVerifyProps {
  rxGroupList: RxGroupList;
}

export default function BrandMeisterRxListVerify({ rxGroupList }: BrandMeisterRxListVerifyProps) {
  const { codeplug, applyBrandMeisterRxListCorrection } = useCodeplug();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [diffOpen, setDiffOpen] = useState(false);
  const [diffRows, setDiffRows] = useState<ReturnType<typeof diffRxGroupListFromBrandMeister>>([]);
  const [correctionPlan, setCorrectionPlan] = useState<
    Awaited<ReturnType<typeof prepareRxListCorrection>>
  >(null);
  const [staticSlots, setStaticSlots] = useState<
    ReturnType<typeof staticTalkgroupSlots>
  >([]);

  const deviceId = useMemo(
    () => findBrandMeisterDeviceIdForRxList(rxGroupList, codeplug),
    [rxGroupList, codeplug],
  );

  const linkedChannel = useMemo(
    () =>
      codeplug.channels.find(
        (ch) =>
          ch.rxGroupListId === rxGroupList.id &&
          ch.meta?.repeaterDirectory?.sourceId === 'brandmeister',
      ),
    [codeplug.channels, rxGroupList.id],
  );

  const handleCheck = async () => {
    if (deviceId == null) {
      setError('Link a BrandMeister channel to this RX list to verify membership.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const staticTgs = await fetchStaticTalkgroups(deviceId);
      const rows = diffRxGroupListFromBrandMeister(rxGroupList, staticTgs, codeplug);
      setDiffRows(rows);
      setStaticSlots(staticTalkgroupSlots(staticTgs));

      if (!entityDiffHasChanges(rows)) {
        setCorrectionPlan(null);
        setDiffOpen(true);
        return;
      }

      const device = {
        id: deviceId,
        callsign: linkedChannel?.callsign ?? '',
      };
      const plan = await prepareRxListCorrection(codeplug, device, rxGroupList);
      if (!plan || (plan.memberRefs.length === 0 && plan.newTalkGroups.length === 0)) {
        setError(plan?.warnings[0] ?? 'Cannot build RX list correction.');
        return;
      }

      setCorrectionPlan(plan);
      setDiffOpen(true);
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

  const handleApply = () => {
    if (!correctionPlan) {
      setDiffOpen(false);
      return;
    }

    const memberSpecs = staticSlots.map(({ number, timeslot }) => ({ number, timeslot }));
    applyBrandMeisterRxListCorrection(
      {
        newTalkGroups: correctionPlan.newTalkGroups,
        rxListMembers: memberSpecs,
        action: 'update',
        existingRxGroupListId: rxGroupList.id,
        newListName: rxGroupList.name,
      },
      undefined,
    );
    setDiffOpen(false);
  };

  return (
    <>
      <Stack gap={4}>
        <Button
          variant="light"
          size="sm"
          loading={loading}
          disabled={deviceId == null}
          onClick={() => void handleCheck()}
        >
          Check BrandMeister
        </Button>
        {deviceId == null ? (
          <Text size="xs" c="dimmed" maw={220}>
            Assign this list to a channel imported from BrandMeister first.
          </Text>
        ) : null}
        {error ? (
          <Text size="xs" c="red" maw={220}>
            {error}
          </Text>
        ) : null}
      </Stack>

      <Modal
        opened={diffOpen}
        onClose={() => setDiffOpen(false)}
        title="BrandMeister vs local"
        size="lg"
      >
        {!entityDiffHasChanges(diffRows) ? (
          <Text size="sm">RX group list membership matches the repeater static talk groups.</Text>
        ) : (
          <Stack gap="md">
            <Table withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Field</Table.Th>
                  <Table.Th>Local</Table.Th>
                  <Table.Th>Remote</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {diffRows
                  .filter((r) => r.changed)
                  .map((row) => (
                    <Table.Tr key={row.field}>
                      <Table.Td>{row.label}</Table.Td>
                      <Table.Td>{row.local}</Table.Td>
                      <Table.Td>{row.remote}</Table.Td>
                    </Table.Tr>
                  ))}
              </Table.Tbody>
            </Table>
            {correctionPlan?.newTalkGroups.length ? (
              <Text size="xs" c="dimmed">
                Apply creates talk group(s){' '}
                {correctionPlan.newTalkGroups.map((tg) => tg.number).join(', ')} by DMR ID, then
                updates membership and timeslots.
              </Text>
            ) : (
              <Text size="xs" c="dimmed">
                Apply updates membership and timeslots for matching DMR talk group IDs.
              </Text>
            )}
          </Stack>
        )}
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={() => setDiffOpen(false)}>
            Close
          </Button>
          {correctionPlan ? <Button onClick={handleApply}>Apply correction</Button> : null}
        </Group>
      </Modal>
    </>
  );
}
