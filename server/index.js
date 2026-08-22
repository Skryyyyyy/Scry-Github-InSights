import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { analyzeRouter } from './routes/analyze.js';
import { demoRouter } from './routes/demo.js';
import { exportRouter } from './routes/export.js';
import { getMasterPrompt } from './services/analyzerService.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// API Routes
app.use('/api/analyze', analyzeRouter);
app.use('/api/demo', demoRouter);
app.use('/api/export', exportRouter);

// Health & System Info
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    aiProvider: config.geminiApiKey ? 'Gemini AI Active' : 'Heuristic Engine (Configure GEMINI_API_KEY for Live LLM)',
    hasGithubToken: Boolean(config.githubToken)
  });
});

// Master Prompt Route
app.get('/api/prompt', async (req, res) => {
  try {
    const prompt = await getMasterPrompt();
    res.type('text/plain').send(prompt);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start Server
app.listen(config.port, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 GitVision Server is running on http://localhost:${config.port}`);
  console.log(`📡 Healthcheck: http://localhost:${config.port}/api/health`);
  console.log(`🤖 AI Status: ${config.geminiApiKey ? 'Gemini LLM Key Configured' : 'Offline Heuristic Fallback Ready'}`);
  console.log(`======================================================\n`);
});
