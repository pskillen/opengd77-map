import {
  Alert,
  Badge,
  Button,
  Group,
  Modal,
  Slider,
  Stack,
  Switch,
  Text,
  TextInput,
} from '@mantine/core';
import { useCallback, useMemo, useState } from 'react';
import ModePill from '../crud/ModePill.tsx';
import {
  applyChannelMerges,
  defaultChannelMergeFindSettings,
  findChannelMergeCandidates,
  formatChannelMergeReportLines,
  formatMhzInputFromHz,
  nameSimilaritySliderToThreshold,
  nameSimilarityThresholdToSlider,
  previewChannelMerges,
  suggestedMergeResultFrequencies,
  type ChannelMergeCandidateGroup,
  type ChannelMergeFindSettings,
  type ChannelMergeSelection,
} from '../../lib/channelMergeCandidates.ts';
import { parseFrequencyHzFromMhzInput } from '../../lib/channelFields/frequencies.ts';
import { formatFrequencyHz } from '../../lib/formatFrequency.ts';
import { entityRefDisplayName } from '../../lib/entityRefs.ts';
import { channelDisplayLabel } from '../../lib/channelNaming.ts';
import type { Channel, Codeplug } from '../../models/codeplug.ts';
import { useCodeplug } from '../../state/codeplugStore.tsx';

export interface ChannelMergeCandidatesModalProps {
  opened: boolean;
  onClose: () => void;
}

function channelById(channels: Channel[], id: string): Channel | undefined {
  return channels.find((ch) => ch.id === id);
}

function SourceChannelSummary({ channel, codeplug }: { channel: Channel; codeplug: Codeplug }) {
  const contact =
    entityRefDisplayName(channel.contactRef, codeplug.talkGroups, codeplug.contacts) || '—';
  const rgl = channel.rxGroupListId
    ? (codeplug.rxGroupLists.find((r) => r.id === channel.rxGroupListId)?.name ?? '—')
    : '—';

  return (
    <Stack gap={4}>
      <Group gap="xs" wrap="wrap">
        <Text size="sm" fw={500}>
          {channelDisplayLabel(channel, true) || '—'}
        </Text>
        <ModePill mode={channel.mode} size="xs" />
      </Group>
      <Text size="xs" c="dimmed">
        RX {formatFrequencyHz(channel.rxFrequency)} · TX {formatFrequencyHz(channel.txFrequency)}
      </Text>
      <Text size="xs" c="dimmed">
        Contact {contact} · RX list {rgl}
      </Text>
    </Stack>
  );
}

function CandidateGroupCard({
  group,
  merged,
  snapshotChannels,
  displayCodeplug,
  resultName,
  onResultNameChange,
  rxMhz,
  txMhz,
  onRxMhzChange,
  onTxMhzChange,
  preview,
  onMerge,
}: {
  group: ChannelMergeCandidateGroup;
  merged: boolean;
  snapshotChannels: Channel[];
  displayCodeplug: Codeplug;
  resultName: string;
  onResultNameChange: (name: string) => void;
  rxMhz: string;
  txMhz: string;
  onRxMhzChange: (mhz: string) => void;
  onTxMhzChange: (mhz: string) => void;
  preview: ReturnType<typeof previewChannelMerges>[number] | undefined;
  onMerge: () => void;
}) {
  const sources = group.sourceChannelIds
    .map((id) => channelById(snapshotChannels, id))
    .filter((ch): ch is Channel => ch != null);
  const isActionable = group.mergeKind === 'multiMode' || group.mergeKind === 'multiTalkgroup';
  const hasErrors = preview?.validationIssues.some((i) => i.severity === 'error');

  return (
    <Stack
      gap="xs"
      p="sm"
      style={{
        border: '1px solid var(--mantine-color-gray-3)',
        borderRadius: 8,
        opacity: merged ? 0.55 : 1,
        background: merged ? 'var(--mantine-color-gray-0)' : undefined,
      }}
    >
      <Group justify="space-between" align="flex-start">
        {merged ? (
          <Text size="sm" c="dimmed" fw={500}>
            Merged
          </Text>
        ) : null}
        {group.mergeKind === 'multiMode' ? (
          <Badge color="teal" variant="light" ml="auto">
            Multi-mode
          </Badge>
        ) : group.mergeKind === 'multiTalkgroup' ? (
          <Badge color="teal" variant="light" ml="auto">
            Multi-talkgroup
          </Badge>
        ) : (
          <Badge color="orange" variant="light" ml="auto">
            Ambiguous
          </Badge>
        )}
      </Group>

      {group.ambiguousReason ? (
        <Text size="xs" c="orange">
          {group.ambiguousReason}
        </Text>
      ) : null}

      {sources.map((ch) => (
        <SourceChannelSummary key={ch.id} channel={ch} codeplug={displayCodeplug} />
      ))}

      {isActionable && !merged ? (
        <>
          <TextInput
            label="Result name"
            value={resultName}
            onChange={(e) => onResultNameChange(e.currentTarget.value)}
            size="sm"
          />
          <Group gap="sm" align="flex-end" wrap="nowrap">
            <Text size="sm" fw={500} style={{ flexShrink: 0 }}>
              RX
            </Text>
            <TextInput
              flex={1}
              value={rxMhz}
              onChange={(e) => onRxMhzChange(e.currentTarget.value)}
              size="sm"
              aria-label="Result RX MHz"
            />
            <Text size="sm" fw={500} style={{ flexShrink: 0 }}>
              TX
            </Text>
            <TextInput
              flex={1}
              value={txMhz}
              onChange={(e) => onTxMhzChange(e.currentTarget.value)}
              size="sm"
              aria-label="Result TX MHz"
            />
          </Group>
        </>
      ) : null}

      {hasErrors ? (
        <Alert color="red" title="Validation">
          {preview!.validationIssues
            .filter((i) => i.severity === 'error')
            .map((i) => (
              <Text key={i.field} size="sm">
                {i.message}
              </Text>
            ))}
        </Alert>
      ) : null}

      {isActionable ? (
        <Group justify="flex-end">
          <Button onClick={onMerge} disabled={merged || hasErrors}>
            {merged ? 'Merged' : 'Merge'}
          </Button>
        </Group>
      ) : null}
    </Stack>
  );
}

export default function ChannelMergeCandidatesModal({
  opened,
  onClose,
}: ChannelMergeCandidatesModalProps) {
  const { codeplug, applyChannelMerges: applyMerges } = useCodeplug();
  const [findSettings, setFindSettings] = useState(defaultChannelMergeFindSettings);
  const [snapshotChannels] = useState(() => codeplug.channels);
  const [mergedGroups, setMergedGroups] = useState<ChannelMergeCandidateGroup[]>([]);
  const [resultNames, setResultNames] = useState<Record<string, string>>({});
  const [resultFreqMhz, setResultFreqMhz] = useState<Record<string, { rx: string; tx: string }>>(
    {},
  );
  const [lastMergeNote, setLastMergeNote] = useState<string | null>(null);

  const candidates = useMemo(
    () => findChannelMergeCandidates(codeplug, findSettings),
    [codeplug, findSettings],
  );

  const mergedIds = useMemo(() => new Set(mergedGroups.map((g) => g.id)), [mergedGroups]);

  const activeCandidates = useMemo(
    () => candidates.filter((g) => !mergedIds.has(g.id)),
    [candidates, mergedIds],
  );

  const displayGroups = useMemo(
    () => [...mergedGroups, ...activeCandidates],
    [mergedGroups, activeCandidates],
  );

  const setResultName = useCallback((groupId: string, resultName: string) => {
    setResultNames((prev) => ({ ...prev, [groupId]: resultName }));
  }, []);

  const sourcesForGroup = useCallback(
    (group: ChannelMergeCandidateGroup) =>
      group.sourceChannelIds
        .map((id) => channelById(snapshotChannels, id))
        .filter((ch): ch is Channel => ch != null),
    [snapshotChannels],
  );

  const freqMhzForGroup = useCallback(
    (group: ChannelMergeCandidateGroup) => {
      const suggested = suggestedMergeResultFrequencies(sourcesForGroup(group));
      const stored = resultFreqMhz[group.id];
      return {
        rx: stored?.rx ?? formatMhzInputFromHz(suggested.rxFrequency),
        tx: stored?.tx ?? formatMhzInputFromHz(suggested.txFrequency),
      };
    },
    [resultFreqMhz, sourcesForGroup],
  );

  const setResultFreqMhzForGroup = useCallback(
    (group: ChannelMergeCandidateGroup, patch: Partial<{ rx: string; tx: string }>) => {
      const current = freqMhzForGroup(group);
      setResultFreqMhz((prev) => ({
        ...prev,
        [group.id]: {
          rx: patch.rx ?? current.rx,
          tx: patch.tx ?? current.tx,
        },
      }));
    },
    [freqMhzForGroup],
  );

  const buildSelection = useCallback(
    (group: ChannelMergeCandidateGroup): ChannelMergeSelection => {
      const { rx, tx } = freqMhzForGroup(group);
      return {
        groupId: group.id,
        sourceChannelIds: group.sourceChannelIds,
        resultName: resultNames[group.id]?.trim() || group.suggestedName,
        enabled: true,
        rxFrequency: parseFrequencyHzFromMhzInput(rx),
        txFrequency: parseFrequencyHzFromMhzInput(tx),
      };
    },
    [freqMhzForGroup, resultNames],
  );

  const previewForGroup = useCallback(
    (group: ChannelMergeCandidateGroup) =>
      previewChannelMerges(codeplug, [buildSelection(group)], candidates)[0],
    [buildSelection, codeplug, candidates],
  );

  const handleMergeOne = useCallback(
    (group: ChannelMergeCandidateGroup) => {
      if (
        mergedIds.has(group.id) ||
        (group.mergeKind !== 'multiMode' && group.mergeKind !== 'multiTalkgroup')
      ) {
        return;
      }

      const selection = buildSelection(group);
      const preview = previewForGroup(group);
      if (preview?.validationIssues.some((i) => i.severity === 'error')) return;

      const { report } = applyChannelMerges(codeplug, [selection], [group]);
      applyMerges([selection], [group]);
      setMergedGroups((prev) => [...prev, group]);
      const lines = formatChannelMergeReportLines(report);
      setLastMergeNote(lines.join(' · ') || `Merged into "${selection.resultName}"`);
    },
    [applyMerges, buildSelection, codeplug, mergedIds, previewForGroup],
  );

  const displayCodeplug = useMemo(
    () => ({ ...codeplug, channels: snapshotChannels }),
    [codeplug, snapshotChannels],
  );

  const similaritySlider = nameSimilarityThresholdToSlider(findSettings.nameFuzzyThreshold);

  const updateFindSettings = useCallback((patch: Partial<ChannelMergeFindSettings>) => {
    setFindSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  return (
    <Modal opened={opened} onClose={onClose} title="Merge channel candidates" size="lg">
      <Stack gap="md">
        <Stack
          gap="sm"
          p="sm"
          style={{ border: '1px solid var(--mantine-color-gray-3)', borderRadius: 8 }}
        >
          <Text size="sm" fw={500}>
            Match settings
          </Text>
          <Stack gap={4}>
            <Text size="xs" c="dimmed">
              Name similarity
            </Text>
            <Group justify="space-between" gap="xs">
              <Text size="xs" c="dimmed">
                Strict
              </Text>
              <Text size="xs" c="dimmed">
                Loose
              </Text>
            </Group>
            <Slider
              value={similaritySlider}
              onChange={(value) =>
                updateFindSettings({ nameFuzzyThreshold: nameSimilaritySliderToThreshold(value) })
              }
              min={0}
              max={100}
              label={null}
            />
          </Stack>
          <Switch
            label="Match RX frequency"
            checked={findSettings.matchRxFrequency}
            onChange={(e) => updateFindSettings({ matchRxFrequency: e.currentTarget.checked })}
          />
          <Switch
            label="Match TX frequency"
            checked={findSettings.matchTxFrequency}
            onChange={(e) => updateFindSettings({ matchTxFrequency: e.currentTarget.checked })}
          />
        </Stack>

        {lastMergeNote ? (
          <Alert color="green" variant="light">
            {lastMergeNote}
          </Alert>
        ) : null}

        {displayGroups.length === 0 ? (
          <Alert color="blue">No merge candidates found with these settings.</Alert>
        ) : (
          displayGroups.map((group) => {
            const { rx, tx } = freqMhzForGroup(group);
            return (
              <CandidateGroupCard
                key={group.id}
                group={group}
                merged={mergedIds.has(group.id)}
                snapshotChannels={snapshotChannels}
                displayCodeplug={displayCodeplug}
                resultName={resultNames[group.id] ?? group.suggestedName}
                onResultNameChange={(name) => setResultName(group.id, name)}
                rxMhz={rx}
                txMhz={tx}
                onRxMhzChange={(mhz) => setResultFreqMhzForGroup(group, { rx: mhz })}
                onTxMhzChange={(mhz) => setResultFreqMhzForGroup(group, { tx: mhz })}
                preview={mergedIds.has(group.id) ? undefined : previewForGroup(group)}
                onMerge={() => handleMergeOne(group)}
              />
            );
          })
        )}

        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Close
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
