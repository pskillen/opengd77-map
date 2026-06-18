export interface Channel {
  number: string;
  name: string;
  callsign: string;
  type: string;
  rx: string;
  tx: string;
  contact: string;
  tgList: string;
  lat: number | null;
  lon: number | null;
  useLocation: boolean;
}

export interface Zone {
  name: string;
  members: string[];
}

const COL = {
  number: 'Channel Number',
  name: 'Channel Name',
  type: 'Channel Type',
  rx: 'Rx Frequency',
  tx: 'Tx Frequency',
  contact: 'Contact',
  tgList: 'TG List',
  lat: 'Latitude',
  lon: 'Longitude',
  useLocation: 'Use Location',
} as const;

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let i = 0;
  let inQuotes = false;

  while (i < text.length) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += c;
      i++;
      continue;
    }
    if (c === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (c === ',') {
      row.push(field);
      field = '';
      i++;
      continue;
    }
    if (c === '\r') {
      i++;
      continue;
    }
    if (c === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      i++;
      continue;
    }
    field += c;
    i++;
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

export function extractCallsign(channelName: string): string {
  return channelName.split(/\s+/)[0] || channelName;
}

export function parseChannelsCsv(text: string): Channel[] {
  const rows = parseCsv(text.replace(/^\uFEFF/, ''));
  if (!rows.length) throw new Error('Empty CSV');

  const headers = rows[0].map((h) => h.trim());
  const required = [COL.name, COL.lat, COL.lon];
  for (const key of required) {
    if (!headers.includes(key)) {
      throw new Error(`Missing column "${key}". Is this an OpenGD77 Channels.csv?`);
    }
  }

  const idx = Object.fromEntries(headers.map((h, i) => [h, i]));
  const out: Channel[] = [];

  for (let r = 1; r < rows.length; r++) {
    const cells = rows[r];
    if (!cells.length || (cells.length === 1 && !cells[0].trim())) continue;

    const get = (col: string) => (cells[idx[col]] ?? '').trim().replace(/\t/g, '');

    const name = get(COL.name);
    if (!name) continue;

    const lat = parseFloat(get(COL.lat));
    const lon = parseFloat(get(COL.lon));

    out.push({
      number: get(COL.number),
      name,
      callsign: extractCallsign(name),
      type: get(COL.type) || 'Unknown',
      rx: get(COL.rx),
      tx: get(COL.tx),
      contact: get(COL.contact),
      tgList: get(COL.tgList),
      lat: Number.isFinite(lat) ? lat : null,
      lon: Number.isFinite(lon) ? lon : null,
      useLocation: get(COL.useLocation).toLowerCase() === 'yes',
    });
  }
  return out;
}

export function parseZonesCsv(text: string): Zone[] {
  const rows = parseCsv(text.replace(/^\uFEFF/, ''));
  if (!rows.length) throw new Error('Empty CSV');

  const headers = rows[0].map((h) => h.trim());
  if (!headers.includes('Zone Name')) {
    throw new Error('Missing column "Zone Name". Is this an OpenGD77 Zones.csv?');
  }

  const idx = Object.fromEntries(headers.map((h, i) => [h, i]));
  const channelCols = headers
    .map((h, i) => (/^Channel\d+$/i.test(h) ? i : -1))
    .filter((i) => i >= 0);

  const out: Zone[] = [];
  for (let r = 1; r < rows.length; r++) {
    const cells = rows[r];
    if (!cells.length || (cells.length === 1 && !cells[0].trim())) continue;

    const name = (cells[idx['Zone Name']] ?? '').trim();
    if (!name) continue;

    const members: string[] = [];
    for (const ci of channelCols) {
      const ch = (cells[ci] ?? '').trim();
      if (ch) members.push(ch);
    }
    out.push({ name, members });
  }
  return out;
}
