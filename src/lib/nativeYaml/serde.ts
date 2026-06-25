import { parse, stringify } from 'yaml';
import type { Codeplug } from '../../models/codeplug.ts';
import type { CodeplugProject } from '../../models/codeplugProject.ts';
import { migrateCodeplug } from '../../state/codeplugStorage.ts';

export const NATIVE_YAML_FORMAT = 'codeplug-tool-native-yaml' as const;
export const NATIVE_YAML_FORMAT_VERSION = 1;
export const NATIVE_YAML_DEFAULT_FILE_NAME = 'codeplug.yaml';

export class NativeYamlParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NativeYamlParseError';
  }
}

interface NativeYamlEnvelope {
  format: string;
  formatVersion: number;
  project: Record<string, unknown>;
  codeplug: unknown;
}

function parseEnvelope(text: string): NativeYamlEnvelope {
  let parsed: unknown;
  try {
    parsed = parse(text);
  } catch (err) {
    throw new NativeYamlParseError(err instanceof Error ? err.message : 'Invalid YAML document');
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new NativeYamlParseError('YAML root must be an object');
  }

  const envelope = parsed as Record<string, unknown>;
  if (envelope.format !== NATIVE_YAML_FORMAT) {
    throw new NativeYamlParseError(
      `Unsupported format: expected ${NATIVE_YAML_FORMAT}, got ${String(envelope.format)}`,
    );
  }
  if (envelope.formatVersion !== NATIVE_YAML_FORMAT_VERSION) {
    throw new NativeYamlParseError(
      `Unsupported formatVersion: expected ${NATIVE_YAML_FORMAT_VERSION}, got ${String(envelope.formatVersion)}`,
    );
  }
  if (!envelope.project || typeof envelope.project !== 'object') {
    throw new NativeYamlParseError('Missing or invalid project section');
  }
  if (!envelope.codeplug || typeof envelope.codeplug !== 'object') {
    throw new NativeYamlParseError('Missing or invalid codeplug section');
  }

  return envelope as unknown as NativeYamlEnvelope;
}

function projectFromEnvelope(
  projectRaw: Record<string, unknown>,
  codeplug: Codeplug,
): CodeplugProject {
  const id = projectRaw.id;
  const name = projectRaw.name;
  const createdAt = projectRaw.createdAt;
  const updatedAt = projectRaw.updatedAt;
  if (typeof id !== 'string' || !id) {
    throw new NativeYamlParseError('project.id must be a non-empty string');
  }
  if (typeof name !== 'string') {
    throw new NativeYamlParseError('project.name must be a string');
  }
  if (typeof createdAt !== 'string' || typeof updatedAt !== 'string') {
    throw new NativeYamlParseError('project.createdAt and project.updatedAt must be ISO strings');
  }

  return {
    id,
    name,
    description: typeof projectRaw.description === 'string' ? projectRaw.description : '',
    notes: typeof projectRaw.notes === 'string' ? projectRaw.notes : '',
    author: typeof projectRaw.author === 'string' ? projectRaw.author : '',
    targetRadios: Array.isArray(projectRaw.targetRadios)
      ? projectRaw.targetRadios.filter((v): v is string => typeof v === 'string')
      : [],
    createdAt,
    updatedAt,
    codeplug,
  };
}

/** Parse a native YAML document into a CodeplugProject (with migration applied). */
export function parseNativeYaml(text: string): CodeplugProject {
  const envelope = parseEnvelope(text);
  const codeplug = migrateCodeplug(envelope.codeplug);
  if (!codeplug) {
    throw new NativeYamlParseError('codeplug section failed validation or migration');
  }
  return projectFromEnvelope(envelope.project, codeplug);
}

/** Quick sniff for native YAML envelope without full parse. */
export function isNativeYamlEnvelope(text: string): boolean {
  try {
    const parsed = parse(text);
    if (!parsed || typeof parsed !== 'object') return false;
    const envelope = parsed as Record<string, unknown>;
    return (
      envelope.format === NATIVE_YAML_FORMAT &&
      envelope.formatVersion === NATIVE_YAML_FORMAT_VERSION
    );
  } catch {
    return false;
  }
}

export interface SerialiseNativeYamlOptions {
  /** ISO timestamp for project.updatedAt — defaults to now. */
  exportedAt?: string;
}

/** Serialise a CodeplugProject to native YAML. */
export function serialiseNativeYaml(
  project: CodeplugProject,
  options?: SerialiseNativeYamlOptions,
): string {
  const exportedAt = options?.exportedAt ?? new Date().toISOString();
  const envelope = {
    format: NATIVE_YAML_FORMAT,
    formatVersion: NATIVE_YAML_FORMAT_VERSION,
    project: {
      id: project.id,
      name: project.name,
      description: project.description,
      notes: project.notes,
      author: project.author,
      targetRadios: project.targetRadios,
      createdAt: project.createdAt,
      updatedAt: exportedAt,
    },
    codeplug: project.codeplug,
  };

  return stringify(envelope, {
    lineWidth: 0,
    defaultKeyType: 'PLAIN',
    defaultStringType: 'QUOTE_DOUBLE',
  });
}
