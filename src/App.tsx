import { AppShell, Burger, Group, NavLink, Stack, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import ActiveProjectBar from './components/ActiveProjectBar/ActiveProjectBar.tsx';
import BuildFooter from './components/BuildFooter.tsx';
import Home from './routes/Home.tsx';
import Export from './routes/Export.tsx';
import Summary from './routes/Summary.tsx';
import ChannelsList from './routes/channels/list.tsx';
import ChannelDetail from './routes/channels/detail.tsx';
import ChannelEdit from './routes/channels/edit.tsx';
import ZonesList from './routes/zones/list.tsx';
import ZoneDetail from './routes/zones/detail.tsx';
import ZoneEdit from './routes/zones/edit.tsx';
import TalkGroupsList from './routes/TalkGroupsList.tsx';
import TalkGroupDetail from './routes/TalkGroupDetail.tsx';
import ContactsList from './routes/ContactsList.tsx';
import ContactDetail from './routes/ContactDetail.tsx';
import RxGroupListsList from './routes/RxGroupListsList.tsx';
import RxGroupListDetail from './routes/RxGroupListDetail.tsx';
import Settings from './routes/Settings.tsx';
import ReferenceIndex from './routes/reference/index.tsx';
import BandPlan from './routes/reference/band-plan.tsx';
import { useProjects } from './state/codeplugStore.tsx';

function navActive(pathname: string, path: string): boolean {
  if (path === '/') return pathname === '/';
  return pathname === path || pathname.startsWith(`${path}/`);
}

export default function App() {
  const [opened, { toggle, close }] = useDisclosure();
  const location = useLocation();
  const { activeProjectId } = useProjects();
  const showNav = activeProjectId != null;

  const navItems = [
    { to: '/summary', label: 'Summary' },
    { to: '/channels', label: 'Channels' },
    { to: '/zones', label: 'Zones' },
    { to: '/talk-groups', label: 'Talk groups' },
    { to: '/contacts', label: 'Contacts' },
    { to: '/rx-group-lists', label: 'RX Group Lists' },
    { to: '/export', label: 'Export' },
  ];

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={
        showNav
          ? {
              width: 260,
              breakpoint: 'sm',
              collapsed: { mobile: !opened },
            }
          : undefined
      }
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md">
          {showNav ? (
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
          ) : null}
          <Text fw={600}>MM9PDY Codeplug Tool</Text>
        </Group>
      </AppShell.Header>

      {showNav ? (
        <AppShell.Navbar p="md">
          <Stack gap="md" style={{ height: '100%' }}>
            <ActiveProjectBar />
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                component={Link}
                to={item.to}
                label={item.label}
                active={navActive(location.pathname, item.to)}
                onClick={close}
              />
            ))}
            <div style={{ flex: 1 }} />
            <NavLink
              component={Link}
              to="/reference"
              label="Reference"
              active={navActive(location.pathname, '/reference')}
              onClick={close}
            />
            <NavLink
              component={Link}
              to="/settings"
              label="Settings"
              active={navActive(location.pathname, '/settings')}
              onClick={close}
            />
          </Stack>
        </AppShell.Navbar>
      ) : null}

      <AppShell.Main>
        <Routes>
          <Route path="/" element={<Home />} />
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
          <Route path="/talk-groups/:id" element={<TalkGroupDetail />} />
          <Route path="/contacts" element={<ContactsList />} />
          <Route path="/contacts/:id" element={<ContactDetail />} />
          <Route path="/rx-group-lists" element={<RxGroupListsList />} />
          <Route path="/rx-group-lists/:id" element={<RxGroupListDetail />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/reference" element={<ReferenceIndex />} />
          <Route path="/reference/band-plan" element={<BandPlan />} />
          <Route path="/export" element={<Export />} />
          <Route path="/map" element={<Navigate to="/channels" replace />} />
        </Routes>
        <BuildFooter />
      </AppShell.Main>
    </AppShell>
  );
}
