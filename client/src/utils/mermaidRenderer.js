import mermaid from 'mermaid';

let isInitialized = false;

export function initMermaid() {
  if (!isInitialized) {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      themeVariables: {
        darkMode: true,
        background: '#131926',
        primaryColor: '#1e293b',
        primaryTextColor: '#f8fafc',
        primaryBorderColor: '#38bdf8',
        lineColor: '#06b6d4',
        secondaryColor: '#334155',
        tertiaryColor: '#0f172a',
        fontFamily: 'Inter, sans-serif',
        fontSize: '13px'
      },
      securityLevel: 'loose',
      flowchart: {
        htmlLabels: true,
        curve: 'basis'
      }
    });
    isInitialized = true;
  }
}

/**
 * Renders a Mermaid diagram into a target DOM container
 */
export async function renderMermaidDiagram(containerElement, mermaidCode) {
  initMermaid();

  if (!containerElement) return;

  // Clean code if needed
  let cleanedCode = (mermaidCode || '').trim();
  if (cleanedCode.startsWith('```mermaid')) {
    cleanedCode = cleanedCode.substring(10);
  }
  if (cleanedCode.endsWith('```')) {
    cleanedCode = cleanedCode.substring(0, cleanedCode.length - 3);
  }
  cleanedCode = cleanedCode.trim();

  if (!cleanedCode) {
    containerElement.innerHTML = `<div class="mermaid-error">No diagram syntax provided.</div>`;
    return;
  }

  try {
    const id = `mermaid-svg-${Date.now()}`;
    const { svg } = await mermaid.render(id, cleanedCode);
    containerElement.innerHTML = svg;

    // Attach zoom & pan controls
    setupDiagramZoomControls(containerElement);
  } catch (err) {
    console.error('Mermaid render error:', err);
    containerElement.innerHTML = `
      <div style="padding: 2rem; color: #f43f5e; text-align: center;">
        <p><strong>Failed to render architectural diagram</strong></p>
        <p style="font-size: 0.85rem; color: #94a3b8; margin-top: 0.5rem;">${err.message}</p>
        <pre style="margin-top: 1rem; text-align: left; background: #020617; padding: 1rem; border-radius: 8px; font-family: monospace; font-size: 0.8rem; overflow-x: auto;">${cleanedCode}</pre>
      </div>
    `;
  }
}

/**
 * Adds interactive zoom and pan support to the diagram viewport
 */
export function setupDiagramZoomControls(container) {
  const svg = container.querySelector('svg');
  if (!svg) return;

  let scale = 1;
  let isPanning = false;
  let startX = 0;
  let startY = 0;
  let translateX = 0;
  let translateY = 0;

  function updateTransform() {
    svg.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
  }

  // Wheel zoom
  container.onwheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    scale = Math.min(Math.max(0.4, scale + delta), 3.0);
    updateTransform();
  };

  // Mouse pan
  container.onmousedown = (e) => {
    if (e.target.closest('.mermaid-toolbar')) return;
    isPanning = true;
    startX = e.clientX - translateX;
    startY = e.clientY - translateY;
  };

  window.onmousemove = (e) => {
    if (!isPanning) return;
    translateX = e.clientX - startX;
    translateY = e.clientY - startY;
    updateTransform();
  };

  window.onmouseup = () => {
    isPanning = false;
  };

  // Expose control handlers on container
  container.__zoomIn = () => {
    scale = Math.min(3.0, scale + 0.2);
    updateTransform();
  };
  container.__zoomOut = () => {
    scale = Math.max(0.4, scale - 0.2);
    updateTransform();
  };
  container.__resetZoom = () => {
    scale = 1;
    translateX = 0;
    translateY = 0;
    updateTransform();
  };
}
