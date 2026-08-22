import { copyToClipboard, downloadFile } from '../utils/formatters.js';

/**
 * Onboarding & AI Quickstart View Component
 */
export function renderQuickstartView(container, onboardingData = {}) {
  const prerequisites = onboardingData.prerequisites || [];
  const steps = onboardingData.ai_quickstart_steps || [];
  const envVars = onboardingData.environment_variables || [];

  container.innerHTML = `
    <!-- Prerequisites -->
    <div class="content-card">
      <h3 class="card-title">
        <svg viewBox="0 0 24 24" width="20" height="20" stroke="var(--accent-cyan)" stroke-width="2" fill="none">
          <polyline points="9 11 12 14 22 4"></polyline>
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
        </svg>
        <span>Environment Prerequisites</span>
      </h3>
      <div style="display: flex; flex-wrap: wrap; gap: 0.6rem;">
        ${prerequisites.length > 0 ? prerequisites.map(p => `
          <div style="display: inline-flex; align-items: center; gap: 0.5rem; background: var(--bg-elevated); border: 1px solid var(--border-subtle); padding: 0.5rem 0.9rem; border-radius: var(--radius-sm); font-size: 0.9rem;">
            <span style="color: var(--accent-emerald);">✓</span>
            <span>${p}</span>
          </div>
        `).join('') : `<span style="color: var(--text-muted);">Standard runtime prerequisites.</span>`}
      </div>
    </div>

    <!-- Step by Step Quickstart -->
    <div class="content-card">
      <h3 class="card-title">
        <svg viewBox="0 0 24 24" width="20" height="20" stroke="var(--accent-emerald)" stroke-width="2" fill="none">
          <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>
        <span>Deterministic Setup &amp; Execution Pipeline</span>
      </h3>
      
      <div class="quickstart-steps-list">
        ${steps.length > 0 ? steps.map(step => `
          <div class="step-card">
            <div class="step-number">${step.step}</div>
            <div class="step-content">
              <div style="font-weight: 600; color: var(--text-primary); font-size: 0.95rem;">${step.explanation}</div>
              <div class="command-box">
                <code>${step.command}</code>
                <button type="button" class="copy-btn copy-cmd-btn" data-command="${encodeURIComponent(step.command)}" title="Copy Command">
                  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        `).join('') : `<p style="color: var(--text-muted);">No setup steps extracted.</p>`}
      </div>
    </div>

    <!-- Environment Variables -->
    <div class="content-card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.75rem;">
        <h3 class="card-title" style="margin-bottom: 0;">
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="var(--accent-amber)" stroke-width="2" fill="none">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
            <line x1="1" y1="10" x2="23" y2="10"></line>
          </svg>
          <span>Required Environment Variables (${envVars.length})</span>
        </h3>
        
        ${envVars.length > 0 ? `
          <button type="button" id="download-env-btn" class="btn-secondary" style="font-size: 0.85rem; padding: 0.4rem 0.8rem;">
            <span>📥 Generate .env.example</span>
          </button>
        ` : ''}
      </div>

      <div class="custom-table-container">
        <table class="custom-table">
          <thead>
            <tr>
              <th style="width: 30%;">Variable Key</th>
              <th style="width: 15%;">Status</th>
              <th>Purpose &amp; Documentation</th>
            </tr>
          </thead>
          <tbody>
            ${envVars.length > 0 ? envVars.map(v => `
              <tr>
                <td><code style="font-family: var(--font-mono); color: var(--accent-cyan); font-weight: 600;">${v.key}</code></td>
                <td>${v.required ? '<span class="badge" style="background: rgba(244, 63, 94, 0.15); color: #fb7185; border: 1px solid rgba(244, 63, 94, 0.3);">Mandatory</span>' : '<span class="badge" style="background: rgba(255, 255, 255, 0.06); color: var(--text-muted);">Optional</span>'}</td>
                <td>${v.purpose}</td>
              </tr>
            `).join('') : `<tr><td colspan="3" style="text-align: center; color: var(--text-muted);">No environment variables required</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Attach command copy listeners
  container.querySelectorAll('.copy-cmd-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const cmd = decodeURIComponent(btn.getAttribute('data-command') || '');
      await copyToClipboard(cmd);
      btn.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" stroke="#10b981" stroke-width="2.5" fill="none"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
      setTimeout(() => {
        btn.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
      }, 1500);
    });
  });

  // Attach .env download listener
  container.querySelector('#download-env-btn')?.addEventListener('click', () => {
    let envContent = `# Generated by Scry Architectural Intelligence\n\n`;
    for (const v of envVars) {
      envContent += `# ${v.purpose} (${v.required ? 'REQUIRED' : 'OPTIONAL'})\n`;
      envContent += `${v.key}=\n\n`;
    }
    downloadFile('.env.example', envContent, 'text/plain');
  });
}
