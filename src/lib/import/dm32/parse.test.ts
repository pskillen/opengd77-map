import { describe, expect, it } from 'vitest';
import { normalizeImportedChannelNaming } from '../../channelNaming.ts';
import { parseChannels, parseTalkGroups } from './parse.ts';
import { CHANNEL_HEADERS, TALKGROUP_HEADERS } from './columns.ts';
import { DEFAULT_DM32_PROFILE_ID } from '../../dm32/profiles.ts';

describe('DM32 parse', () => {
  it('maps Digital channel row to dmr mode', () => {
    const csv = `${CHANNEL_HEADERS.join(',')}
1,GB7FE Stirling,Digital,439.47500,430.47500,High,12.5KHz,None,Channel Idle,None,1,Off,0,1,0,0,0,0,0,0,0,BM Scotland,Scotland,1,Slot 1,0,None,1,0,0,0,Paddy MM7IGV,103.5,103.5,None,Carrier/CTC,None,OFF,0,0`;
    const channels = normalizeImportedChannelNaming(
      parseChannels(csv, { profileId: DEFAULT_DM32_PROFILE_ID }),
    );
    expect(channels).toHaveLength(1);
    expect(channels[0]).toMatchObject({
      name: 'Stirling',
      callsign: 'GB7FE',
      exportNameMode: 'callsign_name',
      mode: 'dmr',
      multiMode: false,
      colourCode: 1,
      timeslot: 1,
    });
  });

  it('maps Fixed Digital to multiMode', () => {
    const csv = `${CHANNEL_HEADERS.join(',')}
2,GB3FE Stirling,Fixed Digital,145.66250,145.06250,High,12.5KHz,None,Channel Idle,None,1,Off,0,1,0,0,0,0,0,0,0,BM Scotland,Scotland,1,Slot 1,0,None,1,0,0,0,Paddy MM7IGV,103.5,103.5,None,Carrier/CTC,None,OFF,0,0`;
    const channels = parseChannels(csv, { profileId: DEFAULT_DM32_PROFILE_ID });
    expect(channels[0].multiMode).toBe(true);
    expect(channels[0].mode).toBe('dmr');
    expect(channels[0].meta?.imported?.channelWireName).toBe('GB3FE Stirling');
    expect(channels[0].modeProfiles).toHaveLength(2);
  });

  it('parses talk group call types', () => {
    const csv = `${TALKGROUP_HEADERS.join(',')}
9,Parrot 9990,9990,Private Call
1,Local,9,Group Call`;
    const talkGroups = parseTalkGroups(csv);
    expect(talkGroups.find((t) => t.name === 'Parrot 9990')?.callType).toBe('private');
    expect(talkGroups.find((t) => t.name === 'Local')?.callType).toBe('group');
  });
});
