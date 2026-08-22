import express from 'express';
import { generateMarkdownReport } from '../services/reportGenerator.js';

export const exportRouter = express.Router();

/**
 * POST /api/export/markdown
 * Converts JSON Scry analysis into a Markdown document
 */
exportRouter.post('/markdown', (req, res) => {
  try {
    const { data } = req.body;
    if (!data) {
      return res.status(400).json({ success: false, error: 'Scry JSON data is required.' });
    }

    const markdown = generateMarkdownReport(data);
    return res.json({ success: true, markdown });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});
