import { describe, expect, it } from 'vitest';
import { channelFieldDefaults, emptyCodeplug } from '../../models/codeplug.ts';
import { hasValidationErrors, isSimplex, validateChannel } from './channel.ts';
import { validateZone } from './zone.ts';

function channel(id: string, name: string) {
  return {
    id,
    name,
    callsign: name,
    mode: 'digital' as const,
    ...channelFieldDefaults(),
    number: '1',
  };
}

describe('validateChannel', () => {
  it('requires unique name', () => {
    const cp = { ...emptyCodeplug(), channels: [channel('c1', 'Dup')] };
    const issues = validateChannel({ name: 'Dup', ...channelFieldDefaults(), mode: 'digital' }, cp);
    expect(hasValidationErrors(issues)).toBe(true);
  });

  it('warns on missing contact', () => {
    const issues = validateChannel(
      { ...channelFieldDefaults(), name: 'X', contactName: 'Missing', mode: 'digital' },
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
