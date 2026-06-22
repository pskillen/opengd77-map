import { describe, expect, it, vi } from 'vitest';
import { detectKind } from './opengd77/adapter.ts';
import { importFiles } from './index.ts';
import { CHANNEL_HEADERS, CONTACT_HEADERS, RX_GROUP_LIST_HEADERS } from './opengd77/columns.ts';

describe('detectKind', () => {
  it('classifies by filename', () => {
    expect(detectKind('Channels.csv', [])).toBe('channels');
    expect(detectKind('zones.csv', [])).toBe('zones');
    expect(detectKind('Contacts.csv', [])).toBe('contacts');
    expect(detectKind('TG_Lists.csv', [])).toBe('rxGroupLists');
    expect(detectKind('DTMF.csv', [])).toBe('unknown');
  });

  it('falls back to header signatures', () => {
    expect(detectKind('data.csv', ['Channel Name', 'Latitude', 'Longitude'])).toBe('channels');
    expect(detectKind('data.csv', ['Zone Name', 'Channel1'])).toBe('zones');
    expect(detectKind('data.csv', CONTACT_HEADERS)).toBe('contacts');
    expect(detectKind('data.csv', RX_GROUP_LIST_HEADERS)).toBe('rxGroupLists');
    expect(detectKind('data.csv', ['Contact Name', 'Code'])).toBe('unknown');
    expect(detectKind('data.csv', ['Foo', 'Bar'])).toBe('unknown');
  });
});

describe('importFiles', () => {
  const channelsCsv = `${CHANNEL_HEADERS.join(',')}
1,GB3DA DMR,Digital,430,430,,,,,,,,,,,,,,,,,,,,,56.5,-4.0,Yes`;
  const zonesCsv = `Zone Name,Channel1\nNorth,GB3DA DMR`;
  const contactsCsv = `${CONTACT_HEADERS.join(',')}
Local 9,9,Group,Disabled`;
  const tgListsCsv = `${RX_GROUP_LIST_HEADERS.join(',')}
Scotland,Local 9,,`;

  it('recognises channels and zones from separate files', async () => {
    const result = await importFiles([
      new File([channelsCsv], 'Channels.csv', { type: 'text/csv' }),
      new File([zonesCsv], 'Zones.csv', { type: 'text/csv' }),
    ]);
    expect(result.recognised).toEqual(['Channels.csv', 'Zones.csv']);
    expect(result.channels).toHaveLength(1);
    expect(result.zones).toHaveLength(1);
    expect(result.skipped).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
  });

  it('recognises contacts and TG lists', async () => {
    const result = await importFiles([
      new File([contactsCsv], 'Contacts.csv', { type: 'text/csv' }),
      new File([tgListsCsv], 'TG_Lists.csv', { type: 'text/csv' }),
    ]);
    expect(result.recognised).toEqual(['Contacts.csv', 'TG_Lists.csv']);
    expect(result.talkGroups).toHaveLength(1);
    expect(result.rxGroupLists).toHaveLength(1);
  });

  it('skips DTMF and unknown files without error', async () => {
    const result = await importFiles([
      new File(['Contact Name,Code\n'], 'DTMF.csv', { type: 'text/csv' }),
      new File(['Name,Number\nFoo,1'], 'Mystery.csv', { type: 'text/csv' }),
    ]);
    expect(result.skipped).toHaveLength(2);
    expect(result.errors).toHaveLength(0);
  });

  it('records parse errors', async () => {
    const result = await importFiles([
      new File(['not,a,valid,channels,csv'], 'Channels.csv', { type: 'text/csv' }),
    ]);
    expect(result.errors).toHaveLength(1);
    expect(result.recognised).toHaveLength(0);
  });

  it('suggests directory leaf name for folder imports', async () => {
    const channels = new File([channelsCsv], 'Channels.csv', { type: 'text/csv' });
    Object.defineProperty(channels, 'webkitRelativePath', {
      value: 'my-codeplug/Channels.csv',
    });
    const zones = new File([zonesCsv], 'Zones.csv', { type: 'text/csv' });
    Object.defineProperty(zones, 'webkitRelativePath', {
      value: 'my-codeplug/Zones.csv',
    });

    const result = await importFiles([channels, zones]);
    expect(result.suggestedProjectName).toBe('my-codeplug');
  });

  it('suggests OpenGD77 ISO date for loose file imports', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-21T12:00:00.000Z'));
    const single = await importFiles([
      new File([channelsCsv], 'Channels.csv', { type: 'text/csv' }),
    ]);
    expect(single.suggestedProjectName).toBe('OpenGD77 2026-06-21');

    const multiple = await importFiles([
      new File([channelsCsv], 'Channels.csv', { type: 'text/csv' }),
      new File([zonesCsv], 'Zones.csv', { type: 'text/csv' }),
    ]);
    expect(multiple.suggestedProjectName).toBe('OpenGD77 2026-06-21');
    vi.useRealTimers();
  });

  it('accepts dropped directory name override', async () => {
    const result = await importFiles(
      [new File([channelsCsv], 'Channels.csv', { type: 'text/csv' })],
      { directoryName: 'DroppedFolder' },
    );
    expect(result.suggestedProjectName).toBe('DroppedFolder');
  });
});
