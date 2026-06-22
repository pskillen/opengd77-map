import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CODEPLUG_SCHEMA_VERSION,
  channelFieldDefaults,
  emptyCodeplug,
  resetIdGenerator,
  setIdGenerator,
} from './codeplug.ts';
import {
  DEFAULT_PROJECT_NAME,
  defaultProjectName,
  deriveProjectNameFromImportFiles,
  newProject,
} from './codeplugProject.ts';

describe('newProject', () => {
  beforeEach(() => {
    setIdGenerator(() => 'project-id-1');
  });

  afterEach(() => {
    resetIdGenerator();
  });

  it('creates a project with id, name, timestamps, and empty codeplug by default', () => {
    const project = newProject('Home repeaters');

    expect(project.id).toBe('project-id-1');
    expect(project.name).toBe('Home repeaters');
    expect(project.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(project.updatedAt).toBe(project.createdAt);
    expect(project.codeplug).toEqual(emptyCodeplug());
    expect(project.codeplug.meta.schemaVersion).toBe(CODEPLUG_SCHEMA_VERSION);
    expect(project.description).toBe('');
    expect(project.notes).toBe('');
    expect(project.author).toBe('');
    expect(project.targetRadios).toEqual([]);
  });

  it('accepts a pre-built codeplug', () => {
    const codeplug = emptyCodeplug();
    codeplug.channels.push({
      id: 'ch-1',
      name: 'Test',
      callsign: 'Test',
      mode: 'dmr',
      ...channelFieldDefaults(),
    });

    const project = newProject('With channels', codeplug);
    expect(project.codeplug.channels).toHaveLength(1);
  });
});

describe('defaultProjectName', () => {
  it('falls back when no source files', () => {
    expect(defaultProjectName()).toBe(DEFAULT_PROJECT_NAME);
    expect(defaultProjectName([])).toBe(DEFAULT_PROJECT_NAME);
  });

  it('derives from the first recognised filename', () => {
    expect(defaultProjectName(['Channels.csv'])).toBe('Channels');
    expect(defaultProjectName(['Zones.csv', 'Channels.csv'])).toBe('Zones');
  });
});

function fileWithPath(name: string, webkitRelativePath = ''): File {
  const file = new File([''], name, { type: 'text/csv' });
  if (webkitRelativePath) {
    Object.defineProperty(file, 'webkitRelativePath', { value: webkitRelativePath });
  }
  return file;
}

describe('deriveProjectNameFromImportFiles', () => {
  it('uses explicit directory name when provided', () => {
    expect(
      deriveProjectNameFromImportFiles([fileWithPath('Channels.csv')], {
        directoryName: 'MyExport',
      }),
    ).toBe('MyExport');
  });

  it('uses leaf folder from webkitRelativePath', () => {
    const files = [
      fileWithPath('Channels.csv', 'opengd77-cps-export/Channels.csv'),
      fileWithPath('Zones.csv', 'opengd77-cps-export/Zones.csv'),
    ];
    expect(deriveProjectNameFromImportFiles(files, { formatLabel: 'OpenGD77' })).toBe(
      'opengd77-cps-export',
    );
  });

  it('names loose file imports with format label and ISO date', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-21T12:00:00.000Z'));
    expect(
      deriveProjectNameFromImportFiles([fileWithPath('Channels.csv')], {
        formatLabel: 'OpenGD77',
      }),
    ).toBe('OpenGD77 2026-06-21');
    expect(
      deriveProjectNameFromImportFiles([fileWithPath('Zones.csv'), fileWithPath('Channels.csv')], {
        formatLabel: 'OpenGD77',
      }),
    ).toBe('OpenGD77 2026-06-21');
    vi.useRealTimers();
  });
});
