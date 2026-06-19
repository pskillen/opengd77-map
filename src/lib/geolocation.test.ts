import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GeolocationError, isGeolocationSupported, requestCurrentPosition } from './geolocation.ts';

describe('isGeolocationSupported', () => {
  const originalGeolocation = navigator.geolocation;
  const originalIsSecureContext = window.isSecureContext;

  afterEach(() => {
    Object.defineProperty(navigator, 'geolocation', {
      value: originalGeolocation,
      configurable: true,
    });
    Object.defineProperty(window, 'isSecureContext', {
      value: originalIsSecureContext,
      configurable: true,
    });
  });

  it('returns true when geolocation exists and context is secure', () => {
    Object.defineProperty(navigator, 'geolocation', {
      value: { getCurrentPosition: vi.fn() },
      configurable: true,
    });
    Object.defineProperty(window, 'isSecureContext', {
      value: true,
      configurable: true,
    });
    expect(isGeolocationSupported()).toBe(true);
  });

  it('returns false when context is not secure', () => {
    Object.defineProperty(navigator, 'geolocation', {
      value: { getCurrentPosition: vi.fn() },
      configurable: true,
    });
    Object.defineProperty(window, 'isSecureContext', {
      value: false,
      configurable: true,
    });
    expect(isGeolocationSupported()).toBe(false);
  });
});

describe('requestCurrentPosition', () => {
  const originalGeolocation = navigator.geolocation;
  const originalIsSecureContext = window.isSecureContext;

  beforeEach(() => {
    Object.defineProperty(window, 'isSecureContext', {
      value: true,
      configurable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'geolocation', {
      value: originalGeolocation,
      configurable: true,
    });
    Object.defineProperty(window, 'isSecureContext', {
      value: originalIsSecureContext,
      configurable: true,
    });
  });

  it('returns lat, lon, and accuracy on success', async () => {
    const getCurrentPosition = vi.fn((success: PositionCallback) => {
      success({
        coords: {
          latitude: 55.953252,
          longitude: -3.188267,
          accuracy: 12,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
          toJSON: () => ({}),
        },
        timestamp: Date.now(),
        toJSON: () => ({}),
      });
    });

    Object.defineProperty(navigator, 'geolocation', {
      value: { getCurrentPosition },
      configurable: true,
    });

    const result = await requestCurrentPosition();

    expect(result).toEqual({
      lat: 55.953252,
      lon: -3.188267,
      accuracyMeters: 12,
    });
    expect(getCurrentPosition).toHaveBeenCalledOnce();
  });

  it('rejects with permission denied message', async () => {
    const getCurrentPosition = vi.fn((_success: PositionCallback, error: PositionErrorCallback) => {
      error({ code: 1, message: 'denied', PERMISSION_DENIED: 1 } as GeolocationPositionError);
    });

    Object.defineProperty(navigator, 'geolocation', {
      value: { getCurrentPosition },
      configurable: true,
    });

    await expect(requestCurrentPosition()).rejects.toEqual(
      new GeolocationError('Location permission denied'),
    );
  });

  it('rejects when geolocation is unsupported', async () => {
    Object.defineProperty(window, 'isSecureContext', {
      value: false,
      configurable: true,
    });

    await expect(requestCurrentPosition()).rejects.toEqual(
      new GeolocationError('Location not available in this browser or context'),
    );
  });
});
