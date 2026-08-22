import { renderTopBanner } from './components/BannerView.js';
import { renderHeader } from './components/Header.js';
import { renderVitalityMeter, renderBreakdownGrid } from './components/VitalityMeter.js';
import { renderTechStackView } from './components/TechStackView.js';
import { renderArchitectureView } from './components/ArchitectureView.js';
import { renderDeepDiveView } from './components/DeepDiveView.js';
import { renderSecurityAuditView } from './components/SecurityAuditView.js';
import { renderUiUxAuditView } from './components/UiUxAuditView.js';
import { renderQuickstartView } from './components/QuickstartView.js';
import { openJsonExportModal } from './components/JsonExportModal.js';
import { openSettingsModal } from './components/SettingsModal.js';
import { openHistoryDrawer } from './components/HistoryDrawer.js';
import { analyzeRepository, fetchDemoById } from './services/api.js';
import { storage } from './services/storage.js';

// Application State
let currentAuditData = null;
let currentActiveTab = 'architecture';

// DOM Elements
const topBannerContainer = document.getElementById('top-banner-container');
const headerContainer = document.getElementById('header-container');
const heroSection = document.getElementById('hero-section');
const analyzeForm = document.getElementById('analyze-form');
const repoInput = document.getElementById('repo-input');
const branchInput = document.getElementById('branch-input');
const analyzeBtn = document.getElementById('analyze-btn');
const demoChips = document.getElementById('demo-chips');
const loadingState = document.getElementById('loading-state');
const dashboardContainer = document.getElementById('dashboard-container');
const modalContainer = document.getElementById('modal-container');
const toastContainer = document.getElementById('toast-container');

/**
 * Toast Notification System
 */
export function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span>${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
    <div>${message}</div>
  `;
  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

/**
 * App Initialization
 */
function init() {
  // 0. Mount Top Rainbow Banner (@fuma-nama/banner)
  if (topBannerContainer) {
    renderTopBanner(topBannerContainer);
  }

  // 1. Mount Header
  renderHeader(headerContainer, {
    onOpenSettings: () => openSettingsModal(modalContainer, (settings) => {
      showToast('API Configuration saved successfully', 'success');
    }),
    onOpenHistory: () => openHistoryDrawer(modalContainer, (auditData) => {
      renderDashboard(auditData);
    }),
    onReset: () => {
      dashboardContainer.classList.add('hidden');
      heroSection.classList.remove('hidden');
      repoInput.value = '';
    }
  });

  // 2. Setup Form Submission
  analyzeForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const url = repoInput.value.trim();
    const branch = branchInput.value.trim();
    if (!url) return;
    await executeAnalysis({ repoUrl: url, branch });
  });

  // 3. Setup Demo Chips
  demoChips?.addEventListener('click', async (e) => {
    const chip = e.target.closest('.demo-chip');
    if (!chip) return;
    const demoId = chip.getAttribute('data-demo');
    if (demoId) {
      await loadDemo(demoId);
    }
  });

  // Automatically load default demo to showcase interface immediately
  loadDemo('nextjs-commerce', false);
}

/**
 * Executes repository analysis against the API
 */
async function executeAnalysis({ repoUrl, branch }) {
  const settings = storage.getSettings();

  showLoading(true, `Auditing ${repoUrl}...`, 'Connecting to repository, parsing file tree & manifests');
  try {
    const result = await analyzeRepository({
      repoUrl,
      branch,
      geminiKey: settings.geminiKey,
      githubToken: settings.githubToken
    });

    if (result.success && result.data) {
      storage.addHistoryItem(result.data);
      renderDashboard(result.data);
      showToast(`Successfully analyzed ${result.data.project_overview?.name || repoUrl}!`, 'success');
    } else {
      throw new Error(result.error || 'Failed to complete analysis.');
    }
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    showLoading(false);
  }
}

/**
 * Loads a pre-analyzed benchmark demo
 */
async function loadDemo(demoId, showNotification = true) {
  showLoading(true, `Loading demo: ${demoId}`, 'Fetching pre-calculated high-fidelity telemetry dataset');
  try {
    const res = await fetchDemoById(demoId);
    if (res.success && res.data) {
      storage.addHistoryItem(res.data);
      renderDashboard(res.data);
      if (showNotification) {
        showToast(`Loaded demo: ${res.data.project_overview?.name}`, 'success');
      }
    }
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    showLoading(false);
  }
}

/**
 * Controls loading spinner and progress bar state
 */
function showLoading(isLoading, title = '', status = '') {
  if (isLoading) {
    loadingState.classList.remove('hidden');
    dashboardContainer.classList.add('hidden');
    document.getElementById('loader-title').textContent = title;
    document.getElementById('loader-status').textContent = status;
  } else {
    loadingState.classList.add('hidden');
  }
}

/**
 * Renders the full Dashboard
 */
function renderDashboard(data) {
  currentAuditData = data;
  const p = data.project_overview || {};
  const v = p.vitality_score || {};
  const b = v.breakdown || {};
  const overallScore = v.overall_score || 0;

  dashboardContainer.innerHTML = `
    <!-- Top Repo Overview Banner -->
    <div class="repo-banner-card">
      <div class="repo-info-col">
        <div class="repo-badge-row">
          <span class="badge badge-method-get">${p.tech_stack?.primary_language || 'Codebase'}</span>
          <span class="badge" style="background: rgba(139, 92, 246, 0.15); color: #c084fc;">${data.architecture?.pattern || 'Architecture'}</span>
        </div>
        <h2 class="repo-title">${p.name || 'Repository Audit'}</h2>
        <p class="repo-tagline">${p.tagline || ''}</p>
        <p class="repo-pitch">💡 ${p.elevator_pitch || ''}</p>

        <div class="repo-action-bar">
          <button type="button" id="export-json-btn" class="btn-primary" style="font-size: 0.85rem; padding: 0.5rem 1rem;">
            <span>📦 Export Audit / JSON</span>
          </button>
          <button type="button" id="quick-audit-another-btn" class="btn-secondary" style="font-size: 0.85rem; padding: 0.5rem 1rem;">
            <span>🔍 Audit Another Repo</span>
          </button>
        </div>
      </div>

      <!-- Vitality Score Gauge Dial -->
      <div id="vitality-gauge-container"></div>
    </div>

    <!-- Breakdown 4-Quadrant Grid -->
    <div id="breakdown-grid-container"></div>

    <!-- Navigation Tabs Bar -->
    <nav class="dashboard-tabs" id="tab-nav">
      <button type="button" class="tab-btn ${currentActiveTab === 'architecture' ? 'active' : ''}" data-tab="architecture">
        <span>🏛️ Architecture &amp; Flow</span>
      </button>
      <button type="button" class="tab-btn ${currentActiveTab === 'techstack' ? 'active' : ''}" data-tab="techstack">
        <span>🛠️ Tech Stack</span>
      </button>
      <button type="button" class="tab-btn ${currentActiveTab === 'deepdive' ? 'active' : ''}" data-tab="deepdive">
        <span>🔬 Deep Dive &amp; API</span>
      </button>
      <button type="button" class="tab-btn ${currentActiveTab === 'security' ? 'active' : ''}" data-tab="security">
        <span>🛡️ Security &amp; Risks</span>
      </button>
      <button type="button" class="tab-btn ${currentActiveTab === 'uiux' ? 'active' : ''}" data-tab="uiux">
        <span>🎨 UI/UX Audit</span>
      </button>
      <button type="button" class="tab-btn ${currentActiveTab === 'quickstart' ? 'active' : ''}" data-tab="quickstart">
        <span>🚀 Quickstart &amp; Setup</span>
      </button>
    </nav>

    <!-- Active Tab Panel Container -->
    <div id="tab-panel-stage" class="tab-panel"></div>
  `;

  // Mount Vitality Score Dial & Breakdown
  const vitalityContainer = document.getElementById('vitality-gauge-container');
  const breakdownContainer = document.getElementById('breakdown-grid-container');
  renderVitalityMeter(vitalityContainer, v);
  renderBreakdownGrid(breakdownContainer, b, v.evidence_summary || {});

  // Mount initial active tab
  renderActiveTab();

  // Attach tab navigation listeners
  document.querySelectorAll('#tab-nav .tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#tab-nav .tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentActiveTab = btn.getAttribute('data-tab') || 'architecture';
      renderActiveTab();
    });
  });

  // Attach Banner Action Listeners
  document.getElementById('export-json-btn')?.addEventListener('click', () => {
    openJsonExportModal(currentAuditData, modalContainer);
  });

  document.getElementById('quick-audit-another-btn')?.addEventListener('click', () => {
    heroSection.scrollIntoView({ behavior: 'smooth' });
    repoInput.focus();
  });

  // Display dashboard
  dashboardContainer.classList.remove('hidden');
}

/**
 * Renders the content of the currently selected tab
 */
function renderActiveTab() {
  const stage = document.getElementById('tab-panel-stage');
  if (!stage || !currentAuditData) return;

  stage.innerHTML = '';
  switch (currentActiveTab) {
    case 'architecture':
      renderArchitectureView(stage, currentAuditData.architecture);
      break;
    case 'techstack':
      renderTechStackView(stage, currentAuditData.project_overview?.tech_stack);
      break;
    case 'deepdive':
      renderDeepDiveView(stage, currentAuditData.deep_dive_analysis);
      break;
    case 'security':
      renderSecurityAuditView(stage, currentAuditData.risk_and_security_audit);
      break;
    case 'uiux':
      renderUiUxAuditView(stage, currentAuditData.ui_ux_audit);
      break;
    case 'quickstart':
      renderQuickstartView(stage, currentAuditData.onboarding_and_usage);
      break;
    default:
      renderArchitectureView(stage, currentAuditData.architecture);
      break;
  }
}

// Boot application when DOM is ready
document.addEventListener('DOMContentLoaded', init);
