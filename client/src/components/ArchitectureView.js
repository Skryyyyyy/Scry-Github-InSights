import { renderMermaidDiagram } from '../utils/mermaidRenderer.js';
import { copyToClipboard, downloadFile } from '../utils/formatters.js';

/**
 * Architecture & Logic Flow View Component — Evidence-Backed
 */
export function renderArchitectureView(container, architectureData = {}) {
  const pattern = architectureData.pattern || 'Modular Architecture';
  const overview = architectureData.overview || 'No architectural summary available.';
  const mermaidCode = architectureData.logic_flow_mermaid || architectureData.mermaid || 'graph TD; Client --> Server';
  const entryPoints = architectureData.entry_points || [];
  const modules = architectureData.modules || [];

  container.innerHTML = `
    <!-- High Level Overview -->
    <div class="content-card">
      <h3 class="card-title">
        <svg viewBox="0 0 24 24" width="20" height="20" stroke="var(--accent-cyan)" stroke-width="2" fill="none">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="2" y1="12" x2="22" y2="12"></line>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
        </svg>
        <span>Architectural Pattern: <span class="gradient-text">${pattern}</span></span>
      </h3>
      <p style="color: var(--text-secondary); line-height: 1.6; font-size: 0.95rem;">${overview}</p>
    </div>

    <!-- Live Mermaid Diagram Viewer -->
    <div class="content-card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <h3 class="card-title" style="margin-bottom: 0;">
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="var(--accent-emerald)" stroke-width="2" fill="none">
            <polyline points="16 18 22 12 16 6"></polyline>
            <polyline points="8 6 2 12 8 18"></polyline>
          </svg>
          <span>Interactive Logic Flow &amp; Call Graph</span>
        </h3>
        <span style="font-size: 0.8rem; color: var(--text-muted);">Scroll to Zoom • Drag to Pan</span>
      </div>

      <div class="mermaid-viewer-wrapper">
        <div class="mermaid-toolbar">
          <button type="button" id="diagram-zoom-in" class="btn-icon" style="width: 32px; height: 32px;" title="Zoom In">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
          </button>
          <button type="button" id="diagram-zoom-out" class="btn-icon" style="width: 32px; height: 32px;" title="Zoom Out">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
          </button>
          <button type="button" id="diagram-zoom-reset" class="btn-icon" style="width: 32px; height: 32px;" title="Reset View">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><polyline points="3 3 3 8 8 8"></polyline></svg>
          </button>
          <button type="button" id="diagram-copy-code" class="btn-icon" style="width: 32px; height: 32px;" title="Copy Mermaid Syntax">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          </button>
          <button type="button" id="diagram-export-svg" class="btn-icon" style="width: 32px; height: 32px;" title="Export SVG">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          </button>
        </div>

        <div id="mermaid-canvas" class="mermaid-viewport">
          <div class="loader-spinner"></div>
        </div>
      </div>
    </div>

    <!-- Entry Points Table -->
    <div class="content-card">
      <h3 class="card-title">
        <svg viewBox="0 0 24 24" width="20" height="20" stroke="var(--accent-violet)" stroke-width="2" fill="none">
          <path d="M15 3h6v6"></path>
          <path d="M10 14L21 3"></path>
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
        </svg>
        <span>Entry Points &amp; Execution Gateways (${entryPoints.length})</span>
      </h3>
      <div class="custom-table-container">
        <table class="custom-table">
          <thead>
            <tr>
              <th style="width: 30%;">File Location</th>
              <th style="width: 15%;">Type</th>
              <th>Purpose &amp; Description</th>
            </tr>
          </thead>
          <tbody>
            ${entryPoints.length > 0 ? entryPoints.map(ep => {
              const location = ep.line ? `${ep.file}:${ep.line}` : ep.file;
              return `
              <tr>
                <td><code style="font-family: var(--font-mono); color: var(--accent-cyan);">${location}</code></td>
                <td><span class="badge" style="background: rgba(139, 92, 246, 0.15); color: #c084fc; border: 1px solid rgba(139, 92, 246, 0.3);">${ep.type || 'entry'}</span></td>
                <td>${ep.purpose}</td>
              </tr>
            `;
            }).join('') : `<tr><td colspan="3" style="text-align: center; color: var(--text-muted);">No explicit entry points identified</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modules Breakdown -->
    <div class="content-card">
      <h3 class="card-title">
        <svg viewBox="0 0 24 24" width="20" height="20" stroke="var(--accent-cyan)" stroke-width="2" fill="none">
          <rect x="3" y="3" width="7" height="7"></rect>
          <rect x="14" y="3" width="7" height="7"></rect>
          <rect x="14" y="14" width="7" height="7"></rect>
          <rect x="3" y="14" width="7" height="7"></rect>
        </svg>
        <span>Modular Boundary Catalog (${modules.length})</span>
      </h3>
      <div class="custom-table-container">
        <table class="custom-table">
          <thead>
            <tr>
              <th style="width: 25%;">Module Name</th>
              <th style="width: 20%;">Path</th>
              <th>Responsibility</th>
              <th>Dependencies</th>
            </tr>
          </thead>
          <tbody>
            ${modules.length > 0 ? modules.map(mod => `
              <tr>
                <td><strong>${mod.name}</strong></td>
                <td><code style="font-family: var(--font-mono); font-size: 0.85rem; color: var(--text-secondary);">${mod.path}</code></td>
                <td>${mod.responsibility}</td>
                <td>${(mod.dependencies || []).map(d => `<span class="badge" style="background: var(--bg-elevated); margin-right: 4px;">${d}</span>`).join('') || '<span style="color: var(--text-muted);">None</span>'}</td>
              </tr>
            `).join('') : `<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">No module boundaries detected</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Render diagram asynchronously
  const canvasEl = container.querySelector('#mermaid-canvas');
  if (canvasEl) {
    renderMermaidDiagram(canvasEl, mermaidCode);
  }

  // Attach toolbar listeners
  container.querySelector('#diagram-zoom-in')?.addEventListener('click', () => canvasEl?.__zoomIn?.());
  container.querySelector('#diagram-zoom-out')?.addEventListener('click', () => canvasEl?.__zoomOut?.());
  container.querySelector('#diagram-zoom-reset')?.addEventListener('click', () => canvasEl?.__resetZoom?.());
  
  container.querySelector('#diagram-copy-code')?.addEventListener('click', async () => {
    await copyToClipboard(mermaidCode);
    const btn = container.querySelector('#diagram-copy-code');
    if (btn) {
      const orig = btn.innerHTML;
      btn.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" stroke="#10b981" stroke-width="2.5" fill="none"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
      setTimeout(() => btn.innerHTML = orig, 1500);
    }
  });

  container.querySelector('#diagram-export-svg')?.addEventListener('click', () => {
    const svgEl = canvasEl?.querySelector('svg');
    if (svgEl) {
      downloadFile('architecture_diagram.svg', svgEl.outerHTML, 'image/svg+xml');
    }
  });
}
