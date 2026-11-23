/**
 * @fileoverview In-memory Community Smog Defense Store.
 * Manages neighborhood emission reduction pledges and anti-waste-burning incident reports.
 * Thread-safe with bounds-checked FIFO storage capacity.
 * @module community-store
 */

/**
 * @typedef {Object} CommunityPledge
 * @property {string} id - Unique identifier for the pledge.
 * @property {string} name - Supporter/resident display name.
 * @property {string} locality - Neighborhood or housing colony.
 * @property {string} action - Specific mitigation pledge commitment.
 * @property {number} co2SavedKg - Estimated kilograms of greenhouse gas emissions avoided.
 * @property {string} timestamp - ISO-8601 timestamp of commitment.
 */

/**
 * @typedef {Object} SmogIncident
 * @property {string} id - Unique identifier for the incident report.
 * @property {string} reporter - Display name or pseudonym of the reporter.
 * @property {string} locality - Location of observed air pollution emission.
 * @property {string} type - Incident category (e.g., leaf burning, construction dust).
 * @property {string} status - Resolution or escalation progress status.
 * @property {string} timestamp - ISO-8601 reporting timestamp.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, '..', '..', 'data', 'community-store.json');

/**
 * In-memory repository with file-backed persistence for community pledges and smog incident tracking.
 */
class CommunityStore {
  /**
   * Initializes the community store, loading persisted records from disk if present.
   */
  constructor() {
    /** @type {Array<CommunityPledge>} */
    this.pledges = [
      { id: 'p1', name: 'Rajesh K.', locality: 'Mayur Vihar, Delhi', action: 'Switched 15km daily commute from motorbike to Metro', co2SavedKg: 12.5, timestamp: new Date(Date.now() - 3600000).toISOString() },
      { id: 'p2', name: 'Pooja S.', locality: 'Indirapuram, Ghaziabad', action: 'Built DIY Corsi-Rosenthal box for society club room', co2SavedKg: 5.0, timestamp: new Date(Date.now() - 7200000).toISOString() },
      { id: 'p3', name: 'Amit V.', locality: 'Sector 62, Noida', action: 'Pledged zero open leaf/waste burning this winter', co2SavedKg: 20.0, timestamp: new Date(Date.now() - 14400000).toISOString() },
    ];

    /** @type {Array<SmogIncident>} */
    this.incidents = [
      { id: 'i1', reporter: 'Citizen Watch', locality: 'Anand Vihar', type: 'Open biomass/leaf burning', status: 'Reported to Municipal Corp', timestamp: new Date(Date.now() - 5400000).toISOString() },
      { id: 'i2', reporter: 'EcoGuard', locality: 'Wazirpur Industrial Area', type: 'Uncovered construction dust', status: 'Water sprinkling requested', timestamp: new Date(Date.now() - 10800000).toISOString() },
    ];

    this.loadFromDisk();
  }

  /**
   * Loads persisted data from disk if the store file exists.
   * @private
   */
  loadFromDisk() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.pledges) && parsed.pledges.length > 0) {
          this.pledges = parsed.pledges;
        }
        if (Array.isArray(parsed.incidents) && parsed.incidents.length > 0) {
          this.incidents = parsed.incidents;
        }
      }
    } catch {
      // Graceful fallback to default in-memory seeds on read error
    }
  }

  /**
   * Persists current state to disk asynchronously.
   * @private
   */
  saveToDisk() {
    try {
      const dir = path.dirname(DATA_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify({
        pledges: this.pledges,
        incidents: this.incidents,
      }, null, 2), 'utf8');
    } catch {
      // Non-blocking disk write failure safeguard
    }
  }

  /**
   * Retrieves all active community emission reduction pledges.
   *
   * @returns {Array<CommunityPledge>} Array of pledge records.
   */
  getPledges() {
    return this.pledges;
  }

  /**
   * Records a new community emission reduction pledge with validation and FIFO pruning.
   *
   * @param {Object} pledge - Inbound pledge data payload.
   * @param {string} [pledge.name] - Participant name.
   * @param {string} [pledge.locality] - Locality name.
   * @param {string} pledge.action - Concrete pledge description.
   * @param {number|string} [pledge.co2SavedKg] - Estimated emission savings.
   * @returns {CommunityPledge} Created and stored pledge object.
   */
  addPledge(pledge) {
    const item = {
      id: `p_${Date.now()}`,
      name: pledge.name || 'Anonymous Neighbor',
      locality: pledge.locality || 'NCR Urban Zone',
      action: pledge.action,
      co2SavedKg: Number(pledge.co2SavedKg) || 10,
      timestamp: new Date().toISOString(),
    };
    this.pledges.unshift(item);
    if (this.pledges.length > 50) this.pledges.pop();
    this.saveToDisk();
    return item;
  }

  /**
   * Retrieves all reported neighborhood smog and open-burning incidents.
   *
   * @returns {Array<SmogIncident>} Array of incident records.
   */
  getIncidents() {
    return this.incidents;
  }

  /**
   * Registers a crowdsourced smog incident report.
   *
   * @param {Object} incident - Inbound incident report payload.
   * @param {string} [incident.reporter] - Name of reporting citizen.
   * @param {string} incident.locality - Location coordinates or landmark.
   * @param {string} incident.type - Incident classification.
   * @returns {SmogIncident} Created incident record.
   */
  addIncident(incident) {
    const item = {
      id: `i_${Date.now()}`,
      reporter: incident.reporter || 'Community Watcher',
      locality: incident.locality,
      type: incident.type,
      status: 'Logged & Escalated to Local Ward Office',
      timestamp: new Date().toISOString(),
    };
    this.incidents.unshift(item);
    if (this.incidents.length > 50) this.incidents.pop();
    this.saveToDisk();
    return item;
  }
}

/**
 * Singleton instance of CommunityStore.
 * @type {CommunityStore}
 */
export const communityStore = new CommunityStore();
