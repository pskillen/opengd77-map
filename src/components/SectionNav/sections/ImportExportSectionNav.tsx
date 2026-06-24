import { Divider, NavLink, Stack, Text } from '@mantine/core';
import { Link } from 'react-router-dom';
import { useVendorFormatParam } from '../../../hooks/useVendorFormatParam.ts';
import { vendorFormatHref, vendorFormatNavGroups } from '../../../lib/vendorFormats.ts';
import type { SectionNavProps } from '../../../nav/sectionNavTypes.ts';

export default function ImportExportSectionNav({ variant }: SectionNavProps) {
  const isSidebar = variant === 'sidebar';
  const { vendorFormatId } = useVendorFormatParam();
  const { shipped, planned } = vendorFormatNavGroups();

  return (
    <Stack gap="sm">
      <Text size="sm" c="dimmed">
        Choose the interchange format for import and export panels.
      </Text>
      <Stack gap={4}>
        {shipped.map((option) => (
          <NavLink
            key={option.id}
            component={Link}
            to={vendorFormatHref(option.id)}
            label={option.label}
            description={isSidebar ? option.hint : undefined}
            active={vendorFormatId === option.id}
          />
        ))}
      </Stack>
      {planned.length > 0 ? (
        <>
          <Divider label="Coming soon" labelPosition="center" />
          <Stack gap={4}>
            {planned.map((option) => (
              <NavLink
                key={option.id}
                label={option.label}
                description={
                  isSidebar
                    ? `${option.hint}${option.issue ? ` · ${option.issue}` : ''}`
                    : undefined
                }
                disabled
                style={{ opacity: 0.55 }}
              />
            ))}
          </Stack>
        </>
      ) : null}
    </Stack>
  );
}
