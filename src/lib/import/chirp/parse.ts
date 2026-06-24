import { parseCsv } from '../../csv.ts';
import { channelFieldDefaults, newId, type Channel } from '../../../models/codeplug.ts';
import { stampImported } from '../../entityProvenance.ts';
import type { ImportParseContext } from '../../import-export/importAdapter.ts';
import { CHIRP_COL } from './columns.ts';
import {
  parseChirpDuplex,
  parseChirpFrequencyWire,
  parseChirpModeWire,
  parseChirpOffsetMhz,
  parseChirpPowerWire,
  parseChirpScanSkip,
  parseChirpTones,
} from './channelWire.ts';

const CHIRP_FORMAT = 'chirp';

function colIndex(headers: string[], name: string): number {
  const i = headers.indexOf(name);
  return i >= 0 ? i : -1;
}

function cell(row: string[], index: number): string {
  return index >= 0 && index < row.length ? (row[index] ?? '').trim() : '';
}

function requireProfileId(ctx?: ImportParseContext): string {
  if (!ctx?.profileId) {
    throw new Error('CHIRP import requires a radio profile');
  }
  return ctx.profileId;
}

export function parseChannels(text: string, ctx?: ImportParseContext): Channel[] {
  const profileId = requireProfileId(ctx);
  const rows = parseCsv(text.replace(/^\uFEFF/, ''));
  if (!rows.length) throw new Error('Empty CSV');

  const headers = rows[0].map((h) => h.trim());
  const nameIdx = colIndex(headers, CHIRP_COL.Name);
  if (nameIdx < 0) throw new Error('Missing Name column');

  const idx = {
    frequency: colIndex(headers, CHIRP_COL.Frequency),
    duplex: colIndex(headers, CHIRP_COL.Duplex),
    offset: colIndex(headers, CHIRP_COL.Offset),
    tone: colIndex(headers, CHIRP_COL.Tone),
    rToneFreq: colIndex(headers, CHIRP_COL.rToneFreq),
    cToneFreq: colIndex(headers, CHIRP_COL.cToneFreq),
    mode: colIndex(headers, CHIRP_COL.Mode),
    skip: colIndex(headers, CHIRP_COL.Skip),
    power: colIndex(headers, CHIRP_COL.Power),
    comment: colIndex(headers, CHIRP_COL.Comment),
  };

  const importedAt = new Date().toISOString();
  const channels: Channel[] = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const name = cell(row, nameIdx);
    if (!name) continue;

    const rxFrequency = parseChirpFrequencyWire(cell(row, idx.frequency));
    const duplexWire = cell(row, idx.duplex);
    const offsetWire = cell(row, idx.offset);
    const offsetMhz = parseChirpOffsetMhz(offsetWire);
    const { txFrequency, forbidTransmit } = parseChirpDuplex(duplexWire, rxFrequency, offsetMhz);
    const tones = parseChirpTones(
      cell(row, idx.tone),
      cell(row, idx.rToneFreq),
      cell(row, idx.cToneFreq),
    );
    const { mode, bandwidthKHz } = parseChirpModeWire(cell(row, idx.mode));

    const channel: Channel = {
      id: newId(),
      name,
      callsign: '',
      mode,
      ...channelFieldDefaults(),
      rxFrequency,
      txFrequency,
      rxTone: tones.rxTone,
      txTone: tones.txTone,
      bandwidthKHz,
      power: parseChirpPowerWire(cell(row, idx.power), profileId),
      scanSkip: parseChirpScanSkip(cell(row, idx.skip)),
      forbidTransmit,
      comment: cell(row, idx.comment),
    };

    channels.push(
      stampImported(channel, {
        formatId: CHIRP_FORMAT,
        sourceFile: null,
        importedAt,
        channelWireName: name,
        chirpDuplexWire: duplexWire,
        chirpOffsetWire: offsetWire,
      }),
    );
  }

  return channels;
}
