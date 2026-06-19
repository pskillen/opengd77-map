import { NavLink, Stack } from '@mantine/core';
import { IconChartBar, IconGridDots } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { ICON_SIZE_NAV, ICON_STROKE } from '../../../lib/iconSizes.ts';
import type { SectionNavProps } from '../../../nav/sectionNavTypes.ts';

export default function ReferenceSectionNav(_props: SectionNavProps) {
  return (
    <Stack gap={4}>
      <NavLink
        component={Link}
        to="/reference/band-plan"
        label="Band plan"
        description={_props.variant === 'sidebar' ? 'UK band allocations' : undefined}
        leftSection={<IconChartBar size={ICON_SIZE_NAV} stroke={ICON_STROKE} />}
      />
      <NavLink
        component={Link}
        to="/reference/maidenhead"
        label="Maidenhead converter"
        description={_props.variant === 'sidebar' ? 'Locator ↔ coordinates' : undefined}
        leftSection={<IconGridDots size={ICON_SIZE_NAV} stroke={ICON_STROKE} />}
      />
    </Stack>
  );
}
