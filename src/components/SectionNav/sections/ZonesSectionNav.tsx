import { Stack } from '@mantine/core';
import { useMemo } from 'react';
import { sortByName } from '../../../lib/reportLookup.ts';
import { useCodeplug } from '../../../state/codeplugStore.tsx';
import { filterRowsByName, useListNameQuery } from '../../../hooks/useListNameQuery.ts';
import type { SectionNavProps } from '../../../nav/sectionNavTypes.ts';
import EntityListSectionNav, { EntityZoneLinks } from './EntityListSectionNav.tsx';

export default function ZonesSectionNav({ variant }: SectionNavProps) {
  const { codeplug } = useCodeplug();
  const { nameFilter } = useListNameQuery();
  const zones = useMemo(() => {
    const sorted = sortByName(codeplug.zones);
    return filterRowsByName(sorted, nameFilter, (z) => z.name);
  }, [codeplug.zones, nameFilter]);

  return (
    <Stack gap="sm">
      <EntityListSectionNav variant={variant} newPath="/zones/new" newLabel="New zone" />
      <EntityZoneLinks zones={zones} variant={variant} />
    </Stack>
  );
}
