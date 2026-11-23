import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import app from '../server.js';

describe('Express REST API Route Integration Tests', () => {
  let server;
  let baseUrl;

  beforeAll(async () => {
    await new Promise((resolve) => {
      server = http.createServer(app).listen(0, '127.0.0.1', () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  describe('GET /api/health', () => {
    it('returns system health status and configuration limits', async () => {
      const res = await fetch(`${baseUrl}/api/health`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.status).toBe('ok');
      expect(data.service).toBe('Respiro 2.0');
      expect(data.limits.maxBodyBytes).toBe(15 * 1024);
    });
  });

  describe('GET /api/air', () => {
    it('returns live or fallback air telemetry for a known city', async () => {
      const res = await fetch(`${baseUrl}/api/air?city=Delhi`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.city).toContain('Delhi');
      expect(data.aqi).toBeGreaterThan(0);
      expect(data.dominantPollutant).toBeDefined();
      expect(data.pollutants.pm2_5).toBeDefined();
    });
  });

  describe('POST /api/route', () => {
    it('calculates transit exposure ranking across 5 modes for valid inputs', async () => {
      const res = await fetch(`${baseUrl}/api/route`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ distanceKm: 12, pm25: 180 }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.distanceKm).toBe(12);
      expect(data.options.length).toBe(5);
      expect(data.safestMode).toBeDefined();
      expect(data.percentReduction).toBeGreaterThan(0);
    });

    it('rejects invalid distance values with HTTP 400', async () => {
      const res = await fetch(`${baseUrl}/api/route`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ distanceKm: -5, pm25: 180 }),
      });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('Invalid distanceKm');
    });

    it('rejects invalid pm25 values with HTTP 400', async () => {
      const res = await fetch(`${baseUrl}/api/route`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ distanceKm: 10, pm25: 9999 }),
      });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('Invalid pm25');
    });
  });

  describe('POST /api/cadr', () => {
    it('computes room sizing and Corsi-Rosenthal comparison for valid room dimensions', async () => {
      const res = await fetch(`${baseUrl}/api/cadr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lengthFt: 18, widthFt: 14, heightFt: 9 }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.room.volumeCuFt).toBe(2268);
      expect(data.room.requiredCADR).toBe(151);
      expect(data.corsiRosenthal.cadr).toBe(550);
      expect(data.commercialHEPA.cadr).toBe(180);
    });

    it('rejects out-of-boundary dimensions with HTTP 400', async () => {
      const res = await fetch(`${baseUrl}/api/cadr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lengthFt: 2, widthFt: 14, heightFt: 9 }),
      });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('Invalid dimensions');
    });
  });

  describe('POST /api/routine', () => {
    it('generates an optimized routine plan with verified facts', async () => {
      const res = await fetch(`${baseUrl}/api/routine`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: { commuteKm: 15, commuteMode: 'auto', outdoorHours: 2, hasVulnerable: true },
          airData: { city: 'Delhi', pm2_5: 220, cleanestHour: '13:00', worstHour: '21:00' },
          notes: 'Family has senior citizen with COPD',
        }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.summary).toBeDefined();
      expect(data.routines.length).toBe(3);
      expect(data.facts.length).toBeGreaterThan(0);
      expect(data.engineSource).toBeDefined();
    });
  });

  describe('Community Pledges & Incident Watch Endpoints', () => {
    it('retrieves community pledges via GET /api/community/pledges', async () => {
      const res = await fetch(`${baseUrl}/api/community/pledges`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
    });

    it('submits a new pledge via POST /api/community/pledges', async () => {
      const res = await fetch(`${baseUrl}/api/community/pledges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Sunita Mehra',
          locality: 'Indirapuram',
          action: 'Pledged zero open garbage burning this winter',
          co2SavedKg: 25,
        }),
      });
      expect(res.status).toBe(201);
      const created = await res.json();
      expect(created.id).toBeDefined();
      expect(created.name).toBe('Sunita Mehra');
      expect(created.co2SavedKg).toBe(25);
    });

    it('rejects pledge without action with HTTP 400', async () => {
      const res = await fetch(`${baseUrl}/api/community/pledges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Anonymous', locality: 'Delhi', action: '' }),
      });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('Action is required');
    });

    it('retrieves community incidents via GET /api/community/incidents', async () => {
      const res = await fetch(`${baseUrl}/api/community/incidents`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
    });

    it('submits a new smog incident via POST /api/community/incidents', async () => {
      const res = await fetch(`${baseUrl}/api/community/incidents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reporter: 'Citizen Eye',
          locality: 'NH24 Ghazipur Border',
          type: 'Open municipal plastic burning',
        }),
      });
      expect(res.status).toBe(201);
      const created = await res.json();
      expect(created.id).toBeDefined();
      expect(created.status).toContain('Escalated');
    });

    it('rejects incident without locality or type with HTTP 400', async () => {
      const res = await fetch(`${baseUrl}/api/community/incidents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reporter: 'Citizen', locality: '' }),
      });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('Locality and Incident Type are required');
    });
  });
});
