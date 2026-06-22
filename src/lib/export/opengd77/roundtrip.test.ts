import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { importFiles } from '../../import/index.ts';
import { addRxGroupList, addTalkGroup } from '../../codeplugMutations.ts';
import type { EntityMeta } from '../../entityProvenance.ts';
import {
  CODEPLUG_SCHEMA_VERSION,
  emptyCodeplug,
  resetIdGenerator,
  setIdGenerator,
  type Codeplug,
} from '../../../models/codeplug.ts';
import { buildImportedRxGroupList, buildImportedZone } from '../../../test/builders/index.ts';
import {
  CHANNEL_HEADERS,
  CONTACT_HEADERS,
  RX_GROUP_LIST_HEADERS,
} from '../../import/opengd77/columns.ts';
import { serialiseOpenGd77Files } from './serialise.ts';

function withoutId<T extends { id: string; meta?: EntityMeta }>(item: T): Omit<T, 'id'> {
  const copy = { ...item };
  delete (copy as { id?: string }).id;
  if (copy.meta?.imported) {
    copy.meta = {
      ...copy.meta,
      imported: { ...copy.meta.imported, importedAt: 'stripped' },
    };
  }
  return copy as Omit<T, 'id'>;
}

function withoutZoneIds(zone: Codeplug['zones'][number]) {
  const copy = withoutId(zone) as Codeplug['zones'][number];
  delete (copy as { memberChannelIds?: string[] }).memberChannelIds;
  return copy;
}

function stripIds(cp: Codeplug) {
  return {
    meta: cp.meta,
    channels: cp.channels.map(withoutId),
    zones: cp.zones.map(withoutZoneIds),
    talkGroups: cp.talkGroups.map(withoutId),
    rxGroupLists: cp.rxGroupLists.map((rgl) => {
      const copy = withoutId(rgl) as Codeplug['rxGroupLists'][number];
      copy.memberRefs = rgl.memberRefs.map((ref) => ({ ...ref }));
      return copy;
    }),
    contacts: cp.contacts.map(withoutId),
  };
}

async function importFromExport(files: ReturnType<typeof serialiseOpenGd77Files>) {
  return importFiles([
    new File([files['Channels.csv']], 'Channels.csv', { type: 'text/csv' }),
    new File([files['Zones.csv']], 'Zones.csv', { type: 'text/csv' }),
    new File([files['Contacts.csv']], 'Contacts.csv', { type: 'text/csv' }),
    new File([files['TG_Lists.csv']], 'TG_Lists.csv', { type: 'text/csv' }),
  ]);
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
1,GB3DA DMR,Digital,430.0,430.0,,2,1,Local 9,Scotland,,Off,Off,,,75%,Master,No,No,No,0,Off,No,No,None,56.5,-4.0,Yes`;

    const zonesCsv = `Zone Name,Channel1,Channel2\nNorth,GB3DA DMR,`;
    const contactsCsv = `${CONTACT_HEADERS.join(',')}
Local 9,9,Group,Disabled
Scotland TS1,2355,Group,1`;
    const tgListsCsv = `${RX_GROUP_LIST_HEADERS.join(',')}
Scotland,Scotland TS1,Local 9,,`;

    const first = await importFiles([
      new File([channelsCsv], 'Channels.csv', { type: 'text/csv' }),
      new File([zonesCsv], 'Zones.csv', { type: 'text/csv' }),
      new File([contactsCsv], 'Contacts.csv', { type: 'text/csv' }),
      new File([tgListsCsv], 'TG_Lists.csv', { type: 'text/csv' }),
    ]);

    const exported = serialiseOpenGd77Files({
      channels: first.channels!,
      zones: [
        buildImportedZone(
          { id: 'z1', name: 'North', memberChannelIds: [] },
          first.zones![0].memberNames,
        ),
      ],
      talkGroups: first.talkGroups!,
      contacts: first.contacts!,
      rxGroupLists: first.rxGroupLists!.map((l) =>
        buildImportedRxGroupList({ id: 'rx1', name: l.name }, l.memberWireNames),
      ),
      meta: { schemaVersion: CODEPLUG_SCHEMA_VERSION, importedAt: null, sourceFiles: [] },
    });

    const second = await importFromExport(exported);

    expect(
      stripIds({
        channels: second.channels!,
        zones: [
          buildImportedZone(
            { id: 'z', name: second.zones![0].name, memberChannelIds: [] },
            second.zones![0].memberNames,
          ),
        ],
        talkGroups: second.talkGroups!,
        contacts: second.contacts!,
        rxGroupLists: second.rxGroupLists!.map((l) =>
          buildImportedRxGroupList({ id: 'rx', name: l.name }, l.memberWireNames),
        ),
        meta: { schemaVersion: CODEPLUG_SCHEMA_VERSION, importedAt: null, sourceFiles: [] },
      }),
    ).toEqual(
      stripIds({
        channels: first.channels!,
        zones: [buildImportedZone({ id: 'z', name: 'North', memberChannelIds: [] }, ['GB3DA DMR'])],
        talkGroups: first.talkGroups!,
        contacts: first.contacts!,
        rxGroupLists: first.rxGroupLists!.map((l) =>
          buildImportedRxGroupList({ id: 'rx', name: l.name }, l.memberWireNames),
        ),
        meta: { schemaVersion: CODEPLUG_SCHEMA_VERSION, importedAt: null, sourceFiles: [] },
      }),
    );
    expect(second.zones).toEqual(first.zones);
    expect(second.rxGroupLists).toEqual(first.rxGroupLists);
  });

  it('export truncates RX group list members at OpenGD77 profile cap (boundary only)', async () => {
    let cp = emptyCodeplug();
    const memberNames: string[] = [];
    for (let i = 0; i < 40; i++) {
      const name = `TG${i}`;
      memberNames.push(name);
      cp = addTalkGroup(cp, { name, number: String(i), timeslotOverride: '' });
    }
    cp = addRxGroupList(cp, {
      name: 'BigList',
      memberRefs: cp.talkGroups.map((tg) => ({ kind: 'talkGroup', id: tg.id })),
    });

    expect(cp.rxGroupLists[0].memberRefs).toHaveLength(40);

    const exported = serialiseOpenGd77Files(cp);
    const reimported = await importFromExport(exported);

    expect(reimported.rxGroupLists).toHaveLength(1);
    expect(reimported.rxGroupLists![0].memberWireNames).toHaveLength(32);
    expect(reimported.rxGroupLists![0].memberWireNames[0]).toBe('TG0');
    expect(reimported.rxGroupLists![0].memberWireNames[31]).toBe('TG31');
  });
});
