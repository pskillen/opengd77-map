import { NullSectionNav } from './sectionNavStubs.tsx';
import type { SectionNavEntry } from './sectionNavTypes.ts';

/** Longest prefix first — more specific routes win. */
const registry: SectionNavEntry[] = [
  { title: 'Reference', prefix: '/reference', Component: NullSectionNav },
  { title: 'Settings', prefix: '/settings', Component: NullSectionNav },
  { title: 'Channels', prefix: '/channels', Component: NullSectionNav },
  { title: 'Zones', prefix: '/zones', Component: NullSectionNav },
  { title: 'Talk groups', prefix: '/talk-groups', Component: NullSectionNav },
  { title: 'Contacts', prefix: '/contacts', Component: NullSectionNav },
  { title: 'RX Group Lists', prefix: '/rx-group-lists', Component: NullSectionNav },
  { title: 'Import & export', prefix: '/export', Component: NullSectionNav },
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
  if (!entry) return false;
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
