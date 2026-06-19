import { MantineProvider } from '@mantine/core';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { channelFieldDefaults, type Channel } from '../../models/codeplug.ts';
import { newProject } from '../../models/codeplugProject.ts';
import { CODEPLUG_STORAGE_KEY, serializeProjects } from '../../state/codeplugStorage.ts';
import { CodeplugProvider } from '../../state/codeplugStore.tsx';
import { theme } from '../../theme.ts';
import MaidenheadConverter from './maidenhead.tsx';

vi.mock('../../components/MapLocationPicker/MapLocationPicker.tsx', () => ({
  default: () => <div data-testid="map-location-picker" />,
}));

const originalGeolocation = navigator.geolocation;
const originalIsSecureContext = window.isSecureContext;

function mockGeolocationSuccess(lat: number, lon: number, accuracy = 12) {
  Object.defineProperty(window, 'isSecureContext', { value: true, configurable: true });
  Object.defineProperty(navigator, 'geolocation', {
    value: {
      getCurrentPosition: vi.fn((success: PositionCallback) => {
        success({
          coords: {
            latitude: lat,
            longitude: lon,
            accuracy,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
          },
          timestamp: Date.now(),
        });
      }),
    },
    configurable: true,
  });
}

function mockGeolocationDenied() {
  Object.defineProperty(window, 'isSecureContext', { value: true, configurable: true });
  Object.defineProperty(navigator, 'geolocation', {
    value: {
      getCurrentPosition: vi.fn((_success: PositionCallback, error: PositionErrorCallback) => {
        error({ code: 1, message: 'denied', PERMISSION_DENIED: 1 } as GeolocationPositionError);
      }),
    },
    configurable: true,
  });
}

function renderConverter(channels: Channel[] = []) {
  const project = newProject('Test');
  project.codeplug.channels = channels;
  localStorage.setItem(
    CODEPLUG_STORAGE_KEY,
    serializeProjects({ activeProjectId: project.id, projects: [project] }),
  );

  return render(
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <MemoryRouter>
        <CodeplugProvider>
          <MaidenheadConverter />
        </CodeplugProvider>
      </MemoryRouter>
    </MantineProvider>,
  );
}

describe('MaidenheadConverter', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'geolocation', {
      value: originalGeolocation,
      configurable: true,
    });
    Object.defineProperty(window, 'isSecureContext', {
      value: originalIsSecureContext,
      configurable: true,
    });
  });

  it('shows validation error for invalid locator', () => {
    renderConverter();
    const input = screen.getByLabelText('Maidenhead locator');
    fireEvent.change(input, { target: { value: 'IO8' } });
    expect(screen.getByText(/Invalid Maidenhead locator/)).toBeInTheDocument();
  });

  it('updates coordinates when a valid locator is entered', () => {
    renderConverter();
    const input = screen.getByLabelText('Maidenhead locator');
    fireEvent.change(input, { target: { value: 'IO85' } });
    expect(screen.getByLabelText('Latitude')).toHaveValue('55.5');
    expect(screen.getByLabelText('Longitude')).toHaveValue('-3');
  });

  it('renders channel lookup with apply disabled until a located channel is selected', () => {
    renderConverter();
    expect(screen.getByText('Channel lookup')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Name or callsign')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Use location' })).toBeDisabled();
  });

  it('enables use location when channel label is set after autocomplete selection', () => {
    renderConverter([
      {
        ...channelFieldDefaults(),
        id: 'ch-1',
        name: 'GB3HI',
        callsign: 'GB3HI',
        mode: 'digital',
        location: { lat: 55.86, lon: -4.25 },
        useLocation: true,
      },
    ]);

    fireEvent.change(screen.getByPlaceholderText('Name or callsign'), {
      target: { value: 'GB3HI' },
    });

    expect(screen.getByRole('button', { name: 'Use location' })).toBeEnabled();
  });

  it('populates coordinates when use my location succeeds', async () => {
    mockGeolocationSuccess(55.953252, -3.188267);
    renderConverter();
    fireEvent.click(screen.getByRole('button', { name: 'Use my location' }));
    await waitFor(() => {
      expect(screen.getByLabelText('Latitude')).toHaveValue('55.953252');
      expect(screen.getByLabelText('Longitude')).toHaveValue('-3.188267');
    });
  });

  it('shows error when use my location permission is denied', async () => {
    mockGeolocationDenied();
    renderConverter();
    fireEvent.click(screen.getByRole('button', { name: 'Use my location' }));
    await waitFor(() => {
      expect(screen.getByText('Location permission denied')).toBeInTheDocument();
    });
    const input = screen.getByLabelText('Maidenhead locator');
    fireEvent.change(input, { target: { value: 'IO85' } });
    expect(screen.getByLabelText('Latitude')).toHaveValue('55.5');
  });
});
