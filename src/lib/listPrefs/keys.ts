import type { EntityListEntity } from './types.ts';

const APP_PREFIX = 'mm9pdy-codeplug-tool.list.';

/** Legacy global key — migrated to per-project keys in #146. */
export const LEGACY_CHANNEL_LIST_COLUMN_STORAGE_KEY = 'channels-list-columns';
export const LEGACY_CHANNEL_LIST_COLUMNS_SCHEMA_KEY = 'channels-list-columns-schema';

export function channelListPrefsKey(projectId: string): string {
  return `${APP_PREFIX}channels.${projectId}`;
}

export function entityListPrefsKey(entity: EntityListEntity, projectId: string): string {
  return `${APP_PREFIX}${entity}.${projectId}`;
}

export function channelListColumnsKey(projectId: string): string {
  return `${APP_PREFIX}channels.${projectId}.columns`;
}

export function channelListColumnsSchemaKey(projectId: string): string {
  return `${APP_PREFIX}channels.${projectId}.columns-schema`;
}

export const LIST_PREFS_STORAGE_PREFIX = APP_PREFIX;
