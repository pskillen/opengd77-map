import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

export function useListNameQuery(): {
  nameFilter: string;
  setNameFilter: (value: string) => void;
} {
  const [searchParams, setSearchParams] = useSearchParams();
  const nameFilter = searchParams.get('q') ?? '';

  const setNameFilter = useCallback(
    (value: string) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (value) next.set('q', value);
          else next.delete('q');
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  return { nameFilter, setNameFilter };
}

export function filterRowsByName<T>(
  rows: T[],
  nameFilter: string,
  getName: (row: T) => string,
): T[] {
  if (!nameFilter) return rows;
  const lower = nameFilter.toLowerCase();
  return rows.filter((row) => getName(row).toLowerCase().includes(lower));
}
