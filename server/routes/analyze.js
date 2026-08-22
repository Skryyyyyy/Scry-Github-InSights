import express from 'express';
import { parseGitHubUrl, fetchRepositorySnapshot } from '../services/githubService.js';
import { analyzeRepositorySnapshot } from '../services/analyzerService.js';

export const analyzeRouter = express.Router();

/**
 * POST /api/analyze
 * Body: { repoUrl: string, branch?: string, geminiKey?: string, githubToken?: string }
 */
analyzeRouter.post('/', async (req, res) => {
  try {
    const { repoUrl, branch, geminiKey, githubToken, rawSnapshot } = req.body;

    // Direct snapshot analysis (e.g. from local scan or manual input)
    if (rawSnapshot) {
      const result = await analyzeRepositorySnapshot({
        formattedSnapshot: rawSnapshot,
        apiKey: geminiKey,
        repoMetadata: { name: req.body.name || 'Manual Snapshot' },
        fileContents: [],
        filePaths: []
      });
      return res.json({ success: true, data: result, source: 'raw_snapshot' });
    }

    if (!repoUrl) {
      return res.status(400).json({ success: false, error: 'Repository URL is required.' });
    }

    // Parse GitHub repository URL
    const parsed = parseGitHubUrl(repoUrl);
    const targetBranch = branch || parsed.branch;

    // Fetch repository snapshot
    const snapshotResult = await fetchRepositorySnapshot({
      owner: parsed.owner,
      repo: parsed.repo,
      branch: targetBranch,
      token: githubToken
    });

    // Run Evidence-First Analysis Pipeline
    const analysis = await analyzeRepositorySnapshot({
      formattedSnapshot: snapshotResult.formattedSnapshot,
      apiKey: geminiKey,
      repoMetadata: snapshotResult.metadata,
      fileContents: snapshotResult.fileContents || [],
      filePaths: snapshotResult.filePaths || []
    });

    return res.json({
      success: true,
      repository: snapshotResult.metadata,
      data: analysis
    });

  } catch (err) {
    console.error('Analyze route error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'An unexpected error occurred during repository analysis.'
    });
  }
});
