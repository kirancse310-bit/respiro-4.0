import { describe, it, expect, beforeEach } from 'vitest';
import { communityStore } from '../src/services/community-store.js';

describe('Persistent Community Smog Defense Store', () => {
  it('retrieves default and persisted seed pledges', () => {
    const pledges = communityStore.getPledges();
    expect(pledges.length).toBeGreaterThan(0);
    expect(pledges[0].name).toBeDefined();
    expect(pledges[0].action).toBeDefined();
  });

  it('records a new pledge and prepends to the collection', () => {
    const beforeCount = communityStore.getPledges().length;
    const item = communityStore.addPledge({
      name: 'Vikas T.',
      locality: 'Noida Sector 18',
      action: 'Switched 20km commute to electric metro',
      co2SavedKg: 18.2,
    });

    expect(item.id).toMatch(/^p_/);
    expect(item.name).toBe('Vikas T.');
    expect(item.locality).toBe('Noida Sector 18');
    expect(communityStore.getPledges().length).toBe(beforeCount + 1);
    expect(communityStore.getPledges()[0].id).toBe(item.id);
  });

  it('records a new smog incident and assigns initial escalation status', () => {
    const beforeCount = communityStore.getIncidents().length;
    const item = communityStore.addIncident({
      reporter: 'Green Guard',
      locality: 'GT Karnal Road Industrial Area',
      type: 'Industrial boiler black smoke',
    });

    expect(item.id).toMatch(/^i_/);
    expect(item.status).toContain('Escalated');
    expect(communityStore.getIncidents().length).toBe(beforeCount + 1);
  });

  it('enforces FIFO capacity bounds capping max stored records at 50', () => {
    for (let i = 0; i < 55; i++) {
      communityStore.addPledge({
        name: `Test Resident ${i}`,
        locality: 'NCR Zone',
        action: `Pledge ${i}`,
        co2SavedKg: 5,
      });
    }

    expect(communityStore.getPledges().length).toBeLessThanOrEqual(50);
  });
});
