import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { serialiseNativeYamlExport } from '../../lib/export/native-yaml/serialise.ts';
import { importFiles } from '../../lib/import/index.ts';
import { parseNativeYaml } from '../../lib/nativeYaml/serde.ts';
import {
  channelFieldDefaults,
  emptyCodeplug,
  resetIdGenerator,
  setIdGenerator,
  type Channel,
} from '../../models/codeplug.ts';
import { newProject } from '../../models/codeplugProject.ts';

function buildSampleProject() {
  const channel: Channel = {
    id: 'ch-native-1',
    name: 'Hull',
    callsign: 'GB3DA',
    mode: 'dmr',
    ...channelFieldDefaults(),
    exportNameMode: 'callsign_name',
    rxFrequency: 145_500_000,
    txFrequency: 145_500_000,
  };

  const project = newProject('Round-trip test', {
    ...emptyCodeplug(),
    channels: [channel],
  });
  project.id = 'proj-native-1';
  project.description = 'Native YAML system test';
  project.author = 'M0TEST';
  return project;
}

describe('native YAML file-level round-trip', () => {
  beforeEach(() => {
    let n = 0;
    setIdGenerator(() => `native-sys-${++n}`);
  });

  afterEach(() => {
    resetIdGenerator();
  });

  it('import → export → re-import preserves project state', async () => {
    const original = buildSampleProject();

    const yaml = serialiseNativeYamlExport(original.codeplug, { project: original });
    const firstImport = await importFiles(
      [new File([yaml], 'codeplug.yaml', { type: 'application/yaml' })],
      { vendorFormatId: 'native-yaml' },
    );
    expect(firstImport.errors).toHaveLength(0);
    expect(firstImport.nativeProject?.id).toBe('proj-native-1');
    expect(firstImport.nativeProject?.codeplug.channels).toHaveLength(1);

    const exportedYaml = serialiseNativeYamlExport(firstImport.nativeProject!.codeplug, {
      project: firstImport.nativeProject,
    });
    const secondImport = await importFiles(
      [new File([exportedYaml], 'codeplug.yaml', { type: 'application/yaml' })],
      { vendorFormatId: 'native-yaml' },
    );
    expect(secondImport.errors).toHaveLength(0);

    const parsed = parseNativeYaml(exportedYaml);
    expect(parsed.id).toBe(original.id);
    expect(parsed.name).toBe(original.name);
    expect(parsed.description).toBe(original.description);
    expect(parsed.author).toBe(original.author);
    expect(parsed.codeplug.channels).toHaveLength(1);
    expect(parsed.codeplug.channels[0]?.id).toBe('ch-native-1');
    expect(parsed.codeplug.channels[0]?.callsign).toBe('GB3DA');
  });
});
