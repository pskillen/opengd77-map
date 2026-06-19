import { describe, expect, it } from 'vitest';
import {
  channelIdFromPath,
  channelSectionAnchorId,
  isChannelDetailPath,
  isChannelEditPath,
  isChannelListPath,
  isChannelPagePath,
} from './channelPageSections.ts';

describe('channelPageSections', () => {
  it('derives stable anchor ids from section titles', () => {
    expect(channelSectionAnchorId('Identity')).toBe('identity');
    expect(channelSectionAnchorId('Scan / APRS')).toBe('scan-aprs');
    expect(channelSectionAnchorId('External links')).toBe('external-links');
  });

  it('classifies channel routes', () => {
    expect(isChannelListPath('/channels')).toBe(true);
    expect(isChannelListPath('/channels/new')).toBe(false);

    expect(isChannelPagePath('/channels/abc')).toBe(true);
    expect(isChannelDetailPath('/channels/abc')).toBe(true);
    expect(isChannelDetailPath('/channels/new')).toBe(false);
    expect(isChannelDetailPath('/channels/abc/edit')).toBe(false);
    expect(channelIdFromPath('/channels/abc')).toBe('abc');
    expect(channelIdFromPath('/channels/new')).toBeNull();

    expect(isChannelEditPath('/channels/new')).toBe(true);
    expect(isChannelEditPath('/channels/abc/edit')).toBe(true);
    expect(isChannelEditPath('/channels/abc')).toBe(false);
  });
});
