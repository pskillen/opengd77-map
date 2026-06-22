import type { Codeplug } from '../../models/codeplug.ts';
import type { EntityRef } from '../../lib/entityRefs.ts';
import type { ValidationIssue } from './channel.ts';

export function validateRxGroupList(
  input: { name: string; memberRefs?: EntityRef[] },
  codeplug: Codeplug,
  rglId?: string,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!input.name.trim()) {
    issues.push({ field: 'name', message: 'RX group list name is required', severity: 'error' });
  } else {
    const duplicate = codeplug.rxGroupLists.find((r) => r.name === input.name && r.id !== rglId);
    if (duplicate) {
      issues.push({
        field: 'name',
        message: 'Another RX group list already uses this name',
        severity: 'error',
      });
    }
  }

  const members = input.memberRefs;
  if (members) {
    const unresolved = members.filter((ref) => {
      if (ref.kind === 'talkGroup') {
        return !codeplug.talkGroups.some((tg) => tg.id === ref.id);
      }
      return !codeplug.contacts.some((c) => c.id === ref.id);
    });
    if (unresolved.length > 0) {
      issues.push({
        field: 'memberRefs',
        message: `${unresolved.length} member ref(s) not found in talk groups or contacts`,
        severity: 'warning',
      });
    }
  }

  return issues;
}
