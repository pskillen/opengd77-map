import type { Channel, Codeplug } from '../../models/codeplug.ts';

export interface ValidationIssue {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export function parseFrequencyMhz(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = parseFloat(trimmed);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function validateChannel(
  input: Partial<Channel> & { name: string },
  codeplug: Codeplug,
  channelId?: string,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!input.name.trim()) {
    issues.push({ field: 'name', message: 'Channel name is required', severity: 'error' });
  } else {
    const duplicate = codeplug.channels.find((ch) => ch.name === input.name && ch.id !== channelId);
    if (duplicate) {
      issues.push({
        field: 'name',
        message: 'Another channel already uses this name',
        severity: 'error',
      });
    }
  }

  const rx = parseFrequencyMhz(input.rxFrequency ?? '');
  const tx = parseFrequencyMhz(input.txFrequency ?? '');

  if (input.rxFrequency?.trim() && rx === null) {
    issues.push({ field: 'rxFrequency', message: 'Invalid RX frequency', severity: 'error' });
  }
  if (input.txFrequency?.trim() && tx === null) {
    issues.push({ field: 'txFrequency', message: 'Invalid TX frequency', severity: 'error' });
  }

  const contact = input.contactName?.trim();
  if (contact && contact !== 'None') {
    const hasContact = codeplug.contacts.some((c) => c.name === contact);
    const hasTalkGroup = codeplug.talkGroups.some((tg) => tg.name === contact);
    if (!hasContact && !hasTalkGroup) {
      issues.push({
        field: 'contactName',
        message: `Contact "${contact}" not found in project`,
        severity: 'warning',
      });
    }
  }

  const rgl = input.rxGroupListName?.trim();
  if (rgl && rgl !== 'None') {
    if (!codeplug.rxGroupLists.some((list) => list.name === rgl)) {
      issues.push({
        field: 'rxGroupListName',
        message: `RX group list "${rgl}" not found in project`,
        severity: 'warning',
      });
    }
  }

  return issues;
}

export function hasValidationErrors(issues: ValidationIssue[]): boolean {
  return issues.some((i) => i.severity === 'error');
}

export function isSimplex(rxFrequency: string, txFrequency: string): boolean {
  const rx = parseFrequencyMhz(rxFrequency);
  const tx = parseFrequencyMhz(txFrequency);
  if (rx === null || tx === null) return false;
  return Math.abs(rx - tx) < 0.0001;
}
