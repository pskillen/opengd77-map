export interface RowAddStatusInput {
  skipReason?: string;
  callsignCollision: boolean;
  mappable: boolean;
}

export interface RowAddStatus {
  label: string;
  color: 'orange' | 'dimmed' | undefined;
}

export function rowAddStatus(row: RowAddStatusInput): RowAddStatus {
  if (row.skipReason) {
    return { label: row.skipReason, color: 'dimmed' };
  }
  if (row.callsignCollision) {
    return { label: 'Callsign already in codeplug', color: 'orange' };
  }
  if (row.mappable) {
    return { label: 'Ready', color: undefined };
  }
  return { label: '—', color: undefined };
}
