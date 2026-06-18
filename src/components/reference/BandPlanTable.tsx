import { ScrollArea, Table, Text } from '@mantine/core';
import BandPill from '../crud/BandPill.tsx';
import { UK_BANDS } from '../../lib/bands.ts';
import { formatBandRangeMhz } from '../../lib/formatFrequency.ts';

export default function BandPlanTable() {
  return (
    <ScrollArea>
      <Table striped highlightOnHover withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Band</Table.Th>
            <Table.Th>Range</Table.Th>
            <Table.Th>Colour</Table.Th>
            <Table.Th>Notes</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {UK_BANDS.map((band) => (
            <Table.Tr key={band.id}>
              <Table.Td>
                <BandPill band={band} />
              </Table.Td>
              <Table.Td>{formatBandRangeMhz(band.minMhz, band.maxMhz)}</Table.Td>
              <Table.Td>
                <Text size="sm" c="dimmed" ff="monospace">
                  {band.color}
                </Text>
              </Table.Td>
              <Table.Td>{band.notes ?? '—'}</Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </ScrollArea>
  );
}
