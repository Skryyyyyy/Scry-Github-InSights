/**
 * UI / UX Heuristic Audit & Actionable Improvements View Component — Evidence-Backed
 */
export function renderUiUxAuditView(container, uiUxData = {}) {
  const hasFrontend = uiUxData.has_frontend ?? false;
  const designSystem = uiUxData.design_system || 'None';
  const stateManagement = uiUxData.state_management || 'None';
  const heuristics = uiUxData.heuristics || {};
  const components = uiUxData.key_views_and_components || [];
  const improvements = uiUxData.actionable_improvements || [];

  container.innerHTML = `
    <!-- Heuristics & Telemetry Summary Cards -->
    <div class="content-card">
      <h3 class="card-title">
        <svg viewBox="0 0 24 24" width="20" height="20" stroke="#ffffff" stroke-width="2" fill="none">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="3" y1="9" x2="21" y2="9"></line>
          <line x1="9" y1="21" x2="9" y2="9"></line>
        </svg>
        <span>Frontend Architecture &amp; UI/UX Telemetry</span>
      </h3>
      
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
        <div style="background: #09090b; border: 1px solid #27272a; padding: 1.25rem; border-radius: var(--radius-md);">
          <span style="font-size: 0.75rem; text-transform: uppercase; color: #a1a1aa; font-weight: 600;">Frontend Present</span>
          <div style="font-size: 1.25rem; font-weight: 700; color: ${hasFrontend ? '#34d399' : '#a1a1aa'}; margin-top: 0.25rem;">
            ${hasFrontend ? '✅ Yes' : '❌ No (Backend / CLI Codebase)'}
          </div>
        </div>

        <div style="background: #09090b; border: 1px solid #27272a; padding: 1.25rem; border-radius: var(--radius-md);">
          <span style="font-size: 0.75rem; text-transform: uppercase; color: #a1a1aa; font-weight: 600;">Design System</span>
          <div style="font-size: 1.15rem; font-weight: 700; color: #ffffff; margin-top: 0.25rem;">
            ${designSystem}
          </div>
        </div>

        <div style="background: #09090b; border: 1px solid #27272a; padding: 1.25rem; border-radius: var(--radius-md);">
          <span style="font-size: 0.75rem; text-transform: uppercase; color: #a1a1aa; font-weight: 600;">State Management</span>
          <div style="font-size: 1.15rem; font-weight: 700; color: #ffffff; margin-top: 0.25rem;">
            ${stateManagement}
          </div>
        </div>
      </div>

      <!-- Heuristics Ratings -->
      <h4 style="font-size: 0.85rem; font-weight: 700; color: #a1a1aa; margin-bottom: 0.75rem; text-transform: uppercase; letter-spacing: 0.04em;">
        Usability &amp; Design Heuristics Assessment
      </h4>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
        <div style="background: #000000; border: 1px solid #27272a; border-radius: var(--radius-md); padding: 1rem; text-align: center;">
          <span style="font-size: 0.8rem; color: #71717a;">Accessibility (a11y)</span>
          <div style="font-size: 1.15rem; font-weight: 700; color: ${heuristics.accessibility_rating === 'Needs Improvement' ? '#f43f5e' : '#34d399'}; margin-top: 0.2rem;">
            ${heuristics.accessibility_rating || 'Good'}
          </div>
        </div>
        <div style="background: #000000; border: 1px solid #27272a; border-radius: var(--radius-md); padding: 1rem; text-align: center;">
          <span style="font-size: 0.8rem; color: #71717a;">Responsiveness</span>
          <div style="font-size: 1.15rem; font-weight: 700; color: ${heuristics.responsiveness === 'Needs Improvement' ? '#f59e0b' : '#38bdf8'}; margin-top: 0.2rem;">
            ${heuristics.responsiveness || 'Good'}
          </div>
        </div>
        <div style="background: #000000; border: 1px solid #27272a; border-radius: var(--radius-md); padding: 1rem; text-align: center;">
          <span style="font-size: 0.8rem; color: #71717a;">Design Consistency</span>
          <div style="font-size: 1.15rem; font-weight: 700; color: #ffffff; margin-top: 0.2rem;">
            ${heuristics.design_consistency || 'High'}
          </div>
        </div>
      </div>
    </div>

    <!-- Actionable UI / UX Improvements & Refactoring Recommendations -->
    <div class="content-card">
      <h3 class="card-title">
        <svg viewBox="0 0 24 24" width="20" height="20" stroke="#f59e0b" stroke-width="2" fill="none">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <span>Actionable UI/UX Improvements &amp; Refactoring Recommendations (${improvements.length})</span>
      </h3>

      <div style="display: flex; flex-direction: column; gap: 1rem; margin-top: 1rem;">
        ${improvements.length > 0 ? improvements.map(imp => {
          const fileLoc = imp.line ? `${imp.targetFile}:${imp.line}` : imp.targetFile;
          return `
          <div style="background: #09090b; border: 1px solid #27272a; border-radius: var(--radius-md); padding: 1.25rem; border-left: 4px solid ${imp.impact === 'HIGH' ? '#f43f5e' : '#f59e0b'};">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.5rem;">
              <h4 style="font-size: 1rem; font-weight: 700; color: #ffffff;">${imp.title}</h4>
              <div style="display: flex; gap: 0.4rem;">
                <span class="badge" style="background: #18181b; color: #a1a1aa; border: 1px solid #27272a;">${imp.category}</span>
                <span class="badge" style="background: ${imp.impact === 'HIGH' ? 'rgba(244,63,94,0.15)' : 'rgba(245,158,11,0.15)'}; color: ${imp.impact === 'HIGH' ? '#f43f5e' : '#f59e0b'}; font-weight: 700;">${imp.impact} IMPACT</span>
              </div>
            </div>
            ${fileLoc ? `
              <div style="font-size: 0.8rem; color: #71717a; font-family: var(--font-mono); margin-bottom: 0.5rem;">
                📍 Target Location: <code style="color: #ffffff;">${fileLoc}</code>
              </div>
            ` : ''}
            <p style="font-size: 0.9rem; color: #a1a1aa; margin-bottom: 0.75rem; line-height: 1.5;">
              ${imp.issue}
            </p>
            <div style="background: #18181b; border: 1px solid #27272a; border-radius: var(--radius-sm); padding: 0.75rem 1rem; font-size: 0.875rem; color: #ffffff;">
              <strong>💡 Actionable Fix:</strong> ${imp.recommendation}
            </div>
          </div>
        `}).join('') : `
          <div style="text-align: center; color: #71717a; padding: 1.5rem;">
            No critical UI/UX issues detected in scanned files.
          </div>
        `}
      </div>
    </div>

    <!-- Key Views & Component Architecture -->
    <div class="content-card">
      <h3 class="card-title">
        <svg viewBox="0 0 24 24" width="20" height="20" stroke="#ffffff" stroke-width="2" fill="none">
          <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
          <polyline points="2 17 12 22 22 17"></polyline>
          <polyline points="2 12 12 17 22 12"></polyline>
        </svg>
        <span>Key Views &amp; UI Components (${components.length})</span>
      </h3>
      
      <div class="custom-table-container">
        <table class="custom-table">
          <thead>
            <tr>
              <th style="width: 25%;">Component Name</th>
              <th style="width: 15%;">Type</th>
              <th style="width: 25%;">File Path</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            ${components.length > 0 ? components.map(c => `
              <tr>
                <td><strong>${c.name}</strong></td>
                <td><span class="badge" style="background: #18181b; color: #ffffff; border: 1px solid #27272a;">${c.type || 'Component'}</span></td>
                <td><code style="font-family: var(--font-mono); font-size: 0.8rem; color: #ffffff;">${c.path}</code></td>
                <td>${c.description}</td>
              </tr>
            `).join('') : `<tr><td colspan="4" style="text-align: center; color: #71717a;">No key UI views identified in scanned files</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>
  `;
}
