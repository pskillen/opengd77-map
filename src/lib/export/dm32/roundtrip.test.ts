import { describe, expect, it } from 'vitest';
import { serialiseDm32Files } from './serialise.ts';
import { importFiles } from '../../import/index.ts';
import { applyImportToCodeplug } from '../../importMerge.ts';
import { emptyCodeplug } from '../../../models/codeplug.ts';
import { DEFAULT_DM32_PROFILE_ID } from '../../dm32/profiles.ts';
import { filesFromBundle, minimalBundle } from '../../../test/dm32/bundles.ts';
import { compareCsvRecords } from '../../../test/csvRecordCompare.ts';

describe('DM32 synthetic round-trip', () => {
  it('import → export preserves minimal bundle', async () => {
    const parseResult = await importFiles(filesFromBundle(minimalBundle), {
      vendorFormatId: 'dm32',
      profileId: DEFAULT_DM32_PROFILE_ID,
    });
    expect(parseResult.errors).toHaveLength(0);

    const { codeplug } = applyImportToCodeplug(emptyCodeplug(), parseResult, 'merge');
    const exported = serialiseDm32Files(codeplug, { profileId: DEFAULT_DM32_PROFILE_ID });

    for (const [fileName, originalCsv] of Object.entries(minimalBundle)) {
      const nameColumn =
        fileName === 'Channels.csv'
          ? 'Channel Name'
          : fileName === 'Zones.csv'
            ? 'Zone Name'
            : fileName === 'Talkgroups.csv'
              ? 'Name'
              : fileName === 'Contacts.csv'
                ? 'Name'
                : fileName === 'RXGroupLists.csv'
                  ? 'RX Group Name'
                  : 'Analog Contacts';
      const excludeColumns = fileName === 'Channels.csv' ? ['No.', 'Scan List', 'DMR ID'] : ['No.'];
      const comparison = compareCsvRecords(
        originalCsv,
        exported[fileName as keyof typeof exported],
        {
          nameColumn,
          excludeColumns,
        },
      );
      expect(comparison.ok, `${fileName}: ${comparison.missingInExport.length} missing`).toBe(true);
    }
  });

  it('Fixed Digital survives as one row', async () => {
    const parseResult = await importFiles(filesFromBundle(minimalBundle), {
      vendorFormatId: 'dm32',
      profileId: DEFAULT_DM32_PROFILE_ID,
    });
    const { codeplug } = applyImportToCodeplug(emptyCodeplug(), parseResult, 'merge');
    const exported = serialiseDm32Files(codeplug, { profileId: DEFAULT_DM32_PROFILE_ID });
    expect(exported['Channels.csv']).toContain('GB3FE Stirling,Fixed Digital');
    expect(exported['Channels.csv'].match(/GB3FE Stirling/g)?.length).toBe(1);
  });
});
