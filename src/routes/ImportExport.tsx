import { Container, Paper, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import ExportFromActivePanel from '../components/ExportFromActivePanel/ExportFromActivePanel.tsx';
import ImportIntoActivePanel from '../components/ImportIntoActivePanel/ImportIntoActivePanel.tsx';
import { useVendorFormatParam } from '../hooks/useVendorFormatParam.ts';

export default function ImportExport() {
  const { vendorFormat } = useVendorFormatParam();

  return (
    <Container size="lg" py="md">
      <Stack gap="lg">
        <Stack gap="xs">
          <Title order={1}>Import &amp; export</Title>
          <Text c="dimmed">
            Your codeplug is vendor-neutral inside the app. Choose the interchange format in the
            sidebar — where files came from for import, or where you want to send them for export.
            OpenGD77 CPS CSV is supported today; qDMR YAML, native YAML, Baofeng DM-32 CPS, and
            others are planned.
          </Text>
        </Stack>

        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
          <Paper withBorder p="md" radius="md">
            <Stack gap="md">
              <Stack gap={4}>
                <Title order={2}>Import</Title>
                <Text size="sm" c="dimmed">
                  Add or refresh data in the active codeplug without creating a new project.
                </Text>
              </Stack>
              <ImportIntoActivePanel vendorFormat={vendorFormat} />
            </Stack>
          </Paper>

          <Paper withBorder p="md" radius="md">
            <Stack gap="md">
              <Stack gap={4}>
                <Title order={2}>Export</Title>
                <Text size="sm" c="dimmed">
                  Download the active codeplug as vendor CPS files.
                </Text>
              </Stack>
              <ExportFromActivePanel vendorFormat={vendorFormat} />
            </Stack>
          </Paper>
        </SimpleGrid>
      </Stack>
    </Container>
  );
}
