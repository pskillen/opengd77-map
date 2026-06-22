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
import { entityRefKey } from '../../lib/entityRefs.ts';
import type { EntityRef } from '../../lib/entityRefs.ts';
import { ICON_SIZE_NAV, ICON_STROKE } from '../../lib/iconSizes.ts';
import { sortByName } from '../../lib/reportLookup.ts';
import type { Contact, TalkGroup } from '../../models/codeplug.ts';

export interface RxGroupListMemberPickerProps {
  talkGroups: TalkGroup[];
  contacts: Contact[];
  selectedRefs: EntityRef[];
  onChange: (refs: EntityRef[]) => void;
}

interface MemberOption {
  ref: EntityRef;
  name: string;
  key: string;
}

function moveSelectedBlock(
  refs: EntityRef[],
  selected: Set<string>,
  direction: 'up' | 'down',
): EntityRef[] {
  const next = [...refs];
  const indices = next
    .map((ref, index) => ({ key: entityRefKey(ref), index }))
    .filter(({ key }) => selected.has(key))
    .map(({ index }) => index);

  if (direction === 'up') {
    for (const index of indices.sort((a, b) => a - b)) {
      if (index === 0) continue;
      const above = index - 1;
      if (selected.has(entityRefKey(next[above]))) continue;
      [next[above], next[index]] = [next[index], next[above]];
    }
  } else {
    for (const index of indices.sort((a, b) => b - a)) {
      if (index >= next.length - 1) continue;
      const below = index + 1;
      if (selected.has(entityRefKey(next[below]))) continue;
      [next[below], next[index]] = [next[index], next[below]];
    }
  }

  return next;
}

function memberOptions(talkGroups: TalkGroup[], contacts: Contact[]): MemberOption[] {
  const tg = sortByName(talkGroups).map((t) => ({
    ref: { kind: 'talkGroup' as const, id: t.id },
    name: t.name,
    key: entityRefKey({ kind: 'talkGroup', id: t.id }),
  }));
  const ct = sortByName(contacts).map((c) => ({
    ref: { kind: 'contact' as const, id: c.id },
    name: c.name,
    key: entityRefKey({ kind: 'contact', id: c.id }),
  }));
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
  onToggle: (key: string) => void;
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
        <Group key={item.key} gap="xs" wrap="nowrap">
          <Checkbox
            label={item.name}
            checked={checked.has(item.key)}
            onChange={() => onToggle(item.key)}
            style={{ flex: 1 }}
          />
          {item.ref.kind === 'talkGroup' ? (
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
  selectedRefs,
  onChange,
}: RxGroupListMemberPickerProps) {
  const [availableFilter, setAvailableFilter] = useState('');
  const [inListFilter, setInListFilter] = useState('');
  const [availableSelected, setAvailableSelected] = useState<string[]>([]);
  const [inListSelected, setInListSelected] = useState<string[]>([]);

  const selectedKeys = useMemo(
    () => new Set(selectedRefs.map((ref) => entityRefKey(ref))),
    [selectedRefs],
  );
  const allOptions = useMemo(() => memberOptions(talkGroups, contacts), [talkGroups, contacts]);
  const optionByKey = useMemo(() => new Map(allOptions.map((o) => [o.key, o])), [allOptions]);

  const availableFilterLower = availableFilter.trim().toLowerCase();
  const inListFilterLower = inListFilter.trim().toLowerCase();

  const availableMembers = useMemo(
    () =>
      allOptions.filter(
        (o) =>
          !selectedKeys.has(o.key) &&
          (!availableFilterLower || o.name.toLowerCase().includes(availableFilterLower)),
      ),
    [allOptions, selectedKeys, availableFilterLower],
  );

  const inListMembers = useMemo(
    () =>
      selectedRefs
        .map((ref) => {
          const key = entityRefKey(ref);
          return optionByKey.get(key) ?? { ref, name: key, key };
        })
        .filter((o) => !inListFilterLower || o.name.toLowerCase().includes(inListFilterLower)),
    [selectedRefs, optionByKey, inListFilterLower],
  );

  const toggleAvailable = (key: string) => {
    setAvailableSelected((prev) =>
      prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key],
    );
  };

  const toggleInList = (key: string) => {
    setInListSelected((prev) =>
      prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key],
    );
  };

  const addSelected = () => {
    const toAdd = availableSelected
      .map((key) => optionByKey.get(key)?.ref)
      .filter((ref): ref is EntityRef => ref != null && !selectedKeys.has(entityRefKey(ref)));
    if (!toAdd.length) return;
    onChange([...selectedRefs, ...toAdd]);
    setAvailableSelected([]);
  };

  const removeSelected = () => {
    if (!inListSelected.length) return;
    const remove = new Set(inListSelected);
    onChange(selectedRefs.filter((ref) => !remove.has(entityRefKey(ref))));
    setInListSelected([]);
  };

  const moveSelected = (direction: 'up' | 'down') => {
    if (!inListSelected.length) return;
    onChange(moveSelectedBlock(selectedRefs, new Set(inListSelected), direction));
  };

  const canMoveUp = inListSelected.some((key) => {
    const index = selectedRefs.findIndex((ref) => entityRefKey(ref) === key);
    return index > 0;
  });
  const canMoveDown = inListSelected.some((key) => {
    const index = selectedRefs.findIndex((ref) => entityRefKey(ref) === key);
    return index >= 0 && index < selectedRefs.length - 1;
  });

  return (
    <Stack gap="sm">
      <Text size="sm" c="dimmed">
        {selectedRefs.length} member{selectedRefs.length === 1 ? '' : 's'}
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
