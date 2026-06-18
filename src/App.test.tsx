import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import App from './App.tsx';
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
}));

function renderApp(initialRoute = '/') {
  return render(
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <MemoryRouter initialEntries={[initialRoute]}>
        <App />
      </MemoryRouter>
    </MantineProvider>,
  );
}

describe('App', () => {
  it('renders the home heading', () => {
    renderApp('/');
    expect(screen.getByRole('heading', { name: 'opengd77-map' })).toBeInTheDocument();
  });

  it('renders the channel map sidebar on /map', () => {
    renderApp('/map');
    expect(screen.getByRole('heading', { name: 'OpenGD77 channel map' })).toBeInTheDocument();
    expect(screen.getByText('Channels.csv', { selector: 'strong' })).toBeInTheDocument();
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
  });
});
