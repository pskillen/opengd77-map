import { Alert, Badge, Button, Group, Modal, Stack, Text, TextInput } from '@mantine/core';
import { useCallback, useMemo, useState } from 'react';
import ModePill from '../crud/ModePill.tsx';
import {
  applyChannelMerges,
  findChannelMergeCandidates,
  formatChannelMergeReportLines,
  previewChannelMerges,
  type ChannelMergeCandidateGroup,
  type ChannelMergeSelection,
} from '../../lib/channelMergeCandidates.ts';
import { formatFrequencyHz } from '../../lib/formatFrequency.ts';
import { entityRefDisplayName } from '../../lib/entityRefs.ts';
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
          {channel.name}
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

export default function ChannelMergeCandidatesModal({
  opened,
  onClose,
}: ChannelMergeCandidatesModalProps) {
  const { codeplug, applyChannelMerges: applyMerges } = useCodeplug();
  const [candidates] = useState(() => findChannelMergeCandidates(codeplug));
  const [snapshotChannels] = useState(() => codeplug.channels);
  const [resultNames, setResultNames] = useState<Record<string, string>>(() =>
    Object.fromEntries(candidates.map((g) => [g.id, g.suggestedName])),
  );
  const [mergedGroupIds, setMergedGroupIds] = useState<Set<string>>(() => new Set());
  const [lastMergeNote, setLastMergeNote] = useState<string | null>(null);

  const setResultName = useCallback((groupId: string, resultName: string) => {
    setResultNames((prev) => ({ ...prev, [groupId]: resultName }));
  }, []);

  const previewForGroup = useCallback(
    (group: ChannelMergeCandidateGroup) => {
      const resultName = resultNames[group.id]?.trim() || group.suggestedName;
      const selection: ChannelMergeSelection = {
        groupId: group.id,
        sourceChannelIds: group.sourceChannelIds,
        resultName,
        enabled: true,
      };
      return previewChannelMerges(codeplug, [selection])[0];
    },
    [codeplug, resultNames],
  );

  const handleMergeOne = useCallback(
    (group: ChannelMergeCandidateGroup) => {
      if (mergedGroupIds.has(group.id) || group.mergeKind !== 'multiMode') return;

      const resultName = resultNames[group.id]?.trim() || group.suggestedName;
      const selection: ChannelMergeSelection = {
        groupId: group.id,
        sourceChannelIds: group.sourceChannelIds,
        resultName,
        enabled: true,
      };

      const preview = previewForGroup(group);
      if (preview?.validationIssues.some((i) => i.severity === 'error')) return;

      const { report } = applyChannelMerges(codeplug, [selection], [group]);
      applyMerges([selection], [group]);
      setMergedGroupIds((prev) => new Set([...prev, group.id]));
      const lines = formatChannelMergeReportLines(report);
      setLastMergeNote(lines.join(' · ') || `Merged into "${resultName}"`);
    },
    [applyMerges, codeplug, mergedGroupIds, previewForGroup, resultNames],
  );

  const displayCodeplug = useMemo(
    () => ({ ...codeplug, channels: snapshotChannels }),
    [codeplug, snapshotChannels],
  );

  return (
    <Modal opened={opened} onClose={onClose} title="Merge channel candidates" size="lg">
      <Stack gap="md">
        {lastMergeNote ? (
          <Alert color="green" variant="light">
            {lastMergeNote}
          </Alert>
        ) : null}

        {candidates.length === 0 ? (
          <Alert color="blue">No merge candidates found in this codeplug.</Alert>
        ) : (
          candidates.map((group) => {
            const merged = mergedGroupIds.has(group.id);
            const sources = group.sourceChannelIds
              .map((id) => channelById(snapshotChannels, id))
              .filter((ch): ch is Channel => ch != null);
            const isActionable = group.mergeKind === 'multiMode';
            const preview = !merged && isActionable ? previewForGroup(group) : undefined;
            const hasErrors = preview?.validationIssues.some((i) => i.severity === 'error');

            return (
              <Stack
                key={group.id}
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
                  {isActionable ? (
                    <Badge color="teal" variant="light">
                      Multi-mode
                    </Badge>
                  ) : group.mergeKind === 'multiTalkgroup' ? (
                    <Badge color="gray" variant="light">
                      Multi-talkgroup (not yet supported)
                    </Badge>
                  ) : (
                    <Badge color="orange" variant="light">
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
                  <TextInput
                    label="Result name"
                    value={resultNames[group.id] ?? group.suggestedName}
                    onChange={(e) => setResultName(group.id, e.currentTarget.value)}
                    size="sm"
                  />
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
                    <Button onClick={() => handleMergeOne(group)} disabled={merged || hasErrors}>
                      {merged ? 'Merged' : 'Merge'}
                    </Button>
                  </Group>
                ) : null}
              </Stack>
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
