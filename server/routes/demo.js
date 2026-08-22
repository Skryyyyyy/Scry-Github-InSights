import express from 'express';
import { mockRepositories } from '../services/mockDataService.js';

export const demoRouter = express.Router();

/**
 * GET /api/demo
 * Returns list of available pre-analyzed demo projects
 */
demoRouter.get('/', (req, res) => {
  const demos = Object.keys(mockRepositories).map(key => {
    const item = mockRepositories[key];
    return {
      id: key,
      name: item.project_overview.name,
      tagline: item.project_overview.tagline,
      primaryLanguage: item.project_overview.tech_stack.primary_language,
      overallScore: item.project_overview.vitality_score.overall_score,
      verdict: item.project_overview.vitality_score.verdict
    };
  });

  return res.json({ success: true, demos });
});

/**
 * GET /api/demo/:id
 * Returns the full GitVision JSON analysis for a specific demo
 */
demoRouter.get('/:id', (req, res) => {
  const { id } = req.params;
  const demoData = mockRepositories[id];

  if (!demoData) {
    return res.status(404).json({
      success: false,
      error: `Demo project "${id}" not found. Available: ${Object.keys(mockRepositories).join(', ')}`
    });
  }

  return res.json({
    success: true,
    data: demoData,
    isDemo: true
  });
});
