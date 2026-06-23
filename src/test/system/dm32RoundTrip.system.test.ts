import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { serialiseDm32Files } from '../../lib/export/dm32/serialise.ts';
import { importFiles } from '../../lib/import/index.ts';
import { applyImportToCodeplug } from '../../lib/importMerge.ts';
import { emptyCodeplug, resetIdGenerator, setIdGenerator } from '../../models/codeplug.ts';
import { compareCsvRecords, formatCsvRecordCompareFailure } from '../csvRecordCompare.ts';
import {
  DM32_TEST_DATA_FIXTURES,
  dm32TestDataFiles,
  readDm32TestData,
  type Dm32TestDataFileName,
} from '../dm32/testData.ts';

const SUBSTANTIVE_FILES: {
  fileName: Dm32TestDataFileName;
  nameColumn: string;
  excludeColumns?: string[];
}[] = [
  {
    fileName: 'Channels.csv',
    nameColumn: 'Channel Name',
    excludeColumns: ['No.', 'Scan List', 'DMR ID'],
  },
  { fileName: 'Zones.csv', nameColumn: 'Zone Name', excludeColumns: ['No.'] },
  { fileName: 'Talkgroups.csv', nameColumn: 'Name', excludeColumns: ['No.'] },
  { fileName: 'Contacts.csv', nameColumn: 'Name', excludeColumns: ['No.'] },
  { fileName: 'RXGroupLists.csv', nameColumn: 'RX Group Name', excludeColumns: ['No.'] },
  { fileName: 'DTMFContacts.csv', nameColumn: 'Analog Contacts', excludeColumns: ['No.'] },
];

describe('DM32 file-level round-trip (test-data)', () => {
  beforeEach(() => {
    let n = 0;
    setIdGenerator(() => `dm32-sys-${++n}`);
  });

  afterEach(() => {
    resetIdGenerator();
  });

  it.each(DM32_TEST_DATA_FIXTURES)(
    'import → codeplug → export matches $version CPS export',
    async (fixture) => {
      const parseResult = await importFiles(dm32TestDataFiles(fixture), {
        vendorFormatId: 'dm32',
        profileId: fixture.profileId,
      });
      expect(parseResult.errors).toHaveLength(0);
      expect(parseResult.channels?.length).toBeGreaterThan(0);

      const { codeplug } = applyImportToCodeplug(emptyCodeplug(), parseResult, 'merge');

      const exported = serialiseDm32Files(codeplug, { profileId: fixture.profileId });

      for (const { fileName, nameColumn, excludeColumns } of SUBSTANTIVE_FILES) {
        const originalCsv = readDm32TestData(fixture, fileName);
        const comparison = compareCsvRecords(originalCsv, exported[fileName], {
          nameColumn,
          excludeColumns,
        });
        expect(comparison.ok, `${fileName}:\n${formatCsvRecordCompareFailure(comparison)}`).toBe(
          true,
        );
        expect(comparison.originalCount).toBe(comparison.exportedCount);
      }
    },
  );
});
