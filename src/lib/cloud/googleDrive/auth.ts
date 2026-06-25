import {
  GOOGLE_DRIVE_OAUTH_SCOPE,
  googleOAuthClientId,
  isGoogleDriveConfigured,
} from './config.ts';
import { loadGoogleIdentityServices } from './loadGis.ts';
import {
  clearGoogleDriveTokens,
  isGoogleDriveTokenValid,
  loadGoogleDriveTokens,
  saveGoogleDriveTokens,
  type GoogleDriveStoredTokens,
} from './tokens.ts';

export function isGoogleDriveConnected(): boolean {
  return isGoogleDriveTokenValid(loadGoogleDriveTokens());
}

export function getGoogleDriveTokens(): GoogleDriveStoredTokens | null {
  const tokens = loadGoogleDriveTokens();
  return isGoogleDriveTokenValid(tokens) ? tokens : null;
}

export async function connectGoogleDrive(): Promise<void> {
  if (!isGoogleDriveConfigured()) {
    throw new Error('Google Drive is not configured for this build');
  }

  await loadGoogleIdentityServices();
  const oauth2 = window.google?.accounts?.oauth2;
  if (!oauth2) {
    throw new Error('Google Identity Services failed to initialise');
  }

  return new Promise((resolve, reject) => {
    const client = oauth2.initTokenClient({
      client_id: googleOAuthClientId(),
      scope: GOOGLE_DRIVE_OAUTH_SCOPE,
      callback: (response) => {
        if (response.error || !response.access_token) {
          reject(
            new Error(response.error_description ?? response.error ?? 'Google sign-in failed'),
          );
          return;
        }
        const expiresInSec = response.expires_in ?? 3600;
        saveGoogleDriveTokens({
          accessToken: response.access_token,
          expiresAt: Date.now() + expiresInSec * 1000,
        });
        resolve();
      },
    });
    client.requestAccessToken({ prompt: '' });
  });
}

export function disconnectGoogleDrive(): void {
  const tokens = loadGoogleDriveTokens();
  if (tokens?.accessToken && window.google?.accounts?.oauth2?.revoke) {
    window.google.accounts.oauth2.revoke(tokens.accessToken, () => {
      clearGoogleDriveTokens();
    });
    return;
  }
  clearGoogleDriveTokens();
}

export async function getGoogleDriveAccessToken(): Promise<string> {
  const tokens = getGoogleDriveTokens();
  if (!tokens) {
    throw new Error('Google Drive is not connected');
  }
  return tokens.accessToken;
}
