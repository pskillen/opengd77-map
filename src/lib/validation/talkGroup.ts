import type { Codeplug } from '../../models/codeplug.ts';
import type { ValidationIssue } from './channel.ts';

export function validateTalkGroup(
  input: { name: string; number?: string; timeslotOverride?: string },
  codeplug: Codeplug,
  talkGroupId?: string,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!input.name.trim()) {
    issues.push({ field: 'name', message: 'Talk group name is required', severity: 'error' });
  } else {
    const duplicate = codeplug.talkGroups.find(
      (tg) => tg.name === input.name && tg.id !== talkGroupId,
    );
    if (duplicate) {
      issues.push({
        field: 'name',
        message: 'Another talk group already uses this name',
        severity: 'error',
      });
    }

    const contactCollision = codeplug.contacts.find((c) => c.name === input.name);
    if (contactCollision) {
      issues.push({
        field: 'name',
        message: 'A private contact already uses this name',
        severity: 'error',
      });
    }
  }

  return issues;
}
