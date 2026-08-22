/**
 * Scry Backend API Client
 */

export async function fetchHealth() {
  const res = await fetch('/api/health');
  return res.json();
}

export async function fetchDemoList() {
  const res = await fetch('/api/demo');
  return res.json();
}

export async function fetchDemoById(id) {
  const res = await fetch(`/api/demo/${encodeURIComponent(id)}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch demo');
  return data;
}

export async function analyzeRepository({ repoUrl, branch, geminiKey, githubToken, rawSnapshot }) {
  const res = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ repoUrl, branch, geminiKey, githubToken, rawSnapshot })
  });
  
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to analyze repository');
  }
  return data;
}

export async function exportMarkdownReport(analysisData) {
  const res = await fetch('/api/export/markdown', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: analysisData })
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to export markdown report');
  return data.markdown;
}
