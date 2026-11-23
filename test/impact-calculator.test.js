import { describe, it, expect } from 'vitest';
import {
  calculateAvoidedInhalation,
  calculateAvoidedEmissions,
  generateComputedFacts,
} from '../src/lib/impact-calculator.js';

describe('Deterministic Impact Calculator', () => {
  it('computes avoided inhalation mass with N95 mask', () => {
    const res = calculateAvoidedInhalation(200, 3, false, true);
    // Outdoor 3 hours, 0.625 m³/h = 1.875 m³
    // Exposure = 200 * 1.875 = 375 µg
    // Avoided with N95 (90%) = 338 µg
    expect(res.rawExposureUg).toBe(375);
    expect(res.avoidedInhalationUg).toBe(338);
    expect(res.reductionPercent).toBe(90);
    expect(res.provenance).toContain('CDC/NIOSH');
  });

  it('computes weekly emissions avoided by shifting to metro', () => {
    const res = calculateAvoidedEmissions(15, 'two_wheeler', 'metro', 5);
    // 75 km/week * 0.05 g/km = 3.75 g PM2.5
    expect(res.weeklyKm).toBe(75);
    expect(res.pm25SavedG).toBe(3.8);
    expect(res.co2eSavedKg).toBe(3.0);

    // Test auto-rickshaw mode
    const autoRes = calculateAvoidedEmissions(10, 'auto', 'metro', 5);
    expect(autoRes.weeklyKm).toBe(50);
    expect(autoRes.pm25SavedG).toBe(1.0);
    expect(autoRes.co2eSavedKg).toBe(3.0);
    expect(autoRes.provenance).toContain('CNG Auto');
  });

  it('generates facts sheet and allowed numbers for number firewall', () => {
    const sheet = generateComputedFacts(
      { commuteKm: 14, commuteMode: 'two_wheeler', outdoorHours: 2, hasVulnerable: true },
      { pm2_5: 220, city: 'Delhi', cleanestHour: '13:00', worstHour: '21:00', cleanestPm25: 140, worstPm25: 310 }
    );

    expect(sheet.facts.length).toBeGreaterThanOrEqual(6);
    expect(sheet.allowedNumbers.has('220')).toBe(true);
    expect(sheet.allowedNumbers.has('14')).toBe(true);
    expect(sheet.allowedNumbers.has('13')).toBe(true);
    expect(sheet.allowedNumbers.has('21')).toBe(true);
    expect(sheet.allowedNumbers.has('140')).toBe(true);
    expect(sheet.allowedNumbers.has('310')).toBe(true);
  });
});
