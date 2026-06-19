import {
  IconAntenna,
  IconArrowsLeftRight,
  IconAddressBook,
  IconFolders,
  IconLayoutDashboard,
  IconListDetails,
  IconUsersGroup,
} from '@tabler/icons-react';
import type { TablerIcon } from '@tabler/icons-react';
import type { Codeplug } from '../models/codeplug.ts';

export type EntityCountKey = keyof Pick<
  Codeplug,
  'channels' | 'zones' | 'talkGroups' | 'contacts' | 'rxGroupLists'
>;

export interface PrimaryNavItem {
  to: string;
  label: string;
  icon: TablerIcon;
  countKey?: EntityCountKey;
  requiresActiveProject?: boolean;
}

export const projectNavItems: PrimaryNavItem[] = [
  { to: '/summary', label: 'Summary', icon: IconLayoutDashboard },
  { to: '/channels', label: 'Channels', icon: IconAntenna, countKey: 'channels' },
  { to: '/zones', label: 'Zones', icon: IconFolders, countKey: 'zones' },
  {
    to: '/talk-groups',
    label: 'Talk groups',
    icon: IconUsersGroup,
    countKey: 'talkGroups',
  },
  { to: '/contacts', label: 'Contacts', icon: IconAddressBook, countKey: 'contacts' },
  {
    to: '/rx-group-lists',
    label: 'RX Group Lists',
    icon: IconListDetails,
    countKey: 'rxGroupLists',
  },
  { to: '/export', label: 'Import & export', icon: IconArrowsLeftRight },
];
