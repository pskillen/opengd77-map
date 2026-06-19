import { Alert, Button, Group, Modal, SegmentedControl, Stack, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useCallback, useState } from 'react';
import type { ImportApplyMode, ImportMergeReport } from '../../lib/importMerge.ts';
import { previewImportMerge } from '../../lib/importMerge.ts';
import type { ImportResult } from '../../lib/import/types.ts';
import { formatImportFileSummary, formatMergeReportLines } from '../../lib/importSummary.ts';
import type { VendorFormatOption } from '../../lib/vendorFormats.ts';
import { useCodeplug, useProjects } from '../../state/codeplugStore.tsx';
import ImportDropzone from '../ImportDropzone/ImportDropzone.tsx';

export interface ImportIntoActivePanelProps {
  vendorFormat: VendorFormatOption;
}

export default function ImportIntoActivePanel({ vendorFormat }: ImportIntoActivePanelProps) {
  const { codeplug } = useCodeplug();
  const { applyImportToActive, persistenceError, clearPersistenceError } = useProjects();
  const [mode, setMode] = useState<ImportApplyMode>('merge');
  const [pendingResult, setPendingResult] = useState<ImportResult | null>(null);
  const [pendingReport, setPendingReport] = useState<ImportMergeReport | null>(null);
  const [appliedSummary, setAppliedSummary] = useState<string | null>(null);
  const [confirmOpen, { open: openConfirm, close: closeConfirm }] = useDisclosure(false);

  const onParsed = useCallback(
    (result: ImportResult) => {
      const report = previewImportMerge(codeplug, result, mode);
      setPendingResult(result);
      setPendingReport(report);
      setAppliedSummary(null);
      openConfirm();
    },
    [codeplug, mode, openConfirm],
  );

  const handleConfirm = useCallback(() => {
    if (!pendingResult || !pendingReport) return;
    if (pendingReport.hasChanges) {
      applyImportToActive(pendingResult, mode);
      const fileSummary = formatImportFileSummary(
        pendingResult.recognised,
        pendingResult.skipped,
        pendingResult.errors,
      );
      const mergeLines = formatMergeReportLines(pendingReport);
      const parts = [fileSummary, ...mergeLines].filter(Boolean);
      setAppliedSummary(parts.join(' · '));
    }
    setPendingResult(null);
    setPendingReport(null);
    closeConfirm();
  }, [applyImportToActive, closeConfirm, mode, pendingReport, pendingResult]);

  const handleCancel = useCallback(() => {
    setPendingResult(null);
    setPendingReport(null);
    closeConfirm();
  }, [closeConfirm]);

  const modeLabel = mode === 'merge' ? 'Merge' : 'Overwrite';
  const hasRemovalWarning =
    pendingReport?.mode === 'overwrite' &&
    [
      pendingReport.channels,
      pendingReport.zones,
      pendingReport.contacts,
      pendingReport.talkGroups,
      pendingReport.rxGroupLists,
    ].some((s) => s.removed > 0);

  if (vendorFormat.importStatus !== 'shipped') {
    return (
      <Alert color="gray" title="Import not available yet">
        {vendorFormat.label} import is planned
        {vendorFormat.issue ? ` (${vendorFormat.issue})` : ''}. OpenGD77 CPS CSV is supported today.
      </Alert>
    );
  }

  if (vendorFormat.id !== 'opengd77') {
    return (
      <Alert color="gray" title="Import not available">
        No importer is registered for {vendorFormat.label}.
      </Alert>
    );
  }

  return (
    <Stack gap="sm">
      <SegmentedControl
        value={mode}
        onChange={(value) => setMode(value as ImportApplyMode)}
        data={[
          { label: 'Merge', value: 'merge' },
          { label: 'Overwrite', value: 'overwrite' },
        ]}
      />
      <Text size="sm" c="dimmed">
        {mode === 'merge'
          ? 'Match by channel/zone/contact name. Only changed rows are updated; re-importing the same file changes nothing.'
          : 'Replace entire lists for each file type imported (e.g. all channels if Channels.csv is included).'}
      </Text>

      <ImportDropzone
        onResult={onParsed}
        persistenceError={persistenceError}
        onDismissPersistenceError={clearPersistenceError}
        hint="Drop OpenGD77 CSV files into the active codeplug. Channels.csv, Zones.csv, Contacts.csv, and TG_Lists.csv are recognised."
      />

      {appliedSummary ? (
        <Text size="sm" c="dimmed">
          Import applied: {appliedSummary}
        </Text>
      ) : null}

      <Modal
        opened={confirmOpen}
        onClose={handleCancel}
        title={`Import into active codeplug (${modeLabel})`}
      >
        {pendingResult && pendingReport ? (
          <Stack gap="md">
            {pendingReport.hasChanges ? null : (
              <Alert color="blue">No changes — codeplug already matches import.</Alert>
            )}

            {formatImportFileSummary(
              pendingResult.recognised,
              pendingResult.skipped,
              pendingResult.errors,
            ) ? (
              <Text size="sm">
                {formatImportFileSummary(
                  pendingResult.recognised,
                  pendingResult.skipped,
                  pendingResult.errors,
                )}
              </Text>
            ) : null}

            {formatMergeReportLines(pendingReport).map((line) => (
              <Text key={line} size="sm">
                {line}
              </Text>
            ))}

            {hasRemovalWarning ? (
              <Alert color="yellow">
                Overwrite will remove existing rows for each imported file type. This cannot be
                undone except by re-importing a backup.
              </Alert>
            ) : null}

            {pendingReport.unresolvedZoneMembers.length ? (
              <Alert color="orange" title="Unresolved zone members">
                {pendingReport.unresolvedZoneMembers.map(({ zoneName, memberNames }) => (
                  <Text key={zoneName} size="sm">
                    {zoneName}: {memberNames.join(', ')}
                  </Text>
                ))}
              </Alert>
            ) : null}

            <Group justify="flex-end">
              <Button variant="default" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleConfirm}>
                {pendingReport.hasChanges ? 'Apply import' : 'Close'}
              </Button>
            </Group>
          </Stack>
        ) : null}
      </Modal>
    </Stack>
  );
}
