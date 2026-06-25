import { describe, expect, it } from 'vitest';
import { importFromSources } from '../../lib/fileDelivery/importFromSources.ts';
import { serialiseNativeYamlExport } from '../../lib/export/native-yaml/serialise.ts';
import { emptyCodeplug } from '../../models/codeplug.ts';
import { newProject } from '../../models/codeplugProject.ts';

describe('importFromSources (native YAML)', () => {
  it('imports without a browser File picker', async () => {
    const project = newProject('Drive-style import', emptyCodeplug());
    project.author = 'M0SRC';
    const yaml = serialiseNativeYamlExport(project.codeplug, { project });

    const result = await importFromSources([{ name: 'codeplug.yaml', text: yaml }], {
      vendorFormatId: 'native-yaml',
    });

    expect(result.errors).toHaveLength(0);
    expect(result.nativeProject?.name).toBe('Drive-style import');
    expect(result.nativeProject?.author).toBe('M0SRC');
  });
});
