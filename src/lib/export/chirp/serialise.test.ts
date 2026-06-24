import { describe, expect, it } from 'vitest';
import {
  channelFieldDefaults,
  CODEPLUG_SCHEMA_VERSION,
  emptyCodeplug,
  type Channel,
} from '../../../models/codeplug.ts';
import { serialiseChirpCsv } from './serialise.ts';

function analogueChannel(overrides: Partial<Channel> & Pick<Channel, 'id' | 'name'>): Channel {
  return {
    ...channelFieldDefaults(),
    callsign: '',
    mode: 'fm',
    rxFrequency: 145_500_000,
    txFrequency: 145_500_000,
    exportNameMode: 'name_only',
    ...overrides,
  };
}

/** CHIRP `Name` column (index 1) — test names have no commas. */
function wireNameFromCsv(csv: string): string {
  const dataRow = csv.trim().split('\n')[1]!;
  return dataRow.split(',')[1]!;
}

describe('serialiseChirpCsv name length', () => {
  it('preserves a 10-character name within UV-5R Mini profile default', () => {
    const codeplug = emptyCodeplug();
    codeplug.channels = [analogueChannel({ id: 'ch-1', name: 'TenCharOne' })];
    codeplug.meta = { schemaVersion: CODEPLUG_SCHEMA_VERSION, importedAt: null, sourceFiles: [] };

    const { csv } = serialiseChirpCsv(codeplug, {
      profileId: 'baofeng-uv5r-mini',
      shortenNames: true,
    });

    expect(wireNameFromCsv(csv)).toBe('TenCharOne');
  });

  it('honours maxNameLength override above a lower profile limit', () => {
    const codeplug = emptyCodeplug();
    codeplug.channels = [analogueChannel({ id: 'ch-1', name: 'TenCharOne' })];
    codeplug.meta = { schemaVersion: CODEPLUG_SCHEMA_VERSION, importedAt: null, sourceFiles: [] };

    const { csv } = serialiseChirpCsv(codeplug, {
      profileId: 'baofeng-uv5r-mini',
      shortenNames: true,
      maxNameLength: 12,
    });

    expect(wireNameFromCsv(csv)).toBe('TenCharOne');
  });

  it('shortens names longer than maxNameLength override', () => {
    const codeplug = emptyCodeplug();
    codeplug.channels = [analogueChannel({ id: 'ch-1', name: 'abcdefghijklmn' })];
    codeplug.meta = { schemaVersion: CODEPLUG_SCHEMA_VERSION, importedAt: null, sourceFiles: [] };

    const { csv } = serialiseChirpCsv(codeplug, {
      profileId: 'baofeng-uv5r-mini',
      shortenNames: true,
      maxNameLength: 12,
    });

    expect(wireNameFromCsv(csv).length).toBeLessThanOrEqual(12);
    expect(wireNameFromCsv(csv).length).toBeGreaterThan(0);
  });
});
