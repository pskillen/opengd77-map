import { describe, expect, it } from 'vitest';
import { opengd77Adapter } from '../import/opengd77/adapter.ts';
import { chirpAdapter } from '../import/chirp/adapter.ts';
import { dm32Adapter } from '../import/dm32/adapter.ts';
import { opengd77ExportAdapter } from '../export/opengd77/adapter.ts';
import { chirpExportAdapter } from '../export/chirp/adapter.ts';
import { dm32ExportAdapter } from '../export/dm32/adapter.ts';
import { nativeYamlAdapter } from '../import/native-yaml/adapter.ts';
import { nativeYamlExportAdapter } from '../export/native-yaml/adapter.ts';
import { isMultiFileExportAdapter, isSingleFileExportAdapter } from './exportAdapter.ts';
import { adapterSupportsKind } from './importAdapter.ts';

describe('adapter contracts', () => {
  it('opengd77 import adapter has required metadata and parsers', () => {
    expect(opengd77Adapter.id).toBe('opengd77');
    expect(opengd77Adapter.projectNameLabel).toBe('OpenGD77');
    expect(opengd77Adapter.capabilities.delivery).toBe('multi-file');
    expect(opengd77Adapter.capabilities.entityKinds).toEqual([
      'channels',
      'zones',
      'contacts',
      'rxGroupLists',
    ]);
    expect(typeof opengd77Adapter.parseChannels).toBe('function');
    expect(typeof opengd77Adapter.parseZones).toBe('function');
    expect(typeof opengd77Adapter.parseContacts).toBe('function');
    expect(typeof opengd77Adapter.parseRxGroupLists).toBe('function');
  });

  it('opengd77 export adapter is multi-file', () => {
    expect(isMultiFileExportAdapter(opengd77ExportAdapter)).toBe(true);
    expect(opengd77ExportAdapter.fileNames).toContain('Channels.csv');
    expect(typeof opengd77ExportAdapter.downloadFile).toBe('function');
    expect(typeof opengd77ExportAdapter.downloadZip).toBe('function');
  });

  it('adapterSupportsKind gates optional parsers', () => {
    expect(adapterSupportsKind(opengd77Adapter, 'channels')).toBe(true);
    expect(adapterSupportsKind(opengd77Adapter, 'unknown')).toBe(false);
    expect(adapterSupportsKind(chirpAdapter, 'channels')).toBe(true);
    expect(adapterSupportsKind(chirpAdapter, 'zones')).toBe(false);
  });

  it('chirp export adapter is single-file', () => {
    expect(isSingleFileExportAdapter(chirpExportAdapter)).toBe(true);
    expect(chirpExportAdapter.defaultFileName).toContain('.csv');
    expect(typeof chirpExportAdapter.download).toBe('function');
  });

  it('dm32 import adapter has required metadata and parsers', () => {
    expect(dm32Adapter.id).toBe('dm32');
    expect(dm32Adapter.capabilities.entityKinds).toContain('talkGroups');
    expect(typeof dm32Adapter.parseTalkGroups).toBe('function');
    expect(typeof dm32Adapter.parseDtmfContacts).toBe('function');
  });

  it('dm32 export adapter is multi-file', () => {
    expect(isMultiFileExportAdapter(dm32ExportAdapter)).toBe(true);
    expect(dm32ExportAdapter.fileNames).toContain('Channels.csv');
  });

  it('native-yaml import adapter is native-document', () => {
    expect(nativeYamlAdapter.capabilities.interchange).toBe('native-document');
    expect(typeof nativeYamlAdapter.parseDocument).toBe('function');
  });

  it('native-yaml export adapter is single-file', () => {
    expect(isSingleFileExportAdapter(nativeYamlExportAdapter)).toBe(true);
    expect(nativeYamlExportAdapter.defaultFileName).toBe('codeplug.yaml');
  });
});
