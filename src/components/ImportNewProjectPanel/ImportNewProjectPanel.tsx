import { Select, Stack, Text } from '@mantine/core';
import { useMemo, useState } from 'react';
import type { ImportResult } from '../../lib/import/types.ts';
import { getFormatProfiles } from '../../lib/import-export/registry.ts';
import {
  defaultVendorFormatId,
  vendorFormatById,
  vendorFormatSelectData,
  type VendorFormatId,
} from '../../lib/vendorFormats.ts';
import ImportFormatDropzone from '../ImportFormatDropzone/ImportFormatDropzone.tsx';
import CloudFileActions from '../CloudFileActions/CloudFileActions.tsx';

export interface ImportNewProjectPanelProps {
  onImported: (result: ImportResult) => void;
  persistenceError?: string | null;
  onDismissPersistenceError?: () => void;
  /** Shown above the format selector when the user has no projects yet. */
  introText?: string;
}

export default function ImportNewProjectPanel({
  onImported,
  persistenceError,
  onDismissPersistenceError,
  introText,
}: ImportNewProjectPanelProps) {
  const [vendorFormatId, setVendorFormatId] = useState<VendorFormatId>(defaultVendorFormatId);
  const vendorFormat = vendorFormatById(vendorFormatId);
  const formatProfiles = useMemo(() => getFormatProfiles(vendorFormatId), [vendorFormatId]);
  const [profileId, setProfileId] = useState<string | null>(
    () => formatProfiles?.defaultId ?? null,
  );

  const activeProfileId = formatProfiles ? (profileId ?? formatProfiles.defaultId) : undefined;

  return (
    <Stack gap="sm">
      {introText ? (
        <Text size="sm" c="dimmed">
          {introText}
        </Text>
      ) : null}
      <Select
        label="Vendor format"
        description="Choose the CPS export format you are importing — files are not auto-detected."
        data={vendorFormatSelectData()}
        value={vendorFormatId}
        onChange={(value) => {
          if (!value) return;
          const next = value as VendorFormatId;
          setVendorFormatId(next);
          const profiles = getFormatProfiles(next);
          setProfileId(profiles?.defaultId ?? null);
        }}
        allowDeselect={false}
      />
      {formatProfiles ? (
        <Select
          label="Radio profile"
          description="Power ladder and memory limits for the target hardware"
          data={formatProfiles.options}
          value={activeProfileId}
          onChange={(value) => value && setProfileId(value)}
          allowDeselect={false}
        />
      ) : null}
      <ImportFormatDropzone
        vendorFormat={vendorFormat}
        profileId={activeProfileId}
        onResult={onImported}
        persistenceError={persistenceError}
        onDismissPersistenceError={onDismissPersistenceError}
      />
      <CloudFileActions
        mode="import"
        vendorFormatId={vendorFormatId}
        profileId={activeProfileId}
        onImportResult={onImported}
      />
    </Stack>
  );
}
