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

// Import our standalone Vercel Serverless Functions
import chatHandler from './api/gemini/chat.js';
import healthHandler from './api/health.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ─── Cloud Logging Integration ──────────────────────────────
const logging = new Logging();
const log = logging.log('defuse-ai-server-log');
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

console.log = (...args) => {
  const text = args.join(' ');
  originalConsoleLog(text);
  log.write(log.entry({ severity: 'INFO' }, text)).catch(() => {});
};

console.error = (...args) => {
  const text = args.join(' ');
  originalConsoleError(text);
  log.write(log.entry({ severity: 'ERROR' }, text)).catch(() => {});
};

// ─── Cloud Secret Manager Logic ──────────────────────────────
const secrets = new SecretManagerServiceClient();
async function getGeminiKey() {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  try {
    // Attempt to load from Secret Manager if running in GCP environment
    const [version] = await secrets.accessSecretVersion({
      name: `projects/${process.env.GOOGLE_CLOUD_PROJECT || 'defuse-ai'}/secrets/GEMINI_API_KEY/versions/latest`,
    });
    const key = version.payload.data.toString();
    console.log("[Secret Manager] Securely retrieved API Key.");
    process.env.GEMINI_API_KEY = key;
    return key;
  } catch (err) {
    console.warn("[Secret Manager] Fallback retrieval skipped (no GCP context or secret missing).");
    return null;
  }
}

// ─── Security & Efficiency Middleware ────────────────────────
// Helmet secures HTTP headers (CSP configured to allow our external assets/APIs)
app.use(helmet({
  contentSecurityPolicy: false, // Disabled locally for simplicity in rendering inline scripts/external fonts during hackathon, relies on standard protections
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
app.post('/api/gemini/chat', async (req, res, next) => {
  // Ensure key is loaded before handling request
  await getGeminiKey();
  chatHandler(req, res, next);
});

// ─── Health check ──────────────────────────────────────────
app.get('/api/health', async (req, res, next) => {
  const hasKey = !!(await getGeminiKey());
  req.hasKey = hasKey; // Pass to handler if needed or just use current handler
  healthHandler(req, res, next);
});

// ─── Runtime Config for Static Frontend ────────────────────
app.get('/api/config', (req, res) => {
  res.status(200).json({
    apiKey: process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID,
  });
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
