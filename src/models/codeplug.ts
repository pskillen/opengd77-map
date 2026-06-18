export type ChannelMode = 'analogue' | 'digital' | 'other';

export interface GeoPoint {
  lat: number;
  lon: number;
}

export interface Channel {
  /** Stable internal identifier — not derived from vendor fields. */
  id: string;
  /** OpenGD77 vendor/display field; not an internal relationship key. */
  name: string;
  callsign: string;
  mode: ChannelMode;
  rxFrequency: string;
  txFrequency: string;
  contactName: string;
  rxGroupListName: string;
  location: GeoPoint | null;
  useLocation: boolean;
  number: string;
}

export interface Zone {
  id: string;
  name: string;
  /** Resolved channel memberships by internal id. */
  memberChannelIds: string[];
  /** Raw imported member names for re-resolution, unresolved reporting, and export round-trip. */
  sourceMemberNames: string[];
}

/** Stub — OpenGD77 adapter does not populate yet. */
export interface TalkGroup {
  id: string;
  name: string;
  number: string;
}

/** Stub — OpenGD77 adapter does not populate yet. */
export interface TgList {
  id: string;
  name: string;
  memberContactNames: string[];
}

/** Stub — OpenGD77 adapter does not populate yet. */
export interface Contact {
  id: string;
  name: string;
  number: string;
}

export interface CodeplugMeta {
  schemaVersion: number;
  importedAt: string | null;
  sourceFiles: string[];
}

export interface Codeplug {
  channels: Channel[];
  zones: Zone[];
  talkGroups: TalkGroup[];
  tgLists: TgList[];
  contacts: Contact[];
  meta: CodeplugMeta;
}

export const CODEPLUG_SCHEMA_VERSION = 1;

let idGenerator: () => string = () => crypto.randomUUID();

/** Centralised id generation — swappable in tests. */
export function newId(): string {
  return idGenerator();
}

/** @internal test helper */
export function setIdGenerator(generator: () => string): void {
  idGenerator = generator;
}

/** @internal test helper */
export function resetIdGenerator(): void {
  idGenerator = () => crypto.randomUUID();
}

export function emptyCodeplug(): Codeplug {
  return {
    channels: [],
    zones: [],
    talkGroups: [],
    tgLists: [],
    contacts: [],
    meta: {
      schemaVersion: CODEPLUG_SCHEMA_VERSION,
      importedAt: null,
      sourceFiles: [],
    },
  };
}

export function mapChannelMode(type: string): ChannelMode {
  const t = (type || '').toLowerCase();
  if (t === 'digital') return 'digital';
  if (t === 'analogue' || t === 'analog') return 'analogue';
  return 'other';
}
