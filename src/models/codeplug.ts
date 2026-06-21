import type { ChannelMode } from '../lib/channelModes.ts';
import type { ChannelTimeslot, ChannelTone } from '../lib/channelFields/index.ts';

export type { ChannelMode };

export interface GeoPoint {
  lat: number;
  lon: number;
}

/** Default values for optional Channel fields — spread in tests and migration. */
export function channelFieldDefaults(): Omit<Channel, 'id' | 'name' | 'callsign' | 'mode'> {
  return {
    rxFrequency: null,
    txFrequency: null,
    contactName: '',
    rxGroupListName: '',
    location: null,
    useLocation: false,
    bandwidthKHz: null,
    colourCode: null,
    timeslot: null,
    dmrId: null,
    rxTone: 'none',
    txTone: 'none',
    squelch: null,
    power: null,
    rxOnly: false,
    aprsConfigName: '',
    voxEnabled: false,
    transmitTimeout: null,
    scanSkip: false,
    hideFromMap: false,
    vendorExtras: {},
  };
}

export interface Channel {
  /** Stable internal identifier — not derived from vendor fields. */
  id: string;
  /** Display/export label; transitional resolution key for zone members. */
  name: string;
  callsign: string;
  mode: ChannelMode;
  /** Integer Hz — null when unset. */
  rxFrequency: number | null;
  txFrequency: number | null;
  contactName: string;
  /** Transitional name FK → RX group list. */
  rxGroupListName: string;
  location: GeoPoint | null;
  useLocation: boolean;
  /** Channel bandwidth in kHz — null when unset. */
  bandwidthKHz: number | null;
  /** DMR colour code 0–15 — null when not applicable. */
  colourCode: number | null;
  timeslot: ChannelTimeslot | null;
  dmrId: number | null;
  rxTone: ChannelTone;
  txTone: ChannelTone;
  /** Squelch level 0–100 percent; 0 = open/off; null = radio default. */
  squelch: number | null;
  /** TX power 0–100 percent; null = radio default. */
  power: number | null;
  rxOnly: boolean;
  aprsConfigName: string;
  voxEnabled: boolean;
  /** Transmit timeout in seconds; 0 = off; null when unset. */
  transmitTimeout: number | null;
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

export const CODEPLUG_SCHEMA_VERSION = 5;

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
