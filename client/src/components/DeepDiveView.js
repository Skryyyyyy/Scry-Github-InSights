import { getMethodBadgeClass, getComplexityBadgeClass } from '../utils/formatters.js';

/**
 * Deep Dive & API Surface View — Evidence-Backed
 * Displays complexity hotspots, API surface routes, ORM schema models, and schema contradiction flags.
 */
export function renderDeepDiveView(container, deepDiveData = {}) {
  const coreFunctions = deepDiveData.core_functions || deepDiveData.complexity_hotspots || [];
  const apiSurface = deepDiveData.api_surface || deepDiveData.api_routes || [];
  const dbSummary = deepDiveData.database_schema_summary || { orm_or_tool: 'None detected', models: deepDiveData.db_models || [] };
  const contradiction = deepDiveData.schema_dependency_contradiction;

  container.innerHTML = `
    <!-- Core Functions / Complexity Hotspots -->
    <div class="content-card">
      <h3 class="card-title">
        <svg viewBox="0 0 24 24" width="20" height="20" stroke="var(--accent-cyan)" stroke-width="2" fill="none">
          <polyline points="4 17 10 11 4 5"></polyline>
          <line x1="12" y1="19" x2="20" y2="19"></line>
        </svg>
        <span>Complexity Hotspots &amp; Function Symbols (${coreFunctions.length})</span>
      </h3>
      <div class="function-grid">
        ${coreFunctions.length > 0 ? coreFunctions.map(fn => {
          const name = fn.symbol || fn.function || 'function';
          const file = fn.file_path || fn.file;
          const line = fn.line;
          const comp = fn.complexity || fn.cyclomatic_complexity || 'low';
          const tier = fn.tier || (comp > 10 ? 'high' : comp >= 5 ? 'medium' : 'low');
          const compClass = getComplexityBadgeClass(tier);
          const location = line ? `${file}:${line}` : file;

          return `
            <div class="function-card">
              <div class="function-header">
                <span class="function-symbol">${name}</span>
                <span class="badge ${compClass}">${tier.toUpperCase()} complexity (${comp})</span>
              </div>
              <div class="function-file" style="display: flex; align-items: center; gap: 0.4rem;">
                <span style="opacity: 0.5;">📍</span>
                <code style="font-size: 0.8rem; color: var(--accent-cyan);">${location}</code>
              </div>
              ${fn.evidence ? `
                <div style="margin-top: 0.4rem; padding: 0.4rem 0.6rem; background: rgba(0,0,0,0.4); border-left: 2px solid var(--accent-cyan); border-radius: 0 3px 3px 0; font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-muted); overflow-x: auto; white-space: pre;">${escapeHtml(fn.evidence)}</div>
              ` : ''}
              <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5; margin-top: 0.4rem;">${fn.logic_summary || `Function '${name}' extracted from ${file}:${line}`}</p>
            </div>
          `;
        }).join('') : `<div style="color: var(--text-muted); font-size: 0.9rem;">No functions exceeded the complexity scan threshold.</div>`}
      </div>
    </div>

    <!-- API Surface Directory -->
    <div class="content-card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.75rem;">
        <h3 class="card-title" style="margin-bottom: 0;">
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="var(--accent-emerald)" stroke-width="2" fill="none">
            <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
            <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
            <line x1="6" y1="6" x2="6.01" y2="6"></line>
            <line x1="6" y1="18" x2="6.01" y2="18"></line>
          </svg>
          <span>API Surface Routes (${apiSurface.length})</span>
        </h3>
        <input 
          type="text" 
          id="api-filter-input" 
          placeholder="Filter endpoints..." 
          style="background: var(--bg-elevated); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 0.4rem 0.8rem; color: var(--text-primary); font-size: 0.85rem; outline: none;"
        />
      </div>

      <div class="custom-table-container">
        <table class="custom-table" id="api-table">
          <thead>
            <tr>
              <th style="width: 10%;">Method</th>
              <th style="width: 25%;">Endpoint</th>
              <th style="width: 10%;">Auth</th>
              <th style="width: 25%;">Location</th>
              <th>Framework</th>
            </tr>
          </thead>
          <tbody>
            ${apiSurface.length > 0 ? apiSurface.map(api => {
              const method = api.method;
              const path = api.path || api.endpoint;
              const file = api.file_path || api.file;
              const methodClass = getMethodBadgeClass(method);
              const location = api.line ? `${file}:${api.line}` : file;
              const isAuth = api.has_auth_middleware ?? api.auth_required;
              return `
                <tr class="api-row" data-endpoint="${path.toLowerCase()}" data-method="${method.toLowerCase()}">
                  <td><span class="badge ${methodClass}">${method}</span></td>
                  <td><code style="font-family: var(--font-mono); color: var(--accent-cyan);">${path}</code></td>
                  <td>${isAuth ? '<span class="badge" style="background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3);">🔒</span>' : '<span class="badge" style="background: rgba(255, 255, 255, 0.06); color: var(--text-muted);">🔓</span>'}</td>
                  <td><code style="font-family: var(--font-mono); font-size: 0.78rem; color: var(--text-secondary);">${location}</code></td>
                  <td style="font-size: 0.78rem; font-family: var(--font-mono); color: var(--text-muted);">${api.framework || api.description || 'Native Handler'}</td>
                </tr>
              `;
            }).join('') : `<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">No API routes detected by static scan</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Database Schema & Persistence Models -->
    <div class="content-card">
      <h3 class="card-title">
        <svg viewBox="0 0 24 24" width="20" height="20" stroke="var(--accent-violet)" stroke-width="2" fill="none">
          <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
          <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
        </svg>
        <span>Database Models (ORM: <span class="gradient-text">${dbSummary.orm_or_tool || 'None detected'}</span>)</span>
      </h3>
      
      ${contradiction ? `
        <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: var(--radius-md); padding: 1rem; margin-bottom: 1.25rem; display: flex; gap: 0.75rem; align-items: flex-start;">
          <span style="font-size: 1.2rem;">⚠️</span>
          <div>
            <strong style="color: #fbbf24; font-size: 0.9rem;">Schema vs Dependency Contradiction Detected:</strong>
            <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.2rem;">${contradiction}</p>
          </div>
        </div>
      ` : ''}

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.25rem;">
        ${(dbSummary.models || []).length > 0 ? (dbSummary.models || []).map(model => {
          const file = model.file_path || model.file;
          const location = model.line ? `${file}:${model.line}` : file;
          const fields = model.fields || model.fields_key || [];
          return `
          <div style="background: var(--bg-elevated); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1.25rem; display: flex; flex-direction: column; gap: 0.75rem;">
            <div style="font-family: var(--font-heading); font-size: 1.1rem; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; justify-content: space-between;">
              <span>🗃️ ${model.name}</span>
              <span class="badge" style="background: rgba(139, 92, 246, 0.15); color: #c084fc;">${model.orm || 'Model'}</span>
            </div>
            ${location ? `<div style="font-size: 0.78rem; font-family: var(--font-mono); color: var(--text-muted);">📍 ${location}</div>` : ''}
            <div>
              <span style="font-size: 0.75rem; font-weight: 600; text-transform: uppercase; color: var(--text-muted);">Fields:</span>
              <div style="display: flex; flex-wrap: wrap; gap: 0.35rem; margin-top: 0.35rem;">
                ${fields.map(f => `<code style="background: rgba(0,0,0,0.3); padding: 0.2rem 0.45rem; border-radius: 4px; font-size: 0.75rem; color: #38bdf8;">${f}</code>`).join('')}
                ${fields.length === 0 ? '<span style="font-size: 0.8rem; color: var(--text-muted);">No fields extracted</span>' : ''}
              </div>
            </div>
            ${(model.relations || model.relationships || []).length > 0 ? `
              <div>
                <span style="font-size: 0.75rem; font-weight: 600; text-transform: uppercase; color: var(--text-muted);">Relations:</span>
                <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.25rem;">
                  ${(model.relations || model.relationships).join(', ')}
                </div>
              </div>
            ` : ''}
          </div>
        `}).join('') : `<div style="color: var(--text-muted); font-size: 0.9rem;">No ORM models or migration files detected in static scan.</div>`}
      </div>
    </div>
  `;

  // API filter listener
  const filterInput = container.querySelector('#api-filter-input');
  if (filterInput) {
    filterInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      const rows = container.querySelectorAll('.api-row');
      rows.forEach(row => {
        const ep = row.getAttribute('data-endpoint') || '';
        const method = row.getAttribute('data-method') || '';
        row.style.display = (ep.includes(q) || method.includes(q)) ? '' : 'none';
      });
    });
  }
}

function escapeHtml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
