/**
 * Project Overview & Executive Telemetry Summary View Component — Evidence & GitHub Telemetry Backed
 */
export function renderProjectOverviewView(container, data = {}) {
  const p = data.project_overview || {};
  const meta = data.github_meta || data.repository || {};
  const v = p.vitality_score || {};
  const b = v.breakdown || {};
  const t = p.tech_stack || data.tech_stack || {};
  const arch = data.architecture || {};
  const sec = data.risk_and_security_audit?.security_warnings || data.security_and_risk?.findings || [];
  const routes = data.deep_dive_analysis?.api_surface || data.deep_dive?.api_routes || [];
  const models = data.deep_dive_analysis?.database_schema_summary?.models || data.deep_dive?.db_models || [];
  const functions = data.deep_dive_analysis?.core_functions || data.deep_dive?.complexity_hotspots || [];

  const repoName = p.name || meta.name || 'Repository';
  const ownerName = meta.owner || repoName.split('/')[0] || 'GitHub Author';
  const ownerAvatar = meta.ownerAvatar || `https://github.com/${ownerName}.png`;
  const ownerUrl = meta.ownerUrl || `https://github.com/${ownerName}`;
  const htmlUrl = meta.htmlUrl || (repoName.includes('/') ? `https://github.com/${repoName}` : '#');
  const stars = meta.stars ?? 0;
  const forks = meta.forks ?? 0;
  const openIssues = meta.openIssues ?? 0;
  const defaultBranch = meta.defaultBranch || 'main';

  const critCount = sec.filter(s => s.severity === 'CRITICAL').length;
  const highCount = sec.filter(s => s.severity === 'HIGH').length;
  const medCount = sec.filter(s => s.severity === 'MEDIUM').length;

  container.innerHTML = `
    <!-- GitHub Owner & Repository Telemetry Header Card -->
    <div class="content-card">
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.25rem;">
        <div style="display: flex; align-items: center; gap: 0.85rem;">
          <img src="${ownerAvatar}" width="48" height="48" style="border-radius: 50%; border: 2px solid var(--border-subtle); object-fit: cover;" alt="${ownerName}" onError="this.src='https://github.com/github.png'" />
          <div>
            <div style="font-size: 0.8rem; color: var(--text-muted); font-family: var(--font-mono); display: flex; align-items: center; gap: 0.4rem;">
              <span>Author / Organization:</span>
              <a href="${ownerUrl}" target="_blank" rel="noopener noreferrer" style="color: var(--accent-cyan); font-weight: 600; text-decoration: none;">@${ownerName}</a>
            </div>
            <h3 style="font-size: 1.35rem; font-weight: 800; color: var(--text-primary); margin-top: 0.15rem; font-family: var(--font-heading);">${repoName}</h3>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap;">
          <a href="${htmlUrl}" target="_blank" rel="noopener noreferrer" class="btn-primary" style="font-size: 0.85rem; padding: 0.45rem 0.9rem; text-decoration: none;">
            <span>↗ View on GitHub</span>
          </a>
        </div>
      </div>

      <!-- GitHub Metrics Chips -->
      <div style="display: flex; flex-wrap: wrap; gap: 0.75rem; background: rgba(0,0,0,0.4); border: 1px solid var(--border-subtle); padding: 0.85rem 1.25rem; border-radius: var(--radius-md);">
        <div style="display: flex; align-items: center; gap: 0.4rem; font-size: 0.88rem; color: #fbbf24; font-weight: 600;">
          <span>⭐</span> <span>${stars.toLocaleString()} stars</span>
        </div>
        <span style="color: var(--text-muted);">·</span>
        <div style="display: flex; align-items: center; gap: 0.4rem; font-size: 0.88rem; color: #38bdf8; font-weight: 600;">
          <span>🍴</span> <span>${forks.toLocaleString()} forks</span>
        </div>
        <span style="color: var(--text-muted);">·</span>
        <div style="display: flex; align-items: center; gap: 0.4rem; font-size: 0.88rem; color: #f43f5e; font-weight: 600;">
          <span>👁️</span> <span>${openIssues.toLocaleString()} open issues</span>
        </div>
        <span style="color: var(--text-muted);">·</span>
        <div style="display: flex; align-items: center; gap: 0.4rem; font-size: 0.88rem; color: var(--text-secondary); font-family: var(--font-mono);">
          <span>🌿</span> <span>branch: ${defaultBranch}</span>
        </div>
      </div>
    </div>

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
        <span>Executive Summary &amp; Scope</span>
      </h3>
      
      <div style="background: rgba(0, 0, 0, 0.4); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1.25rem; margin-bottom: 1.25rem;">
        <p style="font-size: 0.95rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 0.75rem;">${p.tagline || data.overview || ''}</p>
        <div style="background: rgba(139, 92, 246, 0.1); border-left: 3px solid #c084fc; padding: 0.75rem 1rem; border-radius: 0 var(--radius-sm) var(--radius-sm) 0; font-size: 0.9rem; color: var(--text-primary); line-height: 1.6;">
          💡 <strong>Synthesis:</strong> ${p.elevator_pitch || data.overview || 'No overview pitch provided.'}
        </div>
      </div>

      <!-- Quick Telemetry Grid -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem;">
        <div style="background: var(--bg-elevated); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1rem; text-align: center;">
          <span style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); font-weight: 600;">Primary Language</span>
          <div style="font-size: 1.2rem; font-weight: 700; color: var(--accent-cyan); margin-top: 0.2rem;">${t.primary_language || (t.languages && t.languages[0]) || 'N/A'}</div>
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
          <span style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); font-weight: 600;">Symbol Hotspots</span>
          <div style="font-size: 1.2rem; font-weight: 700; color: var(--text-primary); margin-top: 0.2rem;">${functions.length} Scanned</div>
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

        ${(t.devops || t.devops_and_cloud || []).length > 0 ? `
          <div>
            <span style="font-size: 0.8rem; font-weight: 600; text-transform: uppercase; color: var(--text-muted);">DevOps &amp; Infrastructure:</span>
            <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.4rem;">
              ${(t.devops || t.devops_and_cloud).map(dc => `<span class="badge" style="background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); font-size: 0.85rem; padding: 0.35rem 0.75rem;">${dc}</span>`).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}
