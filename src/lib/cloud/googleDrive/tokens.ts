import { GOOGLE_DRIVE_TOKEN_STORAGE_KEY } from './config.ts';

export interface GoogleDriveStoredTokens {
  accessToken: string;
  expiresAt: number;
}

export function loadGoogleDriveTokens(): GoogleDriveStoredTokens | null {
  try {
    const raw = localStorage.getItem(GOOGLE_DRIVE_TOKEN_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GoogleDriveStoredTokens;
    if (typeof parsed.accessToken !== 'string' || typeof parsed.expiresAt !== 'number') {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveGoogleDriveTokens(tokens: GoogleDriveStoredTokens): void {
  localStorage.setItem(GOOGLE_DRIVE_TOKEN_STORAGE_KEY, JSON.stringify(tokens));
}

export function clearGoogleDriveTokens(): void {
  localStorage.removeItem(GOOGLE_DRIVE_TOKEN_STORAGE_KEY);
}

export function isGoogleDriveTokenValid(tokens: GoogleDriveStoredTokens | null): boolean {
  if (!tokens) return false;
  return tokens.expiresAt > Date.now() + 60_000;
}
