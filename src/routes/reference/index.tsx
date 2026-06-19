import { NavLink, Stack, Text } from '@mantine/core';
import { IconChartBar, IconGridDots } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import ReportPage from '../../components/report/ReportPage.tsx';
import { ICON_SIZE_NAV, ICON_STROKE } from '../../lib/iconSizes.ts';

export default function ReferenceIndex() {
  return (
    <ReportPage title="Reference">
      <Stack gap="lg">
        <Text c="dimmed">Lookup tables and conventions used across the codeplug tool.</Text>
        <NavLink
          component={Link}
          to="/reference/band-plan"
          label="Band plan"
          description="UK amateur band allocations, MHz ranges, and pill colours"
          leftSection={<IconChartBar size={ICON_SIZE_NAV} stroke={ICON_STROKE} />}
        />
        <NavLink
          component={Link}
          to="/reference/maidenhead"
          label="Maidenhead converter"
          description="Convert between grid locators and WGS84 coordinates"
          leftSection={<IconGridDots size={ICON_SIZE_NAV} stroke={ICON_STROKE} />}
        />
      </Stack>
    </ReportPage>
  );
}
