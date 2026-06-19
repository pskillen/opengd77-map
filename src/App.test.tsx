import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import App from './App.tsx';
import { newProject } from './models/codeplugProject.ts';
import { CODEPLUG_STORAGE_KEY, serializeProjects } from './state/codeplugStorage.ts';
import { CodeplugProvider } from './state/codeplugStore.tsx';
import { OperatorPositionProvider } from './state/operatorPosition.tsx';
import { theme } from './theme.ts';

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="map-container">{children}</div>
  ),
  TileLayer: () => null,
  Marker: () => null,
  Popup: () => null,
  Polygon: () => null,
  Polyline: () => null,
  Circle: () => null,
  Tooltip: () => null,
  useMap: () => ({
    fitBounds: vi.fn(),
    setView: vi.fn(),
    invalidateSize: vi.fn(),
    getContainer: () => {
      const parent = document.createElement('div');
      const container = document.createElement('div');
      parent.appendChild(container);
      return container;
    },
  }),
  useMapEvents: () => null,
}));

function renderApp(initialRoute = '/') {
  return render(
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <MemoryRouter initialEntries={[initialRoute]}>
        <OperatorPositionProvider>
          <CodeplugProvider>
            <App />
          </CodeplugProvider>
        </OperatorPositionProvider>
      </MemoryRouter>
    </MantineProvider>,
  );
}

function seedActiveProject() {
  const project = newProject('Test repeaters');
  localStorage.setItem(
    CODEPLUG_STORAGE_KEY,
    serializeProjects({ activeProjectId: project.id, projects: [project] }),
  );
}

describe('App', () => {
  it('renders the home heading and import section', () => {
    renderApp('/');
    expect(screen.getByRole('heading', { name: 'MM9PDY Codeplug Tool' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Import codeplug' })).toBeInTheDocument();
  });

  it('renders the summary page on /summary', () => {
    seedActiveProject();

    renderApp('/summary');

    expect(screen.getByRole('heading', { name: 'Summary' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Channels', level: 3 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Zones', level: 3 })).toBeInTheDocument();
  });

  it('shows app nav with active codeplug when a project is active', () => {
    seedActiveProject();

    renderApp('/summary');

    expect(screen.getByText('Active codeplug')).toBeInTheDocument();
    expect(screen.getByText('Test repeaters')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Summary' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Channels' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Reference' })).toBeInTheDocument();
  });

  it('renders the reference index on /reference', () => {
    seedActiveProject();

    renderApp('/reference');

    expect(screen.getByRole('heading', { name: 'Reference' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Band plan/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Maidenhead converter/ })).toBeInTheDocument();
  });

  it('renders the maidenhead converter on /reference/maidenhead', () => {
    seedActiveProject();

    renderApp('/reference/maidenhead');

    expect(screen.getByRole('heading', { name: 'Maidenhead converter' })).toBeInTheDocument();
    expect(screen.getByLabelText('Maidenhead locator')).toBeInTheDocument();
    expect(screen.getByLabelText('Address or postcode')).toBeInTheDocument();
  });

  it('renders the band plan page on /reference/band-plan', () => {
    seedActiveProject();

    renderApp('/reference/band-plan');

    expect(screen.getByRole('heading', { name: 'Band plan' })).toBeInTheDocument();
    expect(screen.getByText('2 m')).toBeInTheDocument();
    expect(
      screen.getByText(/For programming convenience only\. Not authoritative for on-air operation/),
    ).toBeInTheDocument();
  });

  it('redirects /map to /channels', () => {
    seedActiveProject();

    renderApp('/map');

    expect(screen.getByRole('heading', { name: 'Channels' })).toBeInTheDocument();
  });
});
