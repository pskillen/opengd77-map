import {
  CODEPLUG_SCHEMA_VERSION,
  channelFieldDefaults,
  type Channel,
  type Codeplug,
  type CodeplugMeta,
  type Contact,
  type RxGroupList,
  type TalkGroup,
  type Zone,
} from '../models/codeplug.ts';
import type { EntityMeta } from '../lib/entityProvenance.ts';
import {
  normaliseWireName,
  resolveChannelContactRefs,
  resolveChannelRxGroupListIds,
  resolveRxGroupListMemberRefs,
} from '../lib/entityRefs.ts';
import { normalizeChannelMode } from '../lib/channelModes.ts';
import { normalizeToneValue } from '../lib/channelFields/index.ts';
import { coerceLegacyStringField } from '../lib/import/opengd77/channelWire.ts';
import {
  isCallsignToken,
  parseChannelWireName,
  splitLegacyCombinedName,
} from '../lib/channelNaming.ts';
import type { ChannelExportNameMode } from '../models/codeplug.ts';
import type { CodeplugProject } from '../models/codeplugProject.ts';
import { newProject } from '../models/codeplugProject.ts';

export const CODEPLUG_STORAGE_KEY = 'mm9pdy-codeplug-tool.codeplug';
export const CODEPLUG_STORAGE_VERSION = 1;

export interface ProjectsState {
  activeProjectId: string | null;
  projects: CodeplugProject[];
}

export class StorageQuotaError extends Error {
  constructor(message = 'LocalStorage quota exceeded') {
    super(message);
    this.name = 'StorageQuotaError';
  }
}

const TYPED_CHANNEL_FIELDS = [
  'rxFrequency',
  'txFrequency',
  'bandwidthKHz',
  'power',
  'squelch',
  'colourCode',
  'timeslot',
  'dmrId',
  'transmitTimeout',
  'rxTone',
  'txTone',
  'rxOnly',
] as const;

function migrateChannel(raw: Record<string, unknown>, projectImportedAt: string | null): Channel {
  const defaults = channelFieldDefaults();
  const rest = { ...raw };
  delete rest.number;
  delete rest.vendorExtras;

  const legacyContactName =
    typeof raw.contactName === 'string' ? normaliseWireName(raw.contactName) : '';
  const legacyRxGroupListName =
    typeof raw.rxGroupListName === 'string' ? normaliseWireName(raw.rxGroupListName) : '';
  delete rest.contactName;
  delete rest.rxGroupListName;

  const partial = rest as Partial<Channel> & {
    vendorExtras?: Record<string, string>;
    contactName?: string;
    rxGroupListName?: string;
  };
  const migrated: Partial<Channel> = { ...defaults, ...partial };
  migrated.mode = normalizeChannelMode(String(partial.mode ?? 'other'));
  migrated.hideFromMap = partial.hideFromMap ?? false;
  migrated.opengd77Extras =
    partial.opengd77Extras ?? partial.vendorExtras ?? defaults.opengd77Extras;
  migrated.contactRef = partial.contactRef ?? null;
  migrated.rxGroupListId = partial.rxGroupListId ?? null;

  let meta = partial.meta as EntityMeta | undefined;
  if (legacyRxGroupListName && !meta?.imported?.rxGroupListWireName) {
    const imported = meta?.imported;
    meta = {
      ...meta,
      imported: {
        formatId: imported?.formatId ?? 'opengd77',
        sourceFile: imported?.sourceFile ?? null,
        importedAt: imported?.importedAt ?? projectImportedAt ?? new Date(0).toISOString(),
        ...imported,
        rxGroupListWireName: legacyRxGroupListName,
      },
    };
  }
  if (legacyContactName && !meta?.imported?.contactWireName) {
    const imported = meta?.imported;
    meta = {
      ...meta,
      imported: {
        formatId: imported?.formatId ?? 'opengd77',
        sourceFile: imported?.sourceFile ?? null,
        importedAt: imported?.importedAt ?? projectImportedAt ?? new Date(0).toISOString(),
        ...imported,
        contactWireName: legacyContactName,
      },
    };
  }

  for (const field of TYPED_CHANNEL_FIELDS) {
    const current = partial[field];
    if (typeof current === 'string' || (current != null && field === 'rxOnly')) {
      const coerced = coerceLegacyStringField(field, current);
      (migrated as Record<string, unknown>)[field] = coerced;
    }
  }

  if (typeof partial.rxTone === 'string') {
    migrated.rxTone = normalizeToneValue(partial.rxTone);
  }
  if (typeof partial.txTone === 'string') {
    migrated.txTone = normalizeToneValue(partial.txTone);
  }

  migrated.comment = typeof partial.comment === 'string' ? partial.comment : '';
  migrated.multiMode = partial.multiMode === true;
  migrated.modeProfiles = Array.isArray(partial.modeProfiles)
    ? (partial.modeProfiles as Channel['modeProfiles'])
    : [];

  if (meta?.imported && 'wireColumns' in meta.imported) {
    const imported = { ...meta.imported };
    delete (imported as { wireColumns?: unknown }).wireColumns;
    meta = { ...meta, imported };
  }

  const legacyName = partial.name ?? '';
  const legacyCallsign = partial.callsign ?? '';
  let exportNameMode = partial.exportNameMode as ChannelExportNameMode | undefined;
  let name = legacyName;
  let callsign = legacyCallsign;

  if (exportNameMode === undefined) {
    const parsed = parseChannelWireName(legacyName);
    if (parsed.callsign) {
      callsign = parsed.callsign;
      name = parsed.name;
      exportNameMode = parsed.exportNameMode;
    } else if (legacyCallsign) {
      if (
        legacyCallsign.toUpperCase() === legacyName.trim().toUpperCase() &&
        !isCallsignToken(legacyCallsign)
      ) {
        callsign = '';
        name = legacyName;
        exportNameMode = 'name_only';
      } else {
        callsign = legacyCallsign;
        name = splitLegacyCombinedName(legacyName, legacyCallsign);
        exportNameMode =
          legacyCallsign && name ? 'callsign_name' : legacyCallsign ? 'callsign_only' : 'name_only';
      }
    } else {
      exportNameMode = 'name_only';
    }
  }

  return {
    id: partial.id ?? '',
    ...defaults,
    ...migrated,
    name,
    callsign,
    exportNameMode: exportNameMode ?? 'name_only',
    mode: migrated.mode!,
    hideFromMap: migrated.hideFromMap ?? false,
    opengd77Extras: migrated.opengd77Extras ?? {},
    multiMode: migrated.multiMode ?? false,
    modeProfiles: migrated.modeProfiles ?? [],
    meta,
  };
}

function migrateZone(raw: Record<string, unknown>, projectImportedAt: string | null): Zone {
  const legacyNames = Array.isArray(raw.sourceMemberNames)
    ? (raw.sourceMemberNames as string[])
    : [];
  const memberChannelIds = Array.isArray(raw.memberChannelIds)
    ? (raw.memberChannelIds as string[])
    : [];
  const existingMeta = raw.meta as EntityMeta | undefined;

  const zone: Zone = {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? ''),
    memberChannelIds,
    meta: existingMeta,
  };

  if (legacyNames.length > 0 && !existingMeta?.imported?.memberWireNames?.length) {
    zone.meta = {
      imported: {
        formatId: 'opengd77',
        sourceFile: null,
        importedAt: projectImportedAt ?? new Date(0).toISOString(),
        memberWireNames: legacyNames,
      },
    };
  }

  return zone;
}

function migrateRxGroupList(
  raw: Record<string, unknown>,
  projectImportedAt: string | null,
): RxGroupList {
  const legacyNames = Array.isArray(raw.sourceMemberNames)
    ? (raw.sourceMemberNames as string[])
    : Array.isArray(raw.memberContactNames)
      ? (raw.memberContactNames as string[])
      : [];
  const existingMeta = raw.meta as EntityMeta | undefined;

  const rgl: RxGroupList = {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? ''),
    memberRefs: Array.isArray(raw.memberRefs) ? (raw.memberRefs as RxGroupList['memberRefs']) : [],
    meta: existingMeta,
  };

  if (legacyNames.length > 0 && !existingMeta?.imported?.memberWireNames?.length) {
    rgl.meta = {
      imported: {
        formatId: 'opengd77',
        sourceFile: null,
        importedAt: projectImportedAt ?? new Date(0).toISOString(),
        memberWireNames: legacyNames,
      },
    };
  }

  return rgl;
}

function migrateRxGroupLists(
  raw: Record<string, unknown>,
  projectImportedAt: string | null,
): RxGroupList[] {
  if (Array.isArray(raw.rxGroupLists)) {
    return (raw.rxGroupLists as Record<string, unknown>[]).map((item) =>
      migrateRxGroupList(item, projectImportedAt),
    );
  }
  if (Array.isArray(raw.tgLists)) {
    return (raw.tgLists as Record<string, unknown>[]).map((item) =>
      migrateRxGroupList(item, projectImportedAt),
    );
  }
  return [];
}

function migrateContact(raw: Record<string, unknown>): Contact {
  const legacy = raw as Partial<Contact> & { number?: string };
  const identifier =
    typeof legacy.identifier === 'string'
      ? legacy.identifier
      : typeof legacy.number === 'string'
        ? legacy.number
        : '';
  const timeslotOverride =
    typeof legacy.timeslotOverride === 'string' && legacy.timeslotOverride.trim() !== ''
      ? legacy.timeslotOverride
      : undefined;
  const signalingMode: Contact['signalingMode'] = legacy.signalingMode === 'dtmf' ? 'dtmf' : 'dmr';
  return {
    id: legacy.id ?? '',
    name: legacy.name ?? '',
    identifier,
    signalingMode,
    ...(timeslotOverride !== undefined ? { timeslotOverride } : {}),
    meta: legacy.meta,
  };
}

function migrateTalkGroup(raw: Partial<TalkGroup>): TalkGroup {
  return {
    id: raw.id ?? '',
    name: raw.name ?? '',
    number: raw.number ?? '',
    timeslotOverride: raw.timeslotOverride ?? '',
    callType: raw.callType ?? 'group',
    meta: raw.meta,
  };
}

/** Normalise a persisted codeplug (v1–v6) to the current schema. */
export function migrateCodeplug(value: unknown): Codeplug | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  const meta = raw.meta as CodeplugMeta | undefined;
  if (!meta || typeof meta.schemaVersion !== 'number') return null;
  if (meta.schemaVersion > CODEPLUG_SCHEMA_VERSION) return null;

  const projectImportedAt = meta.importedAt ?? null;

  const channels = Array.isArray(raw.channels)
    ? (raw.channels as Record<string, unknown>[]).map((ch) => migrateChannel(ch, projectImportedAt))
    : [];
  const zones = Array.isArray(raw.zones)
    ? (raw.zones as Record<string, unknown>[]).map((z) => migrateZone(z, projectImportedAt))
    : [];
  const talkGroups = Array.isArray(raw.talkGroups)
    ? (raw.talkGroups as Partial<TalkGroup>[]).map(migrateTalkGroup)
    : [];
  const contacts = Array.isArray(raw.contacts)
    ? (raw.contacts as Record<string, unknown>[]).map(migrateContact)
    : [];

  const rxGroupLists = resolveRxGroupListMemberRefs(
    migrateRxGroupLists(raw, projectImportedAt),
    talkGroups,
    contacts,
  );

  return {
    channels: resolveChannelContactRefs(
      resolveChannelRxGroupListIds(channels, rxGroupLists),
      talkGroups,
      contacts,
    ),
    zones,
    talkGroups,
    rxGroupLists,
    contacts,
    meta: {
      importedAt: meta.importedAt ?? null,
      sourceFiles: Array.isArray(meta.sourceFiles) ? meta.sourceFiles : [],
      schemaVersion: CODEPLUG_SCHEMA_VERSION,
    },
  };
}

export function isValidCodeplug(value: unknown): value is Codeplug {
  const cp = migrateCodeplug(value);
  if (!cp) return false;
  return (
    Array.isArray(cp.channels) &&
    Array.isArray(cp.zones) &&
    Array.isArray(cp.talkGroups) &&
    Array.isArray(cp.rxGroupLists) &&
    Array.isArray(cp.contacts) &&
    cp.meta.schemaVersion === CODEPLUG_SCHEMA_VERSION
  );
}

export function isValidProject(value: unknown): value is CodeplugProject {
  if (!value || typeof value !== 'object') return false;
  const p = value as CodeplugProject;
  if (
    typeof p.id !== 'string' ||
    typeof p.name !== 'string' ||
    typeof p.createdAt !== 'string' ||
    typeof p.updatedAt !== 'string'
  ) {
    return false;
  }
  return isValidCodeplug(p.codeplug);
}

export function isPersistableProjects(state: ProjectsState): boolean {
  return state.projects.length > 0;
}

export function serializeProjects(state: ProjectsState): string {
  return JSON.stringify({
    version: CODEPLUG_STORAGE_VERSION,
    activeProjectId: state.activeProjectId,
    projects: state.projects,
  });
}

function normalizeActiveProjectId(
  activeProjectId: string | null,
  projects: CodeplugProject[],
): string | null {
  if (!projects.length) return null;
  if (activeProjectId && projects.some((p) => p.id === activeProjectId)) {
    return activeProjectId;
  }
  return projects[0].id;
}

function normalizeStringField(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function normalizeTargetRadios(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function normalizeProject(raw: unknown): CodeplugProject | null {
  if (!raw || typeof raw !== 'object') return null;
  const p = raw as CodeplugProject;
  const codeplug = migrateCodeplug(p.codeplug);
  if (
    !codeplug ||
    typeof p.id !== 'string' ||
    typeof p.name !== 'string' ||
    typeof p.createdAt !== 'string' ||
    typeof p.updatedAt !== 'string'
  ) {
    return null;
  }
  return {
    ...p,
    description: normalizeStringField(p.description),
    notes: normalizeStringField(p.notes),
    author: normalizeStringField(p.author),
    targetRadios: normalizeTargetRadios(p.targetRadios),
    codeplug,
  };
}

export function deserializeProjects(json: string): ProjectsState | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return null;
  }

  if (!parsed || typeof parsed !== 'object') return null;
  const envelope = parsed as { version?: number; activeProjectId?: unknown; projects?: unknown };

  if (envelope.version !== CODEPLUG_STORAGE_VERSION) return null;
  if (!Array.isArray(envelope.projects)) return null;

  const projects = envelope.projects
    .map(normalizeProject)
    .filter((p): p is CodeplugProject => p != null);
  const activeProjectId =
    typeof envelope.activeProjectId === 'string' || envelope.activeProjectId === null
      ? (envelope.activeProjectId as string | null)
      : null;

  return {
    projects,
    activeProjectId: normalizeActiveProjectId(activeProjectId, projects),
  };
}

export function loadProjectsFromStorage(): ProjectsState | null {
  const json = localStorage.getItem(CODEPLUG_STORAGE_KEY);
  if (!json) return null;

  const state = deserializeProjects(json);
  if (!state) {
    localStorage.removeItem(CODEPLUG_STORAGE_KEY);
    return null;
  }
  return state;
}

export function saveProjectsToStorage(state: ProjectsState): void {
  if (!isPersistableProjects(state)) {
    localStorage.removeItem(CODEPLUG_STORAGE_KEY);
    return;
  }

  try {
    localStorage.setItem(CODEPLUG_STORAGE_KEY, serializeProjects(state));
  } catch (err) {
    if (err instanceof DOMException && err.name === 'QuotaExceededError') {
      throw new StorageQuotaError();
    }
    throw err;
  }
}

export function clearProjectsStorage(): void {
  localStorage.removeItem(CODEPLUG_STORAGE_KEY);
}

/** @internal test helper */
export function seedProjectsStorage(state: ProjectsState): void {
  localStorage.setItem(CODEPLUG_STORAGE_KEY, serializeProjects(state));
}

/** @internal test helper */
export function makeSampleProjectsState(): ProjectsState {
  const a = newProject('Alpha');
  const b = newProject('Beta');
  return { activeProjectId: a.id, projects: [a, b] };
}
