/**
 * Project Overview & Executive Telemetry Summary View Component
 */
export function renderProjectOverviewView(container, data = {}) {
  const p = data.project_overview || {};
  const v = p.vitality_score || {};
  const b = v.breakdown || {};
  const t = p.tech_stack || {};
  const arch = data.architecture || {};
  const sec = data.risk_and_security_audit?.security_warnings || [];
  const routes = data.deep_dive_analysis?.api_surface || [];
  const models = data.deep_dive_analysis?.database_schema_summary?.models || [];
  const functions = data.deep_dive_analysis?.core_functions || [];

  const critCount = sec.filter(s => s.severity === 'CRITICAL').length;
  const highCount = sec.filter(s => s.severity === 'HIGH').length;
  const medCount = sec.filter(s => s.severity === 'MEDIUM').length;

  container.innerHTML = `
    <!-- Executive Summary Card -->
    <div class="content-card">
      <h3 class="card-title">
        <svg viewBox="0 0 24 24" width="20" height="20" stroke="var(--accent-cyan)" stroke-width="2" fill="none">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
        <span>Executive Summary &amp; Repository Scope</span>
      </h3>
      
      <div style="background: rgba(0, 0, 0, 0.4); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1.25rem; margin-bottom: 1.25rem;">
        <h4 style="font-size: 1.15rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.4rem;">${p.name || 'Repository'}</h4>
        <p style="font-size: 0.95rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 0.75rem;">${p.tagline || ''}</p>
        <div style="background: rgba(139, 92, 246, 0.1); border-left: 3px solid #c084fc; padding: 0.75rem 1rem; border-radius: 0 var(--radius-sm) var(--radius-sm) 0; font-size: 0.9rem; color: var(--text-primary); line-height: 1.6;">
          💡 <strong>Core Pitch:</strong> ${p.elevator_pitch || 'No pitch provided.'}
        </div>
      </div>

      <!-- Quick Telemetry Grid -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem;">
        <div style="background: var(--bg-elevated); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1rem; text-align: center;">
          <span style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); font-weight: 600;">Primary Language</span>
          <div style="font-size: 1.2rem; font-weight: 700; color: var(--accent-cyan); margin-top: 0.2rem;">${t.primary_language || 'N/A'}</div>
        </div>

        <div style="background: var(--bg-elevated); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1rem; text-align: center;">
          <span style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); font-weight: 600;">Architecture Pattern</span>
          <div style="font-size: 0.95rem; font-weight: 700; color: #c084fc; margin-top: 0.2rem;">${arch.pattern || 'Modular'}</div>
        </div>

        <div style="background: var(--bg-elevated); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1rem; text-align: center;">
          <span style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); font-weight: 600;">API Endpoints</span>
          <div style="font-size: 1.2rem; font-weight: 700; color: var(--accent-emerald); margin-top: 0.2rem;">${routes.length} Detected</div>
        </div>

        <div style="background: var(--bg-elevated); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1rem; text-align: center;">
          <span style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); font-weight: 600;">Database Models</span>
          <div style="font-size: 1.2rem; font-weight: 700; color: #38bdf8; margin-top: 0.2rem;">${models.length} Models</div>
        </div>

        <div style="background: var(--bg-elevated); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1rem; text-align: center;">
          <span style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); font-weight: 600;">Exported Symbols</span>
          <div style="font-size: 1.2rem; font-weight: 700; color: var(--text-primary); margin-top: 0.2rem;">${functions.length} Symbols</div>
        </div>

        <div style="background: var(--bg-elevated); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1rem; text-align: center;">
          <span style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); font-weight: 600;">Security Findings</span>
          <div style="font-size: 1.1rem; font-weight: 700; color: ${critCount > 0 || highCount > 0 ? '#ff4444' : medCount > 0 ? '#fbbf24' : '#34d399'}; margin-top: 0.2rem;">
            ${sec.length === 0 ? '🛡️ Clean' : `${sec.length} Alert${sec.length > 1 ? 's' : ''}`}
          </div>
        </div>
      </div>
    </div>

    <!-- Tech Stack Quick Summary & Framework Badges -->
    <div class="content-card">
      <h3 class="card-title">
        <svg viewBox="0 0 24 24" width="20" height="20" stroke="var(--accent-emerald)" stroke-width="2" fill="none">
          <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
          <line x1="12" y1="2" x2="12" y2="12"></line>
        </svg>
        <span>Technology &amp; Tooling Overview</span>
      </h3>
      
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        <div>
          <span style="font-size: 0.8rem; font-weight: 600; text-transform: uppercase; color: var(--text-muted);">Frameworks &amp; Core Tooling:</span>
          <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.4rem;">
            ${(t.frameworks || []).map(f => `<span class="badge" style="background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); font-size: 0.85rem; padding: 0.35rem 0.75rem;">${f}</span>`).join('') || '<span style="color: var(--text-muted);">Standard runtime</span>'}
          </div>
        </div>

        <div>
          <span style="font-size: 0.8rem; font-weight: 600; text-transform: uppercase; color: var(--text-muted);">Languages Detected:</span>
          <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.4rem;">
            ${(t.languages || []).map(l => `<span class="badge" style="background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); font-size: 0.85rem; padding: 0.35rem 0.75rem;">${l}</span>`).join('')}
          </div>
        </div>

        ${(t.databases || []).length > 0 ? `
          <div>
            <span style="font-size: 0.8rem; font-weight: 600; text-transform: uppercase; color: var(--text-muted);">Databases &amp; Persistence:</span>
            <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.4rem;">
              ${t.databases.map(d => `<span class="badge" style="background: rgba(139, 92, 246, 0.15); color: #c084fc; border: 1px solid rgba(139, 92, 246, 0.3); font-size: 0.85rem; padding: 0.35rem 0.75rem;">${d}</span>`).join('')}
            </div>
          </div>
        ` : ''}

        ${(t.devops_and_cloud || []).length > 0 ? `
          <div>
            <span style="font-size: 0.8rem; font-weight: 600; text-transform: uppercase; color: var(--text-muted);">DevOps &amp; Infrastructure:</span>
            <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.4rem;">
              ${t.devops_and_cloud.map(dc => `<span class="badge" style="background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); font-size: 0.85rem; padding: 0.35rem 0.75rem;">${dc}</span>`).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}
