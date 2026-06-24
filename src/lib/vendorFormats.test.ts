import { describe, expect, it } from 'vitest';
import { defaultVendorFormatId, vendorFormatHref, vendorFormatNavGroups } from './vendorFormats.ts';

describe('vendorFormatNavGroups', () => {
  it('lists shipped formats before planned', () => {
    const { shipped, planned } = vendorFormatNavGroups();
    expect(shipped.map((o) => o.id)).toEqual(['opengd77', 'chirp', 'dm32']);
    expect(planned.map((o) => o.id)).toEqual(['qdmr', 'native-yaml']);
  });
});

describe('vendorFormatHref', () => {
  it('omits query param for default format', () => {
    expect(vendorFormatHref(defaultVendorFormatId)).toBe('/export');
  });

  it('adds format query param for non-default formats', () => {
    expect(vendorFormatHref('dm32')).toBe('/export?format=dm32');
  });
});
