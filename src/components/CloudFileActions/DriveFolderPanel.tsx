import { Fragment, useState } from 'react';
import {
  Alert,
  Anchor,
  Box,
  Button,
  Group,
  Stack,
  Text,
  TextInput,
  UnstyledButton,
} from '@mantine/core';
import { IconFile, IconFolder, IconFolderPlus } from '@tabler/icons-react';
import type { DriveFolderRef } from '../../hooks/useDriveFolderBrowser.ts';
import type { RemoteDriveEntry } from '../../lib/cloud/types.ts';
import { ICON_SIZE_NAV, ICON_STROKE } from '../../lib/iconSizes.ts';

export interface DriveFolderPanelProps {
  folderStack: readonly DriveFolderRef[];
  entries: readonly RemoteDriveEntry[];
  loading: boolean;
  error: string | null;
  onClearError: () => void;
  onEnterFolder: (id: string, name: string) => void;
  onGoToFolder: (index: number) => void;
  onCreateFolder?: (name: string) => Promise<void>;
  /** When set, files matching the filter are listed and clickable. */
  onPickFile?: (id: string, name: string) => void;
  fileFilter?: (name: string, mimeType?: string) => boolean;
  foldersOnly?: boolean;
  creatingFolder?: boolean;
}

export default function DriveFolderPanel({
  folderStack,
  entries,
  loading,
  error,
  onClearError,
  onEnterFolder,
  onGoToFolder,
  onCreateFolder,
  onPickFile,
  fileFilter,
  foldersOnly = false,
  creatingFolder = false,
}: DriveFolderPanelProps) {
  const [newFolderName, setNewFolderName] = useState('');

  const folders = entries.filter((entry) => entry.isFolder);
  const files =
    foldersOnly || !onPickFile
      ? []
      : entries.filter((entry) => {
          if (entry.isFolder) return false;
          if (!fileFilter) return true;
          const fileRef = entry.ref;
          return fileFilter(fileRef.name, 'mimeType' in fileRef ? fileRef.mimeType : undefined);
        });

  const handleCreateFolder = () => {
    if (!onCreateFolder) return;
    const trimmed = newFolderName.trim();
    if (!trimmed) return;
    void onCreateFolder(trimmed).then(() => setNewFolderName(''));
  };

  return (
    <Stack gap="sm">
      <Box>
        <Text size="xs" c="dimmed" mb={4}>
          Folder
        </Text>
        <Group gap={4} wrap="wrap">
          {folderStack.map((folder, index) => (
            <Fragment key={folder.id}>
              {index > 0 ? (
                <Text size="sm" c="dimmed">
                  /
                </Text>
              ) : null}
              <Anchor
                component="button"
                type="button"
                size="sm"
                fw={index === folderStack.length - 1 ? 600 : 400}
                c={index === folderStack.length - 1 ? undefined : 'dimmed'}
                onClick={() => onGoToFolder(index)}
                disabled={index === folderStack.length - 1}
                underline="hover"
              >
                {folder.name}
              </Anchor>
            </Fragment>
          ))}
        </Group>
      </Box>

      {onCreateFolder ? (
        <Group align="flex-end" wrap="nowrap" gap="xs">
          <TextInput
            label="New folder"
            placeholder="Folder name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateFolder();
            }}
            style={{ flex: 1 }}
          />
          <Button
            variant="light"
            leftSection={<IconFolderPlus size={ICON_SIZE_NAV} stroke={ICON_STROKE} />}
            loading={creatingFolder}
            onClick={handleCreateFolder}
            disabled={!newFolderName.trim()}
          >
            Create
          </Button>
        </Group>
      ) : null}

      {error ? (
        <Alert color="red" onClose={onClearError} withCloseButton>
          {error}
        </Alert>
      ) : null}

      {loading ? <Text size="sm">Loading…</Text> : null}

      {!loading ? (
        <Stack gap={4}>
          {folders.length === 0 && files.length === 0 ? (
            <Text size="sm" c="dimmed">
              {foldersOnly
                ? 'No subfolders in this location.'
                : 'No matching files in this folder.'}
            </Text>
          ) : null}
          {folders.map((entry) => (
            <UnstyledButton
              key={entry.ref.id}
              onClick={() => onEnterFolder(entry.ref.id, entry.ref.name)}
              style={{ padding: '8px 4px', borderRadius: 4 }}
            >
              <Group gap="xs">
                <IconFolder size={ICON_SIZE_NAV} stroke={ICON_STROKE} />
                <Text size="sm">{entry.ref.name}</Text>
              </Group>
            </UnstyledButton>
          ))}
          {files.map((entry) => (
            <UnstyledButton
              key={entry.ref.id}
              onClick={() => onPickFile?.(entry.ref.id, entry.ref.name)}
              style={{ padding: '8px 4px', borderRadius: 4 }}
            >
              <Group gap="xs">
                <IconFile size={ICON_SIZE_NAV} stroke={ICON_STROKE} />
                <Text size="sm">{entry.ref.name}</Text>
              </Group>
            </UnstyledButton>
          ))}
        </Stack>
      ) : null}
    </Stack>
  );
}
