import { describe, expect, it } from 'vitest';
import { serialiseDm32Files } from './serialise.ts';
import { importFiles } from '../../import/index.ts';
import { applyImportToCodeplug } from '../../importMerge.ts';
import { emptyCodeplug } from '../../../models/codeplug.ts';
import { DEFAULT_DM32_PROFILE_ID } from '../../dm32/profiles.ts';
import { filesFromBundle, minimalBundle } from '../../../test/dm32/bundles.ts';
import { compareCsvRecords } from '../../../test/csvRecordCompare.ts';
import {
  buildChannel,
  buildCodeplug,
  buildRxGroupList,
  buildRglMember,
  buildTalkGroup,
} from '../../../test/builders/codeplug.ts';

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

  it('TG-expanded rows carry per-member Time Slot from RGL member timeslot', () => {
    const tgTs2 = buildTalkGroup({
      id: 'tg1',
      name: 'Scotland TS2',
      number: '950',
    });
    const tgTs1 = buildTalkGroup({
      id: 'tg2',
      name: 'Scot West TS1',
      number: '2355',
    });
    const rgl = buildRxGroupList({
      id: 'rgl1',
      name: 'GB7GL',
      memberRefs: [
        buildRglMember({ kind: 'talkGroup', id: 'tg1' }, 2),
        buildRglMember({ kind: 'talkGroup', id: 'tg2' }, 1),
      ],
    });
    const ch = buildChannel({
      id: 'c1',
      name: 'Glasgow',
      callsign: 'GB7GL',
      mode: 'dmr',
      rxGroupListId: 'rgl1',
      rxFrequency: 430_912_500,
      txFrequency: 438_512_500,
      colourCode: 1,
    });
    const codeplug = buildCodeplug({
      channels: [ch],
      talkGroups: [tgTs2, tgTs1],
      rxGroupLists: [rgl],
    });
    const exported = serialiseDm32Files(codeplug, { profileId: DEFAULT_DM32_PROFILE_ID });
    const csv = exported['Channels.csv'];
    expect(csv).toContain('Scotland TS2');
    expect(csv).toContain('Scot West TS1');
    const lines = csv
      .split('\n')
      .filter((line) => line.includes('Scotland TS2') || line.includes('Scot West TS1'));
    expect(lines.some((line) => line.includes('Scotland TS2') && line.includes('Slot 2'))).toBe(
      true,
    );
    expect(lines.some((line) => line.includes('Scot West TS1') && line.includes('Slot 1'))).toBe(
      true,
    );
  });
});
