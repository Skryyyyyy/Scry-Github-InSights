/**
 * Header Component
 */
export function renderHeader(container, { onOpenSettings, onOpenHistory, onReset }) {
  container.innerHTML = `
    <div class="header-brand" id="brand-home-btn">
      <div class="brand-icon">
        <svg viewBox="0 0 24 24" width="22" height="22" stroke="#ffffff" stroke-width="2.5" fill="none">
          <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
          <polyline points="2 17 12 22 22 17"></polyline>
          <polyline points="2 12 12 17 22 12"></polyline>
        </svg>
      </div>
      <span>Git<span class="gradient-text">Vision</span></span>
    </div>

    <div class="header-actions">
      <button type="button" id="history-btn" class="btn-icon" title="Audit History">
        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
      </button>
      <button type="button" id="settings-btn" class="btn-icon" title="API Settings">
        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
      </button>
      <a href="https://github.com" target="_blank" rel="noopener noreferrer" class="btn-secondary" style="font-size: 0.85rem; padding: 0.45rem 0.9rem;">
        <span>Docs & Schema</span>
      </a>
    </div>
  `;

  document.getElementById('brand-home-btn')?.addEventListener('click', onReset);
  document.getElementById('settings-btn')?.addEventListener('click', onOpenSettings);
  document.getElementById('history-btn')?.addEventListener('click', onOpenHistory);
}
