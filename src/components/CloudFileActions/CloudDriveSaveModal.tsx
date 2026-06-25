import { Button, Modal, Stack, Text, TextInput } from '@mantine/core';
import { useState } from 'react';
import { createDriveFolder, getGoogleDriveAccessToken } from '../../lib/cloud/googleDrive/index.ts';
import { useDriveFolderBrowser } from '../../hooks/useDriveFolderBrowser.ts';
import DriveFolderPanel from './DriveFolderPanel.tsx';

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
  const {
    folderStack,
    currentFolder,
    entries,
    loading,
    error,
    setError,
    enterFolder,
    goToFolder,
    refresh,
  } = useDriveFolderBrowser(opened);
  const [fileName, setFileName] = useState(defaultFileName);
  const [subfolderName, setSubfolderName] = useState(defaultSubfolderName);
  const [creatingFolder, setCreatingFolder] = useState(false);

  const handleCreateFolder = async (name: string) => {
    setCreatingFolder(true);
    setError(null);
    try {
      const token = await getGoogleDriveAccessToken();
      const folder = await createDriveFolder(token, {
        name,
        parentFolderId: currentFolder.id,
      });
      refresh();
      enterFolder(folder.id, folder.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setCreatingFolder(false);
    }
  };

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
          Browse to a folder
          {isMultiFile ? ', or create one, then confirm the export subfolder' : ''}.
        </Text>

        {isMultiFile ? (
          <TextInput
            label="Export subfolder name"
            description="CSV files are saved inside this new folder at the location below"
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

        <DriveFolderPanel
          folderStack={folderStack}
          entries={entries}
          loading={loading}
          error={error}
          onClearError={() => setError(null)}
          onEnterFolder={enterFolder}
          onGoToFolder={goToFolder}
          onCreateFolder={handleCreateFolder}
          foldersOnly
          creatingFolder={creatingFolder}
        />

        <Button loading={saving} onClick={handleSave}>
          {isMultiFile ? `Save to ${currentFolder.name}` : `Save file to ${currentFolder.name}`}
        </Button>
      </Stack>
    </Modal>
  );
}
