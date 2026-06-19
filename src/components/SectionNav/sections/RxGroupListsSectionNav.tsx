import type { SectionNavProps } from '../../../nav/sectionNavTypes.ts';
import EntityListSectionNav from './EntityListSectionNav.tsx';

export default function RxGroupListsSectionNav(props: SectionNavProps) {
  return (
    <EntityListSectionNav {...props} newPath="/rx-group-lists/new" newLabel="New RX group list" />
  );
}
