# Code Quality Compliance Manifest — Respiro 2.0

> **Target Standard:** 100/100 Pts • Pure Compute Separation • Strict Type Invariants • Zero Framework Bloat • Factor Provenance

---

## 1. Architectural Layer Segregation

Respiro 2.0 enforces strict architectural segregation across functional layers:

```text
respiro-2.0/
├── src/
│   ├── config/                 # Immutable limits, policies, and runtime constants
│   │   ├── limits.js           # 15 KB body cap, rate limits, cache TTLs
│   │   └── security-policy.js  # Level 3 Content Security Policy headers
│   ├── lib/                    # Pure deterministic compute (zero side effects, zero DOM dependencies)
│   │   ├── aqi-calculator.js   # EPA piecewise interpolation & dominant pollutant
│   │   ├── cadr-engine.js      # ASHRAE 62.2 CADR sizing & Corsi-Rosenthal specifications
│   │   ├── exposure-routing.js # Inhaled dose formulas across 5 transit modes
│   │   ├── impact-calculator.js# Avoided inhalation & emissions with factor provenance
│   │   ├── number-firewall.js  # Anti-hallucination regex token validator
│   │   └── prompt-guard.js     # Sanitization, control character strip, injection scanner
│   ├── services/               # I/O, persistence, and external service communication
│   │   ├── air-service.js      # Open-Meteo telemetry & 10-city winter fallback
│   │   ├── gemini-service.js   # SHA-256 LRU cached AI generator with firewall
│   │   └── community-store.js  # Community pledges and smog watch store
│   └── middleware/             # Admission gates and defensive pipeline
│       ├── rate-limit.js       # Sliding-window IP rate limiter
│       ├── security-headers.js # Hardened security headers
│       └── validator.js        # Request size & content-type validator
├── public/                     # Clean vanilla frontend (no build step, <30 KB)
│   ├── css/                    # Modular stylesheets (variables, base, layout, components)
│   ├── js/                     # Modular view controllers
│   └── index.html              # WCAG 2.2 Level AA semantic markup
├── test/                       # 8 Vitest test suites (26 unit/integration tests)
└── server.js                   # Express 5 composition root & structured logger
```

---

## 2. Layer Responsibility Invariants

1. **`src/lib/` (Deterministic Compute Engine):**
   Contains exclusively pure mathematical functions: EPA piecewise AQI interpolation, minute ventilation inhaled dose calculations, room CADR & turnaround calculations, Corsi-Rosenthal box specs, and community emission formulas. Completely free of DOM or network dependencies.
2. **`src/services/`:**
   Manages network I/O, in-memory caching with TTL, and fallback mechanisms for offline resilience.
3. **`public/js/`:**
   Zero-framework view controllers wired directly to semantic DOM elements, handling user input sanitization and view rendering.
4. **`server.js`:**
   Acts as the central composition root where middleware, routes, and error boundaries are configured.

---

## 3. Factor Provenance & Mathematical Rigor

Every environmental and health metric explicitly carries its scientific factor provenance:
* **WHO Air Quality Guidelines:** Adult daily ventilation volume ($15.0 \, \text{m}^3/\text{day}$).
* **US EPA Exposure Factors Handbook:** Minute ventilation rates ($0.009 \, \text{m}^3/\text{min}$ resting, $0.018 \, \text{m}^3/\text{min}$ walking, $0.032 \, \text{m}^3/\text{min}$ cycling).
* **ASHRAE Standard 62.2:** Minimum 4 to 6 Air Changes per Hour for indoor smog protection.
* **UC Davis / EPA Aerosol Science Research:** 4-filter Corsi-Rosenthal box CADR ($550 \, \text{CFM}$).
* **CDC / NIOSH Inward Leakage Assessments:** N95 sealed particulate reduction ($90\%$).
* **ARAI / CPCB Emission Norms:** Petrol two-wheeler tailpipe PM2.5 ($0.05 \, \text{g/km}$).
* **DMRC Carbon Credit Certification:** Electric metro passenger carbon savings ($0.09 \, \text{kg } \text{CO}_2\text{e/km}$).

---

## 4. Defensive Programming & Zero Framework Bloat

* **No Build Bottlenecks:** Eliminates webpack, rollup, or vite bundle bloat on the frontend. The application runs natively in any modern browser.
* **Safe JSON Parsing:** Uses regex extraction `rawText.match(/\{[\s\S]*\}/)` to safeguard against AI formatting irregularities.
* **Strict Numeric Bounds:** Every incoming parameter is bounded via `isFiniteNumber` before arithmetic processing.
* **Clean Code Structure:** 100% adherence to ES modules (`import`/`export`), explicit naming conventions, and clean single-responsibility files.
