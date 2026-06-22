import { describe, expect, it } from 'vitest';
import { chirpWireToPercent, chirpPercentToWire } from './chirp/profiles.ts';
import { opengd77WireToPercent, opengd77PercentToWire } from './opengd77/profiles.ts';

describe('CHIRP power ladder', () => {
  it('round-trips UV-5R Mini watts', () => {
    expect(chirpWireToPercent('baofeng-uv5r-mini', '5.0W')).toBe(100);
    expect(chirpWireToPercent('baofeng-uv5r-mini', '1.0W')).toBe(20);
    expect(chirpPercentToWire('baofeng-uv5r-mini', 100)).toBe('5.0W');
    expect(chirpPercentToWire('baofeng-uv5r-mini', 20)).toBe('1.0W');
    expect(chirpPercentToWire('baofeng-uv5r-mini', null)).toBe('5.0W');
  });

  it('round-trips RT95 watts', () => {
    expect(chirpWireToPercent('retevis-rt95', '25W')).toBe(100);
    expect(chirpWireToPercent('retevis-rt95', '10W')).toBe(40);
    expect(chirpPercentToWire('retevis-rt95', 100)).toBe('25W');
    expect(chirpPercentToWire('retevis-rt95', 40)).toBe('10W');
  });
});

describe('OpenGD77 power ladder', () => {
  it('round-trips 1701 P-levels', () => {
    expect(opengd77WireToPercent('opengd77-1701', 'P9')).toBe(100);
    expect(opengd77WireToPercent('opengd77-1701', 'P2')).toBe(5);
    expect(opengd77PercentToWire('opengd77-1701', 100)).toBe('P9');
    expect(opengd77PercentToWire('opengd77-1701', null)).toBe('Master');
  });
});
