import { NavLink, Stack } from '@mantine/core';
import { scrollToPageSection } from '../../../lib/scrollToPageSection.ts';

export interface PageSectionNavItem {
  id: string;
  label: string;
}

export default function PageSectionNavLinks({ sections }: { sections: PageSectionNavItem[] }) {
  return (
    <Stack gap={4}>
      {sections.map((section) => (
        <NavLink
          key={section.id}
          component="button"
          type="button"
          onClick={() => scrollToPageSection(section.id)}
          label={section.label}
        />
      ))}
    </Stack>
  );
}
