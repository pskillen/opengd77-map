import { describe, expect, it } from 'vitest';
import { rowAddStatus } from './rowAddStatus.ts';

describe('rowAddStatus', () => {
  it('shows skip reason when listing cannot be mapped', () => {
    expect(
      rowAddStatus({
        skipReason: 'No FM or DMR mode in listing',
        callsignCollision: false,
        mappable: false,
      }),
    ).toEqual({ label: 'No FM or DMR mode in listing', color: 'dimmed' });
  });

  it('shows duplicate callsign message', () => {
    expect(
      rowAddStatus({
        callsignCollision: true,
        mappable: true,
      }),
    ).toEqual({ label: 'Callsign already in codeplug', color: 'orange' });
  });

  it('shows ready when row can be added', () => {
    expect(
      rowAddStatus({
        callsignCollision: false,
        mappable: true,
      }),
    ).toEqual({ label: 'Ready', color: undefined });
  });
});
