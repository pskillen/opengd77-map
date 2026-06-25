import { describe, expect, it } from 'vitest';
import {
  CODEPLUG_SCHEMA_VERSION,
  channelFieldDefaults,
  emptyCodeplug,
  newId,
  type Channel,
  type Contact,
  type RxGroupList,
  type TalkGroup,
  type Zone,
} from '../../models/codeplug.ts';
import { newProject } from '../../models/codeplugProject.ts';
import {
  NATIVE_YAML_FORMAT,
  NATIVE_YAML_FORMAT_VERSION,
  NativeYamlParseError,
  isNativeYamlEnvelope,
  parseNativeYaml,
  serialiseNativeYaml,
} from './serde.ts';

function sampleProject() {
  const channelId = 'ch-1';
  const tgId = 'tg-1';
  const rglId = 'rgl-1';
  const contactId = 'ct-1';
  const zoneId = 'zn-1';

  const channel: Channel = {
    id: 'ch-1',
    name: 'Town',
    callsign: 'GB3DA',
    mode: 'dmr',
    ...channelFieldDefaults(),
    exportNameMode: 'callsign_name',
    rxFrequency: 145_500_000,
    txFrequency: 145_500_000,
    contactRef: { kind: 'talkGroup', id: tgId },
    rxGroupListId: rglId,
  };

  const talkGroup: TalkGroup = {
    id: tgId,
    name: 'Worldwide',
    number: '91',
    timeslotOverride: '',
    callType: 'group',
  };

  const contact: Contact = {
    id: contactId,
    name: 'Private',
    identifier: '1234567',
    signalingMode: 'dmr',
  };

  const rxGroupList: RxGroupList = {
    id: rglId,
    name: 'All',
    memberRefs: [
      { kind: 'talkGroup', id: tgId },
      { kind: 'contact', id: contactId },
    ],
  };

  const zone: Zone = {
    id: zoneId,
    name: 'Home',
    memberChannelIds: [channelId],
  };

  const codeplug = {
    ...emptyCodeplug(),
    channels: [channel],
    zones: [zone],
    talkGroups: [talkGroup],
    rxGroupLists: [rxGroupList],
    contacts: [contact],
  };

  return newProject('Test project', codeplug);
}

describe('nativeYaml serde', () => {
  it('round-trips an empty project with stable ids', () => {
    const project = newProject('Empty', emptyCodeplug());
    project.id = 'proj-empty';

    const yaml = serialiseNativeYaml(project, { exportedAt: '2026-06-24T12:00:00.000Z' });
    expect(isNativeYamlEnvelope(yaml)).toBe(true);

    const parsed = parseNativeYaml(yaml);
    expect(parsed.id).toBe('proj-empty');
    expect(parsed.name).toBe('Empty');
    expect(parsed.updatedAt).toBe('2026-06-24T12:00:00.000Z');
    expect(parsed.codeplug.meta.schemaVersion).toBe(CODEPLUG_SCHEMA_VERSION);
    expect(parsed.codeplug.channels).toHaveLength(0);
  });

  it('round-trips a project with entities and FKs', () => {
    const project = sampleProject();
    project.description = 'Short summary';
    project.author = 'M0TEST';
    project.targetRadios = ['Baofeng 1701'];

    const yaml = serialiseNativeYaml(project, { exportedAt: '2026-06-24T12:00:00.000Z' });
    const parsed = parseNativeYaml(yaml);

    expect(parsed.id).toBe(project.id);
    expect(parsed.name).toBe('Test project');
    expect(parsed.description).toBe('Short summary');
    expect(parsed.author).toBe('M0TEST');
    expect(parsed.targetRadios).toEqual(['Baofeng 1701']);
    expect(parsed.codeplug.channels).toHaveLength(1);
    expect(parsed.codeplug.channels[0]?.contactRef).toEqual({ kind: 'talkGroup', id: 'tg-1' });
    expect(parsed.codeplug.zones[0]?.memberChannelIds).toEqual(['ch-1']);
    expect(parsed.codeplug.rxGroupLists[0]?.memberRefs).toHaveLength(2);
  });

  it('rejects unknown format', () => {
    const yaml = `format: other\nformatVersion: 1\nproject: {}\ncodeplug: {}`;
    expect(() => parseNativeYaml(yaml)).toThrow(NativeYamlParseError);
  });

  it('rejects unsupported formatVersion', () => {
    const yaml = `format: ${NATIVE_YAML_FORMAT}\nformatVersion: 99\nproject:\n  id: x\n  name: n\n  createdAt: "2020-01-01T00:00:00.000Z"\n  updatedAt: "2020-01-01T00:00:00.000Z"\ncodeplug:\n  schemaVersion: ${CODEPLUG_SCHEMA_VERSION}\n  channels: []\n  zones: []\n  talkGroups: []\n  rxGroupLists: []\n  contacts: []\n  meta:\n    schemaVersion: ${CODEPLUG_SCHEMA_VERSION}\n    importedAt: null\n    sourceFiles: []`;
    expect(() => parseNativeYaml(yaml)).toThrow(/formatVersion/);
  });

  it('includes format constants in serialised output', () => {
    const yaml = serialiseNativeYaml(newProject('X', emptyCodeplug()));
    expect(yaml).toContain(NATIVE_YAML_FORMAT);
    expect(yaml).toContain(`formatVersion: ${NATIVE_YAML_FORMAT_VERSION}`);
  });

  it('migrates older schemaVersion on import', () => {
    const project = newProject('Legacy', emptyCodeplug());
    const yaml = serialiseNativeYaml(project);
    const parsedDoc = parseNativeYaml(yaml);
    const legacyCodeplug = {
      ...parsedDoc.codeplug,
      meta: { ...parsedDoc.codeplug.meta, schemaVersion: 12 },
    };
    const legacyYaml = serialiseNativeYaml({ ...project, codeplug: legacyCodeplug });
    const migrated = parseNativeYaml(legacyYaml);
    expect(migrated.codeplug.meta.schemaVersion).toBe(CODEPLUG_SCHEMA_VERSION);
  });

  it('generates new ids when round-tripping through newProject helper', () => {
    const id = newId();
    const project = newProject('Ids', emptyCodeplug());
    project.id = id;
    const parsed = parseNativeYaml(serialiseNativeYaml(project));
    expect(parsed.id).toBe(id);
  });
});
