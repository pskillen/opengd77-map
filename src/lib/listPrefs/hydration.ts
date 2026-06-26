import { useEffect, useRef } from 'react';

/**
 * Restore list prefs from localStorage only on the first visit after mount or project
 * switch — not when the operator clears URL params while editing (regression #170).
 */
export function useHydrateListPrefsOnce(
  activeProjectId: string | null,
  locationSearch: string,
  hasUrlParams: (params: URLSearchParams) => boolean,
  applyStored: () => void,
): void {
  const hydratedRef = useRef(false);

  useEffect(() => {
    hydratedRef.current = false;
  }, [activeProjectId]);

  useEffect(() => {
    if (!activeProjectId) return;
    if (hydratedRef.current) return;

    const currentParams = new URLSearchParams(locationSearch);
    if (hasUrlParams(currentParams)) {
      hydratedRef.current = true;
      return;
    }

    applyStored();
    hydratedRef.current = true;
  }, [activeProjectId, locationSearch, hasUrlParams, applyStored]);
}
