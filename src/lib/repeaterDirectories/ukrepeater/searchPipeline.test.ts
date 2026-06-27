import { describe, expect, it } from 'vitest';
import {
  formatLatLon,
  pipelineGeocodeNoResultsStep,
  pipelineGeocodeResponseStep,
  pipelineGeocoderStep,
  pipelineLocatorStep,
} from './searchPipeline.ts';

describe('searchPipeline', () => {
  it('formats lat/lon with hemisphere', () => {
    expect(formatLatLon(52.9225, -1.4746)).toBe('52.9225° N, 1.4746° W');
  });

  it('builds geocoder step with provider name only when default', () => {
    expect(pipelineGeocoderStep('photon').text).toBe('Geocoder: Photon (OpenStreetMap)');
  });

  it('builds geocoder step with optional detail', () => {
    expect(pipelineGeocoderStep('mapbox', 'token from Settings').text).toBe(
      'Geocoder: Mapbox (token from Settings)',
    );
  });

  it('builds geocode no-results step', () => {
    expect(pipelineGeocodeNoResultsStep('photon', 'bt412an').text).toBe(
      'Photon (OpenStreetMap) response: no match for "bt412an"',
    );
  });

  it('builds geocode response step', () => {
    const step = pipelineGeocodeResponseStep('photon', 'Derby, United Kingdom', 52.92, -1.48);
    expect(step.text).toContain('Photon');
    expect(step.text).toContain('Derby, United Kingdom');
    expect(step.text).toContain('52.9200° N');
  });

  it('builds locator conversion step', () => {
    expect(pipelineLocatorStep('io92').text).toContain('IO92');
  });
});
