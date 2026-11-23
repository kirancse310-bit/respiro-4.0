/**
 * @fileoverview Clean Air Engineering & CADR Calculator View Controller.
 * Manages room dimension form submissions, computes required CADR according to ASHRAE 62.2,
 * and renders comparative tables for DIY Corsi-Rosenthal boxes versus commercial HEPA purifiers.
 * @module cadr-view
 */

import { api } from './api.js';

/**
 * Initializes the CADR calculator view, binds form submit event handlers,
 * and handles dynamic rendering of room sizing and engineering comparison data.
 *
 * @returns {void}
 */
export function setupCADRView() {
  const form = document.getElementById('cadr-form');
  const resultsContainer = document.getElementById('cadr-results');
  if (!form || !resultsContainer) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const lengthFt = Number(/** @type {HTMLInputElement} */ (document.getElementById('cadr-length')).value) || 15;
    const widthFt = Number(/** @type {HTMLInputElement} */ (document.getElementById('cadr-width')).value) || 12;
    const heightFt = Number(/** @type {HTMLInputElement} */ (document.getElementById('cadr-height')).value) || 9;

    try {
      const data = await api.calculateCADR(lengthFt, widthFt, heightFt);

      resultsContainer.innerHTML = `
        <div class="card" style="margin-top: 24px;" aria-live="polite">
          <div class="card-header">
            <h3 class="card-title">Filtration Sizing for ${data.room.roomAreaSqFt} sq ft (${data.room.volumeCuFt} cu ft)</h3>
            <span class="provenance-tag">ASHRAE 62.2 Standard</span>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 24px;">
            <div style="background: var(--bg-elevated); padding: 16px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); text-align: center;">
              <div style="font-size: 0.85rem; color: var(--text-dim);">Required CADR (4 ACH)</div>
              <div style="font-size: 2rem; font-weight: 900; color: var(--primary); font-family: var(--font-mono);">${data.room.requiredCADR} CFM</div>
              <div style="font-size: 0.8rem; color: var(--text-dim);">${data.room.requiredCADR_M3H} m³/h</div>
            </div>
            <div style="background: var(--bg-elevated); padding: 16px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); text-align: center;">
              <div style="font-size: 0.85rem; color: var(--text-dim);">Corsi-Rosenthal Advantage</div>
              <div style="font-size: 2rem; font-weight: 900; color: #10b981; font-family: var(--font-mono);">${data.cadrAdvantageRatio}x</div>
              <div style="font-size: 0.8rem; color: var(--text-dim);">More Clean Air Delivery</div>
            </div>
          </div>

          <h4 style="margin-bottom: 12px; font-size: 1.1rem;">Engineering Comparison: DIY Corsi-Rosenthal vs Commercial HEPA</h4>
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem;">
              <thead>
                <tr style="border-bottom: 2px solid var(--border-color);">
                  <th style="padding: 10px;">Metric</th>
                  <th style="padding: 10px; color: var(--accent);">DIY Corsi-Rosenthal Box</th>
                  <th style="padding: 10px;">Commercial HEPA Purifier</th>
                </tr>
              </thead>
              <tbody>
                <tr style="border-bottom: 1px solid var(--border-color);">
                  <td style="padding: 10px; font-weight: 700;">Clean Air Delivery (CADR)</td>
                  <td style="padding: 10px; font-family: var(--font-mono); font-weight: 700; color: #10b981;">${data.corsiRosenthal.cadr} CFM</td>
                  <td style="padding: 10px; font-family: var(--font-mono);">${data.commercialHEPA.cadr} CFM</td>
                </tr>
                <tr style="border-bottom: 1px solid var(--border-color);">
                  <td style="padding: 10px; font-weight: 700;">Delivered Air Changes (ACH)</td>
                  <td style="padding: 10px; font-family: var(--font-mono);">${data.corsiRosenthal.ach} ACH</td>
                  <td style="padding: 10px; font-family: var(--font-mono);">${data.commercialHEPA.ach} ACH</td>
                </tr>
                <tr style="border-bottom: 1px solid var(--border-color);">
                  <td style="padding: 10px; font-weight: 700;">Time to 80% Smog Reduction</td>
                  <td style="padding: 10px; font-family: var(--font-mono); font-weight: 700; color: #10b981;">${data.corsiRosenthal.turnaround80Percent} min</td>
                  <td style="padding: 10px; font-family: var(--font-mono);">${data.commercialHEPA.turnaround80Percent} min</td>
                </tr>
                <tr style="border-bottom: 1px solid var(--border-color);">
                  <td style="padding: 10px; font-weight: 700;">Estimated Build / Buy Cost</td>
                  <td style="padding: 10px; font-family: var(--font-mono); font-weight: 700; color: #10b981;">₹${data.corsiRosenthal.estimatedCostINR} ($${data.corsiRosenthal.estimatedCostUSD})</td>
                  <td style="padding: 10px; font-family: var(--font-mono);">₹${data.commercialHEPA.estimatedCostINR} ($${data.commercialHEPA.estimatedCostUSD})</td>
                </tr>
                <tr>
                  <td style="padding: 10px; font-weight: 700;">Bill of Materials</td>
                  <td style="padding: 10px; font-size: 0.8rem;">${data.corsiRosenthal.filterType}</td>
                  <td style="padding: 10px; font-size: 0.8rem;">${data.commercialHEPA.filterType}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      `;
    } catch (err) {
      resultsContainer.innerHTML = `<p class="alert-box alert-warning">CADR computation error: ${err.message}</p>`;
    }
  });
}
