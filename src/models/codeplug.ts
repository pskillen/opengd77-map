import type { ChannelMode } from '../lib/channelModes.ts';
import type { ChannelTimeslot, ChannelTone } from '../lib/channelFields/index.ts';
import type { EntityMeta } from '../lib/entityProvenance.ts';
import type { EntityRef } from '../lib/entityRefs.ts';

export type { ChannelMode };
export type { EntityMeta, ImportedProvenance } from '../lib/entityProvenance.ts';
export type { EntityRef, EntityRefKind } from '../lib/entityRefs.ts';

export interface GeoPoint {
  lat: number;
  lon: number;
}

/** Per-mode settings when a channel carries more than one RF mode. */
export interface ChannelModeProfile {
  mode: ChannelMode;
  bandwidthKHz: number | null;
  colourCode: number | null;
  timeslot: ChannelTimeslot | null;
  dmrId: number | null;
  rxTone: ChannelTone;
  txTone: ChannelTone;
  squelch: number | null;
  contactRef: EntityRef | null;
  rxGroupListId: string | null;
  /** Per-profile OpenGD77-only wire columns when promoted from a merged source channel. */
  opengd77Extras?: Record<string, string>;
}

export function channelModeProfileDefaults(mode: ChannelMode = 'fm'): ChannelModeProfile {
  return {
    mode,
    bandwidthKHz: null,
    colourCode: null,
    timeslot: null,
    dmrId: null,
    rxTone: 'none',
    txTone: 'none',
    squelch: null,
    contactRef: null,
    rxGroupListId: null,
  };
}

/** Default values for optional Channel fields — spread in tests and migration. */
export function channelFieldDefaults(): Omit<Channel, 'id' | 'name' | 'callsign' | 'mode'> {
  return {
    rxFrequency: null,
    txFrequency: null,
    contactRef: null,
    rxGroupListId: null,
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
    comment: '',
    opengd77Extras: {},
    multiMode: false,
    modeProfiles: [],
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
  contactRef: EntityRef | null;
  rxGroupListId: string | null;
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
  /** Operator comment — CHIRP `Comment` column and general notes. */
  comment: string;
  /** OpenGD77-only columns keyed by canonical CSV header name. */
  opengd77Extras: Record<string, string>;
  /** When true, mode-specific fields live in modeProfiles (2+ entries). */
  multiMode: boolean;
  /** Per-mode configuration when multiMode is enabled. */
  modeProfiles: ChannelModeProfile[];
  meta?: EntityMeta;
}

export interface Zone {
  id: string;
  name: string;
  /** Resolved channel memberships by internal id. */
  memberChannelIds: string[];
  meta?: EntityMeta;
}

export interface TalkGroup {
  id: string;
  name: string;
  number: string;
  timeslotOverride: string;
  meta?: EntityMeta;
}

/** RX group list — members resolved by internal EntityRef ids. */
export interface RxGroupList {
  id: string;
  name: string;
  memberRefs: EntityRef[];
  meta?: EntityMeta;
}

export interface Contact {
  id: string;
  name: string;
  number: string;
  timeslotOverride: string;
  meta?: EntityMeta;
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

export const CODEPLUG_SCHEMA_VERSION = 9;

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
