import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { addChannel } from '../../lib/codeplugMutations.ts';
import { channelFieldDefaults } from '../../models/codeplug.ts';
import { newProject } from '../../models/codeplugProject.ts';
import { OperatorPositionProvider } from '../../state/operatorPosition.tsx';
import { theme } from '../../theme.ts';
import SummaryDashboard from './SummaryDashboard.tsx';

vi.mock('../CodeplugMap/CodeplugMap.tsx', () => ({
  default: () => <div data-testid="codeplug-map" />,
}));

function renderDashboard(project = newProject('Home repeaters')) {
  return render(
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <MemoryRouter>
        <OperatorPositionProvider>
          <SummaryDashboard project={project} codeplug={project.codeplug} />
        </OperatorPositionProvider>
      </MemoryRouter>
    </MantineProvider>,
  );
}

describe('SummaryDashboard', () => {
  it('uses the project name as the page title', () => {
    renderDashboard();
    expect(screen.getByRole('heading', { name: 'Home repeaters' })).toBeInTheDocument();
  });

  it('shows metadata and edit link when set', () => {
    const project = newProject('Trip');
    project.description = 'Aberdeen May 2026';
    project.author = 'MM9PDY';
    project.targetRadios = ['Baofeng 1701'];
    project.notes = 'Pending zone tidy';

    renderDashboard(project);

    expect(screen.getByText('Aberdeen May 2026')).toBeInTheDocument();
    expect(screen.getByText('By MM9PDY')).toBeInTheDocument();
    expect(screen.getByText('Baofeng 1701')).toBeInTheDocument();
    expect(screen.getByText('Pending zone tidy')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Edit project' })).toHaveAttribute(
      'href',
      '/summary/edit',
    );
  });

  it('shows empty map state when no geolocated channels', () => {
    renderDashboard();
    expect(screen.getByText('No geolocated channels')).toBeInTheDocument();
    expect(screen.queryByTestId('codeplug-map')).not.toBeInTheDocument();
  });

  it('embeds the map when channels have locations', () => {
    const project = newProject('Mapped');
    let codeplug = project.codeplug;
    codeplug = addChannel(codeplug, {
      ...channelFieldDefaults(),
      callsign: 'GB3SE',
      name: 'Edinburgh',
      mode: 'dmr',
      location: { lat: 56.5, lon: -4.0 },
      useLocation: true,
    });
    project.codeplug = codeplug;

    renderDashboard(project);
    expect(screen.getByTestId('codeplug-map')).toBeInTheDocument();
    expect(screen.getByText(/1 of 1 channel/)).toBeInTheDocument();
  });
});
