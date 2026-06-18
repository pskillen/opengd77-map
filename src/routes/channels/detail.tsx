import { Anchor, Button, Group, Stack, Text, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Link, useNavigate, useParams } from 'react-router-dom';
import CodeplugMap from '../../components/CodeplugMap/CodeplugMap.tsx';
import ConfirmDeleteModal from '../../components/crud/ConfirmDeleteModal.tsx';
import { BandPillForChannel } from '../../components/crud/BandPill.tsx';
import DetailSections, { DetailLinkList } from '../../components/report/DetailSections.tsx';
import NotFoundEntity from '../../components/report/NotFoundEntity.tsx';
import ReportPage from '../../components/report/ReportPage.tsx';
import {
  externalChannelLinks,
  findContactByName,
  findEntityById,
  findRxGroupListByName,
  zonesContainingChannel,
} from '../../lib/reportLookup.ts';
import { useCodeplug } from '../../state/codeplugStore.tsx';
import { formatOffsetMhz, frequencyOffsetMhz } from '../../lib/bands.ts';
import { formatFrequencyMhz } from '../../lib/formatFrequency.ts';
import { coordsToLocator } from '../../lib/maidenhead.ts';

function modeLabel(mode: string): string {
  if (mode === 'digital') return 'Digital';
  if (mode === 'analogue') return 'Analogue';
  return 'Other';
}

function formatLocation(lat: number | undefined, lon: number | undefined): string {
  if (lat == null || lon == null) return '—';
  return `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
}

export default function ChannelDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { codeplug, deleteChannel } = useCodeplug();
  const [deleteOpen, { open: openDelete, close: closeDelete }] = useDisclosure(false);
  const channel = id ? findEntityById(codeplug.channels, id) : null;

  if (!channel) {
    return (
      <ReportPage title="Channel">
        <NotFoundEntity entityLabel="Channel" listPath="/channels" />
      </ReportPage>
    );
  }

  const zoneLinks = zonesContainingChannel(channel.id, codeplug.zones).map((z) => ({
    id: z.id,
    name: z.name,
    path: `/zones/${z.id}`,
  }));

  const txContact = findContactByName(channel.contactName, codeplug.contacts);
  const txTalkGroup = codeplug.talkGroups.find((tg) => tg.name === channel.contactName);
  const rxList = findRxGroupListByName(channel.rxGroupListName, codeplug.rxGroupLists);

  const vendorExtraFields = Object.entries(channel.vendorExtras).map(([label, value]) => ({
    label,
    value,
  }));

  const offset = frequencyOffsetMhz(channel.rxFrequency, channel.txFrequency);
  const locator =
    channel.location && channel.useLocation
      ? coordsToLocator(channel.location.lat, channel.location.lon, 6)
      : '';

  const sections = [
    {
      title: 'Identity',
      fields: [
        { label: 'Name', value: channel.name },
        { label: 'Callsign', value: channel.callsign },
        { label: 'Mode', value: modeLabel(channel.mode) },
        { label: 'Band', value: <BandPillForChannel channel={channel} /> },
        { label: 'Channel number', value: channel.number },
      ],
    },
    {
      title: 'RF',
      fields: [
        { label: 'RX frequency', value: channel.rxFrequency ? formatFrequencyMhz(channel.rxFrequency) : '' },
        { label: 'TX frequency', value: channel.txFrequency ? formatFrequencyMhz(channel.txFrequency) : '' },
        {
          label: 'Offset',
          value: offset !== null ? formatOffsetMhz(offset) : '',
        },
        { label: 'Bandwidth', value: channel.bandwidthKHz ? `${channel.bandwidthKHz} kHz` : '' },
        { label: 'Power', value: channel.power },
        { label: 'RX tone', value: channel.rxTone },
        { label: 'TX tone', value: channel.txTone },
        { label: 'Squelch', value: channel.squelch },
        { label: 'RX only', value: channel.rxOnly },
      ],
    },
    {
      title: 'DMR',
      fields: [
        { label: 'Colour code', value: channel.colourCode },
        { label: 'Timeslot', value: channel.timeslot },
        { label: 'DMR ID', value: channel.dmrId },
        {
          label: 'TX contact',
          value:
            channel.contactName && channel.contactName !== 'None' ? (
              txContact ? (
                <Anchor component={Link} to={`/contacts/${txContact.id}`}>
                  {channel.contactName}
                </Anchor>
              ) : txTalkGroup ? (
                <Anchor component={Link} to={`/talk-groups/${txTalkGroup.id}`}>
                  {channel.contactName}
                </Anchor>
              ) : (
                channel.contactName
              )
            ) : (
              '—'
            ),
        },
        {
          label: 'RX group list',
          value:
            channel.rxGroupListName && channel.rxGroupListName !== 'None' ? (
              rxList ? (
                <Anchor component={Link} to={`/rx-group-lists/${rxList.id}`}>
                  {channel.rxGroupListName}
                </Anchor>
              ) : (
                channel.rxGroupListName
              )
            ) : (
              '—'
            ),
        },
      ],
    },
    {
      title: 'Location',
      fields: [
        {
          label: 'Coordinates',
          value: formatLocation(channel.location?.lat, channel.location?.lon),
        },
        { label: 'Maidenhead', value: locator },
        { label: 'Use Location', value: channel.useLocation ? 'Yes' : 'No' },
        { label: 'Hide from map', value: channel.hideFromMap ? 'Yes' : 'No' },
      ],
    },
    {
      title: 'Scan / APRS',
      fields: [
        { label: 'Scan skip', value: channel.scanSkip ? 'Yes' : 'No' },
        { label: 'APRS config', value: channel.aprsConfigName },
        { label: 'Transmit timeout', value: channel.transmitTimeout },
        { label: 'VOX', value: channel.voxEnabled ? 'Yes' : 'No' },
      ],
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
    <ReportPage title={channel.name}>
      <Stack gap="lg">
        <Group justify="space-between">
          <Anchor component={Link} to="/channels" size="sm">
            ← Channels
          </Anchor>
          <Group gap="sm">
            <Button component={Link} to={`/channels/${channel.id}/edit`} variant="light" size="sm">
              Edit
            </Button>
            <Button color="red" variant="light" size="sm" onClick={openDelete}>
              Delete
            </Button>
          </Group>
        </Group>

        <DetailSections sections={sections} />

        <DetailLinkList title="Zones" items={zoneLinks} />

        <Stack gap="sm">
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

        <Stack gap="sm">
          <Title order={3}>Map</Title>
          <CodeplugMap
            channels={[channel]}
            zones={codeplug.zones}
            allChannels={codeplug.channels}
            highlightChannelId={channel.id}
            compactMode
            defaultShowZones={false}
          />
        </Stack>
      </Stack>

      <ConfirmDeleteModal
        opened={deleteOpen}
        onClose={closeDelete}
        onConfirm={confirmDelete}
        title="Delete channel"
        entityName={channel.name}
        warning={zoneWarning}
      />
    </ReportPage>
  );
}
