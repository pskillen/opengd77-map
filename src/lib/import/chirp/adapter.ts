import type { ImportFileKind } from '../../import-export/types.ts';
import { isChirpHeaderRow } from './columns.ts';
import { parseChannels } from './parse.ts';

export function detectKind(_fileName: string, headerRow: string[]): ImportFileKind {
  if (isChirpHeaderRow(headerRow)) return 'channels';
  return 'unknown';
}

export const chirpAdapter = {
  id: 'chirp' as const,
  label: 'CHIRP CSV',
  projectNameLabel: 'CHIRP',
  capabilities: {
    delivery: 'single-file' as const,
    interchange: 'cps-wire' as const,
    entityKinds: ['channels'] as const,
  },
  detectKind,
  parseChannels,
} satisfies import('../../import-export/importAdapter.ts').ImportAdapter;
