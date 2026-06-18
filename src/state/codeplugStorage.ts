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

function migrateChannel(raw: Partial<Channel>): Channel {
  const defaults = channelFieldDefaults();
  return {
    id: raw.id ?? '',
    name: raw.name ?? '',
    callsign: raw.callsign ?? '',
    mode: raw.mode ?? 'other',
    ...defaults,
    ...raw,
    hideFromMap: raw.hideFromMap ?? false,
    vendorExtras: raw.vendorExtras ?? {},
  };
}

function migrateRxGroupLists(raw: Record<string, unknown>): RxGroupList[] {
  if (Array.isArray(raw.rxGroupLists)) {
    return raw.rxGroupLists as RxGroupList[];
  }
  if (Array.isArray(raw.tgLists)) {
    return (raw.tgLists as Array<Record<string, unknown>>).map((item) => ({
      id: String(item.id ?? ''),
      name: String(item.name ?? ''),
      sourceMemberNames: Array.isArray(item.sourceMemberNames)
        ? (item.sourceMemberNames as string[])
        : Array.isArray(item.memberContactNames)
          ? (item.memberContactNames as string[])
          : [],
    }));
  }
  return [];
}

function migrateContact(raw: Partial<Contact>): Contact {
  return {
    id: raw.id ?? '',
    name: raw.name ?? '',
    number: raw.number ?? '',
    timeslotOverride: raw.timeslotOverride ?? '',
  };
}

function migrateTalkGroup(raw: Partial<TalkGroup>): TalkGroup {
  return {
    id: raw.id ?? '',
    name: raw.name ?? '',
    number: raw.number ?? '',
    timeslotOverride: raw.timeslotOverride ?? '',
  };
}

/** Normalise a persisted codeplug (v1 or v2) to the current schema. */
export function migrateCodeplug(value: unknown): Codeplug | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  const meta = raw.meta as CodeplugMeta | undefined;
  if (!meta || typeof meta.schemaVersion !== 'number') return null;
  if (meta.schemaVersion > CODEPLUG_SCHEMA_VERSION) return null;

  const channels = Array.isArray(raw.channels)
    ? (raw.channels as Partial<Channel>[]).map(migrateChannel)
    : [];
  const zones = Array.isArray(raw.zones) ? (raw.zones as Zone[]) : [];
  const talkGroups = Array.isArray(raw.talkGroups)
    ? (raw.talkGroups as Partial<TalkGroup>[]).map(migrateTalkGroup)
    : [];
  const contacts = Array.isArray(raw.contacts)
    ? (raw.contacts as Partial<Contact>[]).map(migrateContact)
    : [];

  return {
    channels,
    zones,
    talkGroups,
    rxGroupLists: migrateRxGroupLists(raw),
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
  return { ...p, codeplug };
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
