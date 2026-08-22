/**
 * Top Rainbow Announcement Banner Component (@fuma-nama/components/banner UI)
 */
export function renderTopBanner(container) {
  const STORAGE_KEY = 'banner-scry-v1-dismissed';
  
  // Check if previously dismissed
  if (localStorage.getItem(STORAGE_KEY) === 'true') {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = `
    <div id="scry-rainbow-banner" class="rainbow-banner-wrapper">
      <div class="rainbow-banner-gradient-1"></div>
      <div class="rainbow-banner-gradient-2"></div>
      
      <div class="banner-inner-content">
        <span class="banner-badge-icon">✨</span>
        <span class="banner-message">
          <strong>Scry v1.0 Intelligence Engine</strong> — AI Architectural Auditing, Live Mermaid.js Diagrams &amp; Vitality Telemetry.
        </span>
        <button type="button" id="banner-cta-btn" class="banner-cta">Try Demo &rarr;</button>
      </div>

      <button type="button" id="close-rainbow-banner-btn" class="banner-close-btn" aria-label="Close Banner">
        <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2.5" fill="none">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
  `;

  const bannerEl = container.querySelector('#scry-rainbow-banner');
  const closeBtn = container.querySelector('#close-rainbow-banner-btn');
  const ctaBtn = container.querySelector('#banner-cta-btn');

  closeBtn?.addEventListener('click', () => {
    if (bannerEl) {
      bannerEl.style.height = '0px';
      bannerEl.style.opacity = '0';
      bannerEl.style.padding = '0';
      setTimeout(() => {
        container.innerHTML = '';
      }, 300);
    }
    localStorage.setItem(STORAGE_KEY, 'true');
  });

  ctaBtn?.addEventListener('click', () => {
    const input = document.getElementById('repo-input');
    if (input) {
      input.focus();
      input.scrollIntoView({ behavior: 'smooth' });
    }
  });
}
