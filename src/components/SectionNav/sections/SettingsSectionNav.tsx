import { NavLink, Stack } from '@mantine/core';
import { IconMap, IconGridDots } from '@tabler/icons-react';
import { ICON_SIZE_NAV, ICON_STROKE } from '../../../lib/iconSizes.ts';

export default function SettingsSectionNav() {
  return (
    <Stack gap={4}>
      <NavLink
        component="a"
        href="#map-tiles"
        label="Map tiles"
        leftSection={<IconMap size={ICON_SIZE_NAV} stroke={ICON_STROKE} />}
      />
      <NavLink
        component="a"
        href="#maidenhead-grid"
        label="Maidenhead grid"
        leftSection={<IconGridDots size={ICON_SIZE_NAV} stroke={ICON_STROKE} />}
      />
    </Stack>
  );
}
