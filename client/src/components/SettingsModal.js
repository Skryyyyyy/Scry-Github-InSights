import { storage } from '../services/storage.js';

/**
 * Settings & API Credentials Modal
 */
export function openSettingsModal(container, onSaved) {
  const currentSettings = storage.getSettings();

  const modalHtml = `
    <div class="modal-backdrop" id="settings-modal-backdrop">
      <div class="modal-dialog">
        <div class="modal-header">
          <h3 class="modal-title">⚙️ Scry AI &amp; GitHub API Settings</h3>
          <button type="button" id="close-settings-x" class="btn-icon" style="width: 32px; height: 32px;">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div class="modal-body">
          <form id="settings-form">
            <div class="form-group">
              <label class="form-label" for="gemini-key-input">Google Gemini API Key (Optional)</label>
              <input 
                type="password" 
                id="gemini-key-input" 
                class="form-input" 
                placeholder="AIzaSy..." 
                value="${currentSettings.geminiKey || ''}"
              />
              <p class="form-hint">Enables real-time live LLM inference with Gemini 1.5/2.0 Flash executing <code>gitvision_master_prompt.md</code>. If left blank, Scry uses the built-in static scanner engine or instant sample benchmarks.</p>
            </div>

            <div class="form-group">
              <label class="form-label" for="github-token-input">GitHub Personal Access Token (Optional)</label>
              <input 
                type="password" 
                id="github-token-input" 
                class="form-input" 
                placeholder="ghp_..." 
                value="${currentSettings.githubToken || ''}"
              />
              <p class="form-hint">Increases GitHub REST API rate limits from 60 requests/hr to 5,000 requests/hr and allows analysis of private repositories.</p>
            </div>
          </form>
        </div>

        <div class="modal-footer">
          <button type="button" id="cancel-settings-btn" class="btn-secondary">Cancel</button>
          <button type="button" id="save-settings-btn" class="btn-primary">Save Configuration</button>
        </div>
      </div>
    </div>
  `;

  container.innerHTML = modalHtml;

  function closeModal() {
    container.innerHTML = '';
  }

  container.querySelector('#close-settings-x')?.addEventListener('click', closeModal);
  container.querySelector('#cancel-settings-btn')?.addEventListener('click', closeModal);
  container.querySelector('#settings-modal-backdrop')?.addEventListener('click', (e) => {
    if (e.target.id === 'settings-modal-backdrop') closeModal();
  });

  container.querySelector('#save-settings-btn')?.addEventListener('click', () => {
    const geminiKey = container.querySelector('#gemini-key-input')?.value.trim() || '';
    const githubToken = container.querySelector('#github-token-input')?.value.trim() || '';

    storage.saveSettings({ geminiKey, githubToken });
    closeModal();
    if (onSaved) onSaved({ geminiKey, githubToken });
  });
}
