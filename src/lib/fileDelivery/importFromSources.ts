import { importFiles, type ImportFilesOptions } from '../import/index.ts';
import type { ImportResult } from '../import/types.ts';
import type { ImportSource } from './types.ts';

export async function importFromSources(
  sources: ImportSource[],
  options?: ImportFilesOptions,
): Promise<ImportResult> {
  const files = sources.map(
    (source) => new File([source.text], source.name, { type: 'text/plain' }),
  );
  return importFiles(files, options);
}
