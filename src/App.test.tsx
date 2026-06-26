import { MantineProvider } from '@mantine/core';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App.tsx';
import { addChannel } from './lib/codeplugMutations.ts';
import { channelFieldDefaults } from './models/codeplug.ts';
import { newProject } from './models/codeplugProject.ts';
import { CODEPLUG_STORAGE_KEY, serializeProjects } from './state/codeplugStorage.ts';
import { CodeplugProvider } from './state/codeplugStore.tsx';
import { OperatorPositionProvider } from './state/operatorPosition.tsx';
import { theme } from './theme.ts';
import { LIST_NAME_FILTER_DEBOUNCE_MS } from './hooks/useDebouncedNameFilter.ts';

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

function seedActiveProjectWithChannels() {
  const project = newProject('Test repeaters');
  let codeplug = project.codeplug;
  codeplug = addChannel(codeplug, {
    ...channelFieldDefaults(),
    callsign: 'GB3SE',
    name: 'Edinburgh',
    mode: 'dmr',
  });
  codeplug = addChannel(codeplug, {
    ...channelFieldDefaults(),
    callsign: 'GB3IV',
    name: 'Inverness',
    mode: 'dmr',
  });
  const withChannels = { ...project, codeplug };
  localStorage.setItem(
    CODEPLUG_STORAGE_KEY,
    serializeProjects({ activeProjectId: withChannels.id, projects: [withChannels] }),
  );
  return withChannels.codeplug.channels[0]!.id;
}

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('renders the home heading and import section', () => {
    renderApp('/');
    expect(screen.getByRole('heading', { name: 'MM9PDY Codeplug Tool' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Import codeplug' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Vendor format' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start fresh' })).toBeInTheDocument();
  });

  it('start fresh on home opens new codeplug form without persisting', () => {
    renderApp('/');

    fireEvent.click(screen.getByRole('button', { name: 'Start fresh' }));

    expect(screen.getByRole('heading', { name: 'New codeplug' })).toBeInTheDocument();
    expect(localStorage.getItem(CODEPLUG_STORAGE_KEY)).toBeNull();
  });

  it('shows minimal nav without an active project', () => {
    renderApp('/');

    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Reference' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Debug' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Summary' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Channels' })).not.toBeInTheDocument();
  });

  it('renders the debug index without an active project', () => {
    renderApp('/debug');

    expect(screen.getByRole('heading', { name: 'Debug' })).toBeInTheDocument();
    expect(screen.getByText(/view persisted keys and their JSON values/i)).toBeInTheDocument();
  });

  it('lists localStorage keys on the debug localStorage page', () => {
    renderApp('/debug/local-storage');

    expect(screen.getByRole('heading', { name: 'LocalStorage' })).toBeInTheDocument();
    expect(screen.getByText(CODEPLUG_STORAGE_KEY)).toBeInTheDocument();
  });

  it('renders codeplug JSON in the localStorage viewer', () => {
    seedActiveProject();

    renderApp(`/debug/local-storage/${encodeURIComponent(CODEPLUG_STORAGE_KEY)}`);

    expect(screen.getByRole('heading', { name: 'Codeplug projects' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Expand all' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Collapse to default' })).toBeInTheDocument();
    expect(screen.getByText('activeProjectId')).toBeInTheDocument();
  });

  it('renders the reference index without an active project', () => {
    renderApp('/reference');

    expect(screen.getByRole('heading', { name: 'Reference' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Band plan/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Maidenhead converter/ })).toBeInTheDocument();
  });

  it('redirects project routes to home without an active project', () => {
    renderApp('/channels');

    expect(screen.getByRole('heading', { name: 'Import codeplug' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Channels' })).not.toBeInTheDocument();
  });

  it('redirects /map to home without an active project', () => {
    renderApp('/map');

    expect(screen.getByRole('heading', { name: 'Import codeplug' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Channels' })).not.toBeInTheDocument();
  });

  it('renders the summary page on /summary', () => {
    seedActiveProject();

    renderApp('/summary');

    expect(screen.getByRole('heading', { name: 'Test repeaters' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Channels', level: 4 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Zones', level: 4 })).toBeInTheDocument();
    expect(screen.getByText('No geolocated channels')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Edit project' })).toBeInTheDocument();
  });

  it('renders the project edit page on /summary/edit', () => {
    seedActiveProject();

    renderApp('/summary/edit');

    expect(screen.getByRole('heading', { name: 'Edit project' })).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test repeaters')).toBeInTheDocument();
    expect(screen.getByText('Target radios')).toBeInTheDocument();
  });

  it('renders new codeplug form on /codeplug/new without an active project', () => {
    renderApp('/codeplug/new');

    expect(screen.getByRole('heading', { name: 'New codeplug' })).toBeInTheDocument();
    expect(screen.getByDisplayValue('Untitled codeplug')).toBeInTheDocument();
    expect(localStorage.getItem(CODEPLUG_STORAGE_KEY)).toBeNull();
  });

  it('cancel on new codeplug returns home without persisting', () => {
    renderApp('/codeplug/new');

    fireEvent.click(screen.getByRole('link', { name: 'Cancel' }));

    expect(screen.getByRole('heading', { name: 'MM9PDY Codeplug Tool' })).toBeInTheDocument();
    expect(localStorage.getItem(CODEPLUG_STORAGE_KEY)).toBeNull();
  });

  it('create on new codeplug persists project and opens summary', async () => {
    renderApp('/codeplug/new');

    const nameInput = screen.getByLabelText(/^Name/);
    fireEvent.change(nameInput, { target: { value: 'Scratch layout' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByRole('heading', { name: 'Scratch layout' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Channels', level: 4 })).toBeInTheDocument();
    expect(localStorage.getItem(CODEPLUG_STORAGE_KEY)).not.toBeNull();
  });

  it('shows app nav with active codeplug when a project is active', () => {
    seedActiveProject();

    renderApp('/summary');

    expect(screen.getByText('Active codeplug')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Test repeaters' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Summary' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Channels' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Reference' })).toBeInTheDocument();
  });

  it('renders the import and export page on /export', () => {
    seedActiveProject();

    renderApp('/export');

    expect(screen.getByRole('heading', { name: 'Import & export' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Import', level: 2 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Export', level: 2 })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Import & export' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /OpenGD77 CPS CSV/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /CHIRP CSV/i })).toBeInTheDocument();
    expect(screen.getByText('Coming soon')).toBeInTheDocument();
  });

  it('filters channels from secondary nav search', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      seedActiveProjectWithChannels();

      renderApp('/channels');

      expect(screen.getByRole('link', { name: 'Edinburgh' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Inverness' })).toBeInTheDocument();

      const searchFields = screen.getAllByLabelText('Search');
      fireEvent.change(searchFields[0], { target: { value: 'GB3SE' } });

      await act(async () => {
        vi.advanceTimersByTime(LIST_NAME_FILTER_DEBOUNCE_MS + 50);
      });

      expect(screen.getByRole('link', { name: 'Edinburgh' })).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'Inverness' })).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('shows New entity actions in secondary nav on list routes', () => {
    seedActiveProject();

    renderApp('/talk-groups');

    const newLinks = screen.getAllByRole('link', { name: 'New talk group' });
    expect(newLinks.some((link) => link.getAttribute('href') === '/talk-groups/new')).toBe(true);
    expect(within(document.body).queryByRole('button', { name: 'New talk group' })).toBeNull();
  });

  it('shows section scroll links on channel edit', () => {
    seedActiveProject();

    renderApp('/channels/new');

    expect(screen.getByRole('link', { name: 'Back to channels' })).toHaveAttribute(
      'href',
      '/channels',
    );
    expect(screen.getByRole('button', { name: 'Channel config' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'RF' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'DMR' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Sort')).not.toBeInTheDocument();
  });

  it('shows section scroll links on channel detail', () => {
    const channelId = seedActiveProjectWithChannels();

    renderApp(`/channels/${channelId}`);

    expect(screen.getByRole('link', { name: 'Back to channels' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Channel config' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Map' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Sort')).not.toBeInTheDocument();
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
