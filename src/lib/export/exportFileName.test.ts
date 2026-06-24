import { describe, expect, it } from 'vitest';
import {
  defaultMultiFileCpsFolderName,
  defaultNativeYamlDriveFileName,
  defaultSingleFileDriveFileName,
  exportDateStamp,
  stampExportFileName,
} from './exportFileName.ts';

const fixed = new Date('2026-06-24T12:00:00.000Z');

describe('exportFileName', () => {
  it('formats export date stamp as YYYY-MM-DD', () => {
    expect(exportDateStamp(fixed)).toBe('2026-06-24');
  });

  it('stamps before extension', () => {
    expect(stampExportFileName('codeplug.yaml', '2026-06-24')).toBe('codeplug-2026-06-24.yaml');
    expect(stampExportFileName('export.csv', '2026-06-24')).toBe('export-2026-06-24.csv');
  });

  it('builds native YAML default with project name', () => {
    expect(defaultNativeYamlDriveFileName('My Repeater Map', fixed)).toBe(
      'My Repeater Map-2026-06-24.yaml',
    );
    expect(defaultNativeYamlDriveFileName(null, fixed)).toBe('codeplug-2026-06-24.yaml');
  });

  it('stamps CHIRP-style profile defaults', () => {
    expect(defaultSingleFileDriveFileName('Baofeng_UV-5R Mini_export.csv', fixed)).toBe(
      'Baofeng_UV-5R Mini_export-2026-06-24.csv',
    );
  });

  it('builds multi-file CPS folder names', () => {
    expect(defaultMultiFileCpsFolderName('opengd77', 'Field day', fixed)).toBe(
      'Field day-2026-06-24',
    );
    expect(defaultMultiFileCpsFolderName('dm32', null, fixed)).toBe('dm32-export-2026-06-24');
  });
});
