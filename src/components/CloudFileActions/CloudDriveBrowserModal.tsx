import { Button, Modal, Stack } from '@mantine/core';
import { useDriveFolderBrowser } from '../../hooks/useDriveFolderBrowser.ts';
import DriveFolderPanel from './DriveFolderPanel.tsx';

export interface CloudDriveBrowserModalProps {
  opened: boolean;
  onClose: () => void;
  title: string;
  /** Pick a single file — called with file id */
  onPickFile: (fileId: string, fileName: string) => void;
  /** Pick current folder for multi-file CPS import */
  onPickFolder?: (folderId: string, folderName: string) => void;
  fileFilter?: (name: string, mimeType?: string) => boolean;
  allowFolderImport?: boolean;
}

export default function CloudDriveBrowserModal({
  opened,
  onClose,
  title,
  onPickFile,
  onPickFolder,
  fileFilter,
  allowFolderImport = false,
}: CloudDriveBrowserModalProps) {
  const {
    folderStack,
    currentFolder,
    entries,
    loading,
    error,
    setError,
    enterFolder,
    goToFolder,
  } = useDriveFolderBrowser(opened);

  return (
    <Modal opened={opened} onClose={onClose} title={title} size="lg">
      <Stack gap="sm">
        <DriveFolderPanel
          folderStack={folderStack}
          entries={entries}
          loading={loading}
          error={error}
          onClearError={() => setError(null)}
          onEnterFolder={enterFolder}
          onGoToFolder={goToFolder}
          onPickFile={(id, name) => {
            onPickFile(id, name);
            onClose();
          }}
          fileFilter={fileFilter}
        />

        {allowFolderImport && onPickFolder ? (
          <Button
            variant="light"
            onClick={() => {
              onPickFolder(currentFolder.id, currentFolder.name);
              onClose();
            }}
          >
            Import CSV files from {currentFolder.name}
          </Button>
        ) : null}
      </Stack>
    </Modal>
  );
}
