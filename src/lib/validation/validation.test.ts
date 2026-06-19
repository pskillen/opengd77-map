import { describe, expect, it } from 'vitest';
import { channelFieldDefaults, emptyCodeplug } from '../../models/codeplug.ts';
import { hasValidationErrors, isSimplex, validateChannel } from './channel.ts';
import { validateContact } from './contact.ts';
import { validateRxGroupList } from './rxGroupList.ts';
import { validateTalkGroup } from './talkGroup.ts';
import { validateZone } from './zone.ts';

function channel(id: string, name: string) {
  return {
    id,
    name,
    callsign: name,
    mode: 'dmr' as const,
    ...channelFieldDefaults(),
    number: '1',
  };
}

describe('validateChannel', () => {
  it('requires unique name', () => {
    const cp = { ...emptyCodeplug(), channels: [channel('c1', 'Dup')] };
    const issues = validateChannel({ name: 'Dup', ...channelFieldDefaults(), mode: 'dmr' }, cp);
    expect(hasValidationErrors(issues)).toBe(true);
  });

  it('warns on missing contact', () => {
    const issues = validateChannel(
      { ...channelFieldDefaults(), name: 'X', contactName: 'Missing', mode: 'dmr' },
      emptyCodeplug(),
    );
    expect(issues.some((i) => i.severity === 'warning' && i.field === 'contactName')).toBe(true);
  });

  it('detects simplex', () => {
    expect(isSimplex('145.775', '145.775')).toBe(true);
    expect(isSimplex('145.775', '145.7750')).toBe(true);
    expect(isSimplex('145.775', '145.175')).toBe(false);
  });
});

describe('validateZone', () => {
  it('enforces member cap', () => {
    const ids = Array.from({ length: 81 }, (_, i) => `ch-${i}`);
    const issues = validateZone({ name: 'Z', memberChannelIds: ids }, emptyCodeplug());
    expect(issues.some((i) => i.severity === 'error')).toBe(true);
  });
});

describe('validateTalkGroup', () => {
  it('rejects cross-name collision with contact', () => {
    const cp = {
      ...emptyCodeplug(),
      contacts: [{ id: 'c1', name: 'Shared', number: '1', timeslotOverride: '' }],
    };
    const issues = validateTalkGroup({ name: 'Shared' }, cp);
    expect(hasValidationErrors(issues)).toBe(true);
  });
});

describe('validateContact', () => {
  it('rejects cross-name collision with talk group', () => {
    const cp = {
      ...emptyCodeplug(),
      talkGroups: [{ id: 'tg1', name: 'Shared', number: '9', timeslotOverride: '' }],
    };
    const issues = validateContact({ name: 'Shared' }, cp);
    expect(hasValidationErrors(issues)).toBe(true);
  });
});

describe('validateRxGroupList', () => {
  it('warns on unresolved member names', () => {
    const issues = validateRxGroupList(
      { name: 'List', sourceMemberNames: ['Missing'] },
      emptyCodeplug(),
    );
    expect(issues.some((i) => i.severity === 'warning')).toBe(true);
    expect(hasValidationErrors(issues)).toBe(false);
  });

  it('accepts large member lists without count error', () => {
    const members = Array.from({ length: 50 }, (_, i) => `TG${i}`);
    const cp = {
      ...emptyCodeplug(),
      talkGroups: members.map((name, i) => ({
        id: `tg-${i}`,
        name,
        number: String(i),
        timeslotOverride: '',
      })),
    };
    const issues = validateRxGroupList({ name: 'Big', sourceMemberNames: members }, cp);
    expect(hasValidationErrors(issues)).toBe(false);
  });
});
