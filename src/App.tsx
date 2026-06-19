import { AppShell, Box, Burger, Divider, Group, Text } from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import AppNav from './components/AppNav/AppNav.tsx';
import SectionNav from './components/SectionNav/SectionNav.tsx';
import RequireActiveProject from './components/RequireActiveProject/RequireActiveProject.tsx';
import BuildFooter from './components/BuildFooter.tsx';
import {
  NAVBAR_WIDTH_WITH_SECONDARY,
  PRIMARY_NAV_WIDTH,
  SECONDARY_NAV_WIDTH,
} from './nav/navWidths.ts';
import { shouldShowSecondaryNav } from './nav/sectionNavRegistry.ts';
import Home from './routes/Home.tsx';
import ImportExport from './routes/ImportExport.tsx';
import Summary from './routes/Summary.tsx';
import ChannelsList from './routes/channels/list.tsx';
import ChannelDetail from './routes/channels/detail.tsx';
import ChannelEdit from './routes/channels/edit.tsx';
import ZonesList from './routes/zones/list.tsx';
import ZoneDetail from './routes/zones/detail.tsx';
import ZoneEdit from './routes/zones/edit.tsx';
import TalkGroupsList from './routes/TalkGroupsList.tsx';
import TalkGroupDetail from './routes/TalkGroupDetail.tsx';
import TalkGroupEdit from './routes/TalkGroupEdit.tsx';
import ContactsList from './routes/ContactsList.tsx';
import ContactDetail from './routes/ContactDetail.tsx';
import ContactEdit from './routes/ContactEdit.tsx';
import RxGroupListsList from './routes/RxGroupListsList.tsx';
import RxGroupListDetail from './routes/RxGroupListDetail.tsx';
import RxGroupListEdit from './routes/RxGroupListEdit.tsx';
import Settings from './routes/Settings.tsx';
import ReferenceIndex from './routes/reference/index.tsx';
import BandPlan from './routes/reference/band-plan.tsx';
import MaidenheadConverter from './routes/reference/maidenhead.tsx';
import { useProjects } from './state/codeplugStore.tsx';

export default function App() {
  const [opened, { toggle, close }] = useDisclosure();
  const isDesktopNav = useMediaQuery('(min-width: 48em)');
  const location = useLocation();
  const { activeProjectId } = useProjects();
  const hasActiveProject = activeProjectId != null;
  const showSecondary = shouldShowSecondaryNav(location.pathname, hasActiveProject);
  const navbarWidth = showSecondary ? NAVBAR_WIDTH_WITH_SECONDARY : PRIMARY_NAV_WIDTH;

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={{
        width: navbarWidth,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md">
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
          <Text fw={600}>MM9PDY Codeplug Tool</Text>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p={0}>
        <Group wrap="nowrap" align="stretch" gap={0} style={{ height: '100%' }}>
          <Box w={PRIMARY_NAV_WIDTH} p="md" style={{ flexShrink: 0 }}>
            <AppNav onNavClick={close} />
          </Box>
          {showSecondary && isDesktopNav ? (
            <>
              <Divider orientation="vertical" />
              <Box w={SECONDARY_NAV_WIDTH} p="md" style={{ flexShrink: 0, overflow: 'hidden' }}>
                <SectionNav variant="sidebar" />
              </Box>
            </>
          ) : null}
        </Group>
      </AppShell.Navbar>

      <AppShell.Main>
        {showSecondary && !isDesktopNav ? (
          <Box mb="md">
            <SectionNav variant="toolbar" />
          </Box>
        ) : null}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/reference" element={<ReferenceIndex />} />
          <Route path="/reference/band-plan" element={<BandPlan />} />
          <Route path="/reference/maidenhead" element={<MaidenheadConverter />} />
          <Route element={<RequireActiveProject />}>
            <Route path="/summary" element={<Summary />} />
            <Route path="/channels" element={<ChannelsList />} />
            <Route path="/channels/new" element={<ChannelEdit />} />
            <Route path="/channels/:id/edit" element={<ChannelEdit />} />
            <Route path="/channels/:id" element={<ChannelDetail />} />
            <Route path="/zones" element={<ZonesList />} />
            <Route path="/zones/new" element={<ZoneEdit />} />
            <Route path="/zones/:id/edit" element={<ZoneEdit />} />
            <Route path="/zones/:id" element={<ZoneDetail />} />
            <Route path="/talk-groups" element={<TalkGroupsList />} />
            <Route path="/talk-groups/new" element={<TalkGroupEdit />} />
            <Route path="/talk-groups/:id/edit" element={<TalkGroupEdit />} />
            <Route path="/talk-groups/:id" element={<TalkGroupDetail />} />
            <Route path="/contacts" element={<ContactsList />} />
            <Route path="/contacts/new" element={<ContactEdit />} />
            <Route path="/contacts/:id/edit" element={<ContactEdit />} />
            <Route path="/contacts/:id" element={<ContactDetail />} />
            <Route path="/rx-group-lists" element={<RxGroupListsList />} />
            <Route path="/rx-group-lists/new" element={<RxGroupListEdit />} />
            <Route path="/rx-group-lists/:id/edit" element={<RxGroupListEdit />} />
            <Route path="/rx-group-lists/:id" element={<RxGroupListDetail />} />
            <Route path="/export" element={<ImportExport />} />
            <Route path="/map" element={<Navigate to="/channels" replace />} />
          </Route>
        </Routes>
        <BuildFooter />
      </AppShell.Main>
    </AppShell>
  );
}
