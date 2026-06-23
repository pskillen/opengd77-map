import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { serialiseChirpCsv } from '../../lib/export/chirp/serialise.ts';
import { importFiles } from '../../lib/import/index.ts';
import {
  emptyCodeplug,
  resetIdGenerator,
  setIdGenerator,
  type Codeplug,
} from '../../models/codeplug.ts';
import { compareCsvRecords, formatCsvRecordCompareFailure } from '../csvRecordCompare.ts';
import { CHIRP_TEST_DATA_FIXTURES, readChirpTestData } from '../chirp/testData.ts';

describe('CHIRP file-level round-trip (test-data)', () => {
  beforeEach(() => {
    let n = 0;
    setIdGenerator(() => `chirp-sys-${++n}`);
  });

  afterEach(() => {
    resetIdGenerator();
  });

  it.each(CHIRP_TEST_DATA_FIXTURES)(
    'import → codeplug → export matches $fileName verbatim (except Location)',
    async (fixture) => {
      const originalCsv = readChirpTestData(fixture);

      const parseResult = await importFiles(
        [new File([originalCsv], fixture.fileName, { type: 'text/csv' })],
        { vendorFormatId: 'chirp', profileId: fixture.profileId },
      );
      expect(parseResult.errors).toHaveLength(0);
      expect(parseResult.channels?.length).toBeGreaterThan(0);

      const codeplug: Codeplug = {
        ...emptyCodeplug(),
        channels: parseResult.channels ?? [],
      };

      const { csv: exportedCsv } = serialiseChirpCsv(codeplug, {
        profileId: fixture.profileId,
      });

      const comparison = compareCsvRecords(originalCsv, exportedCsv, {
        excludeColumns: ['Location', 'Comment'],
      });

      expect(
        comparison.ok,
        formatCsvRecordCompareFailure(comparison) ||
          `records: ${comparison.originalCount} → ${comparison.exportedCount}`,
      ).toBe(true);
      expect(comparison.originalCount).toBe(comparison.exportedCount);
    },
  );
});
