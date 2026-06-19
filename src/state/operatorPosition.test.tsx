import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import {
  OperatorPositionProvider,
  useOperatorPosition,
} from './operatorPosition.tsx';

function wrapper({ children }: { children: ReactNode }) {
  return <OperatorPositionProvider>{children}</OperatorPositionProvider>;
}

describe('useOperatorPosition', () => {
  it('starts with no position', () => {
    const { result } = renderHook(() => useOperatorPosition(), { wrapper });
    expect(result.current.position).toBeNull();
  });

  it('sets and clears session position', () => {
    const { result } = renderHook(() => useOperatorPosition(), { wrapper });

    act(() => {
      result.current.setPosition({ lat: 55.86, lon: -4.25, accuracyMeters: 12 });
    });

    expect(result.current.position).toEqual({ lat: 55.86, lon: -4.25, accuracyMeters: 12 });

    act(() => {
      result.current.clearPosition();
    });

    expect(result.current.position).toBeNull();
  });
});
