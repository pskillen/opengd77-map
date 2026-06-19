import { Anchor, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { channelSectionAnchorId } from '../../lib/channelPageSections.ts';

export interface DetailField {
  label: string;
  value: ReactNode;
}

export interface DetailSection {
  title: string;
  fields: DetailField[];
}

export interface DetailSectionsProps {
  sections: DetailSection[];
}

export default function DetailSections({ sections }: DetailSectionsProps) {
  return (
    <Stack gap="lg">
      {sections.map((section) => (
        <Stack key={section.title} id={channelSectionAnchorId(section.title)} gap="sm">
          <Title order={3}>{section.title}</Title>
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
            {section.fields.map((field) => (
              <Stack key={field.label} gap={2}>
                <Text size="sm" c="dimmed">
                  {field.label}
                </Text>
                <Text size="sm">{field.value || '—'}</Text>
              </Stack>
            ))}
          </SimpleGrid>
        </Stack>
      ))}
    </Stack>
  );
}

export function DetailLinkList({
  title,
  items,
  id,
}: {
  title: string;
  items: { id: string; name: string; path: string }[];
  id?: string;
}) {
  return (
    <Stack gap="sm" id={id ?? channelSectionAnchorId(title)}>
      <Title order={3}>{title}</Title>
      {items.length === 0 ? (
        <Text size="sm" c="dimmed">
          None
        </Text>
      ) : (
        <Stack gap={4}>
          {items.map((item) => (
            <Anchor key={item.id} component={Link} to={item.path}>
              {item.name}
            </Anchor>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
