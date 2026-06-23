import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { importFiles } from '../../import/index.ts';
import { parseChannels } from '../../import/chirp/parse.ts';
import type { EntityMeta } from '../../entityProvenance.ts';
import {
  CODEPLUG_SCHEMA_VERSION,
  resetIdGenerator,
  setIdGenerator,
  type Channel,
  type Codeplug,
} from '../../../models/codeplug.ts';
import { chirpMinimalBundle } from '../../../test/chirp/bundles.ts';
import { DEFAULT_CHIRP_PROFILE_ID } from '../../chirp/profiles.ts';
import { serialiseChirpCsv } from './serialise.ts';

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

function stripChannels(channels: Channel[]) {
  return channels.map((ch) => {
    const { comment, ...rest } = withoutId(ch);
    void comment;
    return rest;
  });
}

async function importChirpCsv(csv: string) {
  return importFiles([new File([csv], 'chirp.csv', { type: 'text/csv' })], {
    vendorFormatId: 'chirp',
    profileId: DEFAULT_CHIRP_PROFILE_ID,
  });
}

describe('CHIRP round-trip', () => {
  beforeEach(() => {
    let n = 0;
    setIdGenerator(() => `id-${++n}`);
  });

  afterEach(() => {
    resetIdGenerator();
  });

  it('import → export → re-import preserves substantive channel data', async () => {
    const first = await importChirpCsv(chirpMinimalBundle['chirp-minimal.csv']!);
    expect(first.channels).toHaveLength(2);

    const codeplug: Codeplug = {
      channels: first.channels!,
      zones: [],
      talkGroups: [],
      rxGroupLists: [],
      contacts: [],
      meta: { schemaVersion: CODEPLUG_SCHEMA_VERSION, importedAt: null, sourceFiles: [] },
    };

    const { csv } = serialiseChirpCsv(codeplug);
    const second = await importChirpCsv(csv);

    expect(stripChannels(second.channels!)).toEqual(stripChannels(first.channels!));
  });

  it('assigns Location from channel list order on export', () => {
    const channels = parseChannels(chirpMinimalBundle['chirp-minimal.csv']!, {
      profileId: DEFAULT_CHIRP_PROFILE_ID,
    });
    const { csv } = serialiseChirpCsv({
      channels,
      zones: [],
      talkGroups: [],
      rxGroupLists: [],
      contacts: [],
      meta: { schemaVersion: CODEPLUG_SCHEMA_VERSION, importedAt: null, sourceFiles: [] },
    });
    const rows = csv.trim().split('\n');
    expect(rows[1]?.startsWith('1,')).toBe(true);
    expect(rows[2]?.startsWith('2,')).toBe(true);
  });
});
