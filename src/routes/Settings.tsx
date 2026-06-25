import { Alert, Button, Group, PasswordInput, Select } from '@mantine/core';
import { Page, PageHeader, PageSection } from '../components/ui/index.ts';
import ExportNameSettingsFields from '../components/ExportNameSettingsFields/ExportNameSettingsFields.tsx';
import GoogleDriveSettingsSection from '../components/GoogleDriveSettingsSection/GoogleDriveSettingsSection.tsx';
import { useMapSettings } from '../hooks/useMapSettings.ts';
import type { MaidenheadGridMode } from '../lib/maidenheadGrid.ts';
import type { TileProvider } from '../lib/mapTiles.ts';

export default function Settings() {
  const {
    tileProvider,
    setTileProvider,
    mapboxToken,
    setMapboxToken,
    maidenheadGrid,
    setMaidenheadGrid,
    tileConfig,
    saveToken,
    clearToken,
  } = useMapSettings();

  return (
    <Page width="narrow">
      <PageHeader
        title="Settings"
        description="Map tile provider, Maidenhead grid overlay, and access token. Stored in browser localStorage only."
      />

      {tileConfig.fallback ? (
        <Alert color="yellow">
          Mapbox selected but no token set. Maps will use OpenStreetMap instead.
        </Alert>
      ) : null}

      <PageSection title="Map tiles" description="Base map layer for channel maps.">
        <Select
          label="Provider"
          data={[
            { value: 'osm', label: 'OpenStreetMap (default, no key)' },
            { value: 'mapbox', label: 'Mapbox streets' },
            { value: 'mapbox-sat', label: 'Mapbox satellite' },
          ]}
          value={tileProvider}
          onChange={(value) => {
            if (value) setTileProvider(value as TileProvider);
          }}
        />
        <PasswordInput
          label="Mapbox access token"
          placeholder="pk.… (saved in localStorage)"
          value={mapboxToken}
          onChange={(e) => setMapboxToken(e.currentTarget.value)}
          autoComplete="off"
        />
        <Group grow>
          <Button variant="default" onClick={saveToken}>
            Save token
          </Button>
          <Button variant="default" onClick={clearToken}>
            Clear
          </Button>
        </Group>
      </PageSection>

      <PageSection
        title="Maidenhead grid"
        description="Maximum Maidenhead resolution. Finer grid detail appears as you zoom in."
      >
        <Select
          label="Grid overlay"
          data={[
            { value: 'off', label: 'Off (default)' },
            { value: '4', label: 'Up to 4 characters (~2° × 1°, e.g. IO85)' },
            { value: '6', label: 'Up to 6 characters (~5 km, e.g. IO85mm)' },
          ]}
          value={maidenheadGrid}
          onChange={(value) => {
            if (value) setMaidenheadGrid(value as MaidenheadGridMode);
          }}
        />
      </PageSection>

      <GoogleDriveSettingsSection />

      <PageSection
        title="Export name shortening"
        description="Controls for abbreviating channel names at CPS export. Applies to OpenGD77, DM32, and CHIRP exports."
      >
        <ExportNameSettingsFields />
      </PageSection>
    </Page>
  );
}
