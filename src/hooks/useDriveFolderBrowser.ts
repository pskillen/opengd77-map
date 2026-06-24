import { useCallback, useEffect, useState } from 'react';
import { getGoogleDriveAccessToken, listDriveFolder } from '../lib/cloud/googleDrive/index.ts';
import type { RemoteDriveEntry } from '../lib/cloud/types.ts';

export interface DriveFolderRef {
  id: string;
  name: string;
}

export function useDriveFolderBrowser(opened: boolean) {
  const [folderStack, setFolderStack] = useState<DriveFolderRef[]>([
    { id: 'root', name: 'My Drive' },
  ]);
  const [entries, setEntries] = useState<RemoteDriveEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentFolder = folderStack[folderStack.length - 1]!;

  useEffect(() => {
    if (!opened) return;
    let cancelled = false;

    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const token = await getGoogleDriveAccessToken();
        const list = await listDriveFolder(token, currentFolder.id);
        if (!cancelled) setEntries(list);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
          setEntries([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [opened, currentFolder.id]);

  const enterFolder = (id: string, name: string) => {
    setFolderStack((stack) => [...stack, { id, name }]);
  };

  const goUp = () => {
    if (folderStack.length <= 1) return;
    setFolderStack((stack) => stack.slice(0, -1));
  };

  const reset = useCallback(() => {
    setFolderStack([{ id: 'root', name: 'My Drive' }]);
    setEntries([]);
    setError(null);
    setLoading(false);
  }, []);

  return {
    folderStack,
    currentFolder,
    entries,
    loading,
    error,
    setError,
    enterFolder,
    goUp,
    reset,
  };
}
