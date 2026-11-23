# Testing & Quality Verification Suite — Respiro 2.0

Respiro 2.0 features an automated test suite executed via **Vitest** with JSDOM and axe-core.

---

## 1. Test Summary

```text
 RUN  v3.2.7 c:/Users/udayk/OneDrive/Desktop/Promptwars/respiro-2.0

 ✓ test/prompt-guard.test.js (4 tests)
 ✓ test/number-firewall.test.js (3 tests)
 ✓ test/aqi-calculator.test.js (3 tests)
 ✓ test/cadr-engine.test.js (4 tests)
 ✓ test/exposure-routing.test.js (3 tests)
 ✓ test/server-security.test.js (5 tests)
 ✓ test/impact-calculator.test.js (3 tests)
 ✓ test/accessibility.test.js (4 tests)

 Test Files  8 passed (8)
      Tests  29 passed (29)
   Pass Rate  100%
   Duration   ~4.7s
```

---

## 2. Test Suite Breakdown

### A. Security & Input Sanitization (OWASP Top 10 & CWE Hardened)
1. `test/server-security.test.js` (5 tests):
   * Enforces Content Security Policy, X-Frame-Options, and X-Content-Type-Options.
   * Blocks payloads exceeding the 15 KB limit with HTTP 413 (*CWE-400 DoS defense*).
   * Enforces sliding-window rate limits (HTTP 429) once request budget is exhausted (*CWE-799*).
   * Strips non-printable control characters `[\x00-\x1f\x7f]` from incoming input (*CWE-20*).
   * Enforces physical numeric bounds via `isFiniteNumber` (e.g. AQI 0–1000, PM2.5 0–2000).
2. `test/prompt-guard.test.js` (4 tests):
   * Strips invisible zero-width unicode characters (`\u200B`, `\uFEFF`, `\u202E`).
   * HTML sanitization for XSS prevention.
   * Detection of prompt injection patterns (system prompt bypass, DAN, script tags).
   * Context delimiter fencing (`<user_notes>`).
3. `test/number-firewall.test.js` (3 tests):
   * Validates numeral extraction while safely ignoring scientific terms (`PM2.5`, `PM10`, `N95`, `MERV-13`).
   * Passes when all numbers are verified in the deterministic fact sheet.
   * Rejects and reports unverified hallucinated figures.

### B. Scientific & Environmental Calculations
4. `test/aqi-calculator.test.js` (3 tests):
   * Piecewise linear interpolation across all EPA PM2.5 and PM10 breakpoints.
   * Symbol and severity band categorization (Good to Hazardous).
   * Dominant pollutant determination.
5. `test/cadr-engine.test.js` (4 tests):
   * Room volume calculations (cu ft and cu m).
   * ASHRAE 62.2 required CADR for 4 Air Changes per Hour.
   * Particulate clearance turnaround times for 80% and 99% reduction.
   * Corsi-Rosenthal vs commercial HEPA comparison metrics.
6. `test/exposure-routing.test.js` (3 tests):
   * Inhaled dose formula with ventilation rates and penetration coefficients.
   * Validates that cycling on roadways has higher inhaled dose than closed transit due to hyperventilation.
   * Multi-modal journey comparison and percentage dose reduction.
7. `test/impact-calculator.test.js` (3 tests):
   * Daily PM2.5 inhalation mass avoided with fitted N95 masks.
   * Weekly emissions prevented by switching from motorbike to electric metro.
   * Deterministic fact sheet generation with allowed numbers set.

### C. Automated Accessibility & WCAG 2.2 AA
8. `test/accessibility.test.js` (4 tests):
   * Verifies WCAG 2.4.1 Skip Link (`#main-content`).
   * Validates semantic landmarks (`header`, `nav`, `main`, `footer`).
   * Verifies ARIA tablist/tabpanel bidirectional bindings.
   * Form input and label bindings (`aria-label`, `<label for="...">`).
   * Runs automated `axe-core` audit on the DOM, asserting **zero critical or serious accessibility violations**.

---

## 3. Running the Tests

```bash
# Run all tests
npm test

# Run tests with code coverage
npm run test:coverage
```
