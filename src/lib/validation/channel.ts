import type { Channel, Codeplug } from '../../models/codeplug.ts';

export interface ValidationIssue {
  field: string;
  message: string;
  severity: 'error' | 'warning';
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

  if (
    input.rxFrequency != null &&
    (!Number.isFinite(input.rxFrequency) || input.rxFrequency <= 0)
  ) {
    issues.push({ field: 'rxFrequency', message: 'Invalid RX frequency', severity: 'error' });
  }
  if (
    input.txFrequency != null &&
    (!Number.isFinite(input.txFrequency) || input.txFrequency <= 0)
  ) {
    issues.push({ field: 'txFrequency', message: 'Invalid TX frequency', severity: 'error' });
  }

  const ref = input.contactRef;
  if (ref) {
    const exists =
      ref.kind === 'talkGroup'
        ? codeplug.talkGroups.some((tg) => tg.id === ref.id)
        : codeplug.contacts.some((c) => c.id === ref.id);
    if (!exists) {
      issues.push({
        field: 'contactRef',
        message: 'Selected TX contact not found in project',
        severity: 'warning',
      });
    }
  }

  const rgl = input.rxGroupListId?.trim();
  if (rgl) {
    if (!codeplug.rxGroupLists.some((list) => list.id === rgl)) {
      issues.push({
        field: 'rxGroupListId',
        message: 'Selected RX group list not found in project',
        severity: 'warning',
      });
    }
  }

  return issues;
}

export function hasValidationErrors(issues: ValidationIssue[]): boolean {
  return issues.some((i) => i.severity === 'error');
}

export function isSimplex(rxFrequency: number | null, txFrequency: number | null): boolean {
  if (rxFrequency == null || txFrequency == null) return false;
  return rxFrequency === txFrequency;
}
