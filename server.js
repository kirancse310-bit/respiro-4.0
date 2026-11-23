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

// Structured Server Logger (ISO timestamped, tagged)
export const logger = {
  info: (msg, ...args) => console.log(`[${new Date().toISOString()}] [INFO] ${msg}`, ...args),
  warn: (msg, ...args) => console.warn(`[${new Date().toISOString()}] [WARN] ${msg}`, ...args),
  error: (msg, ...args) => console.error(`[${new Date().toISOString()}] [ERROR] ${msg}`, ...args),
};

const app = express();
const PORT = process.env.PORT || 3000;

// Reverse-Proxy Trust & Server Fingerprint Concealment (CWE-200)
app.set('trust proxy', 1);
app.disable('x-powered-by');

// Defensive Middleware Pipeline
app.use(helmet({
  contentSecurityPolicy: false, // Managed via comprehensive custom CSP
  crossOriginEmbedderPolicy: false,
}));

// Dynamic CORS allowlist
const allowedOrigins = process.env.ALLOWED_ORIGIN
  ? process.env.ALLOWED_ORIGIN.split(',').map((o) => o.trim())
  : ['http://localhost:3000', 'http://127.0.0.1:3000'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Origin not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST'],
}));

app.use(securityHeadersMiddleware);
app.use(validatePayloadSize);
app.use(express.json({ limit: LIMITS.MAX_BODY_BYTES }));
app.use(rateLimiter);

// Static Asset Serving
app.use(express.static(path.join(__dirname, 'public'), {
  etag: true,
  maxAge: '1h',
  setHeaders: (res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
  },
}));

// API Routes

// Health Check
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

// Live Air Quality Telemetry
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

// AI & Deterministic Routine Optimizer
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

// Inhaled Dose & Lowest-Exposure Route Comparison (Strict Physical Type Guards)
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

// Indoor CADR & Corsi-Rosenthal Box Sizing (Strict Physical Type Guards)
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

// Community Smog Defense Endpoints
app.get('/api/community/pledges', (req, res) => {
  res.json(communityStore.getPledges());
});

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

app.get('/api/community/incidents', (req, res) => {
  res.json(communityStore.getIncidents());
});

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

// SPA Fallback
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Information Disclosure Prevention (CWE-209 & CWE-200)
app.use((err, req, res, next) => {
  logger.error('[SECURITY AUDIT] Unhandled Server Exception:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    logger.info(`🍃 Respiro 2.0 active at http://localhost:${PORT}`);
  });
}

export default app;
