import type { ChannelMode } from '../lib/channelModes.ts';

export type { ChannelMode };

export interface GeoPoint {
  lat: number;
  lon: number;
}

/** Default values for optional Channel fields — spread in tests and migration. */
export function channelFieldDefaults(): Omit<Channel, 'id' | 'name' | 'callsign' | 'mode'> {
  return {
    rxFrequency: '',
    txFrequency: '',
    contactName: '',
    rxGroupListName: '',
    location: null,
    useLocation: false,
    number: '',
    bandwidthKHz: '',
    colourCode: '',
    timeslot: '',
    dmrId: '',
    rxTone: '',
    txTone: '',
    squelch: '',
    power: '',
    rxOnly: '',
    aprsConfigName: '',
    voxEnabled: false,
    transmitTimeout: '',
    scanSkip: false,
    hideFromMap: false,
    vendorExtras: {},
  };
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
  /** OpenGD77 `TG List` — RX group list name (vendor wire). */
  rxGroupListName: string;
  location: GeoPoint | null;
  useLocation: boolean;
  number: string;
  bandwidthKHz: string;
  colourCode: string;
  timeslot: string;
  dmrId: string;
  rxTone: string;
  txTone: string;
  squelch: string;
  power: string;
  rxOnly: string;
  aprsConfigName: string;
  voxEnabled: boolean;
  transmitTimeout: string;
  scanSkip: boolean;
  /** Internal only — exclude from map hulls/plots when true. */
  hideFromMap: boolean;
  /** OpenGD77-only columns keyed by canonical CSV header name. */
  vendorExtras: Record<string, string>;
}

export interface Zone {
  id: string;
  name: string;
  /** Resolved channel memberships by internal id. */
  memberChannelIds: string[];
  /** Raw imported member names for re-resolution, unresolved reporting, and export round-trip. */
  sourceMemberNames: string[];
}

export interface TalkGroup {
  id: string;
  name: string;
  number: string;
  timeslotOverride: string;
}

/** RX group list — members are vendor wire names from Contacts.csv (groups and/or privates). */
export interface RxGroupList {
  id: string;
  name: string;
  sourceMemberNames: string[];
}

export interface Contact {
  id: string;
  name: string;
  number: string;
  timeslotOverride: string;
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
  rxGroupLists: RxGroupList[];
  contacts: Contact[];
  meta: CodeplugMeta;
}

export const CODEPLUG_SCHEMA_VERSION = 3;

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
    rxGroupLists: [],
    contacts: [],
    meta: {
      schemaVersion: CODEPLUG_SCHEMA_VERSION,
      importedAt: null,
      sourceFiles: [],
    },
  };
}
