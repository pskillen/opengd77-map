import { Select, Stack, Text } from '@mantine/core';
import { useVendorFormatParam } from '../../../hooks/useVendorFormatParam.ts';
import type { SectionNavProps } from '../../../nav/sectionNavTypes.ts';
import type { VendorFormatId } from '../../../lib/vendorFormats.ts';

export default function ImportExportSectionNav({ variant }: SectionNavProps) {
  const isSidebar = variant === 'sidebar';
  const { vendorFormatId, setVendorFormatId, selectData } = useVendorFormatParam();

  return (
    <Stack gap="sm">
      <Text size="sm" c="dimmed">
        Choose the interchange format for import and export panels.
      </Text>
      <Select
        label="Vendor format"
        data={selectData}
        value={vendorFormatId}
        onChange={(value) => {
          if (value) setVendorFormatId(value as VendorFormatId);
        }}
        allowDeselect={false}
        size={isSidebar ? 'sm' : 'md'}
      />
    </Stack>
  );
}
