/**
 * Local storage manager for GitVision configuration and history
 */

const STORAGE_KEYS = {
  SETTINGS: 'gitvision_settings',
  HISTORY: 'gitvision_history',
  ACTIVE_REPO: 'gitvision_active_repo'
};

export const storage = {
  getSettings() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? JSON.parse(data) : { geminiKey: '', githubToken: '' };
    } catch {
      return { geminiKey: '', githubToken: '' };
    }
  },

  saveSettings(settings) {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (err) {
      console.error('Failed to save settings to localStorage:', err);
    }
  },

  getHistory() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.HISTORY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  addHistoryItem(repoItem) {
    try {
      const history = this.getHistory();
      // Remove duplicate if exists
      const filtered = history.filter(item => item.name !== repoItem.name);
      filtered.unshift({
        name: repoItem.name,
        timestamp: new Date().toISOString(),
        score: repoItem.vitality_score?.overall_score || 0,
        verdict: repoItem.vitality_score?.verdict || 'Audited',
        data: repoItem
      });
      // Keep up to 20 items
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(filtered.slice(0, 20)));
    } catch (err) {
      console.error('Failed to update history:', err);
    }
  },

  clearHistory() {
    localStorage.removeItem(STORAGE_KEYS.HISTORY);
  }
};
