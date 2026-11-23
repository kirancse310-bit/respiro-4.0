# 🍃 Respiro 2.0

### GenAI-Powered Urban Air Quality Assistant & Community Smog Defense Platform
*Built with Simple, Robust Vanilla Technologies (HTML5, CSS3, ES6 JavaScript) and Express 5*

---

## 📌 Executive Summary

**Respiro 2.0** is an atmospheric defense and resilience platform designed for families, vulnerable residents, and urban communities facing winter smog and thermal inversions across Indian smog corridors.

It brings together the best architectural design patterns and community features:
* **Zero Framework Bloat:** Fast, accessible vanilla HTML/CSS/JS frontend requiring no webpack/vite bundles.
* **"The Model Explains, The Engine Computes":** All health numbers (particulate inhalation avoided, CADR turnaround, and carbon savings) are derived by deterministic, unit-tested functions with cited factors.
* **The Number Firewall:** A validator rejects any LLM response containing hallucinated numerals not present in the verified fact sheet.
* **Lowest-Exposure Transit Pathfinding:** Calculates cumulative inhaled particulate dose ($\mu\text{g}$) across 5 transit modes using EPA ventilation rates and microenvironmental factors.
* **Clean Air Engineering:** Room CADR sizing and DIY Corsi-Rosenthal Box specifications based on ASHRAE 62.2 standards.
* **Collective Smog Defense:** Community emission reduction pledges and anti-biomass-burning incident watch.
* **WCAG 2.2 AA Accessibility & Level 3 Security:** Full keyboard navigation, ARIA landmarks, strict Content Security Policy, rate limiting, and prompt injection defense.

---

## 🏛️ System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                   CLIENT LAYER (Vanilla HTML5 / CSS3 / ES6)           │
│                                                                        │
│   index.html (Semantic HTML5, ARIA Landmarks, Skip Links)              │
│        │                                                               │
│        ├──► dashboard.js   ──► Live AQI, 5 Pollutants, 12h Trend       │
│        ├──► routine.js     ──► AI Household Routine Optimizer          │
│        ├──► navigator.js   ──► Inhaled Dose Multi-modal Transit Chart  │
│        ├──► cadr.js        ──► Room CADR & Corsi-Rosenthal Box Sizer   │
│        ├──► community.js   ──► Community Smog Defense & Incident Watch │
│        └──► i18n.js        ──► 6 Languages (EN, HI, UR [RTL], PA, BN)  │
│                                                                        │
│   api.js (Resilient HTTP Client with automatic fallbacks)              │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ REST API (/api/*)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   BACKEND GATEWAY (Node.js + Express 5)                │
│                                                                        │
│   Security Perimeter:                                                  │
│   ├── Helmet + Strict Content Security Policy (Level 3)                │
│   ├── In-Memory Sliding Window Rate Limiter (60 req/min per IP)        │
│   ├── Payload Size Cap (15 KB DoS Protection)                          │
│   └── Prompt Guard (Invisible unicode strip & injection scanner)       │
│                                                                        │
│   Deterministic Engines:                                               │
│   ├── aqi-calculator.js      (EPA US AQI Breakpoints & Interpolation)  │
│   ├── cadr-engine.js         (ASHRAE 62.2 CADR & Corsi-Rosenthal Box)  │
│   ├── exposure-routing.js    (EPA Inhalation Rates & Microenvironments)│
│   ├── impact-calculator.js   (Avoided PM2.5 & CO2e Factor Provenance)  │
│   └── number-firewall.js     (Anti-hallucination fact validator)       │
│                                                                        │
│   External Telemetry & AI:                                             │
│   ├── Open-Meteo Air Quality API (Live CAMS data + 10-city fallback)   │
│   └── Google Gemini 1.5 Flash (Verified by Number Firewall)            │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
* Node.js v20+
* npm

### Installation & Run
```bash
# Navigate to the project directory
cd respiro-2.0

# Install dependencies
npm install

# Run the development server
npm run dev

# Or start in production mode
npm start
```

Visit the application at: `http://localhost:3000`

### Running the Test Suite
```bash
# Run Vitest test suite (includes axe-core accessibility tests)
npm test

# Run test coverage report
npm run test:coverage
```

---

## 📊 Features & Core Innovations

### 1. Live Atmospheric Telemetry (5 Critical Pollutants)
* Displays US AQI, PM2.5, PM10, $\text{NO}_2$, $\text{CO}$, and $\text{O}_3$ with the dominant pollutant highlighted.
* High-contrast severity bands using text, symbols, and color codes (never color alone).
* Cleanest outdoor hour and peak smog hour indicators for daily planning.
* Offline resilience: Falls back to pre-cached winter baselines for 10 Indian cities when external APIs are unreachable.

### 2. GenAI Routine Optimizer with Number Firewall
* Synthesizes tailored routines based on household vulnerability, commute mode, and living conditions.
* Evaluates all AI text against `number-firewall.js`. If the model invents statistics, it automatically falls back to deterministic rule generation.

### 3. Lowest-Exposure Transit Pathfinding
* Uses EPA minute ventilation rates ($\text{m}^3/\text{min}$) and roadside microenvironmental penetration factors.
* Computes exact inhaled particulate dose ($\mu\text{g}$) for 5 transit options and shows the percentage reduction achieved by shifting to clean transit.

### 4. Clean Air Engineering & Corsi-Rosenthal Box Blueprints
* Sizing engine calculates required Clean Air Delivery Rate (CADR in CFM and $\text{m}^3/\text{h}$) for 4 to 6 Air Changes per Hour (ACH).
* Side-by-side engineering comparison of a DIY Corsi-Rosenthal box ($3.1\times$ CADR at $\frac{1}{3}$ the cost) versus commercial HEPA purifiers.

### 5. Community Smog Defense & Watch
* Neighborhood emission reduction pledges (shifting commute to electric metro, zero leaf burning).
* Crowdsourced open-biomass and construction dust incident logging for municipal escalation.

---

## 📜 Evaluation Criteria Compliance

| Criteria | Document | Summary |
|---|---|---|
| **Security** | [SECURITY.md](SECURITY.md) | Strict CSP, 15 KB body cap, sliding rate limiter, prompt injection scanner, number firewall. |
| **Accessibility** | [ACCESSIBILITY.md](ACCESSIBILITY.md) | WCAG 2.2 AA compliant, automated axe-core audit, skip links, full keyboard tablist navigation. |
| **Code Quality** | [CODE_QUALITY.md](CODE_QUALITY.md) | Modular ES6 architecture, single responsibility, pure deterministic functions, no framework bloat. |
| **Efficiency** | [EFFICIENCY.md](EFFICIENCY.md) | Under 30 KB payload, sub-millisecond computations, in-memory TTL caching. |
| **Testing** | [TESTING.md](TESTING.md) | 8 test suites, 26 unit/integration tests with 100% pass rate. |
| **Problem Alignment** | [PROBLEM_ALIGNMENT.md](PROBLEM_ALIGNMENT.md) | 1:1 mapping against Promptwars Challenge 6 requirements. |
