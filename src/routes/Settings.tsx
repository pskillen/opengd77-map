import {
  Alert,
  Button,
  Container,
  Group,
  PasswordInput,
  Select,
  Stack,
  Text,
  Title,
} from '@mantine/core';
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
    <Container size="sm" py="md">
      <Stack gap="lg">
        <Stack gap="xs">
          <Title order={1}>Settings</Title>
          <Text c="dimmed">
            Map tile provider, Maidenhead grid overlay, and access token. Stored in browser
            localStorage only.
          </Text>
        </Stack>

        {tileConfig.fallback ? (
          <Alert color="yellow">
            Mapbox selected but no token set. Maps will use OpenStreetMap instead.
          </Alert>
        ) : null}

        <Stack gap="sm">
          <Title order={3}>Map tiles</Title>
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
        </Stack>

        <Stack gap="sm">
          <Title order={3}>Maidenhead grid</Title>
          <Select
            label="Grid overlay"
            description="Maximum Maidenhead resolution. Finer grid detail appears as you zoom in."
            data={[
              { value: 'off', label: 'Off (default)' },
              { value: '4', label: 'Up to 4 characters (~2° × 1°, e.g. IO85)' },
              { value: '6', label: 'Up to 6 characters (~5 km, e.g. IO85mm)' },
              // warning: dsiabled for now, performance poor, hangs browser when trying to render map
              // { value: '8', label: 'Up to 8 characters (~500 m, e.g. IO85mm12)' },
            ]}
            value={maidenheadGrid}
            onChange={(value) => {
              if (value) setMaidenheadGrid(value as MaidenheadGridMode);
            }}
          />
        </Stack>
      </Stack>
    </Container>
  );
}
