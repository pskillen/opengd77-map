/** Stable anchor ids for channel detail/edit page sections (hash links in secondary nav). */

export interface ChannelPageSectionLink {
  id: string;
  label: string;
}

export function channelSectionAnchorId(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Form and detail field groups (channel config … location). */
export const CHANNEL_FORM_SECTIONS: ChannelPageSectionLink[] = [
  { id: channelSectionAnchorId('Channel config'), label: 'Channel config' },
  { id: channelSectionAnchorId('RF'), label: 'RF' },
  { id: channelSectionAnchorId('Location'), label: 'Location' },
  { id: channelSectionAnchorId('Mode profiles'), label: 'Mode profiles' },
  { id: channelSectionAnchorId('DMR'), label: 'DMR' },
];

/** Extra blocks on the channel detail page below DetailSections. */
export const CHANNEL_DETAIL_EXTRA_SECTIONS: ChannelPageSectionLink[] = [
  { id: channelSectionAnchorId('Zones'), label: 'Zones' },
  { id: channelSectionAnchorId('External links'), label: 'External links' },
  { id: channelSectionAnchorId('Map'), label: 'Map' },
];

export function isChannelListPath(pathname: string): boolean {
  return pathname === '/channels';
}

export function isChannelEditPath(pathname: string): boolean {
  return pathname === '/channels/new' || /^\/channels\/[^/]+\/edit$/.test(pathname);
}

/** Channel id segment on `/channels/:id` detail routes (not list, new, or edit). */
export function channelIdFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/channels\/([^/]+)$/);
  if (!match || match[1] === 'new') return null;
  return match[1];
}

export function isChannelPagePath(pathname: string): boolean {
  return pathname.startsWith('/channels/');
}

export function isChannelDetailPath(pathname: string): boolean {
  return channelIdFromPath(pathname) != null;
}
