/**
 * @fileoverview AI Routine Optimizer View Controller.
 * Handles household inputs, deterministic facts rendering, and Number-Firewall verified routines.
 * @module routine-view
 */

import { api } from './api.js';

/**
 * Initializes the AI routine optimizer form, attaches submit event listeners,
 * and renders calibrated protective schedules and deterministic health impact facts.
 *
 * @param {Function} getCurrentAirData - State accessor callback returning current telemetry.
 * @returns {void}
 */
export function setupRoutineView(getCurrentAirData) {
  const form = document.getElementById('routine-form');
  const resultsContainer = document.getElementById('routine-results');
  if (!form || !resultsContainer) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const airData = getCurrentAirData();
    if (!airData) return;

    resultsContainer.innerHTML = '<p class="alert-box" aria-live="polite">Optimizing routine against deterministic health impact models...</p>';

    const profile = {
      hasVulnerable: /** @type {HTMLInputElement} */ (document.getElementById('prof-vulnerable')).checked,
      commuteMode: /** @type {HTMLSelectElement} */ (document.getElementById('prof-commute')).value,
      commuteKm: Number(/** @type {HTMLInputElement} */ (document.getElementById('prof-distance')).value) || 12,
      outdoorHours: Number(/** @type {HTMLInputElement} */ (document.getElementById('prof-outdoor-hours')).value) || 2,
    };

    const notes = /** @type {HTMLTextAreaElement} */ (document.getElementById('prof-notes')).value;

    try {
      const plan = await api.generateRoutine(profile, airData, notes);
      
      resultsContainer.innerHTML = `
        <div class="card" style="margin-top: 24px; border-left: 5px solid var(--accent);" aria-live="polite">
          <div class="card-header">
            <h3 class="card-title">Tailored Smog Defense Routine</h3>
            <span class="provenance-tag">Engine: ${plan.engineSource}</span>
          </div>
          <p style="font-size: 1.05rem; margin-bottom: 20px;">${plan.summary}</p>
          
          <div style="display: flex; flex-direction: column; gap: 16px;">
            ${plan.routines.map((r, i) => `
              <div style="background: var(--bg-elevated); padding: 16px; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
                <h4 style="font-size: 1.05rem; font-weight: 700; margin-bottom: 6px; color: var(--primary);">${i + 1}. ${r.title}</h4>
                <p style="margin-bottom: 8px;">${r.action}</p>
                <div style="font-size: 0.85rem; color: var(--accent); font-weight: 700;">
                  ★ Direct Impact: ${r.impact}
                </div>
              </div>
            `).join('')}
          </div>

          <div style="margin-top: 24px; border-top: 1px solid var(--border-color); padding-top: 16px;">
            <h4 style="font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-dim); margin-bottom: 12px;">Verified Deterministic Facts</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
              ${plan.facts.map((f) => `
                <div style="background: var(--bg-surface); border: 1px solid var(--border-color); padding: 10px; border-radius: var(--radius-sm);">
                  <div style="font-size: 0.8rem; color: var(--text-dim);">${f.label}</div>
                  <div style="font-size: 1.1rem; font-weight: 800; font-family: var(--font-mono);">${f.value} ${f.unit}</div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `;
    } catch (err) {
      resultsContainer.innerHTML = `<p class="alert-box alert-warning">Optimization error: ${err.message}</p>`;
    }
  });
}
