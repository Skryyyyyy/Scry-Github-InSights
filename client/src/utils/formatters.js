/**
 * UI formatters and helper utilities
 */

export function getScoreColor(score) {
  if (score >= 90) return '#10b981'; // Emerald
  if (score >= 75) return '#06b6d4'; // Cyan
  if (score >= 60) return '#f59e0b'; // Amber
  return '#f43f5e'; // Crimson
}

export function getScoreBadgeClass(score) {
  if (score >= 90) return 'badge-success';
  if (score >= 75) return 'badge-info';
  if (score >= 60) return 'badge-warning';
  return 'badge-danger';
}

export function getMethodBadgeClass(method) {
  const m = (method || '').toUpperCase();
  switch (m) {
    case 'GET': return 'badge-method-get';
    case 'POST': return 'badge-method-post';
    case 'PUT':
    case 'PATCH': return 'badge-method-put';
    case 'DELETE': return 'badge-method-delete';
    case 'WS':
    case 'GRPC': return 'badge-method-ws';
    default: return 'badge-method-get';
  }
}

export function getSeverityBadgeClass(severity) {
  const s = (severity || '').toUpperCase();
  switch (s) {
    case 'CRITICAL': return 'badge-severity-critical';
    case 'HIGH': return 'badge-severity-high';
    case 'MEDIUM': return 'badge-severity-medium';
    case 'LOW': return 'badge-severity-low';
    default: return 'badge-severity-low';
  }
}

export function getComplexityBadgeClass(complexity) {
  const c = (complexity || '').toLowerCase();
  switch (c) {
    case 'high': return 'badge-complexity-high';
    case 'medium': return 'badge-complexity-medium';
    case 'low':
    default: return 'badge-complexity-low';
  }
}

export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    return false;
  }
}

export function downloadFile(filename, content, mimeType = 'application/json') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
