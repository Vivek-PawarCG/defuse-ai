import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Import our standalone Vercel Serverless Function
import chatHandler from './api/gemini/chat.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Standard containerization middleware
app.use(cors());
app.use(express.json());

// API Routes perfectly matching the Vite frontend fetch structure
app.post('/api/gemini', chatHandler);

// ─── Health check ──────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', model: process.env.GEMINI_MODEL || 'gemini-2.5-flash', hasKey: !!process.env.GEMINI_API_KEY });
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
