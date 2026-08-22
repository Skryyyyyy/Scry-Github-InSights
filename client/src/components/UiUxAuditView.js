/**
 * UI / UX Audit View Component — Evidence-Backed & Unbiased
 */
export function renderUiUxAuditView(container, uiUxData = {}) {
  const hasFrontend = uiUxData.frontend_present ?? uiUxData.has_frontend ?? false;
  const designSystem = uiUxData.design_system || 'None detected';
  const components = uiUxData.components || uiUxData.key_views_and_components || [];
  const improvements = uiUxData.actionable_improvements || [];
  const accessibilityNote = uiUxData.accessibility_note || "Not assessed — requires runtime/visual audit";

  container.innerHTML = `
    <!-- Frontend Telemetry Summary Cards -->
    <div class="content-card">
      <h3 class="card-title">
        <svg viewBox="0 0 24 24" width="20" height="20" stroke="#ffffff" stroke-width="2" fill="none">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="3" y1="9" x2="21" y2="9"></line>
          <line x1="9" y1="21" x2="9" y2="9"></line>
        </svg>
        <span>Frontend Architecture &amp; UI Telemetry</span>
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
          <span style="font-size: 0.75rem; text-transform: uppercase; color: #a1a1aa; font-weight: 600;">Accessibility Audit</span>
          <div style="font-size: 0.95rem; font-weight: 600; color: #fbbf24; margin-top: 0.25rem;">
            ℹ️ ${accessibilityNote}
          </div>
        </div>
      </div>
    </div>

    <!-- Frontend Components -->
    <div class="content-card">
      <h3 class="card-title">
        <svg viewBox="0 0 24 24" width="20" height="20" stroke="#ffffff" stroke-width="2" fill="none">
          <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
          <polyline points="2 17 12 22 22 17"></polyline>
          <polyline points="2 12 12 17 22 12"></polyline>
        </svg>
        <span>Detected UI Components (${components.length})</span>
      </h3>
      
      <div class="custom-table-container">
        <table class="custom-table">
          <thead>
            <tr>
              <th style="width: 25%;">Component Name</th>
              <th style="width: 15%;">Type</th>
              <th style="width: 60%;">File Path</th>
            </tr>
          </thead>
          <tbody>
            ${components.length > 0 ? components.map(c => {
              const name = c.name;
              const file = c.file_path || c.file || c.path;
              const type = c.type || 'Component';
              return `
              <tr>
                <td><strong>${name}</strong></td>
                <td><span class="badge" style="background: #18181b; color: #ffffff; border: 1px solid #27272a;">${type}</span></td>
                <td><code style="font-family: var(--font-mono); font-size: 0.8rem; color: #38bdf8;">${file}</code></td>
              </tr>
            `;
            }).join('') : `<tr><td colspan="3" style="text-align: center; color: #71717a;">No frontend components detected by static scan</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>
  `;
}
