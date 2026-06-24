import {
  CHANNEL_LIST_COLUMNS_SCHEMA_KEY,
  CHANNEL_LIST_COLUMN_STORAGE_KEY,
} from '../../hooks/channelListQueryUtils.ts';
import { LIST_PREFS_STORAGE_PREFIX } from '../listPrefs/keys.ts';
import {
  STORAGE_KEY_EXPORT_MAX_NAME_LENGTH,
  STORAGE_KEY_EXPORT_NAME_MODE_OVERRIDE,
  STORAGE_KEY_EXPORT_SHORTEN_NAMES,
  STORAGE_KEY_EXPORT_USE_TG_ABBREVIATION,
  STORAGE_KEY_EXPORT_USE_CHANNEL_ABBREVIATION,
  STORAGE_KEY_EXPORT_MULTI_TG_NAME_MODE,
} from '../../hooks/useExportSettings.ts';
import { STORAGE_KEY_MAIDENHEAD_GRID, STORAGE_KEY_TILE, STORAGE_KEY_TOKEN } from '../mapTiles.ts';
import { CODEPLUG_STORAGE_KEY } from '../../state/codeplugStorage.ts';
import { parseStorageRaw, redactParsedValue } from './parseStorageValue.ts';

const APP_STORAGE_PREFIX = 'mm9pdy-codeplug-tool.';

export interface StorageKeyDescriptor {
  key: string;
  label: string;
  redact: boolean;
}

export interface StorageKeyRow extends StorageKeyDescriptor {
  present: boolean;
  byteSize: number;
}

export interface StorageEntry {
  raw: string | null;
  parsed: unknown;
  parseError: string | null;
  present: boolean;
}

const KNOWN_STORAGE_KEYS: StorageKeyDescriptor[] = [
  { key: CODEPLUG_STORAGE_KEY, label: 'Codeplug projects', redact: false },
  { key: STORAGE_KEY_TOKEN, label: 'Mapbox token', redact: true },
  { key: STORAGE_KEY_TILE, label: 'Map tile provider', redact: false },
  { key: STORAGE_KEY_MAIDENHEAD_GRID, label: 'Maidenhead grid mode', redact: false },
  { key: CHANNEL_LIST_COLUMN_STORAGE_KEY, label: 'Channel list columns (legacy)', redact: false },
  {
    key: CHANNEL_LIST_COLUMNS_SCHEMA_KEY,
    label: 'Channel list columns schema (legacy)',
    redact: false,
  },
  { key: STORAGE_KEY_EXPORT_SHORTEN_NAMES, label: 'Export shorten names', redact: false },
  { key: STORAGE_KEY_EXPORT_MAX_NAME_LENGTH, label: 'Export max name length', redact: false },
  { key: STORAGE_KEY_EXPORT_NAME_MODE_OVERRIDE, label: 'Export name mode override', redact: false },
  {
    key: STORAGE_KEY_EXPORT_USE_TG_ABBREVIATION,
    label: 'Export use talk group abbreviations',
    redact: false,
  },
  {
    key: STORAGE_KEY_EXPORT_USE_CHANNEL_ABBREVIATION,
    label: 'Export use channel abbreviations',
    redact: false,
  },
  {
    key: STORAGE_KEY_EXPORT_MULTI_TG_NAME_MODE,
    label: 'Export multi-talkgroup name mode',
    redact: false,
  },
];

export function formatByteSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function storageKeyViewerPath(key: string): string {
  return `/debug/local-storage/${encodeURIComponent(key)}`;
}

export function decodeStorageKeyParam(param: string): string {
  return decodeURIComponent(param);
}

const LIST_ENTITY_LABELS: Record<string, string> = {
  channels: 'channels',
  zones: 'zones',
  'talk-groups': 'talk groups',
  contacts: 'contacts',
  'rx-group-lists': 'RX group lists',
};

function describeListPrefsKey(key: string): string | null {
  if (!key.startsWith(LIST_PREFS_STORAGE_PREFIX)) return null;
  const rest = key.slice(LIST_PREFS_STORAGE_PREFIX.length);
  const parts = rest.split('.');
  const entity = parts[0];
  if (!entity || !LIST_ENTITY_LABELS[entity]) return 'List prefs';

  if (parts.length === 2) {
    return `List prefs (${LIST_ENTITY_LABELS[entity]})`;
  }
  if (parts.length === 3 && parts[2] === 'columns') {
    return `List columns (${LIST_ENTITY_LABELS[entity]})`;
  }
  if (parts.length === 3 && parts[2] === 'columns-schema') {
    return `List columns schema (${LIST_ENTITY_LABELS[entity]})`;
  }
  return `List prefs (${LIST_ENTITY_LABELS[entity]})`;
}

export function getStorageKeyDescriptor(key: string): StorageKeyDescriptor {
  const known = KNOWN_STORAGE_KEYS.find((entry) => entry.key === key);
  if (known) return known;
  const listLabel = describeListPrefsKey(key);
  if (listLabel) return { key, label: listLabel, redact: false };
  return { key, label: 'Unknown key', redact: false };
}

export function listStorageKeys(): StorageKeyRow[] {
  const knownKeySet = new Set(KNOWN_STORAGE_KEYS.map((entry) => entry.key));
  const rows: StorageKeyRow[] = KNOWN_STORAGE_KEYS.map((descriptor) => {
    const raw = localStorage.getItem(descriptor.key);
    return {
      ...descriptor,
      present: raw !== null,
      byteSize: raw?.length ?? 0,
    };
  });

  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (!key || knownKeySet.has(key) || !key.startsWith(APP_STORAGE_PREFIX)) continue;
    const raw = localStorage.getItem(key);
    rows.push({
      ...getStorageKeyDescriptor(key),
      present: raw !== null,
      byteSize: raw?.length ?? 0,
    });
  }

  return rows;
}

export function readStorageEntry(descriptor: StorageKeyDescriptor): StorageEntry {
  const raw = localStorage.getItem(descriptor.key);
  const present = raw !== null;
  const { parsed, parseError } = parseStorageRaw(raw);
  const viewParsed =
    parsed !== null && parseError === null ? redactParsedValue(parsed, descriptor.redact) : parsed;

  return {
    raw,
    parsed: viewParsed,
    parseError,
    present,
  };
}
