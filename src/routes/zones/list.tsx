import { Button, Group, Stack, Text } from '@mantine/core';
import { useMemo } from 'react';
import CodeplugMap from '../../components/CodeplugMap/CodeplugMap.tsx';
import { DataTable, ListPage } from '../../components/ui/index.ts';
import UseMyLocationButton from '../../components/UseMyLocationButton/UseMyLocationButton.tsx';
import { filterRowsByName, useListNameQuery } from '../../hooks/useListNameQuery.ts';
import { useCodeplug } from '../../state/codeplugStore.tsx';
import { useOperatorPosition } from '../../state/operatorPosition.tsx';

export default function ZonesList() {
  const { codeplug } = useCodeplug();
  const { channels, zones } = codeplug;
  const { position, setPosition, clearPosition } = useOperatorPosition();
  const { nameFilter, setNameFilter } = useListNameQuery();
  const filtered = useMemo(() => {
    return filterRowsByName(zones, nameFilter, (z) => z.name);
  }, [zones, nameFilter]);

  return (
    <ListPage title="Zones">
      <Stack gap="lg">
        <DataTable
          variant="list"
          rows={filtered}
          totalRowCount={zones.length}
          search={nameFilter}
          onSearchChange={setNameFilter}
          searchPlaceholder="Filter name…"
          rowKey={(z) => z.id}
          nameColumn={{
            getName: (z) => z.name,
            getPath: (z) => `/zones/${z.id}`,
          }}
          columns={[
            {
              key: 'members',
              header: 'Members',
              render: (z) => z.memberChannelIds.length,
              sortValue: (z) => z.memberChannelIds.length,
            },
          ]}
        />

        {position ? (
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
        )}

        <CodeplugMap
          channels={channels}
          zones={zones}
          allChannels={channels}
          talkGroups={codeplug.talkGroups}
          contacts={codeplug.contacts}
          rxGroupLists={codeplug.rxGroupLists}
          operatorPosition={position}
        />
      </Stack>
    </ListPage>
  );
}
