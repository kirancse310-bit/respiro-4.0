import { describe, it, expect } from 'vitest';
import { pm25ToAQI, pm10ToAQI, calculateOverallAQI, getAQIBand } from '../src/lib/aqi-calculator.js';

describe('EPA AQI Calculator', () => {
  it('correctly calculates PM2.5 AQI breakpoints', () => {
    // 0 - 12 µg/m³ -> 0 - 50 AQI
    expect(pm25ToAQI(0)).toBe(0);
    expect(pm25ToAQI(12.0)).toBe(50);

    // 12.1 - 35.4 µg/m³ -> 51 - 100 AQI
    expect(pm25ToAQI(20)).toBeGreaterThanOrEqual(51);
    expect(pm25ToAQI(35.4)).toBe(100);

    // 55.5 - 150.4 µg/m³ -> 151 - 200 AQI
    expect(pm25ToAQI(100)).toBeGreaterThan(150);
    expect(pm25ToAQI(100)).toBeLessThan(200);

    // > 250.5 µg/m³ -> Hazardous (>300)
    expect(pm25ToAQI(350)).toBeGreaterThan(300);
  });

  it('correctly categorizes AQI bands and symbols', () => {
    const good = getAQIBand(45);
    expect(good.label).toBe('Good');
    expect(good.symbol).toBe('●');

    const unhealthy = getAQIBand(175);
    expect(unhealthy.label).toBe('Unhealthy');
    expect(unhealthy.symbol).toBe('◆');

    const hazardous = getAQIBand(420);
    expect(hazardous.label).toBe('Hazardous');
    expect(hazardous.symbol).toBe('✖');
  });

  it('determines dominant pollutant and overall status', () => {
    const res = calculateOverallAQI({
      pm2_5: 180, // ~230 AQI
      pm10: 100,  // ~73 AQI
      no2: 40,
      co: 1000,
      o3: 30,
    });

    expect(res.dominantPollutant).toBe('PM2.5');
    expect(res.category).toBe('Very Unhealthy');
    expect(res.aqi).toBeGreaterThan(200);
  });
});
