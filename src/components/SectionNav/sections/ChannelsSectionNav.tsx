import { useLocation } from 'react-router-dom';
import { isChannelListPath } from '../../../lib/channelPageSections.ts';
import type { SectionNavProps } from '../../../nav/sectionNavTypes.ts';
import ChannelPageSectionNav from './ChannelPageSectionNav.tsx';
import ChannelsListSectionNav from './ChannelsListSectionNav.tsx';

export default function ChannelsSectionNav(props: SectionNavProps) {
  const { pathname } = useLocation();

  if (isChannelListPath(pathname)) {
    return <ChannelsListSectionNav {...props} />;
  }

  return <ChannelPageSectionNav {...props} />;
}
