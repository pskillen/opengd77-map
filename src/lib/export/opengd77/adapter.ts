import {
  serialiseChannels,
  serialiseContacts,
  serialiseRxGroupLists,
  serialiseZones,
  type OpenGd77ExportFiles,
} from './serialise.ts';
import { buildOpenGd77Zip, downloadOpenGd77File, downloadOpenGd77Zip } from './download.ts';

export type OpenGd77ExportFileName = keyof OpenGd77ExportFiles;

export const opengd77ExportAdapter = {
  id: 'opengd77' as const,
  label: 'OpenGD77 CPS CSV',
  delivery: 'multi-file' as const,
  fileNames: ['Channels.csv', 'Zones.csv', 'Contacts.csv', 'TG_Lists.csv'] as const,
  serialiseChannels,
  serialiseZones,
  serialiseContacts,
  serialiseRxGroupLists,
  buildZip: buildOpenGd77Zip,
  downloadFile: downloadOpenGd77File,
  downloadZip: downloadOpenGd77Zip,
} satisfies import('../../import-export/exportAdapter.ts').MultiFileExportAdapter & {
  serialiseChannels: typeof serialiseChannels;
  serialiseZones: typeof serialiseZones;
  serialiseContacts: typeof serialiseContacts;
  serialiseRxGroupLists: typeof serialiseRxGroupLists;
  buildZip: typeof buildOpenGd77Zip;
};

export type { OpenGd77ExportFiles };
