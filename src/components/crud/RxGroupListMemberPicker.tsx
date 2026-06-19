import {
  Badge,
  Button,
  Checkbox,
  Group,
  ScrollArea,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { IconArrowLeft, IconArrowRight } from '@tabler/icons-react';
import { useMemo, useState } from 'react';
import { ICON_SIZE_NAV, ICON_STROKE } from '../../lib/iconSizes.ts';
import { sortByName } from '../../lib/reportLookup.ts';
import type { Contact, TalkGroup } from '../../models/codeplug.ts';

export interface RxGroupListMemberPickerProps {
  talkGroups: TalkGroup[];
  contacts: Contact[];
  selectedNames: string[];
  onChange: (names: string[]) => void;
}

interface MemberOption {
  name: string;
  kind: 'talkGroup' | 'contact';
}

function moveSelectedBlock(
  names: string[],
  selected: Set<string>,
  direction: 'up' | 'down',
): string[] {
  const next = [...names];
  const indices = next
    .map((name, index) => ({ name, index }))
    .filter(({ name }) => selected.has(name))
    .map(({ index }) => index);

  if (direction === 'up') {
    for (const index of indices.sort((a, b) => a - b)) {
      if (index === 0) continue;
      const above = index - 1;
      if (selected.has(next[above])) continue;
      [next[above], next[index]] = [next[index], next[above]];
    }
  } else {
    for (const index of indices.sort((a, b) => b - a)) {
      if (index >= next.length - 1) continue;
      const below = index + 1;
      if (selected.has(next[below])) continue;
      [next[below], next[index]] = [next[index], next[below]];
    }
  }

  return next;
}

function memberOptions(talkGroups: TalkGroup[], contacts: Contact[]): MemberOption[] {
  const tg = sortByName(talkGroups).map((t) => ({ name: t.name, kind: 'talkGroup' as const }));
  const ct = sortByName(contacts).map((c) => ({ name: c.name, kind: 'contact' as const }));
  return [...tg, ...ct];
}

function MemberList({
  items,
  checked,
  onToggle,
  emptyLabel,
}: {
  items: MemberOption[];
  checked: Set<string>;
  onToggle: (name: string) => void;
  emptyLabel: string;
}) {
  if (!items.length) {
    return (
      <Text size="sm" c="dimmed" p="xs">
        {emptyLabel}
      </Text>
    );
  }

  return (
    <Stack gap={4} p="xs">
      {items.map((item) => (
        <Group key={item.name} gap="xs" wrap="nowrap">
          <Checkbox
            label={item.name}
            checked={checked.has(item.name)}
            onChange={() => onToggle(item.name)}
            style={{ flex: 1 }}
          />
          {item.kind === 'talkGroup' ? (
            <Badge size="sm">Talk group</Badge>
          ) : (
            <Badge size="sm" color="grape">
              Private
            </Badge>
          )}
        </Group>
      ))}
    </Stack>
  );
}

export default function RxGroupListMemberPicker({
  talkGroups,
  contacts,
  selectedNames,
  onChange,
}: RxGroupListMemberPickerProps) {
  const [availableFilter, setAvailableFilter] = useState('');
  const [inListFilter, setInListFilter] = useState('');
  const [availableSelected, setAvailableSelected] = useState<string[]>([]);
  const [inListSelected, setInListSelected] = useState<string[]>([]);

  const selectedSet = new Set(selectedNames);
  const allOptions = useMemo(() => memberOptions(talkGroups, contacts), [talkGroups, contacts]);
  const optionByName = useMemo(() => new Map(allOptions.map((o) => [o.name, o])), [allOptions]);

  const availableFilterLower = availableFilter.trim().toLowerCase();
  const inListFilterLower = inListFilter.trim().toLowerCase();

  const availableMembers = useMemo(
    () =>
      allOptions.filter(
        (o) =>
          !selectedSet.has(o.name) &&
          (!availableFilterLower || o.name.toLowerCase().includes(availableFilterLower)),
      ),
    [allOptions, selectedNames, availableFilterLower],
  );

  const inListMembers = useMemo(
    () =>
      selectedNames
        .map((name) => optionByName.get(name) ?? { name, kind: 'contact' as const })
        .filter((o) => !inListFilterLower || o.name.toLowerCase().includes(inListFilterLower)),
    [selectedNames, optionByName, inListFilterLower],
  );

  const toggleAvailable = (name: string) => {
    setAvailableSelected((prev) =>
      prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name],
    );
  };

  const toggleInList = (name: string) => {
    setInListSelected((prev) =>
      prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name],
    );
  };

  const addSelected = () => {
    const toAdd = availableSelected.filter((name) => !selectedSet.has(name));
    if (!toAdd.length) return;
    onChange([...selectedNames, ...toAdd]);
    setAvailableSelected([]);
  };

  const removeSelected = () => {
    if (!inListSelected.length) return;
    const remove = new Set(inListSelected);
    onChange(selectedNames.filter((name) => !remove.has(name)));
    setInListSelected([]);
  };

  const moveSelected = (direction: 'up' | 'down') => {
    if (!inListSelected.length) return;
    onChange(moveSelectedBlock(selectedNames, new Set(inListSelected), direction));
  };

  const canMoveUp = inListSelected.some((name) => selectedNames.indexOf(name) > 0);
  const canMoveDown = inListSelected.some((name) => {
    const index = selectedNames.indexOf(name);
    return index >= 0 && index < selectedNames.length - 1;
  });

  return (
    <Stack gap="sm">
      <Text size="sm" c="dimmed">
        {selectedNames.length} member{selectedNames.length === 1 ? '' : 's'}
      </Text>

      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
        <Stack gap="xs">
          <TextInput
            label="Filter available"
            placeholder="Search by name…"
            value={availableFilter}
            onChange={(e) => setAvailableFilter(e.currentTarget.value)}
          />
          <Text size="sm" fw={500}>
            Available
          </Text>
          <ScrollArea
            h={240}
            type="auto"
            offsetScrollbars
            style={{
              border: '1px solid var(--mantine-color-default-border)',
              borderRadius: 'var(--mantine-radius-sm)',
            }}
          >
            <MemberList
              items={availableMembers}
              checked={new Set(availableSelected)}
              onToggle={toggleAvailable}
              emptyLabel="No talk groups or contacts available"
            />
          </ScrollArea>
        </Stack>

        <Stack gap="xs" justify="center">
          <Button
            type="button"
            variant="light"
            onClick={addSelected}
            disabled={!availableSelected.length}
            rightSection={<IconArrowRight size={ICON_SIZE_NAV} stroke={ICON_STROKE} />}
          >
            Add
          </Button>
          <Button
            type="button"
            variant="light"
            onClick={removeSelected}
            disabled={!inListSelected.length}
            leftSection={<IconArrowLeft size={ICON_SIZE_NAV} stroke={ICON_STROKE} />}
          >
            Remove
          </Button>
        </Stack>

        <Stack gap="xs">
          <TextInput
            label="Filter in list"
            placeholder="Search by name…"
            value={inListFilter}
            onChange={(e) => setInListFilter(e.currentTarget.value)}
          />
          <Text size="sm" fw={500}>
            In list (export order)
          </Text>
          <ScrollArea
            h={240}
            type="auto"
            offsetScrollbars
            style={{
              border: '1px solid var(--mantine-color-default-border)',
              borderRadius: 'var(--mantine-radius-sm)',
            }}
          >
            <MemberList
              items={inListMembers}
              checked={new Set(inListSelected)}
              onToggle={toggleInList}
              emptyLabel="No members in list"
            />
          </ScrollArea>
          <Group gap="xs">
            <Button
              type="button"
              variant="default"
              size="compact-sm"
              onClick={() => moveSelected('up')}
              disabled={!canMoveUp}
            >
              Move up
            </Button>
            <Button
              type="button"
              variant="default"
              size="compact-sm"
              onClick={() => moveSelected('down')}
              disabled={!canMoveDown}
            >
              Move down
            </Button>
          </Group>
        </Stack>
      </SimpleGrid>
    </Stack>
  );
}
