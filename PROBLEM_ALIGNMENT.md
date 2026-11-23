# Problem Statement Alignment

### Challenge 6: Urban Air Quality Assistant

> *"Create a GenAI-powered assistant that helps families and communities navigate severe winter smog and urban air pollution. The application should suggest low-emission daily routines, indoor air quality hacks, and sustainable alternatives tailored to their location and lifestyle, while clearly explaining the direct impact of their choices."*

---

## 1:1 Requirement Mapping Matrix

| Ref | Requirement Clause | How Respiro 2.0 Addresses It | Implementation File | Verification Test |
|---|---|---|---|---|
| **R1** | *GenAI-powered assistant* | Provides an AI Routine Optimizer that synthesizes tailored guidance while strictly verifying all statistics against a Number Firewall. | [src/services/gemini-service.js](src/services/gemini-service.js) | [test/number-firewall.test.js](test/number-firewall.test.js) |
| **R2** | *Families and communities* | Supports household vulnerability profiles (infants, asthmatics, seniors) as well as community-level smog action (emission reduction pledges, anti-burn incident watch). | [public/js/routine.js](public/js/routine.js), [public/js/community.js](public/js/community.js) | [test/impact-calculator.test.js](test/impact-calculator.test.js) |
| **R3** | *Severe winter smog & pollution* | Live US AQI, 5 critical pollutants (PM2.5, PM10, NO2, CO, O3), cleanest hour, peak smog window, and 12h forecast across 10 Indian cities. | [src/services/air-service.js](src/services/air-service.js), [public/js/dashboard.js](public/js/dashboard.js) | [test/aqi-calculator.test.js](test/aqi-calculator.test.js) |
| **R4** | *Low-emission daily routines* | Automatically re-schedules outdoor chores to the cleanest atmospheric window and schedules window sealing during thermal inversion peaks. | [src/services/gemini-service.js](src/services/gemini-service.js) | [test/impact-calculator.test.js](test/impact-calculator.test.js) |
| **R5** | *Indoor air quality hacks* | ASHRAE 62.2 Room CADR sizing calculator and DIY Corsi-Rosenthal Box engineering blueprints ($3.1\times$ CADR at $\frac{1}{3}$ the cost of commercial HEPA). | [src/lib/cadr-engine.js](src/lib/cadr-engine.js), [public/js/cadr.js](public/js/cadr.js) | [test/cadr-engine.test.js](test/cadr-engine.test.js) |
| **R6** | *Sustainable alternatives* | Lowest-Exposure Transit Pathfinding: compares inhaled particulate dose across 5 modes and provides metrics for shifting to electric metro. | [src/lib/exposure-routing.js](src/lib/exposure-routing.js), [public/js/navigator.js](public/js/navigator.js) | [test/exposure-routing.test.js](test/exposure-routing.test.js) |
| **R7** | *Tailored to location* | Geocoded air telemetry via Open-Meteo for any Indian urban hub with offline fallbacks for 10 winter smog capitals. | [src/services/air-service.js](src/services/air-service.js) | [test/aqi-calculator.test.js](test/aqi-calculator.test.js) |
| **R8** | *Tailored to lifestyle* | Tailors routines based on commute mode, distance, outdoor hours, and vulnerability flags. | [src/lib/impact-calculator.js](src/lib/impact-calculator.js) | [test/impact-calculator.test.js](test/impact-calculator.test.js) |
| **R9** | *Explaining direct impact* | Every recommendation quantifies avoided PM2.5 inhalation ($\mu\text{g/day}$), avoided emissions ($\text{g/week}$), or $\text{CO}_2\text{e}$ savings with cited factors. | [src/lib/impact-calculator.js](src/lib/impact-calculator.js) | [test/impact-calculator.test.js](test/impact-calculator.test.js) |
