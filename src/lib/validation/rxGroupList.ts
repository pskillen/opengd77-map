import type { Codeplug } from '../../models/codeplug.ts';
import type { ValidationIssue } from './channel.ts';

export function validateRxGroupList(
  input: { name: string; memberWireNames?: string[] },
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

  const members = input.memberWireNames;
  if (members) {
    const talkGroupNames = new Set(codeplug.talkGroups.map((tg) => tg.name));
    const contactNames = new Set(codeplug.contacts.map((c) => c.name));
    const unresolved = members.filter((n) => !talkGroupNames.has(n) && !contactNames.has(n));
    if (unresolved.length > 0) {
      issues.push({
        field: 'memberWireNames',
        message: `${unresolved.length} member name(s) not found in talk groups or contacts`,
        severity: 'warning',
      });
    }
  }

  return issues;
}
