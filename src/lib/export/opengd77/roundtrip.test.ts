import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { importFiles } from '../../import/index.ts';
import { resetIdGenerator, setIdGenerator, type Codeplug } from '../../../models/codeplug.ts';
import {
  CHANNEL_HEADERS,
  CONTACT_HEADERS,
  RX_GROUP_LIST_HEADERS,
} from '../../import/opengd77/columns.ts';
import { serialiseOpenGd77Files } from './serialise.ts';

function withoutId<T extends { id: string }>(item: T): Omit<T, 'id'> {
  const copy = { ...item };
  delete (copy as { id?: string }).id;
  return copy as Omit<T, 'id'>;
}

function withoutZoneIds(zone: Codeplug['zones'][number]) {
  const copy = { ...zone };
  delete (copy as { id?: string }).id;
  delete (copy as { memberChannelIds?: string[] }).memberChannelIds;
  return copy;
}

function stripIds(cp: Codeplug) {
  return {
    meta: cp.meta,
    channels: cp.channels.map(withoutId),
    zones: cp.zones.map(withoutZoneIds),
    talkGroups: cp.talkGroups.map(withoutId),
    rxGroupLists: cp.rxGroupLists.map(withoutId),
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
        {
          id: 'z1',
          name: 'North',
          sourceMemberNames: first.zones![0].memberNames,
          memberChannelIds: [],
        },
      ],
      talkGroups: first.talkGroups!,
      contacts: first.contacts!,
      rxGroupLists: first.rxGroupLists!.map((l) => ({
        id: 'rx1',
        name: l.name,
        sourceMemberNames: l.sourceMemberNames,
      })),
      meta: { schemaVersion: 3, importedAt: null, sourceFiles: [] },
    });

    const second = await importFromExport(exported);

    expect(
      stripIds({
        channels: second.channels!,
        zones: second.zones!.map((z) => ({
          id: 'z',
          name: z.name,
          sourceMemberNames: z.memberNames,
          memberChannelIds: [],
        })),
        talkGroups: second.talkGroups!,
        contacts: second.contacts!,
        rxGroupLists: second.rxGroupLists!.map((l) => ({
          id: 'rx',
          name: l.name,
          sourceMemberNames: l.sourceMemberNames,
        })),
        meta: { schemaVersion: 3, importedAt: null, sourceFiles: [] },
      }),
    ).toEqual(
      stripIds({
        channels: first.channels!,
        zones: [
          {
            id: 'z',
            name: 'North',
            sourceMemberNames: ['GB3DA DMR'],
            memberChannelIds: [],
          },
        ],
        talkGroups: first.talkGroups!,
        contacts: first.contacts!,
        rxGroupLists: first.rxGroupLists!.map((l) => ({
          id: 'rx',
          name: l.name,
          sourceMemberNames: l.sourceMemberNames,
        })),
        meta: { schemaVersion: 3, importedAt: null, sourceFiles: [] },
      }),
    );
  });
});
