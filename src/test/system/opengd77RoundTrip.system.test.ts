import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { canonicalOpenGd77ChannelWireForCompare } from '../../lib/channelExpansion/index.ts';
import { serialiseOpenGd77Files } from '../../lib/export/opengd77/serialise.ts';
import { importFiles } from '../../lib/import/index.ts';
import { applyImportToCodeplug } from '../../lib/importMerge.ts';
import { emptyCodeplug, resetIdGenerator, setIdGenerator } from '../../models/codeplug.ts';
import {
  compareCsvHeaders,
  compareCsvRecords,
  formatCsvRecordCompareFailure,
} from '../csvRecordCompare.ts';
import { parseCsv } from '../../lib/csv.ts';
import {
  OPENGD77_TEST_DATA_FIXTURES,
  readOpenGd77TestData,
  openGd77TestDataFiles,
  type OpenGd77TestDataFileName,
} from '../opengd77/testData.ts';

const SUBSTANTIVE_FILES: {
  fileName: OpenGd77TestDataFileName;
  nameColumn: string;
  excludeColumns?: string[];
}[] = [
  { fileName: 'Channels.csv', nameColumn: 'Channel Name', excludeColumns: ['Channel Number', 'APRS'] },
  { fileName: 'Zones.csv', nameColumn: 'Zone Name' },
  { fileName: 'Contacts.csv', nameColumn: 'Contact Name' },
  { fileName: 'TG_Lists.csv', nameColumn: 'TG List Name' },
];

const HEADER_ONLY_FILES: OpenGd77TestDataFileName[] = ['DTMF.csv', 'APRS.csv'];

function normalizeCpsCoordinate(value: string): string {
  const n = parseFloat(value.trim());
  if (!Number.isFinite(n)) return value.trim();
  return n.toFixed(2);
}

function openGd77CsvCompareNormalizers(csv: string): Record<string, (value: string) => string> {
  const headers = parseCsv(csv.replace(/^\uFEFF/, '').trim())[0]?.map((h) => h.trim()) ?? [];
  const normalizers: Record<string, (value: string) => string> = {};
  for (const header of headers) {
    if (header === 'Channel Name' || /^Channel\d+$/i.test(header)) {
      normalizers[header] = canonicalOpenGd77ChannelWireForCompare;
    }
    if (header === 'Latitude' || header === 'Longitude') {
      normalizers[header] = normalizeCpsCoordinate;
    }
  }
  return normalizers;
}

describe('OpenGD77 file-level round-trip (test-data)', () => {
  beforeEach(() => {
    let n = 0;
    setIdGenerator(() => `ogd77-sys-${++n}`);
  });

  afterEach(() => {
    resetIdGenerator();
  });

  it.each(OPENGD77_TEST_DATA_FIXTURES)(
    'import → codeplug → export matches $version CPS export',
    async (fixture) => {
      const parseResult = await importFiles(openGd77TestDataFiles(fixture), {
        vendorFormatId: 'opengd77',
        profileId: fixture.profileId,
      });
      expect(parseResult.errors).toHaveLength(0);
      expect(parseResult.channels?.length).toBeGreaterThan(0);

      const { codeplug } = applyImportToCodeplug(emptyCodeplug(), parseResult, 'merge');

      const exported = serialiseOpenGd77Files(codeplug, { profileId: fixture.profileId });

      for (const { fileName, nameColumn, excludeColumns } of SUBSTANTIVE_FILES) {
        const originalCsv = readOpenGd77TestData(fixture, fileName);
        const normalizeColumn =
          fileName === 'Channels.csv' || fileName === 'Zones.csv'
            ? openGd77CsvCompareNormalizers(originalCsv)
            : undefined;
        const comparison = compareCsvRecords(originalCsv, exported[fileName], {
          nameColumn,
          excludeColumns,
          ...(normalizeColumn && Object.keys(normalizeColumn).length > 0 ? { normalizeColumn } : {}),
        });
        expect(comparison.ok, `${fileName}:\n${formatCsvRecordCompareFailure(comparison)}`).toBe(
          true,
        );
        expect(comparison.originalCount).toBe(comparison.exportedCount);
      }

      for (const fileName of HEADER_ONLY_FILES) {
        const originalCsv = readOpenGd77TestData(fixture, fileName);
        expect(exported[fileName].trim()).toBe(originalCsv.trim());
        expect(compareCsvHeaders(originalCsv, exported[fileName])).toBe(true);
      }
    },
  );
});
