import { Badge, NavLink, Stack } from '@mantine/core';
import { IconBook, IconBug, IconHome, IconSettings } from '@tabler/icons-react';
import { Link, useLocation } from 'react-router-dom';
import ActiveProjectBar from '../ActiveProjectBar/ActiveProjectBar.tsx';
import { ICON_SIZE_NAV, ICON_STROKE } from '../../lib/iconSizes.ts';
import { navActive } from '../../nav/navActive.ts';
import { projectNavItems } from '../../nav/primaryNavItems.ts';
import { useCodeplug, useProjects } from '../../state/codeplugStore.tsx';

export interface AppNavProps {
  onNavClick?: () => void;
}

function entityCountBadge(count: number | undefined) {
  if (count == null || count === 0) return undefined;
  return (
    <Badge variant="outline" color="gray" size="sm">
      {count}
    </Badge>
  );
}

export default function AppNav({ onNavClick }: AppNavProps) {
  const location = useLocation();
  const { activeProjectId } = useProjects();
  const { codeplug } = useCodeplug();
  const hasActiveProject = activeProjectId != null;

  return (
    <Stack gap="md" style={{ height: '100%' }}>
      {hasActiveProject ? (
        <>
          <ActiveProjectBar />
          {projectNavItems.map((item) => {
            const Icon = item.icon;
            const count = item.countKey ? codeplug[item.countKey].length : undefined;
            return (
              <NavLink
                key={item.to}
                component={Link}
                to={item.to}
                label={item.label}
                leftSection={<Icon size={ICON_SIZE_NAV} stroke={ICON_STROKE} />}
                rightSection={entityCountBadge(count)}
                active={navActive(location.pathname, item.to)}
                onClick={onNavClick}
              />
            );
          })}
        </>
      ) : (
        <NavLink
          component={Link}
          to="/"
          label="Home"
          leftSection={<IconHome size={ICON_SIZE_NAV} stroke={ICON_STROKE} />}
          active={navActive(location.pathname, '/')}
          onClick={onNavClick}
        />
      )}
      <div style={{ flex: 1 }} />
      <NavLink
        component={Link}
        to="/reference"
        label="Reference"
        leftSection={<IconBook size={ICON_SIZE_NAV} stroke={ICON_STROKE} />}
        active={navActive(location.pathname, '/reference')}
        onClick={onNavClick}
      />
      <NavLink
        component={Link}
        to="/debug"
        label="Debug"
        leftSection={<IconBug size={ICON_SIZE_NAV} stroke={ICON_STROKE} />}
        active={navActive(location.pathname, '/debug')}
        onClick={onNavClick}
      />
      <NavLink
        component={Link}
        to="/settings"
        label="Settings"
        leftSection={<IconSettings size={ICON_SIZE_NAV} stroke={ICON_STROKE} />}
        active={navActive(location.pathname, '/settings')}
        onClick={onNavClick}
      />
    </Stack>
  );
}
