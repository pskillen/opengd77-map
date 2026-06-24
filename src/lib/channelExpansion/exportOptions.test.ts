import { describe, expect, it } from 'vitest';
import { effectiveMaxNameLength } from './exportOptions.ts';

describe('effectiveMaxNameLength', () => {
  it('prefers export override over profile nameLimit', () => {
    expect(effectiveMaxNameLength({ maxNameLength: 12 }, 7)).toBe(12);
  });

  it('falls back to profile nameLimit when override is unset', () => {
    expect(effectiveMaxNameLength(undefined, 12)).toBe(12);
    expect(effectiveMaxNameLength({}, 16)).toBe(16);
  });
});
