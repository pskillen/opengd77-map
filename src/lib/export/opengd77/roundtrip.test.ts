import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { importFiles } from '../../import/index.ts';
import { applyImportToCodeplug } from '../../importMerge.ts';
import { addRxGroupList, addTalkGroup } from '../../codeplugMutations.ts';
import {
  emptyCodeplug,
  resetIdGenerator,
  setIdGenerator,
} from '../../../models/codeplug.ts';
import {
  CHANNEL_HEADERS,
  CONTACT_HEADERS,
  RX_GROUP_LIST_HEADERS,
} from '../../import/opengd77/columns.ts';
import { serialiseOpenGd77Files } from './serialise.ts';
import { DEFAULT_OPENGD77_PROFILE_ID } from '../../opengd77/profiles.ts';
import { buildRglMember } from '../../../test/builders/codeplug.ts';
import { stripCodeplugForSemanticCompare } from '../../../test/opengd77/codeplugSemanticCompare.ts';

const OPGD77_IMPORT = { profileId: DEFAULT_OPENGD77_PROFILE_ID };

async function importFromExport(files: ReturnType<typeof serialiseOpenGd77Files>) {
  return importFiles(
    [
      new File([files['Channels.csv']], 'Channels.csv', { type: 'text/csv' }),
      new File([files['Zones.csv']], 'Zones.csv', { type: 'text/csv' }),
      new File([files['Contacts.csv']], 'Contacts.csv', { type: 'text/csv' }),
      new File([files['TG_Lists.csv']], 'TG_Lists.csv', { type: 'text/csv' }),
    ],
    OPGD77_IMPORT,
  );
}

describe('OpenGD77 round-trip', () => {
  beforeEach(() => {
    let n = 0;
    setIdGenerator(() => `id-${++n}`);
  });

  afterEach(() => {
    resetIdGenerator();
  });

  it('import → export → re-import preserves substantive data', async () => {
    const channelsCsv = `${CHANNEL_HEADERS.join(',')}
1,GB3DA DMR,Digital,430.0,430.0,,2,1,Local 9,Scotland,,Off,Off,,,,Master,No,No,No,0,Off,No,No,None,56.5,-4.0,Yes`;

    const zonesCsv = `Zone Name,Channel1,Channel2\nNorth,GB3DA DMR,`;
    const contactsCsv = `${CONTACT_HEADERS.join(',')}
Local 9,9,Group,Disabled
Scotland TS1,2355,Group,1`;
    const tgListsCsv = `${RX_GROUP_LIST_HEADERS.join(',')}
Scotland,Scotland TS1,Local 9,,`;

    const firstParsed = await importFiles(
      [
        new File([channelsCsv], 'Channels.csv', { type: 'text/csv' }),
        new File([zonesCsv], 'Zones.csv', { type: 'text/csv' }),
        new File([contactsCsv], 'Contacts.csv', { type: 'text/csv' }),
        new File([tgListsCsv], 'TG_Lists.csv', { type: 'text/csv' }),
      ],
      OPGD77_IMPORT,
    );
    const { codeplug: first } = applyImportToCodeplug(emptyCodeplug(), firstParsed, 'merge');

    const exported = serialiseOpenGd77Files(first, OPGD77_IMPORT);

    const secondParsed = await importFromExport(exported);
    const { codeplug: second } = applyImportToCodeplug(emptyCodeplug(), secondParsed, 'merge');

    expect(stripCodeplugForSemanticCompare(second)).toEqual(stripCodeplugForSemanticCompare(first));
    expect(secondParsed.zones).toEqual(firstParsed.zones);
  });

  it('export truncates RX group list members at OpenGD77 profile cap (boundary only)', async () => {
    let cp = emptyCodeplug();
    const memberNames: string[] = [];
    for (let i = 0; i < 40; i++) {
      const name = `TG${i}`;
      memberNames.push(name);
      cp = addTalkGroup(cp, { name, number: String(i) });
    }
    cp = addRxGroupList(cp, {
      name: 'BigList',
      memberRefs: cp.talkGroups.map((tg) => buildRglMember({ kind: 'talkGroup', id: tg.id })),
    });

    expect(cp.rxGroupLists[0].memberRefs).toHaveLength(40);

    const exported = serialiseOpenGd77Files(cp, OPGD77_IMPORT);
    const reimported = await importFromExport(exported);

    expect(reimported.rxGroupLists).toHaveLength(1);
    expect(reimported.rxGroupLists![0].memberWireNames).toHaveLength(32);
    expect(reimported.rxGroupLists![0].memberWireNames[0]).toBe('TG0');
    expect(reimported.rxGroupLists![0].memberWireNames[31]).toBe('TG31');
  });
});
