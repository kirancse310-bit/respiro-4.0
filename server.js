/**
 * @fileoverview Respiro 2.0 Core Express 5 Server Application.
 * Configures hardened defensive middleware, static asset routing with MIME type enforcement,
 * dynamic CORS origin validation, and REST API endpoints for air quality telemetry,
 * AI routine optimization, transit exposure analysis, and community smog defense.
 * @module server
 */

import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';

import { LIMITS } from './src/config/limits.js';
import { securityHeadersMiddleware } from './src/middleware/security-headers.js';
import { rateLimiter } from './src/middleware/rate-limit.js';
import { validatePayloadSize } from './src/middleware/validator.js';

import { fetchLiveAirQuality } from './src/services/air-service.js';
import { generateOptimizedRoutine } from './src/services/gemini-service.js';
import { compareTransitExposure } from './src/lib/exposure-routing.js';
import { compareCorsiRosenthalVsHEPA } from './src/lib/cadr-engine.js';
import { communityStore } from './src/services/community-store.js';
import { sanitizeText, isFiniteNumber } from './src/lib/prompt-guard.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Structured ISO-timestamped server logger.
 * @type {Readonly<Object>}
 */
export const logger = {
  /**
   * Logs an informational message with an ISO-8601 timestamp.
   * @param {string} msg - Informational message string.
   * @param {...unknown} args - Supplementary arguments or objects.
   */
  info: (msg, ...args) => console.log(`[${new Date().toISOString()}] [INFO] ${msg}`, ...args),
  /**
   * Logs a warning message with an ISO-8601 timestamp.
   * @param {string} msg - Warning message string.
   * @param {...unknown} args - Supplementary arguments or objects.
   */
  warn: (msg, ...args) => console.warn(`[${new Date().toISOString()}] [WARN] ${msg}`, ...args),
  /**
   * Logs an error message with an ISO-8601 timestamp.
   * @param {string} msg - Error message string.
   * @param {...unknown} args - Supplementary arguments or objects.
   */
  error: (msg, ...args) => console.error(`[${new Date().toISOString()}] [ERROR] ${msg}`, ...args),
};

const app = express();
const PORT = process.env.PORT || 3000;

// Reverse-Proxy Trust & Server Fingerprint Concealment (CWE-200)
app.set('trust proxy', 1);
app.disable('x-powered-by');

// Defensive Security Headers Pipeline
app.use(helmet({
  contentSecurityPolicy: false, // Managed via comprehensive custom CSP
  crossOriginEmbedderPolicy: false,
}));
app.use(securityHeadersMiddleware);

// Static Asset Serving (served before API rate limiting and body parsing)
app.use(express.static(path.join(__dirname, 'public'), {
  etag: true,
  maxAge: '1h',
  setHeaders: (res, filePath) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    } else if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css; charset=utf-8');
    }
  },
}));

/**
 * Verified allowed origins for Cross-Origin Resource Sharing (CORS).
 * @type {Array<string>}
 */
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'https://respiro-2-0.onrender.com',
];

if (process.env.ALLOWED_ORIGIN) {
  ALLOWED_ORIGINS.push(...process.env.ALLOWED_ORIGIN.split(',').map((o) => o.trim()));
}
if (process.env.ALLOWED_ORIGINS) {
  ALLOWED_ORIGINS.push(...process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()));
}

app.use(cors({
  /**
   * Origin validator callback for incoming CORS requests.
   * @param {string|undefined} origin - Origin header value.
   * @param {Function} callback - Node/CORS callback (err, allow).
   */
  origin: (origin, callback) => {
    // Direct requests, curl, or server-to-server
    if (!origin) return callback(null, true);

    if (
      ALLOWED_ORIGINS.includes('*') ||
      ALLOWED_ORIGINS.includes(origin) ||
      origin.startsWith('http://localhost:') ||
      origin.startsWith('http://127.0.0.1:') ||
      origin.endsWith('.onrender.com') ||
      origin.endsWith('.vercel.app') ||
      origin.endsWith('.web.app') ||
      origin.endsWith('.firebaseapp.com')
    ) {
      return callback(null, true);
    }
    // Return null, false to safely deny CORS without throwing 500 error
    return callback(null, false);
  },
  methods: ['GET', 'POST', 'OPTIONS'],
}));

app.use(validatePayloadSize);
app.use(express.json({ limit: LIMITS.MAX_BODY_BYTES }));
app.use(rateLimiter);

// ==========================================
// REST API Routes
// ==========================================

/**
 * Health check endpoint returning system status and security parameters.
 * @name GET /api/health
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Respiro 2.0',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    limits: {
      maxBodyBytes: LIMITS.MAX_BODY_BYTES,
      rateLimitMax: LIMITS.RATE_LIMIT_MAX_REQUESTS,
    },
  });
});

/**
 * Live air quality telemetry endpoint.
 * @name GET /api/air
 * @param {string} [req.query.city='Delhi'] - Target city name query.
 */
app.get('/api/air', async (req, res) => {
  try {
    const rawCity = sanitizeText(req.query.city || 'Delhi', LIMITS.MAX_NAME_LENGTH);
    const data = await fetchLiveAirQuality(rawCity);
    res.json(data);
  } catch (error) {
    logger.error('Air Quality Telemetry Error:', error.message);
    res.status(500).json({ error: 'Air Quality Fetch Failed' });
  }
});

/**
 * Generative AI and deterministic routine optimizer endpoint.
 * @name POST /api/routine
 * @param {Object} req.body.profile - Household vulnerability and commute profile.
 * @param {Object} req.body.airData - Current ambient air telemetry.
 * @param {string} [req.body.notes] - Untrusted user lifestyle notes.
 */
app.post('/api/routine', async (req, res) => {
  try {
    const { profile = {}, airData = {}, notes = '' } = req.body;
    const cleanNotes = sanitizeText(notes, LIMITS.MAX_USER_NOTES_LENGTH);
    const plan = await generateOptimizedRoutine(profile, airData, cleanNotes);
    res.json(plan);
  } catch (error) {
    logger.error('Routine Optimization Error:', error.message);
    res.status(500).json({ error: 'Routine Generation Failed' });
  }
});

/**
 * Multi-modal transit exposure dose comparison endpoint.
 * @name POST /api/route
 * @param {number} req.body.distanceKm - Commute distance in kilometers.
 * @param {number} req.body.pm25 - Ambient PM2.5 in µg/m³.
 */
app.post('/api/route', (req, res) => {
  try {
    const { distanceKm, pm25 } = req.body;
    const distNum = Number(distanceKm);
    const pmNum = Number(pm25);

    if (!isFiniteNumber(distNum, 0.5, 150)) {
      return res.status(400).json({ error: 'Invalid distanceKm: must be a finite number between 0.5 and 150 km' });
    }
    if (!isFiniteNumber(pmNum, 1, 1000)) {
      return res.status(400).json({ error: 'Invalid pm25: must be a finite number between 1 and 1000 µg/m³' });
    }

    const comparison = compareTransitExposure(distNum, pmNum);
    res.json(comparison);
  } catch (error) {
    logger.error('Route Exposure Calculation Error:', error.message);
    res.status(400).json({ error: 'Route Computation Failed' });
  }
});

/**
 * Indoor Clean Air Delivery Rate (CADR) & Corsi-Rosenthal Box sizing endpoint.
 * @name POST /api/cadr
 * @param {number} req.body.lengthFt - Room length in feet (5-100).
 * @param {number} req.body.widthFt - Room width in feet (5-100).
 * @param {number} req.body.heightFt - Ceiling height in feet (6-30).
 */
app.post('/api/cadr', (req, res) => {
  try {
    const { lengthFt, widthFt, heightFt } = req.body;
    const l = Number(lengthFt);
    const w = Number(widthFt);
    const h = Number(heightFt);

    if (!isFiniteNumber(l, 5, 100) || !isFiniteNumber(w, 5, 100) || !isFiniteNumber(h, 6, 30)) {
      return res.status(400).json({ error: 'Invalid dimensions: length (5-100ft), width (5-100ft), height (6-30ft)' });
    }

    const analysis = compareCorsiRosenthalVsHEPA(l, w, h);
    res.json(analysis);
  } catch (error) {
    logger.error('CADR Sizing Error:', error.message);
    res.status(400).json({ error: 'CADR Sizing Failed' });
  }
});

/**
 * Retrieves community emission reduction pledges.
 * @name GET /api/community/pledges
 */
app.get('/api/community/pledges', (req, res) => {
  res.json(communityStore.getPledges());
});

/**
 * Submits a new community emission reduction pledge.
 * @name POST /api/community/pledges
 * @param {string} req.body.name - Resident name.
 * @param {string} req.body.locality - Residential neighborhood.
 * @param {string} req.body.action - Emission mitigation pledge.
 * @param {number} [req.body.co2SavedKg] - Estimated emission reduction.
 */
app.post('/api/community/pledges', (req, res) => {
  try {
    const { name, locality, action, co2SavedKg } = req.body;
    const cleanAction = sanitizeText(action, 200);
    const cleanName = sanitizeText(name, 100);
    const cleanLocality = sanitizeText(locality, 100);

    if (!cleanAction) {
      return res.status(400).json({ error: 'Action is required for a pledge.' });
    }

    const item = communityStore.addPledge({
      name: cleanName,
      locality: cleanLocality,
      action: cleanAction,
      co2SavedKg,
    });
    res.status(201).json(item);
  } catch (error) {
    logger.error('Pledge Submission Error:', error.message);
    res.status(400).json({ error: 'Pledge submission failed' });
  }
});

/**
 * Retrieves crowdsourced smog and open-burning incident reports.
 * @name GET /api/community/incidents
 */
app.get('/api/community/incidents', (req, res) => {
  res.json(communityStore.getIncidents());
});

/**
 * Submits a crowdsourced neighborhood smog or open-burning incident.
 * @name POST /api/community/incidents
 * @param {string} [req.body.reporter] - Citizen reporter identifier.
 * @param {string} req.body.locality - Location coordinates or landmark.
 * @param {string} req.body.type - Incident classification.
 */
app.post('/api/community/incidents', (req, res) => {
  try {
    const { reporter, locality, type } = req.body;
    const cleanReporter = sanitizeText(reporter, 100);
    const cleanLocality = sanitizeText(locality, 150);
    const cleanType = sanitizeText(type, 100);

    if (!cleanLocality || !cleanType) {
      return res.status(400).json({ error: 'Locality and Incident Type are required.' });
    }

    const item = communityStore.addIncident({
      reporter: cleanReporter,
      locality: cleanLocality,
      type: cleanType,
    });
    res.status(201).json(item);
  } catch (error) {
    logger.error('Incident Report Error:', error.message);
    res.status(400).json({ error: 'Incident report submission failed' });
  }
});

// Single Page Application (SPA) HTML fallback
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/**
 * Centralized error-handling middleware preventing stack trace and system info disclosure (CWE-209 & CWE-200).
 *
 * @param {Error} err - Caught error object.
 * @param {import('express').Request} _req - Express request.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} _next - Express next function.
 */
app.use((err, _req, res, _next) => {
  logger.error('[SECURITY AUDIT] Unhandled Server Exception:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    logger.info(`🍃 Respiro 2.0 active at http://localhost:${PORT}`);
  });
}

export default app;
