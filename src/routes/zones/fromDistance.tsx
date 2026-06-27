import {
  Alert,
  Anchor,
  Button,
  Group,
  NumberInput,
  SegmentedControl,
  Slider,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CodeplugMap from '../../components/CodeplugMap/CodeplugMap.tsx';
import { BandPillForChannel } from '../../components/crud/BandPill.tsx';
import ModePill from '../../components/crud/ModePill.tsx';
import UseMyLocationButton from '../../components/UseMyLocationButton/UseMyLocationButton.tsx';
import { DataTable, FormPage } from '../../components/ui/index.ts';
import { defaultMaxDistanceKm } from '../../hooks/channelListQueryUtils.ts';
import { useMapSettings } from '../../hooks/useMapSettings.ts';
import { resolveChannelModeProfiles } from '../../lib/channelExpansion/index.ts';
import { DISTANCE_FILTER_MARKS_KM } from '../../lib/channels.ts';
import { GeocodeError, geocodeQuery } from '../../lib/geocode.ts';
import { formatDistanceM } from '../../lib/geoDistance.ts';
import { ICON_SIZE_NAV, ICON_STROKE } from '../../lib/iconSizes.ts';
import { coordsToLocator, isValidLocator, locatorToCoords } from '../../lib/maidenhead.ts';
import {
  channelsInRange,
  countUnlocatedChannels,
  defaultZoneFromDistanceName,
  type SearchCentre,
} from '../../lib/zonesFromDistance.ts';
import { membersFromChannelIds } from '../../lib/zones.ts';
import type { Channel } from '../../models/codeplug.ts';
import { useCodeplug } from '../../state/codeplugStore.tsx';

type CentreMode = 'coordinates' | 'locator' | 'address' | 'myLocation';

const distanceFilterMarks = DISTANCE_FILTER_MARKS_KM.map((km) => ({
  value: km,
  label: `${km}`,
}));

export default function ZoneFromDistance() {
  const navigate = useNavigate();
  const { codeplug, addZone } = useCodeplug();
  const { mapboxToken } = useMapSettings();
  const { channels, zones, talkGroups, contacts, rxGroupLists } = codeplug;

  const [centreMode, setCentreMode] = useState<CentreMode>('locator');
  const [centre, setCentre] = useState<SearchCentre | null>(null);
  const [latInput, setLatInput] = useState('');
  const [lonInput, setLonInput] = useState('');
  const [locatorInput, setLocatorInput] = useState('');
  const [addressInput, setAddressInput] = useState('');
  const [centreError, setCentreError] = useState<string | null>(null);
  const [maxDistanceKm, setMaxDistanceKm] = useState(defaultMaxDistanceKm());

  const unlocatedCount = useMemo(() => countUnlocatedChannels(channels), [channels]);

  const inRange = useMemo(() => {
    if (!centre) return [];
    return channelsInRange(channels, centre, maxDistanceKm);
  }, [channels, centre, maxDistanceKm]);

  const inRangeIds = useMemo(() => inRange.map((r) => r.channel.id).join(','), [inRange]);

  const [rangeSelectionKey, setRangeSelectionKey] = useState(inRangeIds);
  const [selectedKeys, setSelectedKeys] = useState<string[]>(() =>
    inRange.map((r) => r.channel.id),
  );
  if (rangeSelectionKey !== inRangeIds) {
    setRangeSelectionKey(inRangeIds);
    setSelectedKeys(inRange.map((r) => r.channel.id));
  }

  const [zoneName, setZoneName] = useState('');
  const [zoneNameTouched, setZoneNameTouched] = useState(false);
  const zoneNameKey = centre ? `${centre.lat},${centre.lon},${maxDistanceKm}` : '';
  const [appliedZoneNameKey, setAppliedZoneNameKey] = useState(zoneNameKey);
  if (!zoneNameTouched && centre && appliedZoneNameKey !== zoneNameKey) {
    setAppliedZoneNameKey(zoneNameKey);
    setZoneName(defaultZoneFromDistanceName(maxDistanceKm, centre));
  }

  const mapChannels = useMemo(() => inRange.map((r) => r.channel), [inRange]);

  const applyCoordinates = () => {
    const lat = Number.parseFloat(latInput);
    const lon = Number.parseFloat(lonInput);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      setCentreError('Enter valid latitude and longitude.');
      return;
    }
    setCentreError(null);
    setCentre({ lat, lon, label: coordsToLocator(lat, lon, 4) });
  };

  const applyLocator = () => {
    const loc = locatorInput.trim();
    if (!isValidLocator(loc)) {
      setCentreError('Enter a valid 4- or 6-character Maidenhead locator.');
      return;
    }
    const coords = locatorToCoords(loc);
    if (!coords) {
      setCentreError('Could not resolve locator coordinates.');
      return;
    }
    setCentreError(null);
    setCentre({
      lat: coords.lat,
      lon: coords.lon,
      label: loc.toUpperCase(),
    });
  };

  const applyAddress = async () => {
    const query = addressInput.trim();
    if (!query) {
      setCentreError('Enter an address or postcode.');
      return;
    }
    try {
      const result = await geocodeQuery(query, {
        mapboxToken: mapboxToken.trim() || undefined,
      });
      if (!result) {
        setCentreError('No location found for that address.');
        return;
      }
      setCentreError(null);
      setCentre({
        lat: result.lat,
        lon: result.lon,
        label: result.label,
      });
    } catch (err) {
      setCentreError(err instanceof GeocodeError ? err.message : 'Geocoding failed.');
    }
  };

  const handleCreateZone = () => {
    const name = zoneName.trim();
    if (!name || !selectedKeys.length) return;
    const newId = addZone({
      name,
      members: membersFromChannelIds(selectedKeys),
    });
    if (newId) navigate(`/zones/${newId}`);
  };

  return (
    <FormPage title="Zone from distance">
      <Stack gap="lg">
        <Anchor component={Link} to="/zones" size="sm">
          <Group gap={4} wrap="nowrap">
            <IconArrowLeft size={ICON_SIZE_NAV} stroke={ICON_STROKE} />
            Zones
          </Group>
        </Anchor>

        <Stack gap="sm">
          <Title order={3}>Search centre</Title>
          <SegmentedControl
            value={centreMode}
            onChange={(value) => setCentreMode(value as CentreMode)}
            data={[
              { label: 'Locator', value: 'locator' },
              { label: 'Coordinates', value: 'coordinates' },
              { label: 'Address', value: 'address' },
              { label: 'My location', value: 'myLocation' },
            ]}
          />

          {centreMode === 'coordinates' ? (
            <Group align="flex-end" grow>
              <NumberInput
                label="Latitude"
                value={latInput}
                onChange={(v) => setLatInput(String(v))}
                decimalScale={6}
              />
              <NumberInput
                label="Longitude"
                value={lonInput}
                onChange={(v) => setLonInput(String(v))}
                decimalScale={6}
              />
              <Button onClick={applyCoordinates}>Set centre</Button>
            </Group>
          ) : null}

          {centreMode === 'locator' ? (
            <Group align="flex-end" grow>
              <TextInput
                label="Maidenhead locator"
                placeholder="e.g. IO92pp"
                value={locatorInput}
                onChange={(e) => setLocatorInput(e.currentTarget.value)}
              />
              <Button onClick={applyLocator}>Set centre</Button>
            </Group>
          ) : null}

          {centreMode === 'address' ? (
            <Group align="flex-end" grow>
              <TextInput
                label="Address or postcode"
                placeholder="e.g. LS1 1UR or Derby"
                value={addressInput}
                onChange={(e) => setAddressInput(e.currentTarget.value)}
              />
              <Button onClick={() => void applyAddress()}>Geocode</Button>
            </Group>
          ) : null}

          {centreMode === 'myLocation' ? (
            <UseMyLocationButton
              label="Use my location as centre"
              onLocation={(lat, lon) => {
                setCentreError(null);
                setCentre({
                  lat,
                  lon,
                  label: coordsToLocator(lat, lon, 4),
                });
              }}
            />
          ) : null}

          {centreError ? (
            <Alert color="red" title="Centre">
              {centreError}
            </Alert>
          ) : null}

          {centre ? (
            <Text size="sm" c="dimmed">
              Centre: {centre.label} ({centre.lat.toFixed(5)}, {centre.lon.toFixed(5)})
            </Text>
          ) : (
            <Text size="sm" c="dimmed">
              Set a search centre to list channels within range.
            </Text>
          )}
        </Stack>

        <Stack gap="xs">
          <Text size="sm" fw={500}>
            Within {maxDistanceKm} km
            {centre ? ` — ${inRange.length} channel${inRange.length === 1 ? '' : 's'}` : ''}
          </Text>
          <Slider
            value={maxDistanceKm}
            onChange={setMaxDistanceKm}
            min={DISTANCE_FILTER_MARKS_KM[0]}
            max={DISTANCE_FILTER_MARKS_KM[DISTANCE_FILTER_MARKS_KM.length - 1]}
            marks={distanceFilterMarks}
            restrictToMarks
            label={(value) => `${value} km`}
            disabled={!centre}
          />
        </Stack>

        {unlocatedCount > 0 ? (
          <Text size="sm" c="dimmed">
            {unlocatedCount} channel{unlocatedCount === 1 ? '' : 's'} excluded (no usable
            coordinates).
          </Text>
        ) : null}

        {centre ? (
          <>
            <DataTable
              variant="embedded"
              rows={inRange.map((r) => r.channel)}
              rowKey={(ch) => ch.id}
              selectable
              selectedKeys={selectedKeys}
              onSelectedKeysChange={setSelectedKeys}
              callsignColumn={{
                getName: (ch: Channel) => ch.callsign || '—',
                sortValue: (ch: Channel) => ch.callsign || '',
              }}
              nameColumn={{
                getName: (ch: Channel) => ch.name || '—',
                getPath: (ch: Channel) => `/channels/${ch.id}`,
              }}
              columns={[
                {
                  key: 'band',
                  header: 'Band',
                  render: (ch: Channel) => <BandPillForChannel channel={ch} />,
                  sortValue: (ch: Channel) => ch.rxFrequency ?? 0,
                },
                {
                  key: 'mode',
                  header: 'Mode',
                  render: (ch: Channel) =>
                    ch.multiMode ? (
                      <Group gap={4}>
                        {resolveChannelModeProfiles(ch).map((p) => (
                          <ModePill key={p.mode} mode={p.mode} size="xs" />
                        ))}
                      </Group>
                    ) : (
                      <ModePill mode={ch.mode} />
                    ),
                  sortValue: (ch: Channel) => ch.mode,
                },
                {
                  key: 'distance',
                  header: 'Distance',
                  render: (ch: Channel) => {
                    const row = inRange.find((r) => r.channel.id === ch.id);
                    return row ? formatDistanceM(row.distanceM) : '—';
                  },
                  sortValue: (ch: Channel) =>
                    inRange.find((r) => r.channel.id === ch.id)?.distanceM ?? 0,
                },
              ]}
            />

            <CodeplugMap
              channels={mapChannels}
              zones={zones}
              allChannels={channels}
              talkGroups={talkGroups}
              contacts={contacts}
              rxGroupLists={rxGroupLists}
              referencePosition={centre}
              referenceLabel="Search centre"
              defaultShowZones={false}
              height={360}
            />

            <Stack gap="sm">
              <TextInput
                label="Zone name"
                value={zoneName}
                onChange={(e) => {
                  setZoneNameTouched(true);
                  setZoneName(e.currentTarget.value);
                }}
              />
              <Group>
                <Button
                  onClick={handleCreateZone}
                  disabled={!zoneName.trim() || selectedKeys.length === 0}
                >
                  Create zone ({selectedKeys.length} channel
                  {selectedKeys.length === 1 ? '' : 's'})
                </Button>
              </Group>
            </Stack>
          </>
        ) : null}
      </Stack>
    </FormPage>
  );
}
