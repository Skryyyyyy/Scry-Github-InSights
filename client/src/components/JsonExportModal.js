import { copyToClipboard, downloadFile } from '../utils/formatters.js';
import { exportMarkdownReport } from '../services/api.js';

/**
 * Raw JSON & Export Audit Report Modal
 */
export function openJsonExportModal(data, container) {
  const jsonStr = JSON.stringify(data, null, 2);
  const repoName = data.project_overview?.name || 'repository_audit';
  const cleanFilename = repoName.toLowerCase().replace(/[^a-z0-9_-]/g, '_');

  const modalHtml = `
    <div class="modal-backdrop" id="json-modal-backdrop">
      <div class="modal-dialog" style="max-width: 860px;">
        <div class="modal-header">
          <h3 class="modal-title">📦 Export GitVision Audit &amp; Raw JSON Schema</h3>
          <button type="button" id="close-modal-x" class="btn-icon" style="width: 32px; height: 32px;">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div class="modal-body" style="padding: 1.25rem;">
          <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
            <button type="button" id="copy-json-btn" class="btn-secondary" style="font-size: 0.85rem;">
              <span>📋 Copy JSON</span>
            </button>
            <button type="button" id="download-json-btn" class="btn-secondary" style="font-size: 0.85rem;">
              <span>💾 Download .json</span>
            </button>
            <button type="button" id="download-md-btn" class="btn-primary" style="font-size: 0.85rem; padding: 0.5rem 1rem;">
              <span>📄 Download Markdown Report</span>
            </button>
          </div>

          <pre style="background: #020617; border: 1px solid var(--border-subtle); padding: 1.25rem; border-radius: 8px; font-family: var(--font-mono); font-size: 0.8rem; color: #38bdf8; max-height: 440px; overflow: auto; line-height: 1.5;">${escapeHtml(jsonStr)}</pre>
        </div>

        <div class="modal-footer">
          <button type="button" id="close-modal-btn" class="btn-secondary">Close</button>
        </div>
      </div>
    </div>
  `;

  container.innerHTML = modalHtml;

  function closeModal() {
    container.innerHTML = '';
  }

  container.querySelector('#close-modal-x')?.addEventListener('click', closeModal);
  container.querySelector('#close-modal-btn')?.addEventListener('click', closeModal);
  container.querySelector('#json-modal-backdrop')?.addEventListener('click', (e) => {
    if (e.target.id === 'json-modal-backdrop') closeModal();
  });

  container.querySelector('#copy-json-btn')?.addEventListener('click', async () => {
    await copyToClipboard(jsonStr);
    const btn = container.querySelector('#copy-json-btn');
    if (btn) {
      btn.innerHTML = `<span>✅ Copied to Clipboard!</span>`;
      setTimeout(() => btn.innerHTML = `<span>📋 Copy JSON</span>`, 1500);
    }
  });

  container.querySelector('#download-json-btn')?.addEventListener('click', () => {
    downloadFile(`${cleanFilename}_gitvision_audit.json`, jsonStr, 'application/json');
  });

  container.querySelector('#download-md-btn')?.addEventListener('click', async () => {
    try {
      const md = await exportMarkdownReport(data);
      downloadFile(`${cleanFilename}_gitvision_report.md`, md, 'text/markdown');
    } catch (err) {
      alert('Failed to generate markdown report: ' + err.message);
    }
  });
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
