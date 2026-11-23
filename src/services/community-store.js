/**
 * In-memory Community Smog Defense Store.
 * Manages neighborhood emission reduction pledges and anti-waste-burning reports.
 */

class CommunityStore {
  constructor() {
    this.pledges = [
      { id: 'p1', name: 'Rajesh K.', locality: 'Mayur Vihar, Delhi', action: 'Switched 15km daily commute from motorbike to Metro', co2SavedKg: 12.5, timestamp: new Date(Date.now() - 3600000).toISOString() },
      { id: 'p2', name: 'Pooja S.', locality: 'Indirapuram, Ghaziabad', action: 'Built DIY Corsi-Rosenthal box for society club room', co2SavedKg: 5.0, timestamp: new Date(Date.now() - 7200000).toISOString() },
      { id: 'p3', name: 'Amit V.', locality: 'Sector 62, Noida', action: 'Pledged zero open leaf/waste burning this winter', co2SavedKg: 20.0, timestamp: new Date(Date.now() - 14400000).toISOString() },
    ];

    this.incidents = [
      { id: 'i1', reporter: 'Citizen Watch', locality: 'Anand Vihar', type: 'Open biomass/leaf burning', status: 'Reported to Municipal Corp', timestamp: new Date(Date.now() - 5400000).toISOString() },
      { id: 'i2', reporter: 'EcoGuard', locality: 'Wazirpur Industrial Area', type: 'Uncovered construction dust', status: 'Water sprinkling requested', timestamp: new Date(Date.now() - 10800000).toISOString() },
    ];
  }

  getPledges() {
    return this.pledges;
  }

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
    return item;
  }

  getIncidents() {
    return this.incidents;
  }

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
    return item;
  }
}

export const communityStore = new CommunityStore();
