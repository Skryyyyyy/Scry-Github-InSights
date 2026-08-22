/**
 * Tech Stack Matrix View Component — Evidence-Backed
 */
export function renderTechStackView(container, techStack = {}) {
  const groups = [
    { title: 'Programming Languages', items: techStack.languages || [techStack.primary_language].filter(Boolean), icon: '⚡' },
    { title: 'Frameworks & Libraries', items: techStack.frameworks || [], icon: '📦' },
    { title: 'Databases & Persistence', items: techStack.databases || [], icon: '🗄️' },
    { title: 'Caching & Message Queues', items: techStack.caching || techStack.caching_and_queues || [], icon: '🔄' },
    { title: 'DevOps & Infrastructure', items: techStack.devops || techStack.devops_and_cloud || [], icon: '☁️' },
    { title: 'Third-Party Services & Integrations', items: techStack.third_party || techStack.third_party_services || [], icon: '🔌' }
  ];

  container.innerHTML = `
    <div class="content-card">
      <h3 class="card-title">
        <svg viewBox="0 0 24 24" width="20" height="20" stroke="var(--accent-cyan)" stroke-width="2" fill="none">
          <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
          <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
          <line x1="6" y1="6" x2="6.01" y2="6"></line>
          <line x1="6" y1="18" x2="6.01" y2="18"></line>
        </svg>
        <span>Technology Stack Ecosystem</span>
      </h3>
      <div class="tech-stack-grid">
        ${groups.map(group => `
          <div class="tech-group-card">
            <span class="tech-group-title">${group.icon} ${group.title}</span>
            <div class="tech-tags-list">
              ${group.items.length > 0 ? group.items.map(item => `
                <span class="tech-tag">${item}</span>
              `).join('') : `<span style="font-size: 0.8rem; color: var(--text-muted);">None detected</span>`}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}
