import { describe, expect, it, vi } from 'vitest';
import { detectKind } from './opengd77/adapter.ts';
import { importFiles } from './index.ts';
import { DEFAULT_OPENGD77_PROFILE_ID } from '../opengd77/profiles.ts';
import { DEFAULT_CHIRP_PROFILE_ID } from '../chirp/profiles.ts';
import { CHANNEL_HEADERS, CONTACT_HEADERS, RX_GROUP_LIST_HEADERS } from './opengd77/columns.ts';
import { chirpMinimalBundle } from '../../test/chirp/bundles.ts';

const OPGD77_IMPORT = { profileId: DEFAULT_OPENGD77_PROFILE_ID };

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
    const result = await importFiles(
      [
        new File([channelsCsv], 'Channels.csv', { type: 'text/csv' }),
        new File([zonesCsv], 'Zones.csv', { type: 'text/csv' }),
      ],
      OPGD77_IMPORT,
    );
    expect(result.recognised).toEqual(['Channels.csv', 'Zones.csv']);
    expect(result.channels).toHaveLength(1);
    expect(result.zones).toHaveLength(1);
    expect(result.skipped).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
  });

  it('recognises contacts and TG lists', async () => {
    const result = await importFiles(
      [
        new File([contactsCsv], 'Contacts.csv', { type: 'text/csv' }),
        new File([tgListsCsv], 'TG_Lists.csv', { type: 'text/csv' }),
      ],
      OPGD77_IMPORT,
    );
    expect(result.recognised).toEqual(['Contacts.csv', 'TG_Lists.csv']);
    expect(result.talkGroups).toHaveLength(1);
    expect(result.rxGroupLists).toHaveLength(1);
  });

  it('skips DTMF and unknown files alongside recognised OpenGD77 files', async () => {
    const result = await importFiles(
      [
        new File([channelsCsv], 'Channels.csv', { type: 'text/csv' }),
        new File(['Contact Name,Code\n'], 'DTMF.csv', { type: 'text/csv' }),
        new File(['Name,Number\nFoo,1'], 'Mystery.csv', { type: 'text/csv' }),
      ],
      OPGD77_IMPORT,
    );
    expect(result.skipped).toHaveLength(2);
    expect(result.errors).toHaveLength(0);
    expect(result.formatId).toBe('opengd77');
  });

  it('errors when the batch format cannot be detected', async () => {
    const result = await importFiles([
      new File(['Name,Number\nFoo,1'], 'Mystery.csv', { type: 'text/csv' }),
    ]);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.fileName).toBe('(batch)');
  });

  it('records parse errors', async () => {
    const result = await importFiles(
      [new File(['not,a,valid,channels,csv'], 'Channels.csv', { type: 'text/csv' })],
      OPGD77_IMPORT,
    );
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

    const result = await importFiles([channels, zones], OPGD77_IMPORT);
    expect(result.suggestedProjectName).toBe('my-codeplug');
  });

  it('suggests OpenGD77 ISO date for loose file imports', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-21T12:00:00.000Z'));
    const single = await importFiles(
      [new File([channelsCsv], 'Channels.csv', { type: 'text/csv' })],
      OPGD77_IMPORT,
    );
    expect(single.suggestedProjectName).toBe('OpenGD77 2026-06-21');

    const multiple = await importFiles(
      [
        new File([channelsCsv], 'Channels.csv', { type: 'text/csv' }),
        new File([zonesCsv], 'Zones.csv', { type: 'text/csv' }),
      ],
      OPGD77_IMPORT,
    );
    expect(multiple.suggestedProjectName).toBe('OpenGD77 2026-06-21');
    vi.useRealTimers();
  });

  it('accepts dropped directory name override', async () => {
    const result = await importFiles(
      [new File([channelsCsv], 'Channels.csv', { type: 'text/csv' })],
      { directoryName: 'DroppedFolder', ...OPGD77_IMPORT },
    );
    expect(result.suggestedProjectName).toBe('DroppedFolder');
  });

  it('imports CHIRP CSV when vendorFormatId is chirp', async () => {
    const csv = chirpMinimalBundle['chirp-minimal.csv']!;
    const result = await importFiles([new File([csv], 'chirp-minimal.csv', { type: 'text/csv' })], {
      vendorFormatId: 'chirp',
      profileId: DEFAULT_CHIRP_PROFILE_ID,
    });
    expect(result.formatId).toBe('chirp');
    expect(result.channels?.length).toBeGreaterThan(0);
    expect(result.errors).toHaveLength(0);
  });

  it('errors when profile-aware import lacks profileId', async () => {
    const csv = chirpMinimalBundle['chirp-minimal.csv']!;
    const chirp = await importFiles([new File([csv], 'chirp.csv', { type: 'text/csv' })], {
      vendorFormatId: 'chirp',
    });
    expect(chirp.errors[0]?.message).toMatch(/profile is required/i);

    const opengd77 = await importFiles(
      [new File([channelsCsv], 'Channels.csv', { type: 'text/csv' })],
      { vendorFormatId: 'opengd77' },
    );
    expect(opengd77.errors[0]?.message).toMatch(/profile is required/i);
  });
});
