export const GOOGLE_DRIVE_TOKEN_STORAGE_KEY = 'mm9pdy-codeplug-tool.cloud.google-drive.tokens';

export const GOOGLE_DRIVE_OAUTH_SCOPE = 'https://www.googleapis.com/auth/drive.file';

export function googleOAuthClientId(): string {
  return __GOOGLE_OAUTH_CLIENT_ID__;
}

export function isGoogleDriveConfigured(): boolean {
  return googleOAuthClientId().length > 0;
}
