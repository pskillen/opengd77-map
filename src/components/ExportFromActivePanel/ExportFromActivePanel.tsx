import { Alert, Button, Stack, Text } from '@mantine/core';
import { IconDownload, IconPackage } from '@tabler/icons-react';
import { opengd77ExportAdapter, type OpenGd77ExportFileName } from '../../lib/export/index.ts';
import { ICON_SIZE_NAV, ICON_STROKE } from '../../lib/iconSizes.ts';
import type { VendorFormatOption } from '../../lib/vendorFormats.ts';
import { useCodeplug } from '../../state/codeplugStore.tsx';

const INDIVIDUAL_FILES: OpenGd77ExportFileName[] = [
  'Channels.csv',
  'Zones.csv',
  'Contacts.csv',
  'TG_Lists.csv',
];

export interface ExportFromActivePanelProps {
  vendorFormat: VendorFormatOption;
}

export default function ExportFromActivePanel({ vendorFormat }: ExportFromActivePanelProps) {
  const { codeplug } = useCodeplug();
  const hasData = codeplug.channels.length > 0;

  if (vendorFormat.exportStatus !== 'shipped') {
    return (
      <Alert color="gray" title="Export not available yet">
        {vendorFormat.label} export is planned
        {vendorFormat.issue ? ` (${vendorFormat.issue})` : ''}. OpenGD77 CPS CSV is supported today.
      </Alert>
    );
  }

  if (vendorFormat.id !== 'opengd77') {
    return (
      <Alert color="gray" title="Export not available">
        No exporter is registered for {vendorFormat.label}.
      </Alert>
    );
  }

  return (
    <Stack gap="sm">
      {!hasData ? (
        <Text size="sm" c="dimmed">
          Import a codeplug first — there are no channels to export yet.
        </Text>
      ) : null}

      <Stack gap="xs">
        {INDIVIDUAL_FILES.map((fileName) => (
          <Button
            key={fileName}
            variant="default"
            disabled={!hasData}
            leftSection={<IconDownload size={ICON_SIZE_NAV} stroke={ICON_STROKE} />}
            onClick={() => opengd77ExportAdapter.downloadFile(codeplug, fileName)}
          >
            Download {fileName}
          </Button>
        ))}
        <Button
          disabled={!hasData}
          leftSection={<IconPackage size={ICON_SIZE_NAV} stroke={ICON_STROKE} />}
          onClick={() => opengd77ExportAdapter.downloadZip(codeplug)}
        >
          Download all (.zip)
        </Button>
      </Stack>
      <Text size="sm" c="dimmed">
        The ZIP also includes header-only <code>DTMF.csv</code> and <code>APRS.csv</code> so the
        bundle matches a full OpenGD77 export folder.
      </Text>
    </Stack>
  );
}
