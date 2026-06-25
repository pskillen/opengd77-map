import { Alert, Button, Divider, Group, Stack, Text } from '@mantine/core';
import { useMemo, useState } from 'react';
import { useDisclosure } from '@mantine/hooks';
import GoogleDriveLogo from '../GoogleDriveLogo/GoogleDriveLogo.tsx';
import { DEFAULT_CHIRP_PROFILE_ID, getChirpProfile } from '../../lib/chirp/profiles.ts';
import {
  defaultMultiFileCpsFolderName,
  defaultNativeYamlDriveFileName,
  defaultSingleFileDriveFileName,
  exportDateStamp,
} from '../../lib/export/exportFileName.ts';
import { getExportAdapter } from '../../lib/import-export/registry.ts';
import { buildExportPayload } from '../../lib/fileDelivery/index.ts';
import { importFromSources } from '../../lib/fileDelivery/importFromSources.ts';
import type { ImportResult } from '../../lib/import/types.ts';
import {
  createDriveFolder,
  createDriveTextFile,
  getGoogleDriveAccessToken,
  listDriveCsvInFolder,
  readDriveTextFile,
} from '../../lib/cloud/googleDrive/index.ts';
import type { VendorFormatId } from '../../lib/import-export/types.ts';
import { isGoogleDriveConfigured } from '../../lib/cloud/googleDrive/config.ts';
import { isGoogleDriveConnected } from '../../lib/cloud/googleDrive/auth.ts';
import { useGoogleDriveConnection } from '../../hooks/useGoogleDriveConnection.ts';
import type { CodeplugProject } from '../../models/codeplugProject.ts';
import type { Codeplug } from '../../models/codeplug.ts';
import CloudDriveBrowserModal from './CloudDriveBrowserModal.tsx';
import CloudDriveSaveModal from './CloudDriveSaveModal.tsx';

export interface CloudFileActionsImportProps {
  mode: 'import';
  vendorFormatId: VendorFormatId;
  profileId?: string;
  onImportResult: (result: ImportResult) => void;
}

export interface CloudFileActionsExportProps {
  mode: 'export';
  vendorFormatId: VendorFormatId;
  codeplug: Codeplug;
  project?: CodeplugProject | null;
  exportOptions?: Parameters<typeof buildExportPayload>[1]['options'];
  onComplete?: (message: string) => void;
}

export type CloudFileActionsProps = CloudFileActionsImportProps | CloudFileActionsExportProps;

function isYamlFormat(formatId: VendorFormatId): boolean {
  return formatId === 'native-yaml';
}

function isMultiFileCps(formatId: VendorFormatId): boolean {
  return formatId === 'opengd77' || formatId === 'dm32';
}

function driveExportDefaults(props: CloudFileActionsExportProps) {
  if (isMultiFileCps(props.vendorFormatId)) {
    return {
      defaultSubfolderName: defaultMultiFileCpsFolderName(
        props.vendorFormatId,
        props.project?.name,
      ),
    };
  }
  if (props.vendorFormatId === 'native-yaml') {
    return { defaultFileName: defaultNativeYamlDriveFileName(props.project?.name) };
  }
  if (props.vendorFormatId === 'chirp') {
    const profileId = props.exportOptions?.profileId ?? DEFAULT_CHIRP_PROFILE_ID;
    const profile = getChirpProfile(profileId);
    return { defaultFileName: defaultSingleFileDriveFileName(profile.defaultFileName) };
  }
  return { defaultFileName: `export-${exportDateStamp()}.csv` };
}

export default function CloudFileActions(props: CloudFileActionsProps) {
  const { configured, connected, connect, busy: connectBusy } = useGoogleDriveConnection();
  const [pickerOpen, { open: openPicker, close: closePicker }] = useDisclosure(false);
  const [saveSession, setSaveSession] = useState(0);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [saveOpen, { open: openSaveModal, close: closeSave }] = useDisclosure(false);

  const openSave = () => {
    setSaveSession((session) => session + 1);
    openSaveModal();
  };

  const exportDefaults = useMemo(
    () => (props.mode === 'export' ? driveExportDefaults(props) : null),
    [props],
  );

  if (!configured) {
    return (
      <Text size="sm" c="dimmed">
        Google Drive is not configured for this build. See Settings or the contributor docs.
      </Text>
    );
  }

  const handleImportFile = async (fileId: string) => {
    if (props.mode !== 'import') return;
    setLoading(true);
    setError(null);
    try {
      const token = await getGoogleDriveAccessToken();
      const { ref, content } = await readDriveTextFile(token, fileId);
      const result = await importFromSources([{ name: ref.name, text: content }], {
        vendorFormatId: props.vendorFormatId,
        profileId: props.profileId,
      });
      if (result.errors.length) {
        setError(result.errors.map((e) => e.message).join('; '));
        return;
      }
      props.onImportResult(result);
      setStatus(`Imported ${ref.name} from Google Drive`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleImportFolder = async (folderId: string, folderName: string) => {
    if (props.mode !== 'import') return;
    setLoading(true);
    setError(null);
    try {
      const token = await getGoogleDriveAccessToken();
      const files = await listDriveCsvInFolder(token, folderId);
      if (!files.length) {
        setError(`No CSV files found in ${folderName}`);
        return;
      }
      const sources = await Promise.all(
        files.map(async (file) => {
          const { content } = await readDriveTextFile(token, file.id);
          return { name: file.name, text: content };
        }),
      );
      const result = await importFromSources(sources, {
        vendorFormatId: props.vendorFormatId,
        profileId: props.profileId,
        directoryName: folderName,
      });
      if (result.errors.length) {
        setError(result.errors.map((e) => e.message).join('; '));
        return;
      }
      props.onImportResult(result);
      setStatus(`Imported ${files.length} file(s) from ${folderName}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDriveSave = async (input: {
    parentFolderId: string;
    parentFolderName: string;
    fileName?: string;
    subfolderName?: string;
  }) => {
    if (props.mode !== 'export') return;
    setLoading(true);
    setError(null);
    try {
      const adapter = getExportAdapter(props.vendorFormatId);
      const isMulti = isMultiFileCps(props.vendorFormatId);
      const exportOptions = {
        ...props.exportOptions,
        ...(isMulti ? {} : { fileName: input.fileName }),
      };
      const { payloads, warnings } = buildExportPayload(adapter, {
        codeplug: props.codeplug,
        project: props.project ?? undefined,
        options: exportOptions,
      });
      const token = await getGoogleDriveAccessToken();

      let targetFolderId = input.parentFolderId;
      let destinationLabel = input.parentFolderName;

      if (isMulti && input.subfolderName) {
        const folder = await createDriveFolder(token, {
          name: input.subfolderName,
          parentFolderId: input.parentFolderId,
        });
        targetFolderId = folder.id;
        destinationLabel = `${input.parentFolderName}/${folder.name}`;
      }

      for (const payload of payloads) {
        await createDriveTextFile(token, {
          name: payload.fileName,
          content: payload.content,
          mimeType: payload.mimeType,
          parentFolderId: targetFolderId,
        });
      }

      const warnText = warnings.length ? ` (${warnings.join('; ')})` : '';
      const message = `Saved ${payloads.length} file(s) to ${destinationLabel}${warnText}`;
      setStatus(message);
      props.onComplete?.(message);
      closeSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const importFormatId = props.mode === 'import' ? props.vendorFormatId : 'native-yaml';

  const driveLogo = <GoogleDriveLogo size={18} />;

  return (
    <>
      <Divider
        my="md"
        label={
          <Group gap={6}>
            {driveLogo}
            <Text size="sm">Google Drive</Text>
          </Group>
        }
        labelPosition="left"
      />
      <Stack gap="xs">
      {!connected ? (
        <Button
          variant="light"
          leftSection={driveLogo}
          loading={connectBusy}
          onClick={() => void connect()}
        >
          Connect Google Drive
        </Button>
      ) : props.mode === 'import' ? (
        <Button
          variant="light"
          leftSection={driveLogo}
          loading={loading}
          onClick={openPicker}
        >
          Open from Google Drive
        </Button>
      ) : (
        <Button variant="light" leftSection={driveLogo} loading={loading} onClick={openSave}>
          Save to Google Drive
        </Button>
      )}

      {status ? (
        <Text size="sm" c="dimmed">
          {status}
        </Text>
      ) : null}
      {error ? (
        <Alert color="red" onClose={() => setError(null)} withCloseButton>
          {error}
        </Alert>
      ) : null}

      {props.mode === 'import' && connected ? (
        <CloudDriveBrowserModal
          opened={pickerOpen}
          onClose={closePicker}
          title="Open from Google Drive"
          onPickFile={(id) => void handleImportFile(id)}
          onPickFolder={
            isMultiFileCps(importFormatId)
              ? (folderId, folderName) => void handleImportFolder(folderId, folderName)
              : undefined
          }
          allowFolderImport={isMultiFileCps(importFormatId)}
          fileFilter={(name) => {
            const lower = name.toLowerCase();
            if (isYamlFormat(importFormatId)) {
              return lower.endsWith('.yaml') || lower.endsWith('.yml');
            }
            return lower.endsWith('.csv');
          }}
        />
      ) : null}

      {props.mode === 'export' && connected && exportDefaults ? (
        <CloudDriveSaveModal
          key={saveSession}
          opened={saveOpen}
          onClose={closeSave}
          isMultiFile={isMultiFileCps(props.vendorFormatId)}
          defaultFileName={exportDefaults.defaultFileName}
          defaultSubfolderName={exportDefaults.defaultSubfolderName}
          saving={loading}
          onSave={(input) => void handleDriveSave(input)}
        />
      ) : null}
      </Stack>
    </>
  );
}

/** @internal exported for tests */
export function cloudFileActionsConfigured(): boolean {
  return isGoogleDriveConfigured();
}

/** @internal exported for tests */
export function cloudFileActionsConnected(): boolean {
  return isGoogleDriveConnected();
}
