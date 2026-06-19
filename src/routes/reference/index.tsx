import { Stack, Text } from '@mantine/core';
import ReportPage from '../../components/report/ReportPage.tsx';

export default function ReferenceIndex() {
  return (
    <ReportPage title="Reference">
      <Stack gap="lg">
        <Text c="dimmed">Lookup tables and conventions used across the codeplug tool.</Text>
      </Stack>
    </ReportPage>
  );
}
