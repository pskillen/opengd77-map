export interface GoogleIdentityTokenResponse {
  access_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
}

export interface GoogleTokenClient {
  requestAccessToken: (overrides?: { prompt?: string }) => void;
}

export interface GoogleIdentityServices {
  accounts: {
    oauth2: {
      initTokenClient: (config: {
        client_id: string;
        scope: string;
        callback: (response: GoogleIdentityTokenResponse) => void;
      }) => GoogleTokenClient;
      revoke: (accessToken: string, done: () => void) => void;
    };
  };
}

declare global {
  interface Window {
    google?: GoogleIdentityServices;
  }
}

export {};
