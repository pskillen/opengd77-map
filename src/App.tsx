import { AppShell, Burger, Group, NavLink, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Link, Route, Routes, useLocation } from 'react-router-dom';
import BuildFooter from './components/BuildFooter.tsx';
import Home from './routes/Home.tsx';
import Map from './routes/Map.tsx';

function App() {
  const [opened, { toggle, close }] = useDisclosure();
  const location = useLocation();

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={{
        width: 260,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding={location.pathname === '/map' ? 0 : 'md'}
    >
      <AppShell.Header>
        <Group h="100%" px="md">
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
          <Text fw={600}>opengd77-map</Text>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <NavLink
          component={Link}
          to="/"
          label="Home"
          active={location.pathname === '/'}
          onClick={close}
        />
        <NavLink
          component={Link}
          to="/map"
          label="Channel map"
          active={location.pathname === '/map'}
          onClick={close}
        />
      </AppShell.Navbar>

      <AppShell.Main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/map" element={<Map />} />
        </Routes>
        <BuildFooter />
      </AppShell.Main>
    </AppShell>
  );
}

export default App;
