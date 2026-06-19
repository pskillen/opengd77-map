import type { EntityImportStats, ImportApplyMode } from './importMerge.ts';
import type { ImportMessage } from './import/types.ts';

export function formatImportFileSummary(
  recognised: string[],
  skipped: ImportMessage[],
  errors: ImportMessage[],
): string | null {
  const parts: string[] = [];
  if (recognised.length) parts.push(`Recognised: ${recognised.join(', ')}`);
  if (skipped.length)
    parts.push(`Skipped: ${skipped.map((s) => `${s.fileName} (${s.message})`).join('; ')}`);
  if (errors.length)
    parts.push(`Errors: ${errors.map((e) => `${e.fileName}: ${e.message}`).join('; ')}`);
  return parts.length ? parts.join(' · ') : null;
}

const ENTITY_LABELS: Record<string, string> = {
  channels: 'Channels',
  zones: 'Zones',
  contacts: 'Contacts',
  talkGroups: 'Talk groups',
  rxGroupLists: 'RX group lists',
};

export function formatEntityStatsLine(
  label: string,
  stats: EntityImportStats,
  mode: ImportApplyMode,
): string | null {
  if (mode === 'overwrite') {
    if (stats.added === 0 && stats.removed === 0) return null;
    return `${label}: replace ${stats.removed} existing with ${stats.added} imported`;
  }
  const parts: string[] = [];
  if (stats.added) parts.push(`${stats.added} added`);
  if (stats.updated) parts.push(`${stats.updated} updated`);
  if (stats.unchanged) parts.push(`${stats.unchanged} unchanged`);
  if (!parts.length) return null;
  return `${label}: ${parts.join(', ')}`;
}

export function formatMergeReportLines(report: {
  mode: ImportApplyMode;
  channels: EntityImportStats;
  zones: EntityImportStats;
  contacts: EntityImportStats;
  talkGroups: EntityImportStats;
  rxGroupLists: EntityImportStats;
}): string[] {
  const entries: [EntityImportStats, string][] = [
    [report.channels, ENTITY_LABELS.channels],
    [report.zones, ENTITY_LABELS.zones],
    [report.contacts, ENTITY_LABELS.contacts],
    [report.talkGroups, ENTITY_LABELS.talkGroups],
    [report.rxGroupLists, ENTITY_LABELS.rxGroupLists],
  ];
  const lines: string[] = [];
  for (const [stats, label] of entries) {
    const line = formatEntityStatsLine(label, stats, report.mode);
    if (line) lines.push(line);
  }
  return lines;
}
