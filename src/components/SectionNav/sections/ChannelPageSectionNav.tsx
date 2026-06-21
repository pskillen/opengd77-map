import { Divider, NavLink, Stack } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import { Link, useLocation } from 'react-router-dom';
import { useMemo, type ComponentType } from 'react';
import {
  CHANNEL_DETAIL_EXTRA_SECTIONS,
  CHANNEL_FORM_SECTIONS,
  channelIdFromPath,
  channelSectionAnchorId,
  isChannelDetailPath,
  isChannelEditPath,
} from '../../../lib/channelPageSections.ts';
import { ICON_SIZE_NAV, ICON_STROKE } from '../../../lib/iconSizes.ts';
import { findEntityById } from '../../../lib/reportLookup.ts';
import type { SectionNavProps } from '../../../nav/sectionNavTypes.ts';
import { useCodeplug } from '../../../state/codeplugStore.tsx';
import PageSectionNavLinks from './PageSectionNavLinks.tsx';

function ChannelPageSectionNav() {
  const { pathname } = useLocation();
  const { codeplug } = useCodeplug();
  const channelId = channelIdFromPath(pathname);

  const sections = useMemo(() => {
    if (isChannelEditPath(pathname)) {
      return CHANNEL_FORM_SECTIONS;
    }

    if (isChannelDetailPath(pathname) && channelId) {
      const channel = findEntityById(codeplug.channels, channelId);
      const links = [...CHANNEL_FORM_SECTIONS];

      if (channel && Object.keys(channel.opengd77Extras).length > 0) {
        links.push({
          id: channelSectionAnchorId('Vendor extras'),
          label: 'Vendor extras',
        });
      }

      return [...links, ...CHANNEL_DETAIL_EXTRA_SECTIONS];
    }

    return null;
  }, [pathname, channelId, codeplug.channels]);

  if (!sections) return null;

  return (
    <Stack gap="sm">
      <NavLink
        component={Link}
        to="/channels"
        label="Back to channels"
        leftSection={<IconArrowLeft size={ICON_SIZE_NAV} stroke={ICON_STROKE} />}
      />
      <Divider />
      <PageSectionNavLinks sections={sections} />
    </Stack>
  );
}

export default ChannelPageSectionNav as ComponentType<SectionNavProps>;
