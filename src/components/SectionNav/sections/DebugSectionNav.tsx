import { NavLink, Stack } from '@mantine/core';
import { IconBug, IconDatabase } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { ICON_SIZE_NAV, ICON_STROKE } from '../../../lib/iconSizes.ts';
import type { SectionNavProps } from '../../../nav/sectionNavTypes.ts';

export default function DebugSectionNav(_props: SectionNavProps) {
  return (
    <Stack gap={4}>
      <NavLink
        component={Link}
        to="/debug"
        label="Overview"
        description={_props.variant === 'sidebar' ? 'Debug tools' : undefined}
        leftSection={<IconBug size={ICON_SIZE_NAV} stroke={ICON_STROKE} />}
      />
      <NavLink
        component={Link}
        to="/debug/local-storage"
        label="LocalStorage"
        description={_props.variant === 'sidebar' ? 'Browser persistence keys' : undefined}
        leftSection={<IconDatabase size={ICON_SIZE_NAV} stroke={ICON_STROKE} />}
      />
    </Stack>
  );
}
