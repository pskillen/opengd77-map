import ReferenceSectionNav from '../components/SectionNav/sections/ReferenceSectionNav.tsx';
import ChannelsSectionNav from '../components/SectionNav/sections/ChannelsSectionNav.tsx';
import SettingsSectionNav from '../components/SectionNav/sections/SettingsSectionNav.tsx';
import ZonesSectionNav from '../components/SectionNav/sections/ZonesSectionNav.tsx';
import ImportExportSectionNav from '../components/SectionNav/sections/ImportExportSectionNav.tsx';
import TalkGroupsSectionNav from '../components/SectionNav/sections/TalkGroupsSectionNav.tsx';
import ContactsSectionNav from '../components/SectionNav/sections/ContactsSectionNav.tsx';
import RxGroupListsSectionNav from '../components/SectionNav/sections/RxGroupListsSectionNav.tsx';
import { NullSectionNav } from './sectionNavStubs.tsx';
import type { SectionNavEntry } from './sectionNavTypes.ts';

/** Longest prefix first — more specific routes win. */
const registry: SectionNavEntry[] = [
  { title: 'Reference', prefix: '/reference', Component: ReferenceSectionNav },
  { title: 'Settings', prefix: '/settings', Component: SettingsSectionNav },
  { title: 'Channels', prefix: '/channels', Component: ChannelsSectionNav },
  { title: 'Zones', prefix: '/zones', Component: ZonesSectionNav },
  { title: 'Talk groups', prefix: '/talk-groups', Component: TalkGroupsSectionNav },
  { title: 'Contacts', prefix: '/contacts', Component: ContactsSectionNav },
  { title: 'RX Group Lists', prefix: '/rx-group-lists', Component: RxGroupListsSectionNav },
  { title: 'Import & export', prefix: '/export', Component: ImportExportSectionNav },
];

export function resolveSectionNav(pathname: string): SectionNavEntry | null {
  for (const entry of registry) {
    if (pathname === entry.prefix || pathname.startsWith(`${entry.prefix}/`)) {
      return entry;
    }
  }
  return null;
}

/** Secondary column is hidden on home without a project; reference/settings work globally. */
export function shouldShowSecondaryNav(pathname: string, hasActiveProject: boolean): boolean {
  if (pathname === '/') return false;
  const entry = resolveSectionNav(pathname);
  if (!entry || entry.Component === NullSectionNav) return false;
  if (pathname.startsWith('/reference') || pathname.startsWith('/settings')) return true;
  return hasActiveProject;
}

export function registerSectionNav(entry: SectionNavEntry): void {
  const existing = registry.findIndex((e) => e.prefix === entry.prefix);
  if (existing >= 0) {
    registry[existing] = entry;
  } else {
    registry.push(entry);
    registry.sort((a, b) => b.prefix.length - a.prefix.length);
  }
}

export { registry as sectionNavRegistry };
