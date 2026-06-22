import { parseChannels, parseContacts, parseRxGroupLists, parseZones } from './parse.ts';

/** OpenGD77 import adapter — behaviour in docs/features/import-export/opengd77/README.md;
 *  wire format in docs/reference/opengd77/. */

export type OpenGd77FileKind = 'channels' | 'zones' | 'contacts' | 'rxGroupLists' | 'unknown';

export function detectKind(fileName: string, headerRow: string[]): OpenGd77FileKind {
  const lower = fileName.toLowerCase();
  if (lower.includes('channel')) return 'channels';
  if (lower.includes('zone')) return 'zones';
  if (lower.includes('tg_list') || lower.includes('tg list')) return 'rxGroupLists';
  if (lower.includes('contact') && !lower.includes('dtmf')) return 'contacts';

  const headers = headerRow.map((h) => h.trim());
  if (headers.includes('TG List Name')) return 'rxGroupLists';
  if (headers.includes('Contact Name') && headers.includes('ID Type')) return 'contacts';
  if (headers.includes('Channel Name') && headers.includes('Latitude')) return 'channels';
  if (headers.includes('Zone Name')) return 'zones';
  return 'unknown';
}

export const opengd77Adapter = {
  id: 'opengd77' as const,
  label: 'OpenGD77 CPS CSV',
  /** Short label for default new-project names — `{projectNameLabel} YYYY-MM-DD`. */
  projectNameLabel: 'OpenGD77',
  detectKind,
  parseChannels,
  parseZones,
  parseContacts,
  parseRxGroupLists,
};
