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
import {
  BANDWIDTH_KHZ_OPTIONS,
  frequencyHzToMhz,
  parseFrequencyHzFromMhzInput,
  percentLabel,
  POWER_PERCENT_OPTIONS,
  SQUELCH_PERCENT_OPTIONS,
  toneSelectOptions,
  type ChannelTimeslot,
  type ChannelTone,
} from '../../lib/channelFields/index.ts';
import { formatMhzNumber } from '../../lib/formatFrequency.ts';
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
  rxFrequencyMhz: string;
  txFrequencyMhz: string;
  bandwidthKHz: string;
  colourCode: string;
  timeslot: string;
  contactName: string;
  rxGroupListName: string;
  dmrId: string;
  rxTone: ChannelTone;
  txTone: ChannelTone;
  squelch: string;
  power: string;
  rxOnly: boolean;
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

function hzToMhzInput(hz: number | null): string {
  if (hz == null || hz <= 0) return '';
  const mhz = frequencyHzToMhz(hz);
  return mhz != null ? formatMhzNumber(mhz) : '';
}

function percentToSelectValue(value: number | null): string {
  return value == null ? 'default' : String(value);
}

function selectValueToPercent(value: string): number | null {
  if (!value || value === 'default') return null;
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : null;
}

function channelToForm(ch: Channel): ChannelFormValues {
  return {
    name: ch.name,
    mode: ch.mode,
    rxFrequencyMhz: hzToMhzInput(ch.rxFrequency),
    txFrequencyMhz: hzToMhzInput(ch.txFrequency),
    bandwidthKHz: ch.bandwidthKHz != null ? String(ch.bandwidthKHz) : '',
    colourCode: ch.colourCode != null ? String(ch.colourCode) : '',
    timeslot: ch.timeslot != null ? String(ch.timeslot) : '',
    contactName: ch.contactName,
    rxGroupListName: ch.rxGroupListName,
    dmrId: ch.dmrId != null ? String(ch.dmrId) : '',
    rxTone: ch.rxTone,
    txTone: ch.txTone,
    squelch: percentToSelectValue(ch.squelch),
    power: percentToSelectValue(ch.power),
    rxOnly: ch.rxOnly,
    aprsConfigName: ch.aprsConfigName,
    voxEnabled: ch.voxEnabled,
    transmitTimeout: ch.transmitTimeout != null ? String(ch.transmitTimeout) : '',
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
    rxFrequencyMhz: '',
    txFrequencyMhz: '',
    bandwidthKHz: '',
    colourCode: '',
    timeslot: '',
    contactName: defaults.contactName,
    rxGroupListName: defaults.rxGroupListName,
    dmrId: '',
    rxTone: defaults.rxTone,
    txTone: defaults.txTone,
    squelch: 'default',
    power: 'default',
    rxOnly: defaults.rxOnly,
    aprsConfigName: defaults.aprsConfigName,
    voxEnabled: defaults.voxEnabled,
    transmitTimeout: '',
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
  const tot = values.transmitTimeout.trim() ? parseInt(values.transmitTimeout, 10) : null;
  const colourCode = values.colourCode.trim() ? parseInt(values.colourCode, 10) : null;
  const timeslotRaw = values.timeslot.trim();
  const timeslot: ChannelTimeslot | null = timeslotRaw === '1' ? 1 : timeslotRaw === '2' ? 2 : null;
  const dmrId = values.dmrId.trim() ? parseInt(values.dmrId, 10) : null;
  const bandwidth = values.bandwidthKHz.trim() ? parseFloat(values.bandwidthKHz) : null;

  return {
    ...channelFieldDefaults(),
    name: values.name.trim(),
    mode: values.mode,
    rxFrequency: parseFrequencyHzFromMhzInput(values.rxFrequencyMhz),
    txFrequency: parseFrequencyHzFromMhzInput(values.txFrequencyMhz),
    bandwidthKHz: bandwidth != null && Number.isFinite(bandwidth) ? bandwidth : null,
    colourCode:
      colourCode != null && Number.isFinite(colourCode) && colourCode >= 0 && colourCode <= 15
        ? colourCode
        : null,
    timeslot,
    contactName: values.contactName,
    rxGroupListName: values.rxGroupListName,
    dmrId: dmrId != null && Number.isFinite(dmrId) && dmrId > 0 ? dmrId : null,
    rxTone: values.rxTone,
    txTone: values.txTone,
    squelch: selectValueToPercent(values.squelch),
    power: selectValueToPercent(values.power),
    rxOnly: values.rxOnly,
    aprsConfigName: values.aprsConfigName,
    voxEnabled: values.voxEnabled,
    transmitTimeout: tot != null && Number.isFinite(tot) && tot >= 0 ? tot : null,
    scanSkip: values.scanSkip,
    location: hasCoords ? { lat, lon } : null,
    useLocation: values.useLocation,
    hideFromMap: values.hideFromMap,
    opengd77Extras: {},
  };
}

const powerSelectData = POWER_PERCENT_OPTIONS.map((p) => ({
  value: percentToSelectValue(p),
  label: percentLabel(p),
}));

const squelchSelectData = SQUELCH_PERCENT_OPTIONS.map((p) => ({
  value: percentToSelectValue(p),
  label: p === 0 ? 'Open (0%)' : percentLabel(p),
}));

const bandwidthSelectData = [
  { value: '', label: '—' },
  ...BANDWIDTH_KHZ_OPTIONS.map((bw) => ({ value: String(bw), label: `${bw} kHz` })),
];

const timeslotSelectData = [
  { value: '', label: '—' },
  { value: '1', label: '1' },
  { value: '2', label: '2' },
];

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
        rxFrequency: parseFrequencyHzFromMhzInput(values.rxFrequencyMhz),
        txFrequency: parseFrequencyHzFromMhzInput(values.txFrequencyMhz),
        location: { lat, lon },
        useLocation: true,
        hideFromMap: false,
        opengd77Extras: {},
      },
    ];
  }, [
    values.lat,
    values.lon,
    values.name,
    values.mode,
    values.rxFrequencyMhz,
    values.txFrequencyMhz,
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

  const rxHz = parseFrequencyHzFromMhzInput(values.rxFrequencyMhz);
  const txHz = parseFrequencyHzFromMhzInput(values.txFrequencyMhz);
  const offset = rxHz != null && txHz != null ? frequencyOffsetMhz(rxHz, txHz) : null;

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
          </Stack>

          <Stack gap="sm" id={channelSectionAnchorId('RF')}>
            <Title order={4}>RF</Title>
            <Group grow>
              <TextInput
                label="RX MHz"
                value={values.rxFrequencyMhz}
                onChange={(e) => set('rxFrequencyMhz', e.currentTarget.value)}
              />
              <TextInput
                label="TX MHz"
                value={values.txFrequencyMhz}
                onChange={(e) => set('txFrequencyMhz', e.currentTarget.value)}
              />
            </Group>
            {offset !== null ? (
              <Text size="sm" c="dimmed">
                Offset: {formatOffsetMhz(offset)}
              </Text>
            ) : null}
            <BandPillsForFrequencies rxFrequency={rxHz} txFrequency={txHz} />
            <Select
              label="Bandwidth (kHz)"
              data={bandwidthSelectData}
              value={values.bandwidthKHz}
              onChange={(v) => set('bandwidthKHz', v ?? '')}
              clearable
            />
            <Select
              label="Power"
              data={powerSelectData}
              value={values.power}
              onChange={(v) => set('power', v ?? 'default')}
            />
            {showAnalogFields ? (
              <Group grow>
                <Select
                  label="RX tone"
                  data={toneSelectOptions()}
                  value={values.rxTone}
                  onChange={(v) => set('rxTone', (v ?? 'none') as ChannelTone)}
                  searchable
                />
                <Select
                  label="TX tone"
                  data={toneSelectOptions()}
                  value={values.txTone}
                  onChange={(v) => set('txTone', (v ?? 'none') as ChannelTone)}
                  searchable
                />
              </Group>
            ) : null}
            <Select
              label="Squelch"
              data={squelchSelectData}
              value={values.squelch}
              onChange={(v) => set('squelch', v ?? 'default')}
            />
            <Checkbox
              label="RX only"
              checked={values.rxOnly}
              onChange={(e) => set('rxOnly', e.currentTarget.checked)}
            />
          </Stack>

          {showDmrFields ? (
            <Stack gap="sm" id={channelSectionAnchorId('DMR')}>
              <Title order={4}>DMR</Title>
              <Group grow>
                <NumberInput
                  label="Colour code"
                  value={values.colourCode === '' ? undefined : parseInt(values.colourCode, 10)}
                  onChange={(v) => set('colourCode', v != null ? String(v) : '')}
                  min={0}
                  max={15}
                  allowDecimal={false}
                />
                <Select
                  label="Timeslot"
                  data={timeslotSelectData}
                  value={values.timeslot}
                  onChange={(v) => set('timeslot', v ?? '')}
                  clearable
                />
              </Group>
              <NumberInput
                label="DMR ID"
                value={values.dmrId === '' ? undefined : parseInt(values.dmrId, 10)}
                onChange={(v) => set('dmrId', v != null ? String(v) : '')}
                min={1}
                allowDecimal={false}
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
            <NumberInput
              label="Transmit timeout (seconds)"
              value={
                values.transmitTimeout === '' ? undefined : parseInt(values.transmitTimeout, 10)
              }
              onChange={(v) => set('transmitTimeout', v != null ? String(v) : '')}
              min={0}
              max={495}
              step={15}
              allowDecimal={false}
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
