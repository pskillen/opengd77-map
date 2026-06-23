import { Badge, Group } from '@mantine/core';
import { bandsFromFrequencies, isAmateurBand, type BandDefinition } from '../../lib/bands.ts';
import type { Channel } from '../../models/codeplug.ts';

export interface BandPillProps {
  band: BandDefinition | null;
  size?: 'xs' | 'sm' | 'md';
}

export default function BandPill({ band, size = 'sm' }: BandPillProps) {
  if (!band) return null;

  if (isAmateurBand(band)) {
    return (
      <Badge size={size} style={{ backgroundColor: band.color, color: '#fff' }}>
        {band.label}
      </Badge>
    );
  }

  return (
    <Badge
      size={size}
      variant="outline"
      style={{
        borderColor: band.color,
        color: band.color,
        backgroundColor: `${band.color}18`,
      }}
    >
      {band.label}
    </Badge>
  );
}

export function BandPillsForFrequencies({
  rxFrequency,
  txFrequency,
  size,
}: {
  rxFrequency: number | null;
  txFrequency: number | null;
  size?: BandPillProps['size'];
}) {
  const bands = bandsFromFrequencies(rxFrequency, txFrequency);
  if (!bands.length) return null;

  return (
    <Group gap={4} wrap="nowrap">
      {bands.map((band) => (
        <BandPill key={band.id} band={band} size={size} />
      ))}
    </Group>
  );
}

export function BandPillForChannel({
  channel,
  size,
}: {
  channel: Channel;
  size?: BandPillProps['size'];
}) {
  return (
    <BandPillsForFrequencies
      rxFrequency={channel.rxFrequency}
      txFrequency={channel.txFrequency}
      size={size}
    />
  );
}
