import type { Codeplug } from '../../models/codeplug.ts';
import type { ValidationIssue } from './channel.ts';

export function validateContact(
  input: { name: string; number?: string; timeslotOverride?: string },
  codeplug: Codeplug,
  contactId?: string,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!input.name.trim()) {
    issues.push({ field: 'name', message: 'Contact name is required', severity: 'error' });
  } else {
    const duplicate = codeplug.contacts.find((c) => c.name === input.name && c.id !== contactId);
    if (duplicate) {
      issues.push({
        field: 'name',
        message: 'Another contact already uses this name',
        severity: 'error',
      });
    }

    const talkGroupCollision = codeplug.talkGroups.find((tg) => tg.name === input.name);
    if (talkGroupCollision) {
      issues.push({
        field: 'name',
        message: 'A talk group already uses this name',
        severity: 'error',
      });
    }
  }

  return issues;
}
