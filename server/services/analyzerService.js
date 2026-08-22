import fs from 'fs/promises';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config.js';
import { runFullScan } from './staticScanner.js';

let cachedMasterPrompt = null;

/**
 * Loads the master system prompt from gitvision_master_prompt.md
 */
export async function getMasterPrompt() {
  if (!cachedMasterPrompt) {
    try {
      cachedMasterPrompt = await fs.readFile(config.promptPath, 'utf-8');
    } catch (err) {
      console.warn('Could not read master prompt file:', err.message);
      cachedMasterPrompt = `You are RepoLens-Architect, a senior staff engineer. Analyze EVIDENCE_BUNDLE and return ONLY valid JSON matching OUTPUT_SCHEMA. Never invent data.`;
    }
  }
  return cachedMasterPrompt;
}

/**
 * Analyzes repository snapshot using Evidence-First Pipeline:
 * 1. Run static scanner → EVIDENCE_BUNDLE
 * 2. Attempt LLM narration of EVIDENCE_BUNDLE (Gemini)
 * 3. Fallback: assemble OUTPUT_SCHEMA report directly from EVIDENCE_BUNDLE
 */
export async function analyzeRepositorySnapshot({ 
  formattedSnapshot, 
  apiKey = null, 
  repoMetadata = {}, 
  fileContents = [], 
  filePaths = [] 
}) {
  // ── PHASE 1: Deterministic Static Scan ──
  console.log('[RepoLens] Running static scanner on', fileContents.length, 'files...');
  const evidenceBundle = runFullScan({ fileContents, filePaths, repoMetadata });
  console.log('[RepoLens] EVIDENCE_BUNDLE generated:', {
    routes: evidenceBundle.api_routes.length,
    models: evidenceBundle.db_models.length,
    hotspots: evidenceBundle.complexity_hotspots.length,
    sast: evidenceBundle.sast_findings.length,
    scores: evidenceBundle.scores
  });

  // ── PHASE 2: LLM Narration (optional enhancement) ──
  const effectiveApiKey = apiKey || config.geminiApiKey;
  if (effectiveApiKey) {
    try {
      const llmResult = await synthesizeWithGemini(evidenceBundle, effectiveApiKey);
      return mergeWithEvidenceBundle(llmResult, evidenceBundle);
    } catch (err) {
      console.warn('[RepoLens] LLM synthesis skipped/failed, using direct EVIDENCE_BUNDLE assembly:', err.message);
    }
  }

  // ── PHASE 3: Direct EVIDENCE_BUNDLE Assembly (no LLM) ──
  return assembleFromEvidenceBundle(evidenceBundle);
}

/**
 * Sends EVIDENCE_BUNDLE to Gemini for human-readable narration matching OUTPUT_SCHEMA
 */
async function synthesizeWithGemini(evidenceBundle, apiKey) {
  const masterPrompt = await getMasterPrompt();
  const genAI = new GoogleGenerativeAI(apiKey);
  
  const candidateModels = ['gemini-2.0-flash', 'gemini-1.5-flash'];
  let lastError = null;

  for (const modelName of candidateModels) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json'
        },
        systemInstruction: masterPrompt
      });

      const prompt = `Analyze this EVIDENCE_BUNDLE and return JSON matching OUTPUT_SCHEMA. Never invent data not present in the bundle.\n\n${JSON.stringify(evidenceBundle, null, 2)}`;
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      return parseAndCleanJson(responseText);
    } catch (err) {
      lastError = err;
      console.warn(`[RepoLens] Gemini ${modelName} error: ${err.message}`);
    }
  }

  throw lastError || new Error('All Gemini models failed.');
}

/**
 * Cleans and parses JSON output from LLM
 */
export function parseAndCleanJson(text) {
  let cleaned = text.trim();
  
  if (cleaned.startsWith('```json')) cleaned = cleaned.substring(7);
  else if (cleaned.startsWith('```')) cleaned = cleaned.substring(3);
  if (cleaned.endsWith('```')) cleaned = cleaned.substring(0, cleaned.length - 3);
  cleaned = cleaned.trim();

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      return JSON.parse(cleaned.substring(firstBrace, lastBrace + 1));
    }
    throw new Error(`Failed to parse LLM JSON: ${err.message}`);
  }
}

/**
 * Merges LLM output with deterministic evidence bundle.
 * Ensures scores, routes, file:line refs, and contradiction flags are strictly preserved.
 */
function mergeWithEvidenceBundle(llmResult, bundle) {
  const fallback = assembleFromEvidenceBundle(bundle);

  return {
    overview: llmResult.overview || fallback.overview,
    scores: bundle.scores, // Scores are precomputed and verbatim
    architecture: {
      pattern: llmResult.architecture?.pattern || fallback.architecture.pattern,
      confidence: llmResult.architecture?.confidence || fallback.architecture.confidence,
      description: llmResult.architecture?.description || fallback.architecture.description,
      mermaid: llmResult.architecture?.mermaid || fallback.architecture.mermaid
    },
    tech_stack: fallback.tech_stack,
    deep_dive: {
      complexity_hotspots: fallback.deep_dive.complexity_hotspots,
      api_routes: fallback.deep_dive.api_routes,
      db_models: fallback.deep_dive.db_models,
      schema_dependency_contradiction: fallback.deep_dive.schema_dependency_contradiction
    },
    security_and_risk: fallback.security_and_risk,
    ui_ux_audit: fallback.ui_ux_audit,
    quickstart: fallback.quickstart,
    
    // Backwards compatibility layer for legacy UI adapters
    project_overview: {
      name: bundle.repo_meta.name,
      tagline: llmResult.overview || fallback.overview,
      elevator_pitch: fallback.overview,
      vitality_score: {
        overall_score: Math.round((bundle.scores.documentation + bundle.scores.maintainability + bundle.scores.architecture + bundle.scores.security) / 4),
        breakdown: {
          documentation: bundle.scores.documentation,
          maintainability: bundle.scores.maintainability,
          architecture_clarity: bundle.scores.architecture,
          security_posture: bundle.scores.security
        },
        verdict: "Audited by RepoLens Engine"
      },
      tech_stack: {
        primary_language: bundle.repo_meta.primary_language,
        languages: fallback.tech_stack.languages,
        frameworks: fallback.tech_stack.frameworks,
        databases: fallback.tech_stack.databases,
        caching_and_queues: fallback.tech_stack.caching,
        devops_and_cloud: fallback.tech_stack.devops,
        third_party_services: fallback.tech_stack.third_party
      }
    }
  };
}

/**
 * Assembles OUTPUT_SCHEMA directly from EVIDENCE_BUNDLE with 100% deterministic fidelity.
 */
function assembleFromEvidenceBundle(bundle) {
  const { repo_meta, dependencies, sast_findings, secrets_findings, complexity_hotspots, api_routes, db_models, frontend_components, design_system, test_signals, ci_signals, readme_excerpt, scores } = bundle;

  // 1. Tech Stack Categorization
  const prodDeps = dependencies.filter(d => d.dev_or_prod === 'prod').map(d => d.name);
  const devDeps = dependencies.filter(d => d.dev_or_prod === 'dev').map(d => d.name);
  const allDepNames = dependencies.map(d => d.name.toLowerCase());

  const languages = Array.from(new Set([repo_meta.primary_language, ...allDepNames.filter(n => n.includes('typescript') ? 'TypeScript' : null).filter(Boolean)]));
  
  const frameworks = [];
  if (allDepNames.includes('next')) frameworks.push('Next.js');
  else if (allDepNames.includes('react')) frameworks.push('React');
  if (allDepNames.includes('express')) frameworks.push('Express.js');
  if (allDepNames.includes('fastify')) frameworks.push('Fastify');
  if (allDepNames.includes('tailwindcss')) frameworks.push('Tailwind CSS');
  if (frameworks.length === 0) frameworks.push('None detected');

  const databases = [];
  if (allDepNames.some(n => n.includes('prisma'))) databases.push('Prisma ORM');
  if (allDepNames.some(n => n.includes('mongoose') || n.includes('mongodb'))) databases.push('MongoDB (Mongoose)');
  if (allDepNames.some(n => n.includes('pg') || n.includes('postgres'))) databases.push('PostgreSQL');
  if (allDepNames.some(n => n.includes('mysql'))) databases.push('MySQL');
  if (databases.length === 0) databases.push('None detected');

  const caching = [];
  if (allDepNames.some(n => n.includes('redis') || n.includes('upstash'))) caching.push('Redis');
  if (caching.length === 0) caching.push('None detected');

  const devops = [];
  if (ci_signals.platform_or_null) devops.push(ci_signals.platform_or_null);
  if (devops.length === 0) devops.push('None detected');

  const third_party = [];
  if (allDepNames.some(n => n.includes('clerk'))) third_party.push('Clerk Auth');
  if (allDepNames.some(n => n.includes('stripe'))) third_party.push('Stripe');
  if (allDepNames.some(n => n.includes('supabase'))) third_party.push('Supabase');
  if (third_party.length === 0) third_party.push('None detected');

  // 2. Schema / Dependency Contradiction Check
  let schemaContradiction = null;
  const hasDbDriverInDeps = allDepNames.some(n => /pg|postgres|mysql|sqlite|prisma|mongoose|mongodb|drizzle|sqlalchemy/i.test(n));
  if (hasDbDriverInDeps && db_models.length === 0) {
    const driverName = dependencies.find(d => /pg|postgres|mysql|sqlite|prisma|mongoose|mongodb|drizzle|sqlalchemy/i.test(d.name))?.name || 'database driver';
    schemaContradiction = `Database driver/ORM '${driverName}' detected in dependencies, but zero ORM schema models or migration files were found in scanned files.`;
  }

  // 3. Architecture Pattern & Confidence
  let pattern = 'Insufficient evidence to classify pattern confidently';
  let confidence = 'insufficient';
  let archDesc = `Scanned codebase contains ${api_routes.length} API routes, ${db_models.length} database models, and ${frontend_components.length} frontend components.`;

  if (frameworks.includes('Next.js') && api_routes.length > 0) {
    pattern = 'Next.js App Router Monorepo';
    confidence = 'high';
    archDesc = 'Full-stack Next.js application utilizing server routes and React frontend components.';
  } else if (frameworks.includes('Express.js') && api_routes.length > 0) {
    pattern = 'Express.js Layered Web Server';
    confidence = 'high';
    archDesc = 'Node.js Express REST API server with HTTP route handlers.';
  } else if (api_routes.length > 0) {
    pattern = 'RESTful API Server';
    confidence = 'medium';
  } else if (frontend_components.length > 0) {
    pattern = 'Client-Side Single Page Application (SPA)';
    confidence = 'medium';
  }

  // 4. Dynamic Repo-Specific Mermaid Flowchart
  let mermaid = buildRepositoryMermaid(bundle);

  // 5. Deep Dive Hotspots
  const formattedHotspots = complexity_hotspots.map(h => ({
    function: h.function_name,
    file: h.file_path,
    line: h.line,
    complexity: h.cyclomatic_complexity,
    tier: h.cyclomatic_complexity > 10 ? 'high' : h.cyclomatic_complexity >= 5 ? 'medium' : 'low'
  }));

  // 6. Security Findings
  const securityFindings = sast_findings.map(s => ({
    severity: s.severity,
    file: s.file_path,
    line: s.line,
    risk: s.description,
    remediation: `Inspect and refactor ${s.file_path}:${s.line} (${s.snippet})`
  }));

  const codeSmells = [];
  if (test_signals.test_file_count === 0) {
    codeSmells.push({
      description: 'Zero test files detected in repository static scan.',
      file: 'test_signals',
      impact: 'Code changes cannot be automatically validated, increasing regression risk.'
    });
  }
  for (const h of formattedHotspots.filter(x => x.tier === 'high')) {
    codeSmells.push({
      description: `Function '${h.function}' at ${h.file}:${h.line} has high cyclomatic complexity (${h.complexity}).`,
      file: `${h.file}:${h.line}`,
      impact: 'High complexity increases code maintenance difficulty and bug risk.'
    });
  }

  // 7. Quickstart Steps
  const steps = [
    { order: 1, description: `Clone ${repo_meta.name} repository`, command: `git clone https://github.com/${repo_meta.name}.git` },
    { order: 2, description: 'Install project dependencies', command: 'npm install' },
    { order: 3, description: 'Launch development server', command: 'npm run dev' }
  ];

  // Overview statement
  const overview = `${repo_meta.name} is a ${repo_meta.primary_language} application using ${frameworks.join(', ')}. Static scan identified ${api_routes.length} API routes, ${db_models.length} database models, and ${frontend_components.length} UI components.`;

  return {
    overview,
    scores: scores,
    architecture: {
      pattern,
      confidence,
      description: archDesc,
      mermaid,
      logic_flow_mermaid: mermaid
    },
    tech_stack: {
      languages,
      frameworks,
      databases,
      caching,
      devops,
      third_party
    },
    deep_dive: {
      complexity_hotspots: formattedHotspots,
      api_routes: api_routes.map(r => ({
        method: r.method,
        path: r.path,
        file: r.file_path,
        line: r.line,
        auth: r.has_auth_middleware,
        framework: r.framework
      })),
      db_models: db_models.map(m => ({
        name: m.name,
        file: m.file_path,
        fields: m.fields,
        relations: m.relations,
        orm: m.orm
      })),
      schema_dependency_contradiction: schemaContradiction
    },
    security_and_risk: {
      findings: securityFindings,
      cves: [],
      code_smells: codeSmells
    },
    ui_ux_audit: {
      frontend_present: frontend_components.length > 0,
      design_system: design_system.name_detected_or_null,
      components: frontend_components.map(c => ({
        name: c.name,
        file: c.file_path,
        type: c.type
      })),
      accessibility_note: "Not assessed — requires runtime/visual audit"
    },
    quickstart: {
      prerequisites: [`${repo_meta.primary_language} runtime`, 'Git'],
      steps,
      env_vars: []
    },

    // Legacy adapter compatibility layer
    project_overview: {
      name: repo_meta.name,
      tagline: overview,
      elevator_pitch: overview,
      vitality_score: {
        overall_score: Math.round((scores.documentation + scores.maintainability + scores.architecture + scores.security) / 4),
        breakdown: {
          documentation: scores.documentation,
          maintainability: scores.maintainability,
          architecture_clarity: scores.architecture,
          security_posture: scores.security
        },
        verdict: "Audited by RepoLens Engine"
      },
      tech_stack: {
        primary_language: repo_meta.primary_language,
        languages,
        frameworks,
        databases,
        caching_and_queues: caching,
        devops_and_cloud: devops,
        third_party_services: third_party
      }
    }
  };
}

/**
 * Builds a rich, repository-specific Mermaid flowchart using real detected
 * entry points, API routes, database models, and components.
 */
function buildRepositoryMermaid(bundle) {
  const { api_routes = [], db_models = [], frontend_components = [] } = bundle;
  let m = 'graph TD\n';
  m += '    Client(["Client / User Agent"]) --> Ingress["Request Gate / Ingress"]\n';

  // Add frontend pages/components if present
  if (frontend_components.length > 0) {
    m += '    Ingress --> FE["Frontend Layer"]\n';
    frontend_components.slice(0, 4).forEach((comp, idx) => {
      const compId = `Comp${idx}`;
      m += `    FE --> ${compId}["${comp.name} (${comp.type})"]\n`;
      if (api_routes.length > 0) {
        const routeIdx = idx % Math.min(4, api_routes.length);
        const r = api_routes[routeIdx];
        m += `    ${compId} -.-> Route${routeIdx}["${r.method} ${r.path}"]\n`;
      }
    });
  }

  // Add API routes if present
  if (api_routes.length > 0) {
    if (frontend_components.length === 0) {
      m += '    Ingress --> API["API Controller Layer"]\n';
    }
    api_routes.slice(0, 6).forEach((r, idx) => {
      const routeId = `Route${idx}`;
      if (frontend_components.length === 0) {
        m += `    API --> ${routeId}["${r.method} ${r.path}"]\n`;
      }
      // Connect to DB models
      if (db_models.length > 0) {
        const modelIdx = idx % db_models.length;
        const model = db_models[modelIdx];
        m += `    ${routeId} --> Model${modelIdx}[("Model: ${model.name}")]\n`;
      }
    });
  }

  // Fallback if no routes or components detected
  if (api_routes.length === 0 && frontend_components.length === 0) {
    m += '    Ingress --> Codebase["Module Gateway"]\n';
    if (db_models.length > 0) {
      db_models.slice(0, 3).forEach((model, idx) => {
        m += `    Codebase --> Model${idx}[("Model: ${model.name}")]\n`;
      });
    } else {
      m += '    Codebase --> Logic["Business Logic Handlers"]\n';
    }
  }

  return m;
}
