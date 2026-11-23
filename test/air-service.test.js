import { describe, it, expect } from 'vitest';
import { fetchLiveAirQuality, resolveCityCoordinates, TYPICAL_INDIAN_CITIES } from '../src/services/air-service.js';

describe('Air Quality Telemetry & Geocoding Service', () => {
  it('resolves coordinates directly for predefined Indian smog capitals', async () => {
    const delhi = await resolveCityCoordinates('Delhi');
    expect(delhi.name).toContain('Delhi');
    expect(delhi.lat).toBe(TYPICAL_INDIAN_CITIES.delhi.lat);
    expect(delhi.lon).toBe(TYPICAL_INDIAN_CITIES.delhi.lon);

    const mumbai = await resolveCityCoordinates('mumbai');
    expect(mumbai.name).toBe('Mumbai');
    expect(mumbai.lat).toBe(TYPICAL_INDIAN_CITIES.mumbai.lat);
  });

  it('fetches air telemetry and returns complete payload with forecast and clean window', async () => {
    const data = await fetchLiveAirQuality('Delhi');
    expect(data.city).toContain('Delhi');
    expect(data.aqi).toBeGreaterThan(0);
    expect(data.dominantPollutant).toBeDefined();
    expect(data.cleanestHour).toBeDefined();
    expect(data.worstHour).toBeDefined();
    expect(data.pollutants.pm2_5).toBeGreaterThan(0);
    expect(['live-cams-open-meteo', 'edge-cache', 'winter-smog-baseline']).toContain(data.source);
  });

  it('serves repeat requests from edge cache within the TTL window', async () => {
    // Prime cache
    await fetchLiveAirQuality('Bengaluru');
    // Immediate repeat
    const cached = await fetchLiveAirQuality('Bengaluru');
    expect(cached.source).toBe('edge-cache');
  });
});
