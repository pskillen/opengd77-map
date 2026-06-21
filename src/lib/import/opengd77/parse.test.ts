import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { resetIdGenerator, setIdGenerator } from '../../../models/codeplug.ts';
import { CHANNEL_HEADERS, CONTACT_HEADERS, RX_GROUP_LIST_HEADERS } from './columns.ts';
import { parseChannels, parseContacts, parseRxGroupLists, parseZones } from './parse.ts';

describe('parseChannels', () => {
  beforeEach(() => {
    let n = 0;
    setIdGenerator(() => `ch-${++n}`);
  });

  afterEach(() => {
    resetIdGenerator();
  });

  const header = CHANNEL_HEADERS.join(',');

  it('parses valid channels with internal model fields', () => {
    const csv = `${header}
1,GB3DA DMR,Digital,430.0,430.0,,2,1,Local 9,Scotland,,Off,Off,,,75%,Master,No,No,No,0,Off,No,No,None,56.5,-4.0,Yes
2,GB3XX FM,Analogue,145.0,145.0,12.5,,,,,,,,None,103.5,Disabled,Master,No,No,Yes,0,On,No,No,None,57.0,-3.5,No`;

    const channels = parseChannels(csv);
    expect(channels).toHaveLength(2);
    expect(channels[0]).toMatchObject({
      id: 'ch-1',
      name: 'GB3DA DMR',
      callsign: 'GB3DA',
      mode: 'dmr',
      rxFrequency: 430_000_000,
      txFrequency: 430_000_000,
      colourCode: 2,
      timeslot: 1,
      contactName: 'Local 9',
      rxGroupListName: 'Scotland',
      squelch: 75,
      power: null,
      rxOnly: false,
      voxEnabled: false,
      transmitTimeout: 0,
      scanSkip: false,
      location: { lat: 56.5, lon: -4.0 },
      useLocation: true,
      vendorExtras: {
        'Zone Skip': 'No',
        'No Beep': 'No',
        'No Eco': 'No',
        TS1_TA_Tx: 'Off',
        'TS2_TA_Tx ID': 'Off',
      },
    });
    expect(channels[1].mode).toBe('fm');
    expect(channels[1].useLocation).toBe(false);
    expect(channels[1].bandwidthKHz).toBe(12.5);
    expect(channels[1].rxTone).toBe('none');
    expect(channels[1].txTone).toBe('103.5');
    expect(channels[1].squelch).toBe(0);
    expect(channels[1].scanSkip).toBe(true);
    expect(channels[1].voxEnabled).toBe(true);
    expect(new Set(channels.map((c) => c.id)).size).toBe(2);
  });

  it('throws when required column is missing', () => {
    expect(() => parseChannels('Channel Name,Latitude\nFoo,1.0')).toThrow(
      'Missing column "Longitude"',
    );
  });

  it('tolerates BOM', () => {
    const csv = `\uFEFF${header}\n1,Test,Digital,430,430,,,,,,,,,,,,,,,,,,,,,56.5,-4.0,Yes`;
    expect(parseChannels(csv)).toHaveLength(1);
  });

  it('skips empty rows and rows without channel name', () => {
    const csv = `${header}
1,Named,Digital,430,430,,,,,,,,,,,,,,,,,,,,,56.5,-4.0,Yes
,,,,,,,,,,,,,,,,,,,,,,,,,,,,
2,,Digital,430,430,,,,,,,,,,,,,,,,,,,,,56.5,-4.0,Yes`;

    expect(parseChannels(csv)).toHaveLength(1);
    expect(parseChannels(csv)[0].name).toBe('Named');
  });

  it('sets null location for invalid coordinates', () => {
    const csv = `${header}\n1,Test,Digital,430,430,,,,,,,,,,,,,,,,,,,,,not-a-lat,not-a-lon,Yes`;
    const ch = parseChannels(csv)[0];
    expect(ch.location).toBeNull();
  });
});

describe('parseZones', () => {
  it('extracts zone members as raw names', () => {
    const csv = `Zone Name,Channel1,Channel2,Channel3
North,GB3DA DMR,GB3XX FM,
South,GB3YY FM,,`;

    const zones = parseZones(csv);
    expect(zones).toHaveLength(2);
    expect(zones[0]).toEqual({
      name: 'North',
      memberNames: ['GB3DA DMR', 'GB3XX FM'],
    });
    expect(zones[1]).toEqual({ name: 'South', memberNames: ['GB3YY FM'] });
  });

  it('preserves member name case', () => {
    const csv = `Zone Name,Channel1
Test,MixedCase Name`;
    expect(parseZones(csv)[0].memberNames[0]).toBe('MixedCase Name');
  });

  it('throws when Zone Name column is missing', () => {
    expect(() => parseZones('Name,Channel1\nFoo,Bar')).toThrow('Missing column "Zone Name"');
  });

  it('skips empty zone rows', () => {
    const csv = `Zone Name,Channel1
Valid,CH1
,,`;
    expect(parseZones(csv)).toHaveLength(1);
  });
});

describe('parseContacts', () => {
  beforeEach(() => {
    let n = 0;
    setIdGenerator(() => `c-${++n}`);
  });

  afterEach(() => {
    resetIdGenerator();
  });

  const header = CONTACT_HEADERS.join(',');

  it('splits Group rows to talkGroups and Private to contacts', () => {
    const csv = `${header}
Local 9,9,Group,Disabled
Parrot 9990,9990,Private,Disabled
Scotland TS1,2355,Group,1`;

    const { contacts, talkGroups } = parseContacts(csv);
    expect(talkGroups).toHaveLength(2);
    expect(contacts).toHaveLength(1);
    expect(talkGroups[0]).toMatchObject({
      id: 'c-1',
      name: 'Local 9',
      number: '9',
      timeslotOverride: 'Disabled',
    });
    expect(contacts[0]).toMatchObject({
      id: 'c-2',
      name: 'Parrot 9990',
      number: '9990',
    });
  });

  it('throws when required column is missing', () => {
    expect(() => parseContacts('Contact Name,ID\nFoo,1')).toThrow('Missing column "ID Type"');
  });
});

describe('parseRxGroupLists', () => {
  it('extracts list members as sourceMemberNames', () => {
    const csv = `${RX_GROUP_LIST_HEADERS.join(',')}
Scotland,Scotland TS1,Scotland TS2,,`;

    const lists = parseRxGroupLists(csv);
    expect(lists).toHaveLength(1);
    expect(lists[0]).toEqual({
      name: 'Scotland',
      sourceMemberNames: ['Scotland TS1', 'Scotland TS2'],
    });
  });

  it('throws when TG List Name column is missing', () => {
    expect(() => parseRxGroupLists('Name,Contact1\nFoo,Bar')).toThrow(
      'Missing column "TG List Name"',
    );
  });
});
