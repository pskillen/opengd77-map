import { describe, expect, it } from 'vitest';
import { getExportAdapter } from '../import-export/registry.ts';
import { channelFieldDefaults, emptyCodeplug, type Channel } from '../../models/codeplug.ts';
import { newProject } from '../../models/codeplugProject.ts';
import { buildExportPayload } from './buildExportPayload.ts';
import { importFromSources } from './importFromSources.ts';
import { parseNativeYaml } from '../nativeYaml/serde.ts';

describe('fileDelivery', () => {
  it('builds native YAML export payload', () => {
    const channel: Channel = {
      id: 'ch-1',
      name: 'Test',
      callsign: 'GB3DA',
      mode: 'dmr',
      ...channelFieldDefaults(),
      exportNameMode: 'callsign_name',
    };
    const project = newProject('Payload test', { ...emptyCodeplug(), channels: [channel] });

    const { payloads, warnings } = buildExportPayload(getExportAdapter('native-yaml'), {
      codeplug: project.codeplug,
      project,
    });

    expect(warnings).toHaveLength(0);
    expect(payloads).toHaveLength(1);
    expect(payloads[0]?.fileName).toBe('codeplug.yaml');
    expect(payloads[0]?.mimeType).toContain('yaml');

    const parsed = parseNativeYaml(payloads[0]!.content);
    expect(parsed.name).toBe('Payload test');
    expect(parsed.codeplug.channels).toHaveLength(1);
  });

  it('imports from sources without File picker', async () => {
    const project = newProject('Source test', emptyCodeplug());
    const adapter = getExportAdapter('native-yaml');
    const { payloads } = buildExportPayload(adapter, {
      codeplug: project.codeplug,
      project,
    });

    const result = await importFromSources(
      [{ name: 'codeplug.yaml', text: payloads[0]!.content }],
      { vendorFormatId: 'native-yaml' },
    );

    expect(result.errors).toHaveLength(0);
    expect(result.nativeProject?.name).toBe('Source test');
  });
});
