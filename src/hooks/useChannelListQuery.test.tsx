import { renderHook, act, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { useChannelListQuery } from './useChannelListQuery.ts';

function wrapper(initialEntries: string[]) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>;
  };
}

describe('useChannelListQuery', () => {
  it('reads defaults from empty search params', () => {
    const { result } = renderHook(() => useChannelListQuery(), {
      wrapper: wrapper(['/channels']),
    });

    expect(result.current.nameFilter).toBe('');
    expect(result.current.sortMode).toBe('name');
    expect(result.current.bandFilter).toEqual([]);
    expect(result.current.distanceFilterEnabled).toBe(false);
    expect(result.current.maxDistanceKm).toBe(25);
  });

  it('round-trips filter params in the URL', () => {
    const { result } = renderHook(() => useChannelListQuery(), {
      wrapper: wrapper([
        '/channels?q=gb3le&sort=distance&band=2m,70cm&mode=DMR&duplex=simplex&distance=1&maxKm=50',
      ]),
    });

    expect(result.current.nameFilter).toBe('gb3le');
    expect(result.current.sortMode).toBe('distance');
    expect(result.current.bandFilter).toEqual(['2m', '70cm']);
    expect(result.current.modeFilter).toEqual(['DMR']);
    expect(result.current.duplexFilter).toBe('simplex');
    expect(result.current.distanceFilterEnabled).toBe(true);
    expect(result.current.maxDistanceKm).toBe(50);
  });

  it('writes search params when filters change', async () => {
    const { result } = renderHook(() => useChannelListQuery(), {
      wrapper: wrapper(['/channels']),
    });

    act(() => {
      result.current.setNameFilter('repeater');
    });
    await waitFor(() => expect(result.current.nameFilter).toBe('repeater'));

    act(() => {
      result.current.setSortMode('distance');
    });
    await waitFor(() => expect(result.current.sortMode).toBe('distance'));

    act(() => {
      result.current.setBandFilter(['2m']);
    });
    await waitFor(() => expect(result.current.bandFilter).toEqual(['2m']));

    act(() => {
      result.current.setDistanceFilterEnabled(true);
    });
    await waitFor(() => expect(result.current.distanceFilterEnabled).toBe(true));

    act(() => {
      result.current.setMaxDistanceKm(100);
    });
    await waitFor(() => expect(result.current.maxDistanceKm).toBe(100));
  });
});
