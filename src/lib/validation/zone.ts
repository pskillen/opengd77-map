import type { Codeplug } from '../../models/codeplug.ts';
import { OPENGD77_MAX_ZONE_MEMBERS } from '../codeplugMutations.ts';
import type { ValidationIssue } from './channel.ts';

export function validateZone(
  input: { name: string; memberChannelIds?: string[] },
  codeplug: Codeplug,
  zoneId?: string,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!input.name.trim()) {
    issues.push({ field: 'name', message: 'Zone name is required', severity: 'error' });
  } else {
    const duplicate = codeplug.zones.find((z) => z.name === input.name && z.id !== zoneId);
    if (duplicate) {
      issues.push({
        field: 'name',
        message: 'Another zone already uses this name',
        severity: 'error',
      });
    }
  }

  const members = input.memberChannelIds;
  if (members) {
    if (members.length > OPENGD77_MAX_ZONE_MEMBERS) {
      issues.push({
        field: 'memberChannelIds',
        message: `Zone cannot have more than ${OPENGD77_MAX_ZONE_MEMBERS} members`,
        severity: 'error',
      });
    }

    const channelIds = new Set(codeplug.channels.map((ch) => ch.id));
    for (const id of members) {
      if (!channelIds.has(id)) {
        issues.push({
          field: 'memberChannelIds',
          message: 'One or more selected channels no longer exist',
          severity: 'error',
        });
        break;
      }
    }
  }

  return issues;
}
