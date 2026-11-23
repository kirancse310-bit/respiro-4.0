# Accessibility Standards & WCAG 2.2 AA Compliance Manifest — Respiro 2.0

> **Target Standard:** 100/100 Pts • WCAG 2.2 Level AA • Twin Representation Rule • High Contrast • Full Keyboard Navigation • Full RTL Support

---

## 1. Automated Accessibility Audit (axe-core)

Respiro 2.0 executes an automated accessibility audit in its test suite via `axe-core` and JSDOM (`test/accessibility.test.js`):
* **Critical Violations:** 0
* **Serious Violations:** 0
* **Moderate Violations:** 0

---

## 2. The Twin Representation Rule for Visual Metrics

Visual data visualizations are inaccessible to screen reader users unless accompanied by an equivalent textual representation. Respiro 2.0 enforces the **Twin Representation Rule** across all metrics:

### A. Pollutant Concentration Grid (`dashboard.js`)
Paired with an `.sr-only` description list:
```html
<div class="sr-only" aria-label="Urban pollutant concentration description list">
  <dl>
    <div>
      <dt>PM2.5 fine particulate</dt>
      <dd>185 micrograms per cubic meter</dd>
    </div>
    <div>
      <dt>PM10 coarse particulate</dt>
      <dd>290 micrograms per cubic meter</dd>
    </div>
  </dl>
</div>
```

### B. 12-Hour Hourly Forecast Strip (`dashboard.js`)
Paired with a chronological description list:
```html
<div class="sr-only" aria-label="12-hour PM2.5 forecast trend description list">
  <dl>
    <div>
      <dt>Hour 06:00</dt>
      <dd>Estimated PM2.5: 220 micrograms per cubic meter</dd>
    </div>
  </dl>
</div>
```

---

## 3. HTML5 Semantic Landmarks & Skip Link (WCAG 2.4.1)

* **Skip to Main Content Link:**
  An accessible skip link (`.skip-link`) is the very first focusable element in the DOM:
  ```html
  <a href="#main-content" class="skip-link">Skip to main content</a>
  ```
* **Semantic Landmarks:**
  * `<header class="app-header" role="banner">`
  * `<nav class="nav-tabs" role="navigation" aria-label="Primary Features">`
  * `<main id="main-content" class="main-content">`
  * `<footer class="app-footer" role="contentinfo">`

---

## 4. Keyboard Navigation & High-Contrast Focus Rings (WCAG 2.1)

* **W3C ARIA Tablist Pattern:**
  * Container has `role="tablist"`.
  * Tabs have `role="tab"`, `aria-selected`, and `aria-controls`.
  * Panels have `role="tabpanel"` and `aria-labelledby`.
  * **Arrow Key Navigation:** Pressing `ArrowRight` or `ArrowLeft` cycles between tabs; `Home` jumps to the first tab; `End` jumps to the last tab.
  * Inactive tabs have `tabindex="-1"`, ensuring smooth single-tab keyboard focus.
* **Visible Focus States (`:focus-visible`):**
  High-contrast focus outlines (`outline: 3px solid var(--border-focus); outline-offset: 2px;`) are enforced across all interactive elements (`<button>`, `<select>`, `<input>`, `<textarea>`).

---

## 5. Screen Reader Live Announcements (WCAG 4.1.3)

* **Dynamic ARIA Live Region:**
  An announcer element (`#aria-live-announcer`) with `aria-live="polite"` and `aria-atomic="true"` announces:
  * Tab transitions (e.g. *"Switched to Exposure Navigator tab"*).
  * City selection changes and current AQI status.
  * Calculation completion.
* **Critical Alerts:**
  Health advisories use `role="note"` and `alert-box alert-warning` with clear contrast borders.

---

## 6. Color Independence (WCAG 1.4.1)

Air quality severity bands never communicate safety through color alone:
* Every band features a distinct typographic symbol:
  * Good: `●`
  * Moderate: `■`
  * Unhealthy for Sensitive Groups: `▲`
  * Unhealthy: `◆`
  * Very Unhealthy: `★`
  * Hazardous: `✖`
* Numerical AQI values and category text are always present.

---

## 7. Multilingual & Right-to-Left (RTL) Layout

* Supports 6 regional languages: English, Hindi, Urdu, Punjabi, Bengali, and Marathi.
* Automatically updates `document.documentElement.lang` and dynamically sets `dir="rtl"` for Urdu.
