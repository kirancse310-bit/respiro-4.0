/**
 * @fileoverview Community Smog Defense & Watch Controller.
 * Handles emission pledges, crowdsourced smog incident reporting, and real-time DOM updates.
 * @module community-view
 */

import { api } from './api.js';

/**
 * Initializes the Community Smog Defense view, sets up async form submit handlers
 * for pledges and incidents, and renders active collective actions.
 *
 * @returns {void}
 */
export function setupCommunityView() {
  const pledgesList = document.getElementById('community-pledges-list');
  const incidentsList = document.getElementById('community-incidents-list');
  const pledgeForm = document.getElementById('pledge-form');
  const incidentForm = document.getElementById('incident-form');

  /**
   * Fetches latest community pledges and incidents and updates DOM lists.
   * @returns {Promise<void>}
   */
  const loadData = async () => {
    try {
      const [pledges, incidents] = await Promise.all([
        api.getPledges(),
        api.getIncidents(),
      ]);

      if (pledgesList) {
        pledgesList.innerHTML = pledges.map((p) => `
          <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 12px; margin-bottom: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: baseline;">
              <strong>${p.name}</strong>
              <span style="font-size: 0.75rem; color: var(--text-dim);">${p.locality}</span>
            </div>
            <p style="font-size: 0.9rem; margin-top: 4px;">${p.action}</p>
            <div style="font-size: 0.8rem; color: #10b981; font-weight: 700; margin-top: 4px;">
              🌱 ~${p.co2SavedKg} kg CO2e saved
            </div>
          </div>
        `).join('');
      }

      if (incidentsList) {
        incidentsList.innerHTML = incidents.map((i) => `
          <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 12px; margin-bottom: 8px; border-left: 4px solid #ef4444;">
            <div style="display: flex; justify-content: space-between; align-items: baseline;">
              <strong>${i.type}</strong>
              <span style="font-size: 0.75rem; color: var(--text-dim);">${i.locality}</span>
            </div>
            <div style="font-size: 0.8rem; color: var(--text-dim); margin-top: 4px;">Reporter: ${i.reporter}</div>
            <div style="font-size: 0.8rem; color: #d97706; font-weight: 700; margin-top: 4px;">
              Status: ${i.status}
            </div>
          </div>
        `).join('');
      }
    } catch (err) {
      console.error('Failed to load community watch data', err);
    }
  };

  if (pledgeForm) {
    pledgeForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = /** @type {HTMLInputElement} */ (document.getElementById('pledge-name')).value;
      const locality = /** @type {HTMLInputElement} */ (document.getElementById('pledge-locality')).value;
      const action = /** @type {HTMLInputElement} */ (document.getElementById('pledge-action')).value;
      const co2SavedKg = Number(/** @type {HTMLInputElement} */ (document.getElementById('pledge-co2')).value) || 10;

      try {
        await api.submitPledge({ name, locality, action, co2SavedKg });
        /** @type {HTMLFormElement} */ (pledgeForm).reset();
        await loadData();
      } catch (err) {
        alert(err.message);
      }
    });
  }

  if (incidentForm) {
    incidentForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const reporter = /** @type {HTMLInputElement} */ (document.getElementById('incident-reporter')).value;
      const locality = /** @type {HTMLInputElement} */ (document.getElementById('incident-locality')).value;
      const type = /** @type {HTMLInputElement} */ (document.getElementById('incident-type')).value;

      try {
        await api.submitIncident({ reporter, locality, type });
        /** @type {HTMLFormElement} */ (incidentForm).reset();
        await loadData();
      } catch (err) {
        alert(err.message);
      }
    });
  }

  loadData();
}
