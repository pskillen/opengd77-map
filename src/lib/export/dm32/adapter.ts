import { DM32_EXPORT_FILE_NAMES } from '../../import/dm32/columns.ts';
import { serialiseChannels, serialiseZones, type Dm32ExportFiles } from './serialise.ts';
import { buildDm32Zip, downloadDm32File, downloadDm32Zip } from './download.ts';

export type Dm32ExportFileName = keyof Dm32ExportFiles;

export const dm32ExportAdapter = {
  id: 'dm32' as const,
  label: 'Baofeng DM32 CPS CSV',
  delivery: 'multi-file' as const,
  fileNames: DM32_EXPORT_FILE_NAMES,
  serialiseChannels,
  serialiseZones,
  buildZip: buildDm32Zip,
  downloadFile: downloadDm32File,
  downloadZip: downloadDm32Zip,
} satisfies import('../../import-export/exportAdapter.ts').MultiFileExportAdapter & {
  serialiseChannels: typeof serialiseChannels;
  serialiseZones: typeof serialiseZones;
  buildZip: typeof buildDm32Zip;
};

export type { Dm32ExportFiles };
