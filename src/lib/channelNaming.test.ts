import { describe, expect, it } from 'vitest';
import {
  composeChannelWireName,
  findCallsignTokenIndex,
  isCallsignToken,
  parseChannelWireName,
  prepareWireForCallsignParse,
} from './channelNaming.ts';

describe('isCallsignToken', () => {
  it('accepts UK repeater callsigns', () => {
    expect(isCallsignToken('GB7GL')).toBe(true);
    expect(isCallsignToken('GB3DA')).toBe(true);
    expect(isCallsignToken('G0ABC')).toBe(true);
    expect(isCallsignToken('MB7IOH')).toBe(true);
    expect(isCallsignToken('MB7IKB')).toBe(true);
  });

  it('accepts international phase-1 callsigns', () => {
    expect(isCallsignToken('W1AW')).toBe(true);
    expect(isCallsignToken('VE3FRG')).toBe(true);
    expect(isCallsignToken('DL1ABC')).toBe(true);
    expect(isCallsignToken('EA4AB')).toBe(true);
    expect(isCallsignToken('CT1ABC')).toBe(true);
    expect(isCallsignToken('I1ABC')).toBe(true);
    expect(isCallsignToken('F4ABC')).toBe(true);
    expect(isCallsignToken('SP9ABC')).toBe(true);
  });

  it('rejects labels without digits', () => {
    expect(isCallsignToken('Local')).toBe(false);
    expect(isCallsignToken('Scotland')).toBe(false);
  });

  it('accepts portable suffix on token', () => {
    expect(isCallsignToken('GB7GL/M')).toBe(true);
  });
});

describe('parseChannelWireName', () => {
  it.each([
    ['GB7GL Glasgow', 'GB7GL', 'Glasgow'],
    ['MB7IOH Houston', 'MB7IOH', 'Houston'],
    ['MB7IKB East Kilb', 'MB7IKB', 'East Kilb'],
    ['Glasgow GB7GL', 'GB7GL', 'Glasgow'],
    ['GB7GL-F', 'GB7GL', ''],
    ['W1AW Mt Greylock', 'W1AW', 'Mt Greylock'],
    ['VE3FRG Toronto', 'VE3FRG', 'Toronto'],
    ['DL1ABC Berlin', 'DL1ABC', 'Berlin'],
    ['Local Simplex', '', 'Local Simplex'],
    ['145.7750 MHz', '', '145.7750 MHz'],
  ] as const)('parses %s', (wire, callsign, name) => {
    const parsed = parseChannelWireName(wire);
    expect(parsed.callsign).toBe(callsign);
    expect(parsed.name).toBe(name);
    expect(parsed.exportNameMode).toBe(callsign ? 'callsign_name' : 'name_only');
  });

  it('uses leftmost matching token', () => {
    const tokens = ['Scotland', 'GB7GL', 'GB3DA'];
    expect(findCallsignTokenIndex(tokens)).toBe(1);
  });
});

describe('prepareWireForCallsignParse', () => {
  it('strips mode export suffix', () => {
    expect(prepareWireForCallsignParse('GB7GL-F')).toBe('GB7GL');
    expect(prepareWireForCallsignParse('GB7GL-D')).toBe('GB7GL');
  });
});

describe('composeChannelWireName', () => {
  const base = { callsign: 'GB7GL', name: 'Glasgow' };

  it.each([
    ['callsign_name', 'GB7GL Glasgow'],
    ['callsign_only', 'GB7GL'],
    ['name_only', 'Glasgow'],
    ['callsign_suffix', 'GL Glasgow'],
  ] as const)('mode %s', (exportNameMode, expected) => {
    expect(composeChannelWireName({ ...base, exportNameMode })).toBe(expected);
  });

  it('falls back when parts missing', () => {
    expect(
      composeChannelWireName({ callsign: 'GB7GL', name: '', exportNameMode: 'callsign_name' }),
    ).toBe('GB7GL');
    expect(
      composeChannelWireName({ callsign: '', name: 'Glasgow', exportNameMode: 'callsign_only' }),
    ).toBe('Glasgow');
  });
});
