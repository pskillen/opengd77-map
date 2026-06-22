import { CHIRP_HEADERS } from '../../lib/import/chirp/columns.ts';

const header = CHIRP_HEADERS.join(',');

export const chirpMinimalBundle: Record<string, string> = {
  'chirp-minimal.csv': `${header}
1,UK Call VHF,145.500000,,0.000000,,88.5,88.5,023,NN,023,Tone->Tone,NFM,5.00,,5.0W,,,,,
2,GB3CS M'well,145.750000,-,0.600000,Tone,103.5,88.5,023,NN,023,Tone->Tone,NFM,5.00,,5.0W,"GB3CS near Motherwell",,,,`,
};

export const chirpTsqlBundle: Record<string, string> = {
  'chirp-tsql.csv': `${header}
4,Ruaridh 5/13,446.056250,,0.000000,TSQL,88.5,103.5,023,NN,023,Tone->Tone,NFM,5.00,,1.0W,,,,,`,
};
