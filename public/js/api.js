/**
 * Respiro 2.0 API Client.
 * Handles HTTP requests, network error resilience, and input serialization.
 */

export const api = {
  async getAir(city) {
    const res = await fetch(`/api/air?city=${encodeURIComponent(city)}`);
    if (!res.ok) throw new Error('Failed to retrieve air telemetry');
    return res.json();
  },

  async generateRoutine(profile, airData, notes) {
    const res = await fetch('/api/routine', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile, airData, notes }),
    });
    if (!res.ok) throw new Error('Routine optimization failed');
    return res.json();
  },

  async compareRoute(distanceKm, pm25) {
    const res = await fetch('/api/route', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ distanceKm, pm25 }),
    });
    if (!res.ok) throw new Error('Route exposure calculation failed');
    return res.json();
  },

  async calculateCADR(lengthFt, widthFt, heightFt) {
    const res = await fetch('/api/cadr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lengthFt, widthFt, heightFt }),
    });
    if (!res.ok) throw new Error('CADR sizing calculation failed');
    return res.json();
  },

  async getPledges() {
    const res = await fetch('/api/community/pledges');
    if (!res.ok) throw new Error('Failed to load community pledges');
    return res.json();
  },

  async submitPledge(pledge) {
    const res = await fetch('/api/community/pledges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pledge),
    });
    if (!res.ok) throw new Error('Failed to submit pledge');
    return res.json();
  },

  async getIncidents() {
    const res = await fetch('/api/community/incidents');
    if (!res.ok) throw new Error('Failed to load smog incidents');
    return res.json();
  },

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
