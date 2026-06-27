import { Checkbox, Stack, Text } from '@mantine/core';
import { getHelpShort } from '../../content/help/manifest.ts';
import { useExportSettings } from '../../hooks/useExportSettings.ts';
import FormatVarianceTable from '../help/FormatVarianceTable.tsx';

export default function Dm32ZoneExportSettingsFields() {
  const {
    exportScratchChannels,
    setExportScratchChannels,
    exportZoneDerivedScanLists,
    setExportZoneDerivedScanLists,
  } = useExportSettings();

  return (
    <Stack gap="sm">
      <Text size="sm" fw={500}>
        Zone-derived export
      </Text>
      <Text size="xs" c="dimmed">
        {getHelpShort('importExport.dm32ZoneExport')}
      </Text>
      <Checkbox
        label="Export scratch channels when enabled for zone"
        description={getHelpShort('importExport.exportOptions.exportScratchChannels')}
        checked={exportScratchChannels}
        onChange={(e) => setExportScratchChannels(e.currentTarget.checked)}
      />
      <Checkbox
        label="Export scan lists when enabled for zone"
        description={getHelpShort('importExport.exportOptions.exportZoneDerivedScanLists')}
        checked={exportZoneDerivedScanLists}
        onChange={(e) => setExportZoneDerivedScanLists(e.currentTarget.checked)}
      />
      <FormatVarianceTable varianceId="zoneDerivedExport" />
    </Stack>
  );
}
