/**
 * @fileoverview Respiro 2.0 Client API Service.
 * Manages HTTP communication with the backend REST API gateway,
 * handles JSON serialization, and provides error handling for all view controllers.
 * @module api
 */

/**
 * Respiro 2.0 Frontend API Client singleton.
 * @type {Readonly<Object>}
 */
export const api = {
  /**
   * Retrieves real-time air quality telemetry and hourly forecasts for a given city.
   *
   * @param {string} city - Target city query string.
   * @returns {Promise<Object>} Inbound air quality payload including pollutants and AQI.
   * @throws {Error} If network response is not OK.
   */
  async getAir(city) {
    const res = await fetch(`/api/air?city=${encodeURIComponent(city)}`);
    if (!res.ok) throw new Error('Failed to retrieve air telemetry');
    return res.json();
  },

  /**
   * Requests an AI-optimized routine from Gemini or deterministic fallback engine.
   *
   * @param {Object} profile - User household vulnerability and commute profile.
   * @param {Object} airData - Ambient air quality telemetry.
   * @param {string} [notes=''] - User-provided lifestyle and commute notes.
   * @returns {Promise<Object>} Tailored schedule and verified impact facts.
   * @throws {Error} If routine optimization fails.
   */
  async generateRoutine(profile, airData, notes) {
    const res = await fetch('/api/routine', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile, airData, notes }),
    });
    if (!res.ok) throw new Error('Routine optimization failed');
    return res.json();
  },

  /**
   * Compares cumulative inhaled PM2.5 particulate dose across 5 transport modes.
   *
   * @param {number} distanceKm - Commute distance in kilometers.
   * @param {number} pm25 - Ambient PM2.5 in µg/m³.
   * @returns {Promise<Object>} Multi-modal route exposure comparison.
   * @throws {Error} If calculation endpoint returns an error.
   */
  async compareRoute(distanceKm, pm25) {
    const res = await fetch('/api/route', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ distanceKm, pm25 }),
    });
    if (!res.ok) throw new Error('Route exposure calculation failed');
    return res.json();
  },

  /**
   * Calculates required room CADR and compares Corsi-Rosenthal Box vs commercial HEPA.
   *
   * @param {number} lengthFt - Room length in feet.
   * @param {number} widthFt - Room width in feet.
   * @param {number} heightFt - Room ceiling height in feet.
   * @returns {Promise<Object>} Sizing specs and engineering comparison report.
   * @throws {Error} If calculation fails.
   */
  async calculateCADR(lengthFt, widthFt, heightFt) {
    const res = await fetch('/api/cadr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lengthFt, widthFt, heightFt }),
    });
    if (!res.ok) throw new Error('CADR sizing calculation failed');
    return res.json();
  },

  /**
   * Retrieves community emission reduction pledges.
   *
   * @returns {Promise<Array<Object>>} List of active community pledges.
   * @throws {Error} If request fails.
   */
  async getPledges() {
    const res = await fetch('/api/community/pledges');
    if (!res.ok) throw new Error('Failed to load community pledges');
    return res.json();
  },

  /**
   * Submits a new community emission reduction pledge.
   *
   * @param {Object} pledge - Inbound pledge data payload.
   * @returns {Promise<Object>} Created pledge record.
   * @throws {Error} If submission is rejected.
   */
  async submitPledge(pledge) {
    const res = await fetch('/api/community/pledges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pledge),
    });
    if (!res.ok) throw new Error('Failed to submit pledge');
    return res.json();
  },

  /**
   * Retrieves crowdsourced smog and open-burning incident reports.
   *
   * @returns {Promise<Array<Object>>} List of reported incidents.
   * @throws {Error} If request fails.
   */
  async getIncidents() {
    const res = await fetch('/api/community/incidents');
    if (!res.ok) throw new Error('Failed to load smog incidents');
    return res.json();
  },

  /**
   * Submits a crowdsourced neighborhood smog or open-burning incident.
   *
   * @param {Object} incident - Inbound incident report payload.
   * @returns {Promise<Object>} Created incident record.
   * @throws {Error} If submission is rejected.
   */
  async submitIncident(incident) {
    const res = await fetch('/api/community/incidents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(incident),
    });
    if (!res.ok) throw new Error('Failed to submit incident');
    return res.json();
  },
};
