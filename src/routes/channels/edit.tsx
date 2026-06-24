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
import { FormPage, PercentLevelSlider } from '../../components/ui/index.ts';
import CodeplugMap from '../../components/CodeplugMap/CodeplugMap.tsx';
import UseMyLocationButton from '../../components/UseMyLocationButton/UseMyLocationButton.tsx';
import {
  BANDWIDTH_KHZ_OPTIONS,
  frequencyHzToMhz,
  parseFrequencyHzFromMhzInput,
  toneSelectOptions,
  type ChannelTimeslot,
  type ChannelTone,
} from '../../lib/channelFields/index.ts';
import { formatMhzNumber } from '../../lib/formatFrequency.ts';
import { formatOffsetMhz, frequencyOffsetMhz } from '../../lib/bands.ts';
import { BandPillsForFrequencies } from '../../components/crud/BandPill.tsx';
import ChannelModeSelect, {
  ChannelModesMultiSelect,
  ChannelPrimaryModeSelect,
} from '../../components/crud/ChannelModeSegmentedControl.tsx';
import ChannelModeProfilesEditor, {
  formProfileToModel,
  modeProfileToForm,
  syncModeProfilesFromSelection,
  type ModeProfileFormValues,
} from '../../components/crud/ChannelModeProfilesEditor.tsx';
import { channelModeProfileDefaults } from '../../models/codeplug.ts';
import { isAnalogMode, isDmrMode } from '../../lib/channelModes.ts';
import { coordsToLocator, isValidLocator, locatorToCoords } from '../../lib/maidenhead.ts';
import { channelSectionAnchorId } from '../../lib/channelPageSections.ts';
import { ICON_SIZE_NAV, ICON_STROKE } from '../../lib/iconSizes.ts';
import { hasValidationErrors, validateChannel } from '../../lib/validation/channel.ts';
import { composeChannelWireName, EXPORT_NAME_MODE_OPTIONS } from '../../lib/channelNaming.ts';
import {
  channelFieldDefaults,
  type Channel,
  type ChannelExportNameMode,
  type ChannelMode,
} from '../../models/codeplug.ts';
import { entityRefKey, parseEntityRefKey } from '../../lib/entityRefs.ts';
import { findEntityById } from '../../lib/reportLookup.ts';
import { useCodeplug } from '../../state/codeplugStore.tsx';

type ChannelFormValues = {
  callsign: string;
  name: string;
  exportNameMode: ChannelExportNameMode;
  mode: ChannelMode;
  rxFrequencyMhz: string;
  txFrequencyMhz: string;
  bandwidthKHz: string;
  colourCode: string;
  timeslot: string;
  contactRefKey: string;
  rxGroupListId: string;
  dmrId: string;
  rxTone: ChannelTone;
  txTone: ChannelTone;
  squelch: number | null;
  power: number | null;
  rxOnly: boolean;
  aprsConfigName: string;
  voxEnabled: boolean;
  transmitTimeout: string;
  scanSkip: boolean;
  comment: string;
  lat: string;
  lon: string;
  useLocation: boolean;
  hideFromMap: boolean;
  locator: string;
  multiMode: boolean;
  modeProfiles: ModeProfileFormValues[];
};

function hzToMhzInput(hz: number | null): string {
  if (hz == null || hz <= 0) return '';
  const mhz = frequencyHzToMhz(hz);
  return mhz != null ? formatMhzNumber(mhz) : '';
}

function emptyModeProfileForm(mode: ChannelMode): ModeProfileFormValues {
  return modeProfileToForm(channelModeProfileDefaults(mode));
}

function syncProfilesFromModeSelection(
  selectedModes: ChannelMode[],
  existingProfiles: ModeProfileFormValues[],
): ModeProfileFormValues[] {
  return syncModeProfilesFromSelection(selectedModes, existingProfiles);
}

function seedMultiModeProfiles(values: ChannelFormValues): ModeProfileFormValues[] {
  const fm: ModeProfileFormValues =
    values.mode === 'fm'
      ? {
          mode: 'fm',
          bandwidthKHz: values.bandwidthKHz,
          colourCode: '',
          timeslot: '',
          contactRefKey: '',
          rxGroupListId: '',
          dmrId: '',
          rxTone: values.rxTone,
          txTone: values.txTone,
          squelch: values.squelch,
        }
      : emptyModeProfileForm('fm');
  const dmr: ModeProfileFormValues =
    values.mode === 'dmr'
      ? {
          mode: 'dmr',
          bandwidthKHz: values.bandwidthKHz,
          colourCode: values.colourCode,
          timeslot: values.timeslot,
          contactRefKey: values.contactRefKey,
          rxGroupListId: values.rxGroupListId,
          dmrId: values.dmrId,
          rxTone: values.rxTone,
          txTone: values.txTone,
          squelch: values.squelch,
        }
      : emptyModeProfileForm('dmr');
  return [fm, dmr];
}

function channelToForm(ch: Channel): ChannelFormValues {
  return {
    callsign: ch.callsign,
    name: ch.name,
    exportNameMode: ch.exportNameMode,
    mode: ch.mode,
    rxFrequencyMhz: hzToMhzInput(ch.rxFrequency),
    txFrequencyMhz: hzToMhzInput(ch.txFrequency),
    bandwidthKHz: ch.bandwidthKHz != null ? String(ch.bandwidthKHz) : '',
    colourCode: ch.colourCode != null ? String(ch.colourCode) : '',
    timeslot: ch.timeslot != null ? String(ch.timeslot) : '',
    contactRefKey: ch.contactRef ? entityRefKey(ch.contactRef) : '',
    rxGroupListId: ch.rxGroupListId ?? '',
    dmrId: ch.dmrId != null ? String(ch.dmrId) : '',
    rxTone: ch.rxTone,
    txTone: ch.txTone,
    squelch: ch.squelch,
    power: ch.power,
    rxOnly: ch.rxOnly,
    aprsConfigName: ch.aprsConfigName,
    voxEnabled: ch.voxEnabled,
    transmitTimeout: ch.transmitTimeout != null ? String(ch.transmitTimeout) : '',
    scanSkip: ch.scanSkip,
    comment: ch.comment,
    lat: ch.location?.lat != null ? String(ch.location.lat) : '',
    lon: ch.location?.lon != null ? String(ch.location.lon) : '',
    useLocation: ch.useLocation,
    hideFromMap: ch.hideFromMap,
    locator:
      ch.location && ch.useLocation ? coordsToLocator(ch.location.lat, ch.location.lon, 6) : '',
    multiMode: ch.multiMode,
    modeProfiles: ch.multiMode ? ch.modeProfiles.map(modeProfileToForm) : [],
  };
}

function emptyForm(): ChannelFormValues {
  const defaults = channelFieldDefaults();
  return {
    callsign: '',
    name: '',
    exportNameMode: defaults.exportNameMode,
    mode: 'dmr',
    rxFrequencyMhz: '',
    txFrequencyMhz: '',
    bandwidthKHz: '',
    colourCode: '',
    timeslot: '',
    contactRefKey: '',
    rxGroupListId: '',
    dmrId: '',
    rxTone: defaults.rxTone,
    txTone: defaults.txTone,
    squelch: null,
    power: null,
    rxOnly: defaults.rxOnly,
    aprsConfigName: defaults.aprsConfigName,
    voxEnabled: defaults.voxEnabled,
    transmitTimeout: '',
    scanSkip: defaults.scanSkip,
    comment: defaults.comment,
    lat: '',
    lon: '',
    useLocation: defaults.useLocation,
    hideFromMap: defaults.hideFromMap,
    locator: '',
    multiMode: false,
    modeProfiles: [],
  };
}

function formToChannelInput(values: ChannelFormValues): Omit<Channel, 'id'> {
  const lat = parseFloat(values.lat);
  const lon = parseFloat(values.lon);
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lon);
  const tot = values.transmitTimeout.trim() ? parseInt(values.transmitTimeout, 10) : null;
  const colourCode = values.colourCode.trim() ? parseInt(values.colourCode, 10) : null;
  const timeslotRaw = values.timeslot.trim();
  const timeslot: ChannelTimeslot | null = timeslotRaw === '1' ? 1 : timeslotRaw === '2' ? 2 : null;
  const dmrId = values.dmrId.trim() ? parseInt(values.dmrId, 10) : null;
  const bandwidth = values.bandwidthKHz.trim() ? parseFloat(values.bandwidthKHz) : null;
  const modeProfiles = values.multiMode ? values.modeProfiles.map(formProfileToModel) : [];

  const base = {
    ...channelFieldDefaults(),
    callsign: values.callsign.trim(),
    name: values.name.trim(),
    exportNameMode: values.exportNameMode,
    mode: values.mode,
    multiMode: values.multiMode,
    modeProfiles,
    rxFrequency: parseFrequencyHzFromMhzInput(values.rxFrequencyMhz),
    txFrequency: parseFrequencyHzFromMhzInput(values.txFrequencyMhz),
    power: values.power,
    rxOnly: values.rxOnly,
    aprsConfigName: values.aprsConfigName,
    voxEnabled: values.voxEnabled,
    transmitTimeout: tot != null && Number.isFinite(tot) && tot >= 0 ? tot : null,
    scanSkip: values.scanSkip,
    comment: values.comment.trim(),
    location: hasCoords ? { lat, lon } : null,
    useLocation: values.useLocation,
    hideFromMap: values.hideFromMap,
    opengd77Extras: {},
  };

  if (values.multiMode && modeProfiles.length > 0) {
    const primary = modeProfiles.find((p) => p.mode === values.mode) ?? modeProfiles[0];
    return {
      ...base,
      bandwidthKHz: primary.bandwidthKHz,
      colourCode: primary.colourCode,
      timeslot: primary.timeslot,
      contactRef: primary.contactRef,
      rxGroupListId: primary.rxGroupListId,
      dmrId: primary.dmrId,
      rxTone: primary.rxTone,
      txTone: primary.txTone,
      squelch: primary.squelch,
    };
  }

  return {
    ...base,
    bandwidthKHz: bandwidth != null && Number.isFinite(bandwidth) ? bandwidth : null,
    colourCode:
      colourCode != null && Number.isFinite(colourCode) && colourCode >= 0 && colourCode <= 15
        ? colourCode
        : null,
    timeslot,
    contactRef: parseEntityRefKey(values.contactRefKey),
    rxGroupListId: values.rxGroupListId || null,
    dmrId: dmrId != null && Number.isFinite(dmrId) && dmrId > 0 ? dmrId : null,
    rxTone: values.rxTone,
    txTone: values.txTone,
    squelch: values.squelch,
    power: values.power,
    rxOnly: values.rxOnly,
    aprsConfigName: values.aprsConfigName,
    voxEnabled: values.voxEnabled,
    transmitTimeout: tot != null && Number.isFinite(tot) && tot >= 0 ? tot : null,
    scanSkip: values.scanSkip,
    comment: values.comment.trim(),
    location: hasCoords ? { lat, lon } : null,
    useLocation: values.useLocation,
    hideFromMap: values.hideFromMap,
    opengd77Extras: {},
  };
}

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

    const label = values.name.trim() || values.callsign.trim() || 'New channel';

    return [
      {
        ...channelFieldDefaults(),
        id: existing?.id ?? '__preview__',
        callsign: values.callsign.trim(),
        name: values.name.trim() || label,
        exportNameMode: values.exportNameMode,
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
    values.callsign,
    values.name,
    values.exportNameMode,
    values.mode,
    values.rxFrequencyMhz,
    values.txFrequencyMhz,
    existing,
  ]);

  if (!isNew && !existing) {
    return (
      <FormPage title="Edit channel">
        <Text>Channel not found.</Text>
        <Button component={Link} to="/channels" mt="md" variant="light">
          Back to channels
        </Button>
      </FormPage>
    );
  }

  const set = <K extends keyof ChannelFormValues>(key: K, value: ChannelFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const contactOptions = [
    { value: '', label: 'None' },
    ...codeplug.contacts.map((c) => ({
      value: entityRefKey({ kind: 'contact', id: c.id }),
      label: c.name,
    })),
    ...codeplug.talkGroups.map((tg) => ({
      value: entityRefKey({ kind: 'talkGroup', id: tg.id }),
      label: `${tg.name} (group)`,
    })),
  ];

  const rglOptions = [
    { value: '', label: 'None' },
    ...codeplug.rxGroupLists.map((r) => ({ value: r.id, label: r.name })),
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

  const showSingleModeAnalogFields = !values.multiMode && isAnalogMode(values.mode);
  const showDmrFields = !values.multiMode && isDmrMode(values.mode);

  const cancelPath = isNew ? '/channels' : `/channels/${existing?.id}`;

  const wirePreview = composeChannelWireName({
    callsign: values.callsign,
    name: values.name,
    exportNameMode: values.exportNameMode,
  });

  const pageTitle = isNew
    ? 'New channel'
    : [existing?.callsign, existing?.name].filter(Boolean).join(' — ') ||
      existing?.name ||
      'channel';

  return (
    <FormPage
      title={isNew ? 'New channel' : `Edit ${pageTitle}`}
      onSubmit={handleSubmit}
      footer={
        <>
          <Button component={Link} to={cancelPath} variant="default">
            Cancel
          </Button>
          <Button
            type="submit"
            leftSection={<IconDeviceFloppy size={ICON_SIZE_NAV} stroke={ICON_STROKE} />}
          >
            Save
          </Button>
        </>
      }
    >
      <Stack gap="lg">
        <Button
          component={Link}
          to={cancelPath}
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

        <Stack gap="sm" id={channelSectionAnchorId('Channel config')}>
          <Title order={4}>Channel config</Title>
          <TextInput
            label="Callsign"
            description="Repeater or site identifier (e.g. GB7GL)"
            value={values.callsign}
            onChange={(e) => set('callsign', e.currentTarget.value)}
          />
          <TextInput
            label="Name"
            description="Human qualifier — town, TG label, etc."
            value={values.name}
            onChange={(e) => set('name', e.currentTarget.value)}
          />
          <Select
            label="Export name mode"
            description="How CPS export composes the channel name column"
            data={EXPORT_NAME_MODE_OPTIONS.map((o) => ({
              value: o.value,
              label: `${o.label} — ${o.description}`,
            }))}
            value={values.exportNameMode}
            onChange={(v) => set('exportNameMode', (v ?? 'name_only') as ChannelExportNameMode)}
          />
          <TextInput
            label="Wire name preview"
            description="Composed CPS channel name on export"
            value={wirePreview}
            readOnly
          />
          <TextInput
            label="Comment"
            description="Internal notes only — not exported to CPS"
            value={values.comment}
            onChange={(e) => set('comment', e.currentTarget.value)}
          />
          <Checkbox
            label="Multi-mode channel"
            description="One logical site with separate settings per RF mode"
            checked={values.multiMode}
            onChange={(e) => {
              const checked = e.currentTarget.checked;
              setValues((prev) => ({
                ...prev,
                multiMode: checked,
                modeProfiles: checked ? seedMultiModeProfiles(prev) : [],
                mode: checked ? 'fm' : prev.mode,
              }));
            }}
          />
          {values.multiMode ? (
            <>
              <ChannelModesMultiSelect
                value={values.modeProfiles.map((p) => p.mode)}
                onChange={(modes) => {
                  setValues((prev) => {
                    const modeProfiles = syncProfilesFromModeSelection(modes, prev.modeProfiles);
                    const mode = modes.includes(prev.mode) ? prev.mode : (modes[0] ?? prev.mode);
                    return { ...prev, modeProfiles, mode };
                  });
                }}
              />
              {values.modeProfiles.length > 0 ? (
                <ChannelPrimaryModeSelect
                  value={values.mode}
                  modes={values.modeProfiles.map((p) => p.mode)}
                  onChange={(mode) => set('mode', mode)}
                />
              ) : null}
            </>
          ) : (
            <ChannelModeSelect value={values.mode} onChange={(mode) => set('mode', mode)} />
          )}
          <NumberInput
            label="Transmit timeout (seconds)"
            value={values.transmitTimeout === '' ? undefined : parseInt(values.transmitTimeout, 10)}
            onChange={(v) => set('transmitTimeout', v != null ? String(v) : '')}
            min={0}
            max={495}
            step={15}
            allowDecimal={false}
          />
          <Checkbox
            label="VOX"
            checked={values.voxEnabled}
            onChange={(e) => set('voxEnabled', e.currentTarget.checked)}
          />
          <Checkbox
            label="Scan skip"
            checked={values.scanSkip}
            onChange={(e) => set('scanSkip', e.currentTarget.checked)}
          />
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
          {showSingleModeAnalogFields ? (
            <Select
              label="Bandwidth (kHz)"
              data={bandwidthSelectData}
              value={values.bandwidthKHz}
              onChange={(v) => set('bandwidthKHz', v ?? '')}
              clearable
            />
          ) : null}
          <PercentLevelSlider
            label="Power"
            value={values.power}
            onChange={(v) => set('power', v)}
          />
          {showSingleModeAnalogFields ? (
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
          {showSingleModeAnalogFields ? (
            <PercentLevelSlider
              label="Squelch"
              value={values.squelch}
              onChange={(v) => set('squelch', v)}
              zeroLabel="Open (0%)"
            />
          ) : null}
          <Checkbox
            label="RX only"
            checked={values.rxOnly}
            onChange={(e) => set('rxOnly', e.currentTarget.checked)}
          />
        </Stack>

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
            talkGroups={codeplug.talkGroups}
            contacts={codeplug.contacts}
            rxGroupLists={codeplug.rxGroupLists}
            height={240}
            compactMode
            showControls={false}
            defaultShowZones={false}
            onLocationPick={applyCoords}
          />
        </Stack>

        {values.multiMode ? (
          <Stack gap="sm" id={channelSectionAnchorId('Mode profiles')}>
            <Title order={4}>Mode profiles</Title>
            <Text size="sm" c="dimmed">
              Per-mode RF settings. Frequencies, power, and location are shared above.
            </Text>
            <ChannelModeProfilesEditor
              profiles={values.modeProfiles}
              codeplug={codeplug}
              onChange={(modeProfiles) => setValues((prev) => ({ ...prev, modeProfiles }))}
            />
          </Stack>
        ) : null}

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
              value={values.contactRefKey || ''}
              onChange={(v) => set('contactRefKey', v ?? '')}
              searchable
              clearable
            />
            <Select
              label="RX group list"
              data={rglOptions}
              value={values.rxGroupListId || ''}
              onChange={(v) => set('rxGroupListId', v ?? '')}
              searchable
              clearable
            />
          </Stack>
        ) : null}

        <Stack gap="sm" id={channelSectionAnchorId('Scan / APRS')}>
          <Title order={4}>Scan / APRS</Title>
          <TextInput
            label="APRS config"
            value={values.aprsConfigName}
            onChange={(e) => set('aprsConfigName', e.currentTarget.value)}
          />
        </Stack>
      </Stack>
    </FormPage>
  );
}
