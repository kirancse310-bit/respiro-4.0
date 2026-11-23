import { describe, it, expect } from 'vitest';
import {
  calculateRoomVolume,
  calculateRequiredCADR,
  calculateTurnaroundTime,
  compareCorsiRosenthalVsHEPA,
} from '../src/lib/cadr-engine.js';

describe('Clean Air Engineering & CADR Engine', () => {
  it('calculates room volume accurately in cu ft and cu m', () => {
    const { volumeCuFt, volumeCuM } = calculateRoomVolume(20, 15, 10);
    expect(volumeCuFt).toBe(3000);
    expect(volumeCuM).toBeCloseTo(84.95, 1);
  });

  it('calculates required CADR for 4 ACH per ASHRAE 62.2', () => {
    // 15 ft x 12 ft x 9 ft = 1620 cu ft.
    // CADR = (1620 * 4) / 60 = 108 CFM
    const res = calculateRequiredCADR(15, 12, 9, 4);
    expect(res.volumeCuFt).toBe(1620);
    expect(res.requiredCADR).toBe(108);
    expect(res.requiredCADR_M3H).toBe(Math.round(108 * 1.699));
  });

  it('computes turnaround times for smog reduction', () => {
    // 1620 cu ft, 550 CFM (Corsi-Rosenthal)
    const times = calculateTurnaroundTime(1620, 550);
    expect(times.actualACH).toBeGreaterThan(15);
    expect(times.time80Min).toBeLessThan(10); // Very fast clearance
    expect(times.time99Min).toBeLessThan(20);
  });

  it('generates accurate comparison between Corsi-Rosenthal and commercial HEPA', () => {
    const comparison = compareCorsiRosenthalVsHEPA(18, 14, 9);
    expect(comparison.corsiRosenthal.cadr).toBe(550);
    expect(comparison.commercialHEPA.cadr).toBe(180);
    expect(comparison.cadrAdvantageRatio).toBe(3.1);
    expect(comparison.costSavingsRatio).toBe(3.4);
    expect(comparison.corsiRosenthal.provenance).toContain('UC Davis / EPA');
  });
});
