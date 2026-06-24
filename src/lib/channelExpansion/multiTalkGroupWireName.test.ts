import { describe, expect, it } from 'vitest';
import { buildChannel, buildTalkGroup } from '../../test/builders/codeplug.ts';
import {
  composeMultiTalkGroupWireName,
  escalateMultiTalkGroupExportNameMode,
  normaliseTalkGroupTimeslotToken,
  type MultiTalkGroupWireNameContext,
} from './multiTalkGroupWireName.ts';

const tgScotland = buildTalkGroup({
  id: 'tg1',
  name: 'Scotland TS2',
  number: '950',
  timeslotOverride: 'Slot 2',
  abbreviation: 'Sco TS2',
});

const tgWest = buildTalkGroup({
  id: 'tg2',
  name: 'Scot West TS1',
  number: '2355',
  timeslotOverride: 'Slot 1',
  abbreviation: 'Sco W TS1',
});

const channel = buildChannel({
  id: 'c1',
  callsign: 'GB7GL',
  name: 'Glasgow',
  abbreviation: 'Glas',
  exportNameMode: 'callsign_name',
  mode: 'dmr',
});

const member = { kind: 'talkGroup' as const, id: 'tg1' };

function ctx(
  overrides: Partial<MultiTalkGroupWireNameContext> = {},
): MultiTalkGroupWireNameContext {
  return {
    talkGroups: [tgScotland, tgWest],
    contacts: [],
    ...overrides,
  };
}

describe('normaliseTalkGroupTimeslotToken', () => {
  it('maps Slot N wire values to digit', () => {
    expect(normaliseTalkGroupTimeslotToken('Slot 2')).toBe('2');
    expect(normaliseTalkGroupTimeslotToken('Slot 1')).toBe('1');
  });

  it('returns null for empty or disabled', () => {
    expect(normaliseTalkGroupTimeslotToken('')).toBeNull();
    expect(normaliseTalkGroupTimeslotToken('Disabled')).toBeNull();
  });
});

describe('composeMultiTalkGroupWireName', () => {
  it('callsign_tg_abbrev uses callsign and TG abbreviation', () => {
    expect(composeMultiTalkGroupWireName(channel, member, 'callsign_tg_abbrev', ctx())).toBe(
      'GB7GL Sco TS2',
    );
  });

  it('callsign_name_tg includes name qualifier', () => {
    expect(composeMultiTalkGroupWireName(channel, member, 'callsign_name_tg', ctx())).toBe(
      'GB7GL Glasgow Scotland TS2',
    );
  });

  it('callsign_name_tg uses channel abbreviation when enabled', () => {
    expect(
      composeMultiTalkGroupWireName(
        channel,
        member,
        'callsign_name_tg',
        ctx({
          useChannelAbbreviation: true,
        }),
      ),
    ).toBe('GB7GL Glas Scotland TS2');
  });

  it('callsign_tg drops name qualifier', () => {
    expect(composeMultiTalkGroupWireName(channel, member, 'callsign_tg', ctx())).toBe(
      'GB7GL Scotland TS2',
    );
  });

  it('suffix_tg_abbrev uses 2-letter callsign suffix and TG abbrev', () => {
    expect(composeMultiTalkGroupWireName(channel, member, 'suffix_tg_abbrev', ctx())).toBe(
      'GL Sco TS2',
    );
  });

  it('suffix_tg_number uses number/ts token', () => {
    expect(composeMultiTalkGroupWireName(channel, member, 'suffix_tg_number', ctx())).toBe(
      'GL 950/2',
    );
  });

  it('suffix_tg_number for second TG uses its number/ts', () => {
    const member2 = { kind: 'talkGroup' as const, id: 'tg2' };
    expect(composeMultiTalkGroupWireName(channel, member2, 'suffix_tg_number', ctx())).toBe(
      'GL 2355/1',
    );
  });
});

describe('escalateMultiTalkGroupExportNameMode', () => {
  it('escalates callsign_tg_abbrev to suffix_tg_abbrev then suffix_tg_number', () => {
    expect(escalateMultiTalkGroupExportNameMode('callsign_tg_abbrev')).toBe('suffix_tg_abbrev');
    expect(escalateMultiTalkGroupExportNameMode('suffix_tg_abbrev')).toBe('suffix_tg_number');
    expect(escalateMultiTalkGroupExportNameMode('suffix_tg_number')).toBeNull();
  });
});
