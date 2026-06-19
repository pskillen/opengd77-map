import { AppShell, Burger, Group, NavLink, Stack, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconAddressBook,
  IconAntenna,
  IconArrowsLeftRight,
  IconBook,
  IconFolders,
  IconHome,
  IconLayoutDashboard,
  IconListDetails,
  IconSettings,
  IconUsersGroup,
} from '@tabler/icons-react';
import type { TablerIcon } from '@tabler/icons-react';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import ActiveProjectBar from './components/ActiveProjectBar/ActiveProjectBar.tsx';
import RequireActiveProject from './components/RequireActiveProject/RequireActiveProject.tsx';
import BuildFooter from './components/BuildFooter.tsx';
import { ICON_SIZE_NAV, ICON_STROKE } from './lib/iconSizes.ts';
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

function navActive(pathname: string, path: string): boolean {
  if (path === '/') return pathname === '/';
  return pathname === path || pathname.startsWith(`${path}/`);
}

function navIcon(Icon: TablerIcon) {
  return <Icon size={ICON_SIZE_NAV} stroke={ICON_STROKE} />;
}

export default function App() {
  const [opened, { toggle, close }] = useDisclosure();
  const location = useLocation();
  const { activeProjectId } = useProjects();
  const hasActiveProject = activeProjectId != null;

  const navItems: { to: string; label: string; icon: TablerIcon }[] = [
    { to: '/summary', label: 'Summary', icon: IconLayoutDashboard },
    { to: '/channels', label: 'Channels', icon: IconAntenna },
    { to: '/zones', label: 'Zones', icon: IconFolders },
    { to: '/talk-groups', label: 'Talk groups', icon: IconUsersGroup },
    { to: '/contacts', label: 'Contacts', icon: IconAddressBook },
    { to: '/rx-group-lists', label: 'RX Group Lists', icon: IconListDetails },
    { to: '/export', label: 'Import & export', icon: IconArrowsLeftRight },
  ];

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={{
        width: 260,
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

      <AppShell.Navbar p="md">
        <Stack gap="md" style={{ height: '100%' }}>
          {hasActiveProject ? (
            <>
              <ActiveProjectBar />
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  component={Link}
                  to={item.to}
                  label={item.label}
                  leftSection={navIcon(item.icon)}
                  active={navActive(location.pathname, item.to)}
                  onClick={close}
                />
              ))}
            </>
          ) : (
            <NavLink
              component={Link}
              to="/"
              label="Home"
              leftSection={navIcon(IconHome)}
              active={navActive(location.pathname, '/')}
              onClick={close}
            />
          )}
          <div style={{ flex: 1 }} />
          <NavLink
            component={Link}
            to="/reference"
            label="Reference"
            leftSection={navIcon(IconBook)}
            active={navActive(location.pathname, '/reference')}
            onClick={close}
          />
          <NavLink
            component={Link}
            to="/settings"
            label="Settings"
            leftSection={navIcon(IconSettings)}
            active={navActive(location.pathname, '/settings')}
            onClick={close}
          />
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main>
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
