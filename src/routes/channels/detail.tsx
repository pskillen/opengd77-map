import { Anchor, Button, Group, Stack, Text, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconArrowLeft, IconPencil, IconTrash } from '@tabler/icons-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import CodeplugMap from '../../components/CodeplugMap/CodeplugMap.tsx';
import ConfirmDeleteModal from '../../components/crud/ConfirmDeleteModal.tsx';
import { BandPillForChannel } from '../../components/crud/BandPill.tsx';
import DetailSections, { DetailLinkList } from '../../components/report/DetailSections.tsx';
import NotFoundEntity from '../../components/report/NotFoundEntity.tsx';
import { Page, PageHeader } from '../../components/ui/index.ts';
import UseMyLocationButton from '../../components/UseMyLocationButton/UseMyLocationButton.tsx';
import UkRepeaterVerify from '../../components/UkRepeaterVerify/UkRepeaterVerify.tsx';
import {
  externalChannelLinks,
  findEntityById,
  zonesContainingChannel,
} from '../../lib/reportLookup.ts';
import { entityRefDisplayName } from '../../lib/entityRefs.ts';
import { useCodeplug } from '../../state/codeplugStore.tsx';
import { useOperatorPosition } from '../../state/operatorPosition.tsx';
import { modeLabel, isAnalogMode, isDmrMode } from '../../lib/channelModes.ts';
import { percentLabel } from '../../lib/channelFields/index.ts';
import { formatFrequencyHz } from '../../lib/formatFrequency.ts';
import { formatOffsetMhz, frequencyOffsetMhz } from '../../lib/bands.ts';
import { formatDistanceM, haversineDistanceM } from '../../lib/geoDistance.ts';
import { channelHasGeolocation } from '../../lib/channels.ts';
import { coordsToLocator } from '../../lib/maidenhead.ts';
import { channelSectionAnchorId } from '../../lib/channelPageSections.ts';
import { ICON_SIZE_NAV, ICON_STROKE } from '../../lib/iconSizes.ts';
import ModePill from '../../components/crud/ModePill.tsx';
import { resolveChannelModeProfiles } from '../../lib/channelExpansion/index.ts';
import {
  channelDisplayLabel,
  composeChannelWireName,
  exportNameModeLabel,
} from '../../lib/channelNaming.ts';

function formatLocation(lat: number | undefined, lon: number | undefined): string {
  if (lat == null || lon == null) return '—';
  return `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
}

export default function ChannelDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { codeplug, deleteChannel } = useCodeplug();
  const { position, setPosition, clearPosition } = useOperatorPosition();
  const [deleteOpen, { open: openDelete, close: closeDelete }] = useDisclosure(false);
  const channel = id ? findEntityById(codeplug.channels, id) : null;

  if (!channel) {
    return (
      <Page>
        <PageHeader title="Channel" />
        <NotFoundEntity entityLabel="Channel" listPath="/channels" />
      </Page>
    );
  }

  const zoneLinks = zonesContainingChannel(channel.id, codeplug.zones).map((z) => ({
    id: z.id,
    name: z.name,
    path: `/zones/${z.id}`,
  }));

  const contactLabel = entityRefDisplayName(
    channel.contactRef,
    codeplug.talkGroups,
    codeplug.contacts,
  );
  const txContact =
    channel.contactRef?.kind === 'contact'
      ? findEntityById(codeplug.contacts, channel.contactRef.id)
      : null;
  const txTalkGroup =
    channel.contactRef?.kind === 'talkGroup'
      ? findEntityById(codeplug.talkGroups, channel.contactRef.id)
      : null;
  const rxList = channel.rxGroupListId
    ? findEntityById(codeplug.rxGroupLists, channel.rxGroupListId)
    : null;

  const vendorExtraFields = Object.entries(channel.opengd77Extras).map(([label, value]) => ({
    label,
    value,
  }));

  const offset = frequencyOffsetMhz(channel.rxFrequency, channel.txFrequency);
  const locator =
    channel.location && channel.useLocation
      ? coordsToLocator(channel.location.lat, channel.location.lon, 6)
      : '';

  const geolocated = channelHasGeolocation(channel);
  const distanceFromMe =
    geolocated && position
      ? formatDistanceM(
          haversineDistanceM(
            position.lat,
            position.lon,
            channel.location!.lat,
            channel.location!.lon,
          ),
        )
      : '—';

  const locationFields = [
    {
      label: 'Coordinates',
      value: formatLocation(channel.location?.lat, channel.location?.lon),
    },
    { label: 'Maidenhead', value: locator },
    { label: 'Use Location', value: channel.useLocation ? 'Yes' : 'No' },
    { label: 'Hide from map', value: channel.hideFromMap ? 'Yes' : 'No' },
    ...(geolocated
      ? [
          { label: 'Distance from me', value: distanceFromMe },
          ...(position
            ? [
                {
                  label: 'My location',
                  value: formatLocation(position.lat, position.lon),
                },
              ]
            : []),
        ]
      : []),
  ];

  const modeProfiles = resolveChannelModeProfiles(channel);

  const sections = [
    {
      title: 'Channel config',
      fields: [
        { label: 'Callsign', value: channel.callsign || '—' },
        {
          label: 'Name',
          value: channel.abbreviation?.trim() ? (
            <>
              {channel.name}
              <br />({channel.abbreviation.trim()})
            </>
          ) : (
            channel.name || '—'
          ),
        },
        { label: 'Export name mode', value: exportNameModeLabel(channel.exportNameMode) },
        {
          label: 'Wire name preview',
          value: composeChannelWireName(channel) || '—',
        },
        { label: 'Comment', value: channel.comment || '—' },
        {
          label: 'Mode',
          value: channel.multiMode ? (
            <Group gap={6}>
              {modeProfiles.map((p) => (
                <ModePill key={p.mode} mode={p.mode} size="xs" />
              ))}
            </Group>
          ) : (
            modeLabel(channel.mode)
          ),
        },
        { label: 'Band', value: <BandPillForChannel channel={channel} /> },
        { label: 'Scan skip', value: channel.scanSkip ? 'Yes' : 'No' },
        {
          label: 'Transmit timeout',
          value: channel.transmitTimeout != null ? String(channel.transmitTimeout) : '—',
        },
        { label: 'VOX', value: channel.voxEnabled ? 'Yes' : 'No' },
      ],
    },
    {
      title: 'RF',
      fields: [
        {
          label: 'RX frequency',
          value: formatFrequencyHz(channel.rxFrequency),
        },
        {
          label: 'TX frequency',
          value: formatFrequencyHz(channel.txFrequency),
        },
        {
          label: 'Offset',
          value: offset !== null ? formatOffsetMhz(offset) : '',
        },
        ...(channel.multiMode
          ? []
          : [
              ...(isAnalogMode(channel.mode)
                ? [
                    {
                      label: 'Bandwidth',
                      value: channel.bandwidthKHz != null ? `${channel.bandwidthKHz} kHz` : '',
                    },
                    {
                      label: 'RX tone',
                      value: channel.rxTone === 'none' ? '—' : channel.rxTone,
                    },
                    {
                      label: 'TX tone',
                      value: channel.txTone === 'none' ? '—' : channel.txTone,
                    },
                    { label: 'Squelch', value: percentLabel(channel.squelch) },
                  ]
                : []),
              { label: 'Power', value: percentLabel(channel.power) },
            ]),
        { label: 'RX only', value: channel.rxOnly ? 'Yes' : 'No' },
        ...(channel.multiMode ? [{ label: 'Power', value: percentLabel(channel.power) }] : []),
      ],
    },
    ...(channel.multiMode
      ? modeProfiles.map((profile) => ({
          title: `${modeLabel(profile.mode)} profile`,
          fields: [
            ...(isAnalogMode(profile.mode)
              ? [
                  {
                    label: 'Bandwidth',
                    value: profile.bandwidthKHz != null ? `${profile.bandwidthKHz} kHz` : '—',
                  },
                  {
                    label: 'RX tone',
                    value: profile.rxTone === 'none' ? '—' : profile.rxTone,
                  },
                  {
                    label: 'TX tone',
                    value: profile.txTone === 'none' ? '—' : profile.txTone,
                  },
                  { label: 'Squelch', value: percentLabel(profile.squelch) },
                ]
              : []),
            ...(isDmrMode(profile.mode)
              ? [
                  {
                    label: 'Colour code',
                    value: profile.colourCode != null ? String(profile.colourCode) : '—',
                  },
                  {
                    label: 'Timeslot',
                    value: profile.timeslot != null ? String(profile.timeslot) : '—',
                  },
                  {
                    label: 'DMR ID',
                    value: profile.dmrId != null ? String(profile.dmrId) : '—',
                  },
                  {
                    label: 'TX contact',
                    value:
                      entityRefDisplayName(
                        profile.contactRef,
                        codeplug.talkGroups,
                        codeplug.contacts,
                      ) || '—',
                  },
                  {
                    label: 'RX group list',
                    value: profile.rxGroupListId
                      ? (codeplug.rxGroupLists.find((r) => r.id === profile.rxGroupListId)?.name ??
                        '—')
                      : '—',
                  },
                ]
              : []),
          ],
        }))
      : []),
    ...(channel.multiMode
      ? []
      : [
          {
            title: 'DMR',
            fields: [
              {
                label: 'Colour code',
                value: channel.colourCode != null ? String(channel.colourCode) : '',
              },
              {
                label: 'Timeslot',
                value: channel.timeslot != null ? String(channel.timeslot) : '',
              },
              { label: 'DMR ID', value: channel.dmrId != null ? String(channel.dmrId) : '' },
              {
                label: 'TX contact',
                value: contactLabel ? (
                  txContact ? (
                    <Anchor component={Link} to={`/contacts/${txContact.id}`}>
                      {contactLabel}
                    </Anchor>
                  ) : txTalkGroup ? (
                    <Anchor component={Link} to={`/talk-groups/${txTalkGroup.id}`}>
                      {contactLabel}
                    </Anchor>
                  ) : (
                    contactLabel
                  )
                ) : (
                  '—'
                ),
              },
              {
                label: 'RX group list',
                value: rxList ? (
                  <Anchor component={Link} to={`/rx-group-lists/${rxList.id}`}>
                    {rxList.name}
                  </Anchor>
                ) : (
                  '—'
                ),
              },
            ],
          },
        ]),
    {
      title: 'Location',
      fields: locationFields,
    },
    ...(vendorExtraFields.length
      ? [
          {
            title: 'Vendor extras',
            fields: vendorExtraFields,
          },
        ]
      : []),
  ];

  const externalLinks = externalChannelLinks(channel.callsign);
  const memberZones = zonesContainingChannel(channel.id, codeplug.zones);
  const zoneWarning =
    memberZones.length > 0
      ? `This channel is a member of ${memberZones.length} zone(s): ${memberZones.map((z) => z.name).join(', ')}.`
      : undefined;

  const confirmDelete = () => {
    deleteChannel(channel.id);
    closeDelete();
    navigate('/channels');
  };

  return (
    <Page>
      <PageHeader title={channelDisplayLabel(channel, true) || channel.name || 'Channel'} />
      <Stack gap="lg">
        <Group justify="space-between">
          <Anchor component={Link} to="/channels" size="sm">
            <Group gap={4} wrap="nowrap">
              <IconArrowLeft size={ICON_SIZE_NAV} stroke={ICON_STROKE} />
              Channels
            </Group>
          </Anchor>
          <Group gap="sm" align="flex-start">
            <UkRepeaterVerify channel={channel} />
            <Button
              component={Link}
              to={`/channels/${channel.id}/edit`}
              variant="light"
              size="sm"
              leftSection={<IconPencil size={ICON_SIZE_NAV} stroke={ICON_STROKE} />}
            >
              Edit
            </Button>
            <Button
              color="red"
              variant="light"
              size="sm"
              onClick={openDelete}
              leftSection={<IconTrash size={ICON_SIZE_NAV} stroke={ICON_STROKE} />}
            >
              Delete
            </Button>
          </Group>
        </Group>

        <DetailSections sections={sections} />

        <DetailLinkList title="Zones" items={zoneLinks} />

        <Stack gap="sm" id={channelSectionAnchorId('External links')}>
          <Title order={3}>External links</Title>
          <Group gap="md">
            {externalLinks.map((link) => (
              <Anchor key={link.label} href={link.url} target="_blank" rel="noopener noreferrer">
                {link.label}
              </Anchor>
            ))}
          </Group>
          <Text size="xs" c="dimmed">
            Search uses callsign ({channel.callsign}) — results depend on third-party sites.
          </Text>
        </Stack>

        <Stack gap="sm" id={channelSectionAnchorId('Map')}>
          <Title order={3}>Map</Title>
          {geolocated ? (
            position ? (
              <Group gap="sm" align="center">
                {position.accuracyMeters != null && Number.isFinite(position.accuracyMeters) ? (
                  <Text size="sm" c="dimmed">
                    My location accuracy ±{Math.round(position.accuracyMeters)} m
                  </Text>
                ) : null}
                <Button variant="subtle" size="compact-sm" onClick={clearPosition}>
                  Clear my location
                </Button>
              </Group>
            ) : (
              <UseMyLocationButton
                label="Show my location"
                onLocation={(lat, lon, accuracyMeters) =>
                  setPosition({ lat, lon, accuracyMeters: accuracyMeters ?? null })
                }
              />
            )
          ) : null}
          <CodeplugMap
            channels={[channel]}
            zones={codeplug.zones}
            allChannels={codeplug.channels}
            talkGroups={codeplug.talkGroups}
            contacts={codeplug.contacts}
            rxGroupLists={codeplug.rxGroupLists}
            highlightChannelId={channel.id}
            compactMode
            defaultShowZones={false}
            operatorPosition={position}
          />
        </Stack>
      </Stack>

      <ConfirmDeleteModal
        opened={deleteOpen}
        onClose={closeDelete}
        onConfirm={confirmDelete}
        title="Delete channel"
        entityName={channelDisplayLabel(channel, true) || channel.name}
        warning={zoneWarning}
      />
    </Page>
  );
}
