import { describe, expect, it } from 'vitest';
import { opengd77Adapter } from '../import/opengd77/adapter.ts';
import { opengd77ExportAdapter } from '../export/opengd77/adapter.ts';
import { isMultiFileExportAdapter } from './exportAdapter.ts';
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
  });
});
