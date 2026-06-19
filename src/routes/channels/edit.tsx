import {
  Button,
  Checkbox,
  Group,
  NumberInput,
  Select,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { IconArrowLeft, IconDeviceFloppy } from '@tabler/icons-react';
import { useState, useMemo, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ReportPage from '../../components/report/ReportPage.tsx';
import CodeplugMap from '../../components/CodeplugMap/CodeplugMap.tsx';
import UseMyLocationButton from '../../components/UseMyLocationButton/UseMyLocationButton.tsx';
import { formatOffsetMhz, frequencyOffsetMhz } from '../../lib/bands.ts';
import { BandPillsForFrequencies } from '../../components/crud/BandPill.tsx';
import ChannelModeSelect from '../../components/crud/ChannelModeSegmentedControl.tsx';
import { isAnalogMode, isDmrMode } from '../../lib/channelModes.ts';
import { coordsToLocator, isValidLocator, locatorToCoords } from '../../lib/maidenhead.ts';
import { channelSectionAnchorId } from '../../lib/channelPageSections.ts';
import { ICON_SIZE_NAV, ICON_STROKE } from '../../lib/iconSizes.ts';
import { hasValidationErrors, validateChannel } from '../../lib/validation/channel.ts';
import { channelFieldDefaults, type Channel, type ChannelMode } from '../../models/codeplug.ts';
import { findEntityById } from '../../lib/reportLookup.ts';
import { useCodeplug } from '../../state/codeplugStore.tsx';

type ChannelFormValues = {
  name: string;
  mode: ChannelMode;
  number: string;
  rxFrequency: string;
  txFrequency: string;
  bandwidthKHz: string;
  colourCode: string;
  timeslot: string;
  contactName: string;
  rxGroupListName: string;
  dmrId: string;
  rxTone: string;
  txTone: string;
  squelch: string;
  power: string;
  rxOnly: string;
  aprsConfigName: string;
  voxEnabled: boolean;
  transmitTimeout: string;
  scanSkip: boolean;
  lat: string;
  lon: string;
  useLocation: boolean;
  hideFromMap: boolean;
  locator: string;
};

function channelToForm(ch: Channel): ChannelFormValues {
  return {
    name: ch.name,
    mode: ch.mode,
    number: ch.number,
    rxFrequency: ch.rxFrequency,
    txFrequency: ch.txFrequency,
    bandwidthKHz: ch.bandwidthKHz,
    colourCode: ch.colourCode,
    timeslot: ch.timeslot,
    contactName: ch.contactName,
    rxGroupListName: ch.rxGroupListName,
    dmrId: ch.dmrId,
    rxTone: ch.rxTone,
    txTone: ch.txTone,
    squelch: ch.squelch,
    power: ch.power,
    rxOnly: ch.rxOnly,
    aprsConfigName: ch.aprsConfigName,
    voxEnabled: ch.voxEnabled,
    transmitTimeout: ch.transmitTimeout,
    scanSkip: ch.scanSkip,
    lat: ch.location?.lat != null ? String(ch.location.lat) : '',
    lon: ch.location?.lon != null ? String(ch.location.lon) : '',
    useLocation: ch.useLocation,
    hideFromMap: ch.hideFromMap,
    locator:
      ch.location && ch.useLocation ? coordsToLocator(ch.location.lat, ch.location.lon, 6) : '',
  };
}

function emptyForm(): ChannelFormValues {
  const defaults = channelFieldDefaults();
  return {
    name: '',
    mode: 'dmr',
    number: '',
    rxFrequency: '',
    txFrequency: '',
    bandwidthKHz: defaults.bandwidthKHz,
    colourCode: defaults.colourCode,
    timeslot: defaults.timeslot,
    contactName: defaults.contactName,
    rxGroupListName: defaults.rxGroupListName,
    dmrId: defaults.dmrId,
    rxTone: defaults.rxTone,
    txTone: defaults.txTone,
    squelch: defaults.squelch,
    power: defaults.power,
    rxOnly: defaults.rxOnly,
    aprsConfigName: defaults.aprsConfigName,
    voxEnabled: defaults.voxEnabled,
    transmitTimeout: defaults.transmitTimeout,
    scanSkip: defaults.scanSkip,
    lat: '',
    lon: '',
    useLocation: defaults.useLocation,
    hideFromMap: defaults.hideFromMap,
    locator: '',
  };
}

function formToChannelInput(values: ChannelFormValues): Omit<Channel, 'id' | 'callsign'> {
  const lat = parseFloat(values.lat);
  const lon = parseFloat(values.lon);
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lon);

  return {
    ...channelFieldDefaults(),
    name: values.name.trim(),
    mode: values.mode,
    number: values.number,
    rxFrequency: values.rxFrequency.trim(),
    txFrequency: values.txFrequency.trim(),
    bandwidthKHz: values.bandwidthKHz,
    colourCode: values.colourCode,
    timeslot: values.timeslot,
    contactName: values.contactName,
    rxGroupListName: values.rxGroupListName,
    dmrId: values.dmrId,
    rxTone: values.rxTone,
    txTone: values.txTone,
    squelch: values.squelch,
    power: values.power,
    rxOnly: values.rxOnly,
    aprsConfigName: values.aprsConfigName,
    voxEnabled: values.voxEnabled,
    transmitTimeout: values.transmitTimeout,
    scanSkip: values.scanSkip,
    location: hasCoords ? { lat, lon } : null,
    useLocation: values.useLocation,
    hideFromMap: values.hideFromMap,
    vendorExtras: {},
  };
}

export default function ChannelEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { codeplug, addChannel, updateChannel } = useCodeplug();
  const isNew = id === undefined;
  const existing = !isNew && id ? findEntityById(codeplug.channels, id) : null;

  const [values, setValues] = useState<ChannelFormValues>(() =>
    existing ? channelToForm(existing) : emptyForm(),
  );
  const [formError, setFormError] = useState<string | null>(null);

  const mapPreviewChannels = useMemo((): Channel[] => {
    const lat = parseFloat(values.lat);
    const lon = parseFloat(values.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return [];

    return [
      {
        ...channelFieldDefaults(),
        id: existing?.id ?? '__preview__',
        name: values.name.trim() || 'New channel',
        callsign: existing?.callsign ?? '',
        mode: values.mode,
        number: values.number,
        rxFrequency: values.rxFrequency,
        txFrequency: values.txFrequency,
        location: { lat, lon },
        useLocation: true,
        hideFromMap: false,
        vendorExtras: {},
      },
    ];
  }, [
    values.lat,
    values.lon,
    values.name,
    values.mode,
    values.number,
    values.rxFrequency,
    values.txFrequency,
    existing,
  ]);

  if (!isNew && !existing) {
    return (
      <ReportPage title="Edit channel">
        <Text>Channel not found.</Text>
        <Button component={Link} to="/channels" mt="md" variant="light">
          Back to channels
        </Button>
      </ReportPage>
    );
  }

  const set = <K extends keyof ChannelFormValues>(key: K, value: ChannelFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const contactOptions = [
    { value: '', label: 'None' },
    ...codeplug.contacts.map((c) => ({ value: c.name, label: c.name })),
    ...codeplug.talkGroups.map((tg) => ({ value: tg.name, label: `${tg.name} (group)` })),
  ];

  const rglOptions = [
    { value: '', label: 'None' },
    ...codeplug.rxGroupLists.map((r) => ({ value: r.name, label: r.name })),
  ];

  const offset =
    values.rxFrequency && values.txFrequency
      ? frequencyOffsetMhz(values.rxFrequency, values.txFrequency)
      : null;

  const applyLocator = (loc: string) => {
    set('locator', loc);
    if (!loc.trim()) return;
    if (!isValidLocator(loc)) return;
    const coords = locatorToCoords(loc);
    if (coords) {
      setValues((prev) => ({
        ...prev,
        locator: loc.toUpperCase(),
        lat: String(coords.lat),
        lon: String(coords.lon),
        useLocation: true,
      }));
    }
  };

  const applyCoords = (lat: number, lon: number) => {
    setValues((prev) => ({
      ...prev,
      lat: String(lat),
      lon: String(lon),
      locator: coordsToLocator(lat, lon, 6),
      useLocation: true,
    }));
  };

  const clearPosition = () => {
    setValues((prev) => ({
      ...prev,
      lat: '',
      lon: '',
      locator: '',
      useLocation: false,
    }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const input = formToChannelInput(values);
    const issues = validateChannel(input, codeplug, existing?.id);
    if (hasValidationErrors(issues)) {
      setFormError(issues.find((i) => i.severity === 'error')?.message ?? 'Validation failed');
      return;
    }

    if (isNew) {
      addChannel(input);
      navigate('/channels');
    } else if (existing) {
      updateChannel(existing.id, input);
      navigate(`/channels/${existing.id}`);
    }
  };

  const showAnalogFields = isAnalogMode(values.mode);
  const showDmrFields = isDmrMode(values.mode);

  return (
    <ReportPage title={isNew ? 'New channel' : `Edit ${existing?.name ?? 'channel'}`}>
      <form onSubmit={handleSubmit}>
        <Stack gap="lg">
          <Button
            component={Link}
            to={isNew ? '/channels' : `/channels/${existing?.id}`}
            variant="subtle"
            size="compact-sm"
            style={{ alignSelf: 'flex-start' }}
            leftSection={<IconArrowLeft size={ICON_SIZE_NAV} stroke={ICON_STROKE} />}
          >
            Back
          </Button>

          {formError ? (
            <Text c="red" size="sm">
              {formError}
            </Text>
          ) : null}

          <Stack gap="sm" id={channelSectionAnchorId('Identity')}>
            <Title order={4}>Identity</Title>
            <TextInput
              label="Name"
              required
              value={values.name}
              onChange={(e) => set('name', e.currentTarget.value)}
            />
            <ChannelModeSelect value={values.mode} onChange={(mode) => set('mode', mode)} />
            <TextInput
              label="Channel number"
              value={values.number}
              onChange={(e) => set('number', e.currentTarget.value)}
            />
          </Stack>

          <Stack gap="sm" id={channelSectionAnchorId('RF')}>
            <Title order={4}>RF</Title>
            <Group grow>
              <TextInput
                label="RX MHz"
                value={values.rxFrequency}
                onChange={(e) => set('rxFrequency', e.currentTarget.value)}
              />
              <TextInput
                label="TX MHz"
                value={values.txFrequency}
                onChange={(e) => set('txFrequency', e.currentTarget.value)}
              />
            </Group>
            {offset !== null ? (
              <Text size="sm" c="dimmed">
                Offset: {formatOffsetMhz(offset)}
              </Text>
            ) : null}
            <BandPillsForFrequencies
              rxFrequency={values.rxFrequency}
              txFrequency={values.txFrequency}
            />
            <TextInput
              label="Bandwidth (kHz)"
              value={values.bandwidthKHz}
              onChange={(e) => set('bandwidthKHz', e.currentTarget.value)}
            />
            <TextInput
              label="Power"
              value={values.power}
              onChange={(e) => set('power', e.currentTarget.value)}
            />
            {showAnalogFields ? (
              <Group grow>
                <TextInput
                  label="RX tone"
                  value={values.rxTone}
                  onChange={(e) => set('rxTone', e.currentTarget.value)}
                />
                <TextInput
                  label="TX tone"
                  value={values.txTone}
                  onChange={(e) => set('txTone', e.currentTarget.value)}
                />
              </Group>
            ) : null}
            <TextInput
              label="Squelch"
              value={values.squelch}
              onChange={(e) => set('squelch', e.currentTarget.value)}
            />
            <TextInput
              label="RX only"
              value={values.rxOnly}
              onChange={(e) => set('rxOnly', e.currentTarget.value)}
            />
          </Stack>

          {showDmrFields ? (
            <Stack gap="sm" id={channelSectionAnchorId('DMR')}>
              <Title order={4}>DMR</Title>
              <Group grow>
                <TextInput
                  label="Colour code"
                  value={values.colourCode}
                  onChange={(e) => set('colourCode', e.currentTarget.value)}
                />
                <TextInput
                  label="Timeslot"
                  value={values.timeslot}
                  onChange={(e) => set('timeslot', e.currentTarget.value)}
                />
              </Group>
              <TextInput
                label="DMR ID"
                value={values.dmrId}
                onChange={(e) => set('dmrId', e.currentTarget.value)}
              />
              <Select
                label="TX contact"
                data={contactOptions}
                value={values.contactName || ''}
                onChange={(v) => set('contactName', v ?? '')}
                searchable
                clearable
              />
              <Select
                label="RX group list"
                data={rglOptions}
                value={values.rxGroupListName || ''}
                onChange={(v) => set('rxGroupListName', v ?? '')}
                searchable
                clearable
              />
            </Stack>
          ) : null}

          <Stack gap="sm" id={channelSectionAnchorId('Location')}>
            <Title order={4}>Location</Title>
            <TextInput
              label="Maidenhead locator"
              value={values.locator}
              onChange={(e) => set('locator', e.currentTarget.value)}
              onBlur={(e) => applyLocator(e.currentTarget.value)}
            />
            <Group grow>
              <NumberInput
                label="Latitude"
                value={values.lat}
                onChange={(v) => {
                  const lat = String(v ?? '');
                  set('lat', lat);
                  const lon = parseFloat(values.lon);
                  const latN = parseFloat(lat);
                  if (Number.isFinite(latN) && Number.isFinite(lon)) {
                    set('locator', coordsToLocator(latN, lon, 6));
                  }
                }}
                decimalScale={6}
              />
              <NumberInput
                label="Longitude"
                value={values.lon}
                onChange={(v) => {
                  const lon = String(v ?? '');
                  set('lon', lon);
                  const lat = parseFloat(values.lat);
                  const lonN = parseFloat(lon);
                  if (Number.isFinite(lat) && Number.isFinite(lonN)) {
                    set('locator', coordsToLocator(lat, lonN, 6));
                  }
                }}
                decimalScale={6}
              />
            </Group>
            <Checkbox
              label="Use Location"
              checked={values.useLocation}
              onChange={(e) => set('useLocation', e.currentTarget.checked)}
            />
            <Checkbox
              label="Hide from map"
              checked={values.hideFromMap}
              onChange={(e) => set('hideFromMap', e.currentTarget.checked)}
            />
            <Group justify="space-between" align="flex-end">
              <UseMyLocationButton onLocation={applyCoords} />
              <Group gap="xs" align="flex-end">
                <Text size="xs" c="dimmed">
                  Click the map to set coordinates.
                </Text>
                <Button type="button" variant="subtle" size="compact-sm" onClick={clearPosition}>
                  Clear position
                </Button>
              </Group>
            </Group>
            <CodeplugMap
              channels={mapPreviewChannels}
              height={240}
              compactMode
              showControls={false}
              defaultShowZones={false}
              onLocationPick={applyCoords}
            />
          </Stack>

          <Stack gap="sm" id={channelSectionAnchorId('Scan / APRS')}>
            <Title order={4}>Scan / APRS</Title>
            <TextInput
              label="APRS config"
              value={values.aprsConfigName}
              onChange={(e) => set('aprsConfigName', e.currentTarget.value)}
            />
            <TextInput
              label="Transmit timeout"
              value={values.transmitTimeout}
              onChange={(e) => set('transmitTimeout', e.currentTarget.value)}
            />
            <Checkbox
              label="Scan skip"
              checked={values.scanSkip}
              onChange={(e) => set('scanSkip', e.currentTarget.checked)}
            />
            <Checkbox
              label="VOX"
              checked={values.voxEnabled}
              onChange={(e) => set('voxEnabled', e.currentTarget.checked)}
            />
          </Stack>

          <Group>
            <Button
              type="submit"
              leftSection={<IconDeviceFloppy size={ICON_SIZE_NAV} stroke={ICON_STROKE} />}
            >
              Save
            </Button>
            <Button
              variant="default"
              component={Link}
              to={isNew ? '/channels' : `/channels/${existing?.id}`}
            >
              Cancel
            </Button>
          </Group>
        </Stack>
      </form>
    </ReportPage>
  );
}
