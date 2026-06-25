import { afterEach, describe, expect, it } from 'vitest';
import { googleOAuthClientId, isGoogleDriveConfigured } from './config.ts';

const originalClientId = __GOOGLE_OAUTH_CLIENT_ID__;

function setClientId(clientId: string): void {
  (globalThis as { __GOOGLE_OAUTH_CLIENT_ID__?: string }).__GOOGLE_OAUTH_CLIENT_ID__ = clientId;
}

afterEach(() => {
  setClientId(originalClientId);
});

describe('googleDrive config', () => {
  it('reports unconfigured when client id is empty', () => {
    setClientId('');
    expect(isGoogleDriveConfigured()).toBe(false);
    expect(googleOAuthClientId()).toBe('');
  });

  it('reports configured when client id is set', () => {
    setClientId('test-client-id.apps.googleusercontent.com');
    expect(isGoogleDriveConfigured()).toBe(true);
    expect(googleOAuthClientId()).toContain('googleusercontent.com');
  });
});
