import { describe, expect, it } from 'vitest';
import { extractCallsign, parseChannelsCsv, parseCsv, parseZonesCsv } from './csv.ts';

describe('parseCsv', () => {
  it('parses quoted fields with commas', () => {
    expect(parseCsv('a,"b,c",d\n1,2,3')).toEqual([
      ['a', 'b,c', 'd'],
      ['1', '2', '3'],
    ]);
  });

  it('parses escaped double quotes', () => {
    expect(parseCsv('"a""b",c')).toEqual([['a"b', 'c']]);
  });
});

describe('extractCallsign', () => {
  it('returns first word of channel name', () => {
    expect(extractCallsign('GB3DA DMR')).toBe('GB3DA');
  });
});

describe('parseChannelsCsv', () => {
  const header =
    'Channel Number,Channel Name,Channel Type,Rx Frequency,Tx Frequency,Contact,TG List,Latitude,Longitude,Use Location';

  it('parses valid channels', () => {
    const csv = `${header}
1,GB3DA DMR,Digital,430.0,430.0,None,None,56.5,-4.0,Yes
2,GB3XX FM,Analogue,145.0,145.0,None,None,57.0,-3.5,No`;

    const channels = parseChannelsCsv(csv);
    expect(channels).toHaveLength(2);
    expect(channels[0]).toMatchObject({
      number: '1',
      name: 'GB3DA DMR',
      callsign: 'GB3DA',
      type: 'Digital',
      lat: 56.5,
      lon: -4.0,
      useLocation: true,
    });
    expect(channels[1].useLocation).toBe(false);
  });

  it('throws when required column is missing', () => {
    expect(() => parseChannelsCsv('Channel Name,Latitude\nFoo,1.0')).toThrow(
      'Missing column "Longitude"',
    );
  });

  it('tolerates BOM', () => {
    const csv = `\uFEFF${header}\n1,Test,Digital,430,430,None,None,56.5,-4.0,Yes`;
    expect(parseChannelsCsv(csv)).toHaveLength(1);
  });

  it('skips empty rows and rows without channel name', () => {
    const csv = `${header}
1,Named,Digital,430,430,None,None,56.5,-4.0,Yes
,,,,,,,,,
2,,Digital,430,430,None,None,56.5,-4.0,Yes`;

    expect(parseChannelsCsv(csv)).toHaveLength(1);
    expect(parseChannelsCsv(csv)[0].name).toBe('Named');
  });

  it('sets null for invalid coordinates', () => {
    const csv = `${header}\n1,Test,Digital,430,430,None,None,not-a-lat,not-a-lon,Yes`;
    const ch = parseChannelsCsv(csv)[0];
    expect(ch.lat).toBeNull();
    expect(ch.lon).toBeNull();
  });
});

describe('parseZonesCsv', () => {
  it('extracts zone members from Channel columns', () => {
    const csv = `Zone Name,Channel1,Channel2,Channel3
North,GB3DA DMR,GB3XX FM,
South,GB3YY FM,,`;

    const zones = parseZonesCsv(csv);
    expect(zones).toHaveLength(2);
    expect(zones[0]).toEqual({ name: 'North', members: ['GB3DA DMR', 'GB3XX FM'] });
    expect(zones[1]).toEqual({ name: 'South', members: ['GB3YY FM'] });
  });

  it('preserves member name case', () => {
    const csv = `Zone Name,Channel1
Test,MixedCase Name`;
    expect(parseZonesCsv(csv)[0].members[0]).toBe('MixedCase Name');
  });

  it('throws when Zone Name column is missing', () => {
    expect(() => parseZonesCsv('Name,Channel1\nFoo,Bar')).toThrow('Missing column "Zone Name"');
  });

  it('skips empty zone rows', () => {
    const csv = `Zone Name,Channel1
Valid,CH1
,,`;
    expect(parseZonesCsv(csv)).toHaveLength(1);
  });
});
