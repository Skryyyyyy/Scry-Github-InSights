import { getSeverityBadgeClass } from '../utils/formatters.js';

/**
 * Risk & Security Audit View — Evidence-Backed
 * Every finding shows file:line reference and the actual code snippet or risk description.
 */
export function renderSecurityAuditView(container, securityData = {}) {
  const warnings = securityData.findings || securityData.security_warnings || [];
  const cves = securityData.cves || [];
  const codeSmells = securityData.code_smells || securityData.code_smells_and_technical_debt || [];

  // Count by severity
  const critCount = warnings.filter(w => w.severity === 'CRITICAL').length;
  const highCount = warnings.filter(w => w.severity === 'HIGH').length;
  const medCount = warnings.filter(w => w.severity === 'MEDIUM').length;
  const lowCount = warnings.filter(w => w.severity === 'LOW').length;

  const severitySummary = [
    critCount > 0 ? `<span style="color: #ff4444;">${critCount} CRITICAL</span>` : '',
    highCount > 0 ? `<span style="color: #ff8c00;">${highCount} HIGH</span>` : '',
    medCount > 0 ? `<span style="color: #fbbf24;">${medCount} MEDIUM</span>` : '',
    lowCount > 0 ? `<span style="color: #9ca3af;">${lowCount} LOW</span>` : ''
  ].filter(Boolean).join(' · ');

  container.innerHTML = `
    <!-- Vulnerability Warnings -->
    <div class="content-card">
      <h3 class="card-title">
        <svg viewBox="0 0 24 24" width="20" height="20" stroke="var(--accent-crimson)" stroke-width="2" fill="none">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
        </svg>
        <span>Security Findings (${warnings.length})</span>
      </h3>
      ${severitySummary ? `<div style="font-size: 0.85rem; margin-bottom: 1rem; color: var(--text-secondary);">${severitySummary}</div>` : ''}
      
      <div class="security-list">
        ${warnings.length > 0 ? warnings.map(w => {
          const sevClass = getSeverityBadgeClass(w.severity);
          const borderClass = `severity-${(w.severity || 'low').toLowerCase()}`;
          const fileLocation = w.file && w.line ? `${w.file}:${w.line}` : (w.location || 'Unknown');
          const issueTitle = w.risk || w.issue || w.description || 'Security Finding';
          
          return `
            <div class="security-card ${borderClass}">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem;">
                <div style="flex: 1;">
                  <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.4rem;">
                    <span class="badge ${sevClass}">${w.severity || 'WARNING'}</span>
                    ${w.rule ? `<span style="font-size: 0.7rem; color: var(--text-muted); font-family: var(--font-mono); background: rgba(255,255,255,0.05); padding: 2px 6px; border-radius: 3px;">${w.rule}</span>` : ''}
                  </div>
                  <h4 style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin-top: 0.2rem;">${issueTitle}</h4>
                  <div style="font-size: 0.85rem; color: var(--text-muted); font-family: var(--font-mono); margin-top: 0.35rem;">
                    📍 <span style="color: var(--accent-cyan);">${fileLocation}</span>
                  </div>
                  ${w.evidence ? `
                    <div style="margin-top: 0.5rem; padding: 0.5rem 0.75rem; background: rgba(0,0,0,0.4); border-left: 2px solid var(--accent-crimson); border-radius: 0 4px 4px 0; font-family: var(--font-mono); font-size: 0.78rem; color: var(--text-secondary); overflow-x: auto; white-space: pre; max-width: 100%;">
                      ${escapeHtml(w.evidence)}
                    </div>
                  ` : ''}
                </div>
              </div>

              <div class="remediation-box">
                <div style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: var(--accent-emerald); margin-bottom: 0.35rem;">
                  🛡️ Actionable Remediation:
                </div>
                <div>${w.remediation}</div>
              </div>
            </div>
          `;
        }).join('') : `
          <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); padding: 1.5rem; border-radius: var(--radius-md); text-align: center;">
            <div style="font-size: 1.5rem; margin-bottom: 0.4rem;">🛡️</div>
            <h4 style="color: #34d399; font-weight: 700;">No SAST or Secret Findings</h4>
            <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.25rem;">No hardcoded secrets, injection vectors, or unvalidated routes detected by static scan.</p>
          </div>
        `}
      </div>
    </div>

    <!-- Known Dependency CVEs (if any) -->
    ${cves.length > 0 ? `
      <div class="content-card">
        <h3 class="card-title">
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="#f43f5e" stroke-width="2" fill="none">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>Known Dependency Vulnerabilities (CVEs) (${cves.length})</span>
        </h3>
        <div class="custom-table-container">
          <table class="custom-table">
            <thead>
              <tr>
                <th>Package</th>
                <th>Current Version</th>
                <th>Fixed Version</th>
                <th>Severity</th>
              </tr>
            </thead>
            <tbody>
              ${cves.map(c => `
                <tr>
                  <td><strong>${c.package}</strong></td>
                  <td><code>${c.current_version}</code></td>
                  <td><code style="color: #34d399;">${c.fixed_version}</code></td>
                  <td><span class="badge ${getSeverityBadgeClass(c.severity)}">${c.severity}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    ` : ''}

    <!-- Code Smells & Technical Debt -->
    <div class="content-card">
      <h3 class="card-title">
        <svg viewBox="0 0 24 24" width="20" height="20" stroke="var(--accent-amber)" stroke-width="2" fill="none">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <span>Code Smells &amp; Technical Debt (${codeSmells.length})</span>
      </h3>
      
      <div class="custom-table-container">
        <table class="custom-table">
          <thead>
            <tr>
              <th style="width: 25%;">Target Location / Source</th>
              <th style="width: 45%;">Description</th>
              <th>Impact</th>
            </tr>
          </thead>
          <tbody>
            ${codeSmells.length > 0 ? codeSmells.map(smell => `
              <tr>
                <td><code style="font-family: var(--font-mono); font-size: 0.8rem; color: #fbbf24;">${smell.file || smell.category || 'Codebase'}</code></td>
                <td>${smell.description}</td>
                <td style="color: var(--text-secondary);">${smell.impact}</td>
              </tr>
            `).join('') : `<tr><td colspan="3" style="text-align: center; color: var(--text-muted);">No code smells detected</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
