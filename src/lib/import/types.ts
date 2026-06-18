import type { Channel, Contact, TalkGroup } from '../../models/codeplug.ts';

export interface ImportMessage {
  fileName: string;
  message: string;
}

/** Adapter output — raw name-based zone members before id resolution. */
export interface ParsedZone {
  name: string;
  memberNames: string[];
}

/** Adapter output — RX group list with vendor wire member names. */
export interface ParsedRxGroupList {
  name: string;
  sourceMemberNames: string[];
}

export interface ImportResult {
  channels?: Channel[];
  zones?: ParsedZone[];
  contacts?: Contact[];
  talkGroups?: TalkGroup[];
  rxGroupLists?: ParsedRxGroupList[];
  recognised: string[];
  skipped: ImportMessage[];
  errors: ImportMessage[];
}
