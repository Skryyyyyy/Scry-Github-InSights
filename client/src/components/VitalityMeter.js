import { getScoreColor } from '../utils/formatters.js';

/**
 * Vitality Score Meter & Breakdown Component — Evidence-Backed
 */
export function renderVitalityMeter(container, vitalityData = {}) {
  const overall = vitalityData.overall_score || 0;
  const breakdown = vitalityData.breakdown || {};
  const verdict = vitalityData.verdict || 'Codebase Audited';

  const scoreColor = getScoreColor(overall);
  
  // Circumference for r=60 is 2 * PI * 60 = 377
  const circumference = 377;
  const offset = circumference - (overall / 100) * circumference;

  container.innerHTML = `
    <div class="vitality-card">
      <div class="score-dial-wrapper">
        <svg class="score-svg" viewBox="0 0 140 140">
          <circle class="score-bg-circle" cx="70" cy="70" r="60"></circle>
          <circle 
            id="vitality-progress" 
            class="score-progress-circle" 
            cx="70" 
            cy="70" 
            r="60" 
            style="stroke: ${scoreColor}; stroke-dashoffset: ${circumference};"
          ></circle>
        </svg>
        <div class="score-inner-text">
          <span class="score-number" style="color: ${scoreColor}">${overall}</span>
          <span class="score-total">/ 100</span>
        </div>
      </div>
      <div class="verdict-badge" style="border-color: ${scoreColor}; color: ${scoreColor}; background: ${scoreColor}1a;">
        ${verdict}
      </div>
    </div>
  `;

  // Trigger animation shortly after mount
  setTimeout(() => {
    const progressEl = container.querySelector('#vitality-progress');
    if (progressEl) {
      progressEl.style.strokeDashoffset = offset;
    }
  }, 100);
}

/**
 * Renders the 4-quadrant breakdown cards with evidence metrics
 */
export function renderBreakdownGrid(container, breakdown = {}, evidenceSummary = {}) {
  const docEv = evidenceSummary.documentation;
  const maintEv = evidenceSummary.maintainability;
  const archEv = evidenceSummary.architecture;
  const secEv = evidenceSummary.security;

  const docSub = docEv ? `${docEv.hasReadme ? '✓ README' : '✗ No README'} · ${docEv.hasScripts ? '✓ npm scripts' : '✗ No scripts'}` : '';
  const maintSub = maintEv ? `${maintEv.hasLinter ? '✓ Linter' : '✗ No Linter'} · ${maintEv.hasCI ? '✓ CI' : '✗ No CI'} · test ratio: ${maintEv.testRatio}` : '';
  const archSub = archEv ? `${archEv.entryPoints} entry points · ${archEv.routes} API routes · ${archEv.models} DB models` : '';
  const secSub = secEv ? `${secEv.critical} CRIT · ${secEv.high} HIGH · ${secEv.medium} MED · ${secEv.low} LOW` : '';

  const items = [
    { label: 'Documentation', score: breakdown.documentation ?? 0, icon: '📖', sub: docSub },
    { label: 'Maintainability', score: breakdown.maintainability ?? 0, icon: '🛠️', sub: maintSub },
    { label: 'Architecture', score: breakdown.architecture_clarity ?? 0, icon: '🏛️', sub: archSub },
    { label: 'Security Posture', score: breakdown.security_posture ?? 0, icon: '🛡️', sub: secSub }
  ];

  container.innerHTML = `
    <div class="breakdown-grid">
      ${items.map(item => {
        const color = getScoreColor(item.score);
        return `
          <div class="breakdown-card">
            <div class="breakdown-header">
              <span class="breakdown-label">${item.icon} ${item.label}</span>
              <span class="breakdown-value" style="color: ${color}">${item.score}%</span>
            </div>
            <div class="breakdown-track">
              <div class="breakdown-fill" style="width: ${item.score}%; background: ${color};"></div>
            </div>
            ${item.sub ? `<div style="font-size: 0.72rem; color: var(--text-muted); font-family: var(--font-mono); margin-top: 0.4rem;">${item.sub}</div>` : ''}
          </div>
        `;
      }).join('')}
    </div>
  `;
}
