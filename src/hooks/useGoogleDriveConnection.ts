import { useCallback, useState } from 'react';
import {
  connectGoogleDrive,
  disconnectGoogleDrive,
  isGoogleDriveConnected,
  isGoogleDriveConfigured,
} from '../lib/cloud/googleDrive/index.ts';

export function useGoogleDriveConnection() {
  const [configured] = useState(() => isGoogleDriveConfigured());
  const [connected, setConnected] = useState(() => isGoogleDriveConnected());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      await connectGoogleDrive();
      setConnected(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setConnected(false);
    } finally {
      setBusy(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    disconnectGoogleDrive();
    setConnected(false);
    setError(null);
  }, []);

  return { configured, connected, busy, error, connect, disconnect };
}
