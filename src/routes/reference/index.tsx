import { NavLink, Stack, Text } from '@mantine/core';
import { Link } from 'react-router-dom';
import ReportPage from '../../components/report/ReportPage.tsx';

export default function ReferenceIndex() {
  return (
    <ReportPage title="Reference">
      <Stack gap="lg">
        <Text c="dimmed">
          Lookup tables and conventions used across the codeplug tool.
        </Text>
        <NavLink
          component={Link}
          to="/reference/band-plan"
          label="Band plan"
          description="UK amateur band allocations, MHz ranges, and pill colours"
        />
        <NavLink
          component={Link}
          to="/reference/maidenhead"
          label="Maidenhead converter"
          description="Convert between grid locators and WGS84 coordinates"
        />
      </Stack>
    </ReportPage>
  );
}
