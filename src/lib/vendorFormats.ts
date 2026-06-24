/** Vendor interchange formats for import/export UI — aligned with adapter `id` values. */

import type { VendorFormatId } from './import-export/types.ts';

export type { VendorFormatId };

export type VendorFormatCapability = 'shipped' | 'planned';

export interface VendorFormatOption {
  id: VendorFormatId;
  label: string;
  /** Short hint shown in the format selector. */
  hint: string;
  importStatus: VendorFormatCapability;
  exportStatus: VendorFormatCapability;
  /** GitHub issue for planned formats. */
  issue?: string;
}

export const vendorFormatOptions: VendorFormatOption[] = [
  {
    id: 'opengd77',
    label: 'OpenGD77 CPS CSV',
    hint: 'OpenGD77 Customer Programming Software export folder',
    importStatus: 'shipped',
    exportStatus: 'shipped',
  },
  {
    id: 'chirp',
    label: 'CHIRP CSV',
    hint: 'CHIRP radio memory export (analogue FM/AM)',
    importStatus: 'shipped',
    exportStatus: 'shipped',
    issue: '#103',
  },
  {
    id: 'qdmr',
    label: 'qDMR YAML',
    hint: 'qDMR codeplug YAML',
    importStatus: 'planned',
    exportStatus: 'planned',
    issue: '#37',
  },
  {
    id: 'native-yaml',
    label: 'Native YAML',
    hint: 'Codeplug Tool native interchange format',
    importStatus: 'planned',
    exportStatus: 'planned',
    issue: '#10',
  },
  {
    id: 'dm32',
    label: 'Baofeng DM-32 CPS',
    hint: 'Baofeng DM-32UV customer programming export',
    importStatus: 'shipped',
    exportStatus: 'shipped',
    issue: '#67',
  },
];

export const defaultVendorFormatId: VendorFormatId = 'opengd77';

export function vendorFormatById(id: VendorFormatId): VendorFormatOption {
  const found = vendorFormatOptions.find((option) => option.id === id);
  if (!found) throw new Error(`Unknown vendor format: ${id}`);
  return found;
}

export function vendorFormatSelectData(): { value: string; label: string }[] {
  return vendorFormatOptions.map((option) => ({
    value: option.id,
    label:
      option.importStatus === 'shipped' || option.exportStatus === 'shipped'
        ? option.label
        : `${option.label} (coming soon)`,
  }));
}

export function isVendorFormatShipped(option: VendorFormatOption): boolean {
  return option.importStatus === 'shipped' || option.exportStatus === 'shipped';
}

/** Shipped formats first (array order), then planned — for import/export section nav. */
export function vendorFormatNavGroups(): {
  shipped: VendorFormatOption[];
  planned: VendorFormatOption[];
} {
  const shipped: VendorFormatOption[] = [];
  const planned: VendorFormatOption[] = [];
  for (const option of vendorFormatOptions) {
    if (isVendorFormatShipped(option)) shipped.push(option);
    else planned.push(option);
  }
  return { shipped, planned };
}

export function vendorFormatHref(id: VendorFormatId): string {
  if (id === defaultVendorFormatId) return '/export';
  return `/export?format=${id}`;
}
