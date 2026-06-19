import { Alert, Box, Button, Group, Stack, Text } from '@mantine/core';
import { IconFile, IconFolder, IconUpload } from '@tabler/icons-react';
import { useCallback, useRef, useState } from 'react';
import { collectFilesFromDataTransfer, importFiles } from '../../lib/import/index.ts';
import type { ImportResult } from '../../lib/import/types.ts';
import { ICON_SIZE_ACTION, ICON_STROKE, ICON_SIZE_NAV } from '../../lib/iconSizes.ts';
import './ImportDropzone.css';

import { formatImportFileSummary } from '../../lib/importSummary.ts';

export interface ImportDropzoneProps {
  onResult: (result: ImportResult) => void;
  persistenceError?: string | null;
  onDismissPersistenceError?: () => void;
  hint?: string;
}

export default function ImportDropzone({
  onResult,
  persistenceError,
  onDismissPersistenceError,
  hint = 'Drop OpenGD77 CSV files or a whole export folder. Channels.csv, Zones.csv, Contacts.csv, and TG_Lists.csv are recognised; DTMF.csv and APRS.csv are skipped.',
}: ImportDropzoneProps) {
  const [dragover, setDragover] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const filesInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    async (files: File[]) => {
      if (!files.length) return;
      try {
        const result = await importFiles(files);
        onResult(result);
        setSummary(formatImportFileSummary(result.recognised, result.skipped, result.errors));
        setError(result.errors.length ? result.errors.map((e) => e.message).join('; ') : null);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    },
    [onResult],
  );

  const onDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setDragover(false);
      const files = await collectFilesFromDataTransfer(e.dataTransfer);
      await handleFiles(files);
    },
    [handleFiles],
  );

  return (
    <Stack gap="sm">
      <Text size="sm" c="dimmed">
        {hint
          .split(/(Channels\.csv|Zones\.csv|Contacts\.csv|TG_Lists\.csv)/)
          .map((part, i) =>
            part === 'Channels.csv' ||
            part === 'Zones.csv' ||
            part === 'Contacts.csv' ||
            part === 'TG_Lists.csv' ? (
              <code key={i}>{part}</code>
            ) : (
              part
            ),
          )}
      </Text>

      {persistenceError ? (
        <Alert color="yellow" onClose={onDismissPersistenceError} withCloseButton>
          {persistenceError}
        </Alert>
      ) : null}

      {error ? (
        <Alert color="red" onClose={() => setError(null)} withCloseButton>
          {error}
        </Alert>
      ) : null}

      {summary ? (
        <Text size="sm" c="dimmed">
          {summary}
        </Text>
      ) : null}

      <Box
        className={`import-dropzone${dragover ? ' dragover' : ''}`}
        tabIndex={0}
        onClick={() => filesInputRef.current?.click()}
        onDragEnter={(e) => {
          e.preventDefault();
          setDragover(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragover(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragover(false);
        }}
        onDrop={onDrop}
      >
        <Stack gap="xs" align="center">
          <IconUpload size={ICON_SIZE_ACTION} stroke={ICON_STROKE} />
          <Text size="sm">Drop CSV files or a folder here, or click to choose files</Text>
        </Stack>
        <input
          ref={filesInputRef}
          type="file"
          accept=".csv,text/csv"
          multiple
          hidden
          onChange={(e) => {
            const list = e.target.files ? [...e.target.files] : [];
            void handleFiles(list);
            e.target.value = '';
          }}
        />
      </Box>

      <Group grow>
        <Button
          variant="default"
          leftSection={<IconFile size={ICON_SIZE_NAV} stroke={ICON_STROKE} />}
          onClick={() => filesInputRef.current?.click()}
        >
          Choose files
        </Button>
        <Button
          variant="default"
          leftSection={<IconFolder size={ICON_SIZE_NAV} stroke={ICON_STROKE} />}
          onClick={() => folderInputRef.current?.click()}
        >
          Choose folder
        </Button>
      </Group>

      <input
        ref={folderInputRef}
        type="file"
        accept=".csv,text/csv"
        hidden
        multiple
        {...({ webkitdirectory: '', directory: '' } as React.InputHTMLAttributes<HTMLInputElement>)}
        onChange={(e) => {
          const list = e.target.files ? [...e.target.files] : [];
          void handleFiles(list);
          e.target.value = '';
        }}
      />
    </Stack>
  );
}
