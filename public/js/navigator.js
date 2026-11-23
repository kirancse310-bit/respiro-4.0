/**
 * Exposure Navigator View Controller.
 * Interactively compares cumulative inhaled particulate dose across 5 transport modes.
 */

import { api } from './api.js';

export function setupNavigatorView(getCurrentAirData) {
  const distInput = document.getElementById('nav-distance');
  const distVal = document.getElementById('nav-dist-val');
  const compareBtn = document.getElementById('nav-compare-btn');
  const resultsContainer = document.getElementById('nav-results');

  if (!distInput || !compareBtn || !resultsContainer) return;

  distInput.addEventListener('input', () => {
    distVal.textContent = `${distInput.value} km`;
  });

  const runComparison = async () => {
    const airData = getCurrentAirData();
    const pm25 = airData?.pollutants?.pm2_5 || 150;
    const distanceKm = Number(distInput.value) || 8;

    try {
      const res = await api.compareRoute(distanceKm, pm25);
      const maxDose = Math.max(...res.options.map((o) => o.inhaledDoseUg));

      resultsContainer.innerHTML = `
        <div class="card" style="margin-top: 24px;" aria-live="polite">
          <div class="card-header">
            <h3 class="card-title">Inhaled Dose Comparison (${distanceKm} km at ${pm25} µg/m³ PM2.5)</h3>
            <span class="provenance-tag">Source: EPA Exposure Factors</span>
          </div>

          <div class="alert-box" style="background: var(--accent-light); color: var(--text-main); border-left-color: var(--accent);">
            <strong>Safest Mode: ${res.safestMode}</strong> delivers a <strong>${res.percentReduction}% reduction</strong> in inhaled particulate dose compared to the most exposed option (saving ~${res.doseAvoidedUg} µg of deep-lung deposition).
          </div>

          <div style="margin-top: 20px;">
            ${res.options.map((opt) => {
              const pct = maxDose > 0 ? Math.round((opt.inhaledDoseUg / maxDose) * 100) : 10;
              const barColor = opt.inhaledDoseUg > 40 ? '#ef4444' : opt.inhaledDoseUg > 15 ? '#f97316' : '#10b981';
              return `
                <div class="bar-chart-row">
                  <div class="bar-label-group">
                    <span>${opt.name} (${opt.durationMin} min)</span>
                    <span style="font-family: var(--font-mono);">${opt.inhaledDoseUg} µg</span>
                  </div>
                  <div class="bar-track">
                    <div class="bar-fill" style="width: ${pct}%; background-color: ${barColor};" role="progressbar" aria-valuenow="${opt.inhaledDoseUg}" aria-valuemin="0" aria-valuemax="${maxDose}"></div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    } catch (err) {
      resultsContainer.innerHTML = `<p class="alert-box alert-warning">Route exposure error: ${err.message}</p>`;
    }
  };

  compareBtn.addEventListener('click', runComparison);
}
