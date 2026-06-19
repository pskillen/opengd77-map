import type { SectionNavProps } from '../../../nav/sectionNavTypes.ts';
import EntityListSectionNav from './EntityListSectionNav.tsx';

export default function ContactsSectionNav(props: SectionNavProps) {
  return <EntityListSectionNav {...props} newPath="/contacts/new" newLabel="New contact" />;
}
