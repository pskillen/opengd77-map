import { Alert, Button, Group, Modal, Stack, Text, TextInput, UnstyledButton } from '@mantine/core';
import { IconChevronLeft, IconFolder } from '@tabler/icons-react';
import { useState } from 'react';
import { useDriveFolderBrowser } from '../../hooks/useDriveFolderBrowser.ts';
import { ICON_SIZE_NAV, ICON_STROKE } from '../../lib/iconSizes.ts';

export interface CloudDriveSaveModalProps {
  opened: boolean;
  onClose: () => void;
  /** Single-file export — editable destination file name. */
  defaultFileName?: string;
  /** Multi-file CPS export — dated subfolder created inside the picked folder. */
  defaultSubfolderName?: string;
  isMultiFile: boolean;
  saving?: boolean;
  onSave: (input: {
    parentFolderId: string;
    parentFolderName: string;
    fileName?: string;
    subfolderName?: string;
  }) => void;
}

export default function CloudDriveSaveModal({
  opened,
  onClose,
  defaultFileName = 'export.yaml',
  defaultSubfolderName = 'cps-export',
  isMultiFile,
  saving = false,
  onSave,
}: CloudDriveSaveModalProps) {
  const { folderStack, currentFolder, entries, loading, error, setError, enterFolder, goUp } =
    useDriveFolderBrowser(opened);
  const [fileName, setFileName] = useState(defaultFileName);
  const [subfolderName, setSubfolderName] = useState(defaultSubfolderName);

  const folders = entries.filter((entry) => entry.isFolder);

  const handleSave = () => {
    if (isMultiFile) {
      const trimmed = subfolderName.trim();
      if (!trimmed) {
        setError('Enter a subfolder name for the CPS export.');
        return;
      }
      onSave({
        parentFolderId: currentFolder.id,
        parentFolderName: currentFolder.name,
        subfolderName: trimmed,
      });
      return;
    }

    const trimmed = fileName.trim();
    if (!trimmed) {
      setError('Enter a file name.');
      return;
    }
    onSave({
      parentFolderId: currentFolder.id,
      parentFolderName: currentFolder.name,
      fileName: trimmed,
    });
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Save to Google Drive" size="lg">
      <Stack gap="sm">
        <Text size="sm" c="dimmed">
          Choose a destination folder{isMultiFile ? ' — a dated subfolder will be created' : ''}.
        </Text>

        {isMultiFile ? (
          <TextInput
            label="Subfolder name"
            description="CSV files are saved inside this new folder"
            value={subfolderName}
            onChange={(e) => setSubfolderName(e.currentTarget.value)}
          />
        ) : (
          <TextInput
            label="File name"
            value={fileName}
            onChange={(e) => setFileName(e.currentTarget.value)}
          />
        )}

        <Group justify="space-between">
          <Text size="sm" fw={500}>
            {currentFolder.name}
          </Text>
          {folderStack.length > 1 ? (
            <Button
              variant="subtle"
              size="compact-sm"
              leftSection={<IconChevronLeft size={ICON_SIZE_NAV} stroke={ICON_STROKE} />}
              onClick={goUp}
            >
              Up
            </Button>
          ) : null}
        </Group>

        {error ? (
          <Alert color="red" onClose={() => setError(null)} withCloseButton>
            {error}
          </Alert>
        ) : null}

        {loading ? <Text size="sm">Loading…</Text> : null}

        {!loading ? (
          <Stack gap={4}>
            {folders.length === 0 ? (
              <Text size="sm" c="dimmed">
                No subfolders — save to this folder.
              </Text>
            ) : null}
            {folders.map((entry) => (
              <UnstyledButton
                key={entry.ref.id}
                onClick={() => enterFolder(entry.ref.id, entry.ref.name)}
                style={{ padding: '8px 4px', borderRadius: 4 }}
              >
                <Group gap="xs">
                  <IconFolder size={ICON_SIZE_NAV} stroke={ICON_STROKE} />
                  <Text size="sm">{entry.ref.name}</Text>
                </Group>
              </UnstyledButton>
            ))}
          </Stack>
        ) : null}

        <Button loading={saving} onClick={handleSave}>
          {isMultiFile ? `Save to ${currentFolder.name}` : `Save file to ${currentFolder.name}`}
        </Button>
      </Stack>
    </Modal>
  );
}
