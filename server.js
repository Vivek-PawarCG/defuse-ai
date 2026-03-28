import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { Logging } from '@google-cloud/logging';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import { BigQuery } from '@google-cloud/bigquery';
import { MetricServiceClient } from '@google-cloud/monitoring';
import { getStrategicDebrief } from './api/agent/majorSteele.js';

import chatHandler from './api/gemini/chat.js';
import healthHandler from './api/health.js';

/**
 * Entry point for the Defuse AI Monolithic Server.
 * Handles security (CSP, Rate Limiting), AI proxying, and static file serving.
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || 'defuse-ai';

// Initialize Cloud Services with fail-safes
let monitoringClient, bigquery, loggingClient;
try {
  monitoringClient = new MetricServiceClient();
  bigquery = new BigQuery({ projectId: PROJECT_ID });
  loggingClient = new Logging({ projectId: PROJECT_ID });
} catch (err) {
  console.warn("Service initialization failed, falling back to basic mode.", err.message);
}

const app = express();

// ─── Cloud Logging Integration ──────────────────────────────
const log = (loggingClient || new Logging({ projectId: PROJECT_ID })).log('defuse-ai-server-log');
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

console.log = (...args) => {
  const text = args.join(' ');
  originalConsoleLog(text);
  log.write(log.entry({ severity: 'INFO' }, text)).catch(() => { });
};

console.error = (...args) => {
  const text = args.join(' ');
  originalConsoleError(text);
  log.write(log.entry({ severity: 'ERROR' }, text)).catch(() => { });
};

// ─── Cloud Secret Manager Logic ──────────────────────────────
const secrets = new SecretManagerServiceClient();
/**
 * Load API keys from Secret Manager or Environment.
 * Supports dual-key architecture: Tactical (Gemini) and Agentic (Vertex AI / ADK).
 */
let cachedKeys = null;
async function getApiKeys() {
  if (cachedKeys) return cachedKeys;

  // Defaults from environment
  let geminiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  let vertexKey = process.env.VERTEX_AI_API_KEY;

  // Cloud Run / Secret Manager Fallback
  if ((!geminiKey || !vertexKey) && process.env.K_SERVICE) {
    try {
      const client = new SecretManagerServiceClient();
      
      if (!geminiKey) {
        const [version] = await client.accessSecretVersion({
          name: `projects/${PROJECT_ID}/secrets/GEMINI_API_KEY/versions/latest`,
        });
        geminiKey = version.payload.data.toString();
      }

      if (!vertexKey) {
        const [adkVersion] = await client.accessSecretVersion({
          name: `projects/${PROJECT_ID}/secrets/VERTEX_AI_API_KEY/versions/latest`,
        });
        vertexKey = adkVersion.payload.data.toString();
      }
    } catch (err) {
      console.warn("[SecretManager] Could not load all keys, falling back to env.", err.message);
    }
  }

  cachedKeys = { geminiKey, vertexKey };
  // Propagate to environment for sub-modules
  if (geminiKey) process.env.GEMINI_API_KEY = geminiKey;
  if (vertexKey) process.env.VERTEX_AI_API_KEY = vertexKey;
  
  return cachedKeys;
}

// ─── Security & Efficiency Middleware ────────────────────────
// Hardened CSP 
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://apis.google.com", "https://www.gstatic.com", "https://*.firebaseapp.com", "https://www.googletagmanager.com", "https://*.google-analytics.com", "https://www.google.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https://*.google-analytics.com", "https://*.googletagmanager.com"],
      connectSrc: ["'self'", "https://generativelanguage.googleapis.com", "https://*.firebaseio.com", "https://*.googleapis.com", "https://*.google-analytics.com", "https://www.google.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      frameSrc: ["'self'", "https://www.google.com", "https://*.firebaseapp.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
}));

// Gzip compress all outbound responses
app.use(compression());

// Standard containerization middleware
app.use(cors());
app.use(express.json());

// API Rate Limiting to protect Gemini AI quota
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 requests per minute
  message: { error: 'Too many requests, slow down soldier.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', apiLimiter);

// API Routes perfectly matching the Vite frontend fetch structure
/**
 * Gemini AI Chat Proxy Endpoint.
 * This endpoint acts as a proxy to the Gemini AI service, ensuring the API key
 * is securely loaded and requests are rate-limited.
 * @param {express.Request} req - The Express request object.
 * @param {express.Response} res - The Express response object.
 * @param {express.NextFunction} next - The Express next middleware function.
 */
app.post('/api/gemini/chat', async (req, res, next) => {
  // Ensure key is loaded before handling request
  const keys = await getApiKeys();
  if (!keys.geminiKey) return res.status(500).json({ error: "Missing Gemini API Key." });
  recordMetric('gemini_api_requests', 1);
  chatHandler(req, res, next);
});

/**
 * Record a custom metric to Google Cloud Monitoring.
 * @param {string} name - Metric name
 * @param {number} value - Value to record
 */
async function recordMetric(name, value = 1) {
  if (!monitoringClient) return;
  try {
    const dataPoint = {
      interval: { endTime: { seconds: Math.floor(Date.now() / 1000) } },
      value: { doubleValue: value },
    };
    const timeSeriesData = {
      metric: { type: `custom.googleapis.com/defuse_ai/${name}` },
      resource: { type: 'global', labels: { project_id: PROJECT_ID } },
      points: [dataPoint],
    };
    await monitoringClient.createTimeSeries({
      name: `projects/${PROJECT_ID}`,
      timeSeries: [timeSeriesData],
    });
  } catch (err) {
    // Silently fail to ensure game stability (Free Tier fallback)
    console.debug("[Monitoring] Could not export metric.", err.message);
  }
}

// ─── API Routes ─────────────────────────────────────────────
app.get('/api/health', async (req, res, next) => {
  const keys = await getApiKeys();
  req.hasKey = !!keys.geminiKey;
  req.hasVertexKey = !!keys.vertexKey;
  healthHandler(req, res, next);
});

/**
 * Runtime Configuration Endpoint.
 * Serves Firebase and system configuration to the frontend without requiring a rebuild.
 * Useful for 12-factor app compliance and Cloud Run environment parity.
 */
app.get('/api/config', (req, res) => {
  res.status(200).json({
    apiKey: process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID,
    recaptchaKey: process.env.VITE_RECAPTCHA_SITE_KEY || process.env.RECAPTCHA_SITE_KEY,
    vertexEnabled: true, // Signal to frontend that Phase 7 is live
  });
});

/**
 * BigQuery Archival Service.
 * Ingests mission telemetry into the analytical data warehouse.
 */
async function recordToBigQuery(data) {
  if (!bigquery) return;
  const datasetId = 'mission_archives';
  const tableId = 'mission_history';
  try {
    const rows = [{
      missionId: data.missionId || `M-${Date.now()}`,
      timestamp: bigquery.timestamp(new Date()),
      difficulty: data.difficulty,
      result: data.result, // 'success' or 'fail'
      timeSpent: parseInt(data.timeSpent),
      tilesCleared: parseInt(data.tilesCleared),
      aiAdviceCount: parseInt(data.aiAdviceCount) || 0
    }];
    await bigquery.dataset(datasetId).table(tableId).insert(rows);
    console.log(`[BigQuery] Mission ${data.missionId} archived successfully.`);
  } catch (err) {
    console.error("[BigQuery] Archival failed.", err.message);
  }
}

app.post('/api/archive', async (req, res) => {
  const { difficulty, result, timeSpent, tilesCleared, aiAdviceCount } = req.body;
  recordMetric('mission_archived', 1);
  await recordToBigQuery({ difficulty, result, timeSpent, tilesCleared, aiAdviceCount });
  res.status(200).json({ status: 'archived' });
});

/**
 * Strategic Debrief Endpoint — Vertex AI + BigQuery.
 * Fires after each game ends (victory or game over).
 * Accepts structured mission data, returns a data-grounded analysis
 * from Major Steele using Vertex AI function calling + BigQuery archives.
 */
app.post('/api/agent/debrief', async (req, res) => {
  const { difficulty, result, timeSpent, tilesCleared, aiAdviceCount } = req.body;

  // ── Pre-flight validation ──────────────────────────────────
  if (!difficulty || !result) {
    return res.status(400).json({ error: 'Missing required fields: difficulty, result.' });
  }

  try {
    recordMetric('vertex_debrief_requests', 1);
    console.log(`[Debrief] Request | difficulty=${difficulty} result=${result} time=${timeSpent}s`);

    const debrief = await getStrategicDebrief({ difficulty, result, timeSpent, tilesCleared, aiAdviceCount });

    if (!debrief) {
      // getStrategicDebrief logs its own errors; return null so frontend shows fallback
      return res.status(200).json({ debrief: null });
    }

    console.log('[Debrief] Strategic analysis complete. Sending to client.');
    res.status(200).json({ debrief });

  } catch (err) {
    console.error('[Debrief] Unexpected error:', err.message, err.stack);
    res.status(200).json({ debrief: null }); // Soft fail — frontend handles null gracefully
  }
});


// Serve the statically compiled Vite frontend
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// Catch-all route to serve index.html for single-page routing natively
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Listen dynamically on the Google Cloud Run assigned process.env.PORT
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`[Cloud Run API Container] Express monolithic server executing securely on runtime port ${PORT}`);
});
