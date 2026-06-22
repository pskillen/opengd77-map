import { parseCsv, extractCallsign } from '../../csv.ts';
import { channelFieldDefaults, newId, type Channel } from '../../../models/codeplug.ts';
import { stampImported } from '../../entityProvenance.ts';
import { CHIRP_COL } from './columns.ts';
import {
  deriveChirpTxFrequencyHz,
  parseChirpFrequencyWire,
  parseChirpModeWire,
  parseChirpOffsetMhz,
  parseChirpPowerWire,
  parseChirpScanSkip,
  parseChirpTones,
  parseChirpTStepWire,
} from './channelWire.ts';

const CHIRP_FORMAT = 'chirp';

function colIndex(headers: string[], name: string): number {
  const i = headers.indexOf(name);
  return i >= 0 ? i : -1;
}

function cell(row: string[], index: number): string {
  return index >= 0 && index < row.length ? (row[index] ?? '').trim() : '';
}

export function parseChannels(text: string): Channel[] {
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
    tstep: colIndex(headers, CHIRP_COL.TStep),
    skip: colIndex(headers, CHIRP_COL.Skip),
    power: colIndex(headers, CHIRP_COL.Power),
  };

  const importedAt = new Date().toISOString();
  const channels: Channel[] = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const name = cell(row, nameIdx);
    if (!name) continue;

    const rxFrequency = parseChirpFrequencyWire(cell(row, idx.frequency));
    const duplex = cell(row, idx.duplex);
    const offsetMhz = parseChirpOffsetMhz(cell(row, idx.offset));
    const txFrequency = deriveChirpTxFrequencyHz(rxFrequency, duplex, offsetMhz);
    const tones = parseChirpTones(
      cell(row, idx.tone),
      cell(row, idx.rToneFreq),
      cell(row, idx.cToneFreq),
    );

    const channel: Channel = {
      id: newId(),
      name,
      callsign: extractCallsign(name),
      mode: parseChirpModeWire(cell(row, idx.mode)),
      ...channelFieldDefaults(),
      rxFrequency,
      txFrequency,
      rxTone: tones.rxTone,
      txTone: tones.txTone,
      bandwidthKHz: parseChirpTStepWire(cell(row, idx.tstep)),
      power: parseChirpPowerWire(cell(row, idx.power)),
      scanSkip: parseChirpScanSkip(cell(row, idx.skip)),
    };

    channels.push(
      stampImported(channel, {
        formatId: CHIRP_FORMAT,
        sourceFile: null,
        importedAt,
      }),
    );
  }

  return channels;
}
