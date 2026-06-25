import type { Channel, Contact, TalkGroup } from '../../models/codeplug.ts';
import type { CodeplugProject } from '../../models/codeplugProject.ts';
import type { VendorFormatId } from '../import-export/types.ts';

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
  memberWireNames: string[];
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
  /** Suggested project name from import file selection (directory or single-file rule). */
  suggestedProjectName?: string;
  /** Format adapter that produced this result. */
  formatId?: VendorFormatId;
  /** Full project from native-document import — preserves ids and metadata. */
  nativeProject?: CodeplugProject;
}
