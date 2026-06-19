import { Button, NavLink, Stack, TextInput } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { ICON_SIZE_NAV, ICON_STROKE } from '../../../lib/iconSizes.ts';
import { useListNameQuery } from '../../../hooks/useListNameQuery.ts';
import type { SectionNavProps } from '../../../nav/sectionNavTypes.ts';

export interface EntityListSectionNavProps extends SectionNavProps {
  newPath: string;
  newLabel: string;
}

export default function EntityListSectionNav({
  variant,
  newPath,
  newLabel,
}: EntityListSectionNavProps) {
  const isSidebar = variant === 'sidebar';
  const { nameFilter, setNameFilter } = useListNameQuery();

  return (
    <Stack gap="sm">
      <Button
        component={Link}
        to={newPath}
        leftSection={<IconPlus size={ICON_SIZE_NAV} stroke={ICON_STROKE} />}
        fullWidth={isSidebar}
      >
        {newLabel}
      </Button>
      <TextInput
        label="Search"
        placeholder="Filter name…"
        value={nameFilter}
        onChange={(e) => setNameFilter(e.currentTarget.value)}
        size={isSidebar ? 'sm' : 'md'}
      />
    </Stack>
  );
}

export function EntityZoneLinks({
  zones,
  variant,
}: {
  zones: { id: string; name: string }[];
  variant: SectionNavProps['variant'];
}) {
  if (variant !== 'sidebar' || zones.length === 0) return null;

  return (
    <Stack gap={4} mt="xs">
      {zones.map((zone) => (
        <NavLink key={zone.id} component={Link} to={`/zones/${zone.id}`} label={zone.name} py={4} />
      ))}
    </Stack>
  );
}
