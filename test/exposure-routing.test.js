import { describe, it, expect } from 'vitest';
import { calculateInhaledDose, compareTransitExposure } from '../src/lib/exposure-routing.js';

describe('Exposure Routing & Inhaled Dose Model', () => {
  it('calculates inhaled dose with minute ventilation and penetration factors', () => {
    // 200 µg/m³ ambient, 30 min, walking (0.018 m³/min, penetration 1.0)
    // Dose = 200 * 1.0 * 0.018 * 30 = 108 µg
    const walkingDose = calculateInhaledDose(200, 30, 'walking', false);
    expect(walkingDose).toBe(108.0);

    // Walking with sealed N95 (penetration * 0.05)
    // Dose = 108 * 0.05 = 5.4 µg
    const n95Dose = calculateInhaledDose(200, 30, 'walking', true);
    expect(n95Dose).toBe(5.4);
  });

  it('shows cycling has higher inhaled dose than sitting in vehicle due to hyperventilation', () => {
    const cycleDose = calculateInhaledDose(200, 30, 'cycling', false);
    const carDose = calculateInhaledDose(200, 30, 'car', false);

    expect(cycleDose).toBeGreaterThan(carDose);
  });

  it('compares multi-modal journeys and highlights the safest option', () => {
    const comparison = compareTransitExposure(10, 180);

    expect(comparison.distanceKm).toBe(10);
    expect(comparison.options.length).toBe(5);
    expect(comparison.doseAvoidedUg).toBeGreaterThan(0);
    expect(comparison.percentReduction).toBeGreaterThan(50);
    expect(comparison.safestDoseUg).toBeLessThan(comparison.maxDoseUg);
  });
});
