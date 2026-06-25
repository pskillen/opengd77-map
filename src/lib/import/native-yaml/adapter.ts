import type { ImportFileKind } from '../../import-export/types.ts';
import { isNativeYamlEnvelope, parseNativeYaml } from '../../nativeYaml/serde.ts';

export function detectKind(fileName: string, headerRow: string[]): ImportFileKind {
  void headerRow;
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.yaml') || lower.endsWith('.yml')) return 'channels';
  return 'unknown';
}

export function detectNativeDocument(text: string, fileName: string): boolean {
  const lower = fileName.toLowerCase();
  if (!lower.endsWith('.yaml') && !lower.endsWith('.yml')) return false;
  return isNativeYamlEnvelope(text);
}

export const nativeYamlAdapter = {
  id: 'native-yaml' as const,
  label: 'Native YAML',
  projectNameLabel: 'Native YAML',
  capabilities: {
    delivery: 'single-file' as const,
    interchange: 'native-document' as const,
    entityKinds: ['channels', 'zones', 'contacts', 'talkGroups', 'rxGroupLists'] as const,
  },
  detectKind,
  parseChannels() {
    return [];
  },
  parseDocument(text: string) {
    return parseNativeYaml(text);
  },
} satisfies import('../../import-export/importAdapter.ts').ImportAdapter;
