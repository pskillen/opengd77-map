import { Alert, Button, Select, Stack, Text } from '@mantine/core';
import { IconDownload, IconPackage } from '@tabler/icons-react';
import { useState } from 'react';
import { chirpProfileSelectData, DEFAULT_CHIRP_PROFILE_ID } from '../../lib/chirp/profiles.ts';
import { DEFAULT_DM32_PROFILE_ID, dm32ProfileSelectData } from '../../lib/dm32/profiles.ts';
import {
  DEFAULT_OPENGD77_PROFILE_ID,
  opengd77ProfileSelectData,
} from '../../lib/opengd77/profiles.ts';
import { getExportAdapter, getFormatProfiles } from '../../lib/import-export/registry.ts';
import {
  isMultiFileExportAdapter,
  isSingleFileExportAdapter,
} from '../../lib/import-export/exportAdapter.ts';
import { ICON_SIZE_NAV, ICON_STROKE } from '../../lib/iconSizes.ts';
import type { VendorFormatOption } from '../../lib/vendorFormats.ts';
import { useCodeplug } from '../../state/codeplugStore.tsx';

export interface ExportFromActivePanelProps {
  vendorFormat: VendorFormatOption;
}

export default function ExportFromActivePanel({ vendorFormat }: ExportFromActivePanelProps) {
  const { codeplug } = useCodeplug();
  const hasData = codeplug.channels.length > 0;
  const [chirpProfileId, setChirpProfileId] = useState(DEFAULT_CHIRP_PROFILE_ID);
  const [opengd77ProfileId, setOpenGd77ProfileId] = useState(DEFAULT_OPENGD77_PROFILE_ID);
  const [dm32ProfileId, setDm32ProfileId] = useState(DEFAULT_DM32_PROFILE_ID);
  const [exportWarnings, setExportWarnings] = useState<string[]>([]);

  if (vendorFormat.exportStatus !== 'shipped') {
    return (
      <Alert color="gray" title="Export not available yet">
        {vendorFormat.label} export is planned
        {vendorFormat.issue ? ` (${vendorFormat.issue})` : ''}. OpenGD77 CPS CSV is supported today.
      </Alert>
    );
  }

  let adapter;
  try {
    adapter = getExportAdapter(vendorFormat.id);
  } catch {
    return (
      <Alert color="gray" title="Export not available">
        No exporter is registered for {vendorFormat.label}.
      </Alert>
    );
  }

  if (isMultiFileExportAdapter(adapter)) {
    const formatProfiles = getFormatProfiles(vendorFormat.id);
    const profileId =
      vendorFormat.id === 'dm32'
        ? dm32ProfileId
        : vendorFormat.id === 'opengd77'
          ? opengd77ProfileId
          : formatProfiles?.defaultId;
    const exportOptions = profileId ? { profileId } : undefined;
    const profileSelectData =
      vendorFormat.id === 'dm32'
        ? dm32ProfileSelectData()
        : vendorFormat.id === 'opengd77'
          ? opengd77ProfileSelectData()
          : (formatProfiles?.options ?? []);

    return (
      <Stack gap="sm">
        {!hasData ? (
          <Text size="sm" c="dimmed">
            Import a codeplug first — there are no channels to export yet.
          </Text>
        ) : null}

        {formatProfiles ? (
          <Select
            label="Radio profile"
            description="Power ladder and export limits for target hardware"
            data={profileSelectData}
            value={profileId}
            onChange={(value) => {
              if (!value) return;
              if (vendorFormat.id === 'dm32') setDm32ProfileId(value);
              else if (vendorFormat.id === 'opengd77') setOpenGd77ProfileId(value);
            }}
            allowDeselect={false}
          />
        ) : null}

        <Stack gap="xs">
          {adapter.fileNames.map((fileName) => (
            <Button
              key={fileName}
              variant="default"
              disabled={!hasData}
              leftSection={<IconDownload size={ICON_SIZE_NAV} stroke={ICON_STROKE} />}
              onClick={() => {
                const result = adapter.downloadFile(codeplug, fileName, exportOptions);
                setExportWarnings(result.warnings);
              }}
            >
              Download {fileName}
            </Button>
          ))}
          <Button
            disabled={!hasData}
            leftSection={<IconPackage size={ICON_SIZE_NAV} stroke={ICON_STROKE} />}
            onClick={() => {
              const result = adapter.downloadZip(codeplug, exportOptions);
              setExportWarnings(result.warnings);
            }}
          >
            Download all (.zip)
          </Button>
        </Stack>

        {exportWarnings.length > 0 ? (
          <Alert color="yellow" title="Export notes">
            {exportWarnings.map((warning) => (
              <Text key={warning} size="sm">
                {warning}
              </Text>
            ))}
          </Alert>
        ) : null}
        {vendorFormat.id === 'opengd77' ? (
          <Text size="sm" c="dimmed">
            The ZIP also includes header-only <code>DTMF.csv</code> and <code>APRS.csv</code> so the
            bundle matches a full OpenGD77 export folder.
          </Text>
        ) : vendorFormat.id === 'dm32' ? (
          <Text size="sm" c="dimmed">
            Scan lists and <code>DMR-ID.csv</code> are not included — import a full CPS folder for
            those files if your radio needs them.
          </Text>
        ) : null}
      </Stack>
    );
  }

  if (isSingleFileExportAdapter(adapter)) {
    const handleDownload = () => {
      const result = adapter.download({
        codeplug,
        options: { profileId: chirpProfileId },
      });
      setExportWarnings(result.warnings);
    };

    return (
      <Stack gap="sm">
        {!hasData ? (
          <Text size="sm" c="dimmed">
            Import a codeplug first — there are no channels to export yet.
          </Text>
        ) : null}

        {vendorFormat.id === 'chirp' ? (
          <Select
            label="Radio profile"
            description="CHIRP memory layout and power ladder for target hardware"
            data={chirpProfileSelectData()}
            value={chirpProfileId}
            onChange={(value) => value && setChirpProfileId(value)}
            allowDeselect={false}
          />
        ) : null}

        <Button
          disabled={!hasData}
          leftSection={<IconDownload size={ICON_SIZE_NAV} stroke={ICON_STROKE} />}
          onClick={handleDownload}
        >
          Export
        </Button>

        {exportWarnings.length > 0 ? (
          <Alert color="yellow" title="Export notes">
            {exportWarnings.map((warning) => (
              <Text key={warning} size="sm">
                {warning}
              </Text>
            ))}
          </Alert>
        ) : null}

        {vendorFormat.id === 'chirp' ? (
          <Text size="sm" c="dimmed">
            Only analogue FM/AM channels are exported. Digital modes are skipped with a warning.
          </Text>
        ) : null}
      </Stack>
    );
  }

  return (
    <Alert color="gray" title="Export not available">
      No exporter delivery mode is registered for {vendorFormat.label}.
    </Alert>
  );
}
