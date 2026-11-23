import { describe, it, expect } from 'vitest';
import { extractNumbers, verifyNumbers } from '../src/lib/number-firewall.js';

describe('Number Firewall', () => {
  it('extracts numbers while ignoring scientific terminology with digits', () => {
    const text = 'Air quality has PM2.5 of 220 µg/m³ and PM10 of 350. Wear an N-95 or N95 mask with MERV-13 filter in your 12 km commute.';
    const numbers = extractNumbers(text);

    expect(numbers).toContain('220');
    expect(numbers).toContain('350');
    expect(numbers).toContain('12');
    expect(numbers).not.toContain('2.5');
    expect(numbers).not.toContain('10');
    expect(numbers).not.toContain('95');
    expect(numbers).not.toContain('13');
  });

  it('passes when all numbers are in the allowed set', () => {
    const allowed = new Set(['220', '350', '12', '90']);
    const text = 'Shift your 12 km commute to save 90% exposure when PM2.5 is 220.';
    const res = verifyNumbers(text, allowed);

    expect(res.passed).toBe(true);
    expect(res.unverified.length).toBe(0);
  });

  it('rejects and reports unverified hallucinated figures', () => {
    const allowed = new Set(['220', '12']);
    const text = 'This new filter reduces your risk by 99.8% and costs 4500 rupees.';
    const res = verifyNumbers(text, allowed);

    expect(res.passed).toBe(false);
    expect(res.unverified).toContain('99.8');
    expect(res.unverified).toContain('4500');
  });
});
