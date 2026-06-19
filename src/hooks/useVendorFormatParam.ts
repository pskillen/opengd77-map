import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  defaultVendorFormatId,
  vendorFormatById,
  vendorFormatSelectData,
  type VendorFormatId,
} from '../lib/vendorFormats.ts';

const FORMAT_PARAM = 'format';

function parseVendorFormatId(raw: string | null): VendorFormatId {
  if (raw === 'opengd77' || raw === 'qdmr' || raw === 'native-yaml' || raw === 'dm32') {
    return raw;
  }
  return defaultVendorFormatId;
}

export function useVendorFormatParam(): {
  vendorFormatId: VendorFormatId;
  vendorFormat: ReturnType<typeof vendorFormatById>;
  setVendorFormatId: (id: VendorFormatId) => void;
  selectData: ReturnType<typeof vendorFormatSelectData>;
} {
  const [searchParams, setSearchParams] = useSearchParams();
  const vendorFormatId = parseVendorFormatId(searchParams.get(FORMAT_PARAM));

  const setVendorFormatId = useCallback(
    (id: VendorFormatId) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (id === defaultVendorFormatId) next.delete(FORMAT_PARAM);
          else next.set(FORMAT_PARAM, id);
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  return {
    vendorFormatId,
    vendorFormat: vendorFormatById(vendorFormatId),
    setVendorFormatId,
    selectData: vendorFormatSelectData(),
  };
}
