import { Alert } from '@mantine/core';
import { getImportAdapter } from '../../lib/import/registry.ts';
import type { ImportResult } from '../../lib/import/types.ts';
import type { VendorFormatOption } from '../../lib/vendorFormats.ts';
import ImportDropzone from '../ImportDropzone/ImportDropzone.tsx';

export interface ImportFormatDropzoneProps {
  vendorFormat: VendorFormatOption;
  profileId?: string;
  onResult: (result: ImportResult) => void;
  persistenceError?: string | null;
  onDismissPersistenceError?: () => void;
}

/** Import dropzone gated on shipped adapter + explicit vendor format (no auto-detect). */
export default function ImportFormatDropzone({
  vendorFormat,
  profileId,
  onResult,
  persistenceError,
  onDismissPersistenceError,
}: ImportFormatDropzoneProps) {
  if (vendorFormat.importStatus !== 'shipped') {
    return (
      <Alert color="gray" title="Import not available yet">
        {vendorFormat.label} import is planned
        {vendorFormat.issue ? ` (${vendorFormat.issue})` : ''}.
      </Alert>
    );
  }

  let importAdapter;
  try {
    importAdapter = getImportAdapter(vendorFormat.id);
  } catch {
    return (
      <Alert color="gray" title="Import not available">
        No importer is registered for {vendorFormat.label}.
      </Alert>
    );
  }

  const importHint =
    importAdapter.capabilities.interchange === 'native-document'
      ? `Drop a ${vendorFormat.label} file (.yaml).`
      : importAdapter.capabilities.delivery === 'single-file'
        ? `Drop a ${vendorFormat.label} memory CSV.`
        : `Drop ${vendorFormat.label} export files or a folder.`;

  return (
    <ImportDropzone
      onResult={onResult}
      persistenceError={persistenceError}
      onDismissPersistenceError={onDismissPersistenceError}
      hint={importHint}
      vendorFormatId={vendorFormat.id}
      profileId={profileId}
    />
  );
}
