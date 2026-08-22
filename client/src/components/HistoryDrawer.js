import { storage } from '../services/storage.js';
import { getScoreColor } from '../utils/formatters.js';

/**
 * Audit History Drawer Component
 */
export function openHistoryDrawer(container, onSelectRepo) {
  const history = storage.getHistory();

  const drawerHtml = `
    <div class="modal-backdrop" id="history-backdrop">
      <div style="position: absolute; top: 0; right: 0; width: 100%; max-width: 420px; height: 100%; background: var(--bg-secondary); border-left: 1px solid var(--border-glass); display: flex; flex-direction: column; box-shadow: var(--shadow-lg); animation: fadeIn 0.2s ease;">
        <div class="modal-header">
          <h3 class="modal-title">🕒 Audit History</h3>
          <button type="button" id="close-history-x" class="btn-icon" style="width: 32px; height: 32px;">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div class="modal-body" style="padding: 1.25rem;">
          ${history.length > 0 ? `
            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
              ${history.map((item, idx) => {
                const color = getScoreColor(item.score);
                const date = new Date(item.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                return `
                  <div class="history-item-card" data-idx="${idx}" style="background: var(--bg-elevated); border: 1px solid var(--border-subtle); padding: 1rem; border-radius: var(--radius-md); cursor: pointer; transition: all var(--transition-fast);">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                      <strong style="color: var(--text-primary); font-size: 0.95rem;">${item.name}</strong>
                      <span style="font-family: var(--font-mono); font-weight: 700; color: ${color}; font-size: 0.95rem;">${item.score}/100</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.4rem; font-size: 0.75rem; color: var(--text-muted);">
                      <span>${item.verdict}</span>
                      <span>${date}</span>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          ` : `
            <div style="text-align: center; color: var(--text-muted); padding: 3rem 1rem;">
              <p>No analyzed repositories in history yet.</p>
            </div>
          `}
        </div>

        ${history.length > 0 ? `
          <div class="modal-footer">
            <button type="button" id="clear-history-btn" class="btn-secondary" style="font-size: 0.85rem; color: #fda4af;">Clear History</button>
          </div>
        ` : ''}
      </div>
    </div>
  `;

  container.innerHTML = drawerHtml;

  function closeDrawer() {
    container.innerHTML = '';
  }

  container.querySelector('#close-history-x')?.addEventListener('click', closeDrawer);
  container.querySelector('#history-backdrop')?.addEventListener('click', (e) => {
    if (e.target.id === 'history-backdrop') closeDrawer();
  });

  container.querySelectorAll('.history-item-card').forEach(card => {
    card.addEventListener('click', () => {
      const idx = parseInt(card.getAttribute('data-idx') || '0', 10);
      const selected = history[idx];
      if (selected && onSelectRepo) {
        closeDrawer();
        onSelectRepo(selected.data);
      }
    });
  });

  container.querySelector('#clear-history-btn')?.addEventListener('click', () => {
    storage.clearHistory();
    closeDrawer();
  });
}
