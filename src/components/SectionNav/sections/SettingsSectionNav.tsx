import { NavLink, Stack } from '@mantine/core';
import { IconMap, IconGridDots } from '@tabler/icons-react';
import { ICON_SIZE_NAV, ICON_STROKE } from '../../../lib/iconSizes.ts';
import { scrollToPageSection } from '../../../lib/scrollToPageSection.ts';

const SETTINGS_SECTIONS = [
  { id: 'map-tiles', label: 'Map tiles', icon: IconMap },
  { id: 'maidenhead-grid', label: 'Maidenhead grid', icon: IconGridDots },
] as const;

export default function SettingsSectionNav() {
  return (
    <Stack gap={4}>
      {SETTINGS_SECTIONS.map((section) => (
        <NavLink
          key={section.id}
          component="button"
          type="button"
          onClick={() => scrollToPageSection(section.id)}
          label={section.label}
          leftSection={<section.icon size={ICON_SIZE_NAV} stroke={ICON_STROKE} />}
        />
      ))}
    </Stack>
  );
}
