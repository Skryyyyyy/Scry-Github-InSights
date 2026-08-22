import fs from 'fs/promises';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config.js';
import { runFullScan } from './staticScanner.js';

let cachedMasterPrompt = null;

/**
 * Loads the master prompt from gitvision_master_prompt.md
 */
export async function getMasterPrompt() {
  if (!cachedMasterPrompt) {
    try {
      cachedMasterPrompt = await fs.readFile(config.promptPath, 'utf-8');
    } catch (err) {
      console.warn('Could not read master prompt file:', err.message);
      cachedMasterPrompt = `You are RepoLens-Architect. Analyze the Evidence Bundle and return ONLY valid JSON. Never invent data not present in the evidence.`;
    }
  }
  return cachedMasterPrompt;
}

/**
 * Analyzes repository snapshot using Evidence-First Pipeline:
 * 1. Run static scanner → Evidence Bundle
 * 2. Attempt LLM narration of evidence (Gemini)
 * 3. Fallback: assemble report directly from evidence
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
  const evidence = runFullScan({ fileContents, filePaths });
  console.log('[RepoLens] Scan complete:', {
    entryPoints: evidence.entryPoints.length,
    routes: evidence.routes.length,
    functions: evidence.functions.length,
    models: evidence.models.length,
    security: evidence.security.length,
    uiPatterns: evidence.uiPatterns.length,
    score: evidence.scores.overall_score
  });

  // ── PHASE 2: LLM Narration (optional enhancement) ──
  const effectiveApiKey = apiKey || config.geminiApiKey;
  if (effectiveApiKey) {
    try {
      const llmResult = await synthesizeWithGemini(evidence, repoMetadata, effectiveApiKey);
      // Merge LLM narration with deterministic scores
      return mergeWithEvidence(llmResult, evidence, repoMetadata);
    } catch (err) {
      console.warn('[RepoLens] LLM synthesis skipped, using direct evidence assembly:', err.message);
    }
  }

  // ── PHASE 3: Direct Evidence Assembly (no LLM) ──
  return assembleFromEvidence(evidence, repoMetadata);
}

/**
 * Sends Evidence Bundle to Gemini for human-readable narration
 */
async function synthesizeWithGemini(evidence, repoMetadata, apiKey) {
  const masterPrompt = await getMasterPrompt();
  const genAI = new GoogleGenerativeAI(apiKey);
  
  const candidateModels = ['gemini-2.0-flash', 'gemini-1.5-flash'];
  let lastError = null;

  // Prepare a compact evidence summary for the LLM
  const evidenceSummary = {
    repoName: repoMetadata.name || 'Unknown',
    repoDescription: repoMetadata.description || '',
    manifests: {
      packageJson: evidence.manifests.packageJson,
      scripts: evidence.manifests.scripts,
      engines: evidence.manifests.engines,
      dependencyCount: Object.keys(evidence.manifests.dependencies).length,
      topDependencies: Object.keys(evidence.manifests.dependencies).slice(0, 20)
    },
    entryPoints: evidence.entryPoints.slice(0, 10),
    routes: evidence.routes.slice(0, 20),
    functions: evidence.functions.slice(0, 15).map(f => ({ name: f.name, file: f.file, line: f.line, kind: f.kind, complexity: f.complexity, loc: f.loc })),
    models: evidence.models,
    security: evidence.security,
    uiPatterns: evidence.uiPatterns,
    infrastructure: evidence.infrastructure,
    tests: evidence.tests,
    complexity: { totalLoc: evidence.complexity.totalLoc, totalFunctions: evidence.complexity.totalFunctions, avgFunctionLength: evidence.complexity.avgFunctionLength },
    scores: evidence.scores
  };

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

      const prompt = `Analyze this Evidence Bundle and return the JSON analysis. Remember: NEVER invent data not in the evidence.\n\n${JSON.stringify(evidenceSummary, null, 2)}`;
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
 * Merges LLM narration with deterministic evidence data.
 * LLM can improve taglines/overviews but scores and file:line refs are authoritative.
 */
function mergeWithEvidence(llmResult, evidence, repoMetadata) {
  const assembled = assembleFromEvidence(evidence, repoMetadata);
  
  return {
    ...assembled,
    project_overview: {
      ...assembled.project_overview,
      tagline: llmResult.project_overview?.tagline || assembled.project_overview.tagline,
      elevator_pitch: llmResult.project_overview?.elevator_pitch || assembled.project_overview.elevator_pitch,
      // Scores are ALWAYS from the deterministic engine
      vitality_score: assembled.project_overview.vitality_score
    },
    architecture: {
      ...assembled.architecture,
      pattern: llmResult.architecture?.pattern || assembled.architecture.pattern,
      overview: llmResult.architecture?.overview || assembled.architecture.overview,
      logic_flow_mermaid: llmResult.architecture?.logic_flow_mermaid || assembled.architecture.logic_flow_mermaid,
      // Entry points & modules always from evidence
      entry_points: assembled.architecture.entry_points,
      modules: llmResult.architecture?.modules?.length > 0 ? llmResult.architecture.modules : assembled.architecture.modules
    },
    deep_dive_analysis: {
      core_functions: (llmResult.deep_dive_analysis?.core_functions?.length > 0 
        ? llmResult.deep_dive_analysis.core_functions 
        : assembled.deep_dive_analysis.core_functions),
      api_surface: assembled.deep_dive_analysis.api_surface, // Always from evidence
      database_schema_summary: assembled.deep_dive_analysis.database_schema_summary // Always from evidence
    },
    risk_and_security_audit: assembled.risk_and_security_audit, // Always from evidence
    onboarding_and_usage: assembled.onboarding_and_usage // Always from evidence
  };
}

/**
 * Assembles a complete report directly from the Evidence Bundle.
 * No LLM. 100% deterministic. Every field traceable to scanner output.
 */
function assembleFromEvidence(evidence, repoMetadata) {
  const { manifests, entryPoints, routes, functions, models, security, uiPatterns, infrastructure, tests, complexity, scores } = evidence;
  const allDeps = { ...manifests.dependencies, ...manifests.devDependencies };
  const name = repoMetadata.name || manifests.packageJson?.name || 'Analyzed Repository';
  const primaryLang = repoMetadata.language || detectPrimaryLanguage(allDeps, evidence);

  // ── Tech Stack from evidence ──
  const frameworks = detectFrameworks(allDeps);
  const databases = detectDatabases(allDeps, models);
  const devops = detectDevOps(infrastructure);
  const thirdParty = detectThirdParty(allDeps);
  const caching = detectCaching(allDeps);
  const languages = detectLanguages(allDeps, evidence);
  
  // ── State management & design system ──
  const designSystem = detectDesignSystem(allDeps);
  const stateManagement = detectStateManagement(allDeps);
  const hasFrontend = functions.some(f => f.kind === 'component') || Object.keys(allDeps).some(k => /react|vue|svelte|angular/i.test(k));

  // ── Mermaid from real evidence ──
  const mermaidGraph = buildMermaidFromEvidence(entryPoints, routes, models, databases);

  // ── Modules from directory analysis ──
  const modules = detectModules(functions, routes, entryPoints);

  // ── Quickstart from real scripts ──
  const quickstart = buildQuickstart(manifests, repoMetadata, infrastructure);

  // ── Key UI components ──
  const keyComponents = functions
    .filter(f => f.kind === 'component')
    .slice(0, 10)
    .map(f => ({
      name: f.name,
      path: f.file,
      type: f.file.includes('pages') || f.file.includes('app/') ? 'Page' : 'UI Component',
      description: `React component at ${f.file}:${f.line} (${f.loc} lines)`
    }));

  return {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "project_overview": {
      "name": name,
      "tagline": repoMetadata.description || `${primaryLang} codebase with ${frameworks.slice(0, 3).join(', ') || 'standard tooling'}`,
      "elevator_pitch": buildElevatorPitch(name, primaryLang, frameworks, routes, models, complexity),
      "vitality_score": {
        "overall_score": scores.overall_score,
        "breakdown": scores.breakdown,
        "evidence_summary": scores.evidence_summary,
        "verdict": scores.verdict
      },
      "tech_stack": {
        "primary_language": primaryLang,
        "languages": languages,
        "frameworks": frameworks.length > 0 ? frameworks : [`${primaryLang} Standard Library`],
        "databases": databases.length > 0 ? databases : [],
        "caching_and_queues": caching,
        "devops_and_cloud": devops,
        "third_party_services": thirdParty
      }
    },
    "architecture": {
      "pattern": classifyArchitecture(entryPoints, routes, frameworks, modules),
      "overview": buildArchitectureOverview(complexity, entryPoints, routes, modules, primaryLang),
      "logic_flow_mermaid": mermaidGraph,
      "entry_points": entryPoints.map(e => ({
        file: e.file,
        line: e.line,
        purpose: e.purpose,
        type: e.type
      })),
      "modules": modules
    },
    "deep_dive_analysis": {
      "core_functions": functions.slice(0, 12).map(f => ({
        symbol: `${f.name}(${f.paramSignature || ''})`,
        file: f.file,
        line: f.line,
        logic_summary: `${f.kind === 'class' ? 'Class' : f.kind === 'component' ? 'React Component' : 'Function'} at ${f.file}:${f.line} — ${f.loc} lines, ${f.complexity} complexity`,
        complexity: f.complexity,
        use_case: f.kind === 'component' ? 'UI rendering' : f.kind === 'class' ? 'Domain model / service' : 'Business logic',
        evidence: f.evidence
      })),
      "api_surface": routes.map(r => ({
        method: r.method,
        endpoint: r.path,
        file: r.file,
        line: r.line,
        description: `${r.method} handler at ${r.file}:${r.line}`,
        auth_required: r.auth,
        evidence: r.evidence
      })),
      "database_schema_summary": {
        "orm_or_tool": models.length > 0 ? models[0].orm : "None detected in scanned files",
        "models": models.map(m => ({
          name: m.name,
          file: m.file,
          line: m.line,
          fields_key: m.fields.slice(0, 10),
          relationships: m.relations
        }))
      }
    },
    "ui_ux_audit": {
      "has_frontend": hasFrontend,
      "design_system": designSystem,
      "state_management": stateManagement,
      "heuristics": {
        "accessibility_rating": uiPatterns.some(p => p.category === 'Accessibility') ? "Needs Improvement" : "Good",
        "responsiveness": uiPatterns.some(p => p.category === 'Responsiveness') ? "Needs Improvement" : "Good",
        "design_consistency": "High"
      },
      "actionable_improvements": uiPatterns.map(p => ({
        title: p.issue,
        category: p.category,
        impact: p.impact,
        targetFile: p.file,
        line: p.line,
        issue: p.evidence,
        recommendation: p.recommendation
      })),
      "key_views_and_components": keyComponents
    },
    "risk_and_security_audit": {
      "security_warnings": security.map(s => ({
        severity: s.severity,
        issue: s.title,
        rule: s.rule,
        location: `${s.file}:${s.line}`,
        file: s.file,
        line: s.line,
        evidence: s.evidence,
        remediation: s.remediation
      })),
      "code_smells_and_technical_debt": buildCodeSmells(complexity, tests, security)
    },
    "onboarding_and_usage": quickstart
  };
}

// ─── HELPER: Detect frameworks from dependencies ────────────────────

function detectFrameworks(deps) {
  const fw = [];
  if (deps['next']) fw.push(`Next.js ${deps['next'].replace(/[\^~]/, '')}`);
  else if (deps['react']) fw.push(`React ${deps['react'].replace(/[\^~]/, '')}`);
  if (deps['vue']) fw.push('Vue.js');
  if (deps['@sveltejs/kit'] || deps['svelte']) fw.push('Svelte');
  if (deps['@angular/core']) fw.push('Angular');
  if (deps['express']) fw.push('Express.js');
  if (deps['fastify']) fw.push('Fastify');
  if (deps['@nestjs/core']) fw.push('NestJS');
  if (deps['hono']) fw.push('Hono');
  if (deps['tailwindcss']) fw.push('Tailwind CSS');
  if (deps['typescript']) fw.push('TypeScript');
  return fw;
}

function detectDatabases(deps, models) {
  const dbs = [];
  if (deps['@prisma/client'] || deps['prisma']) dbs.push('PostgreSQL (Prisma)');
  if (deps['mongoose'] || deps['mongodb']) dbs.push('MongoDB');
  if (deps['pg'] || deps['postgres']) dbs.push('PostgreSQL');
  if (deps['mysql2'] || deps['mysql']) dbs.push('MySQL');
  if (deps['better-sqlite3'] || deps['sqlite3']) dbs.push('SQLite');
  if (deps['drizzle-orm']) dbs.push('Drizzle ORM');
  // Add from detected models
  for (const m of models) {
    if (m.orm === 'Mongoose' && !dbs.some(d => /mongo/i.test(d))) dbs.push('MongoDB (Mongoose)');
    if (m.orm === 'SQLAlchemy' && !dbs.some(d => /sql/i.test(d))) dbs.push('SQL (SQLAlchemy)');
    if (m.orm === 'Drizzle' && !dbs.some(d => /drizzle/i.test(d))) dbs.push('Drizzle ORM');
  }
  return dbs;
}

function detectDevOps(infra) {
  const ops = [];
  if (infra.hasDocker) ops.push('Docker');
  if (infra.hasCI) {
    for (const ci of infra.ciPipelines) ops.push(ci.type);
  }
  if (infra.cloudProvider) ops.push(infra.cloudProvider);
  if (ops.length === 0) ops.push('Git');
  return ops;
}

function detectThirdParty(deps) {
  const tp = [];
  if (deps['@clerk/nextjs'] || deps['@clerk/clerk-sdk-node']) tp.push('Clerk Auth');
  if (deps['next-auth'] || deps['@auth/core']) tp.push('Auth.js');
  if (deps['@supabase/supabase-js']) tp.push('Supabase');
  if (deps['firebase'] || deps['firebase-admin']) tp.push('Firebase');
  if (deps['stripe'] || deps['@stripe/stripe-js']) tp.push('Stripe');
  if (deps['@sendgrid/mail']) tp.push('SendGrid');
  if (deps['resend']) tp.push('Resend');
  if (deps['@aws-sdk/client-s3']) tp.push('AWS S3');
  if (deps['@sentry/node'] || deps['@sentry/nextjs']) tp.push('Sentry');
  if (deps['openai']) tp.push('OpenAI');
  if (deps['@google/generative-ai']) tp.push('Google Gemini');
  return tp;
}

function detectCaching(deps) {
  const cache = [];
  if (deps['redis'] || deps['ioredis'] || deps['@upstash/redis']) cache.push('Redis');
  if (deps['bullmq'] || deps['bull']) cache.push('BullMQ');
  if (deps['kafkajs']) cache.push('Kafka');
  if (deps['amqplib']) cache.push('RabbitMQ');
  return cache;
}

function detectDesignSystem(deps) {
  if (deps['tailwindcss'] && deps['@radix-ui/react-slot']) return 'Shadcn UI + Tailwind CSS';
  if (deps['tailwindcss']) return 'Tailwind CSS';
  if (deps['@mui/material']) return 'Material UI';
  if (deps['@chakra-ui/react']) return 'Chakra UI';
  if (deps['styled-components']) return 'Styled Components';
  if (deps['@mantine/core']) return 'Mantine';
  return 'Vanilla CSS';
}

function detectStateManagement(deps) {
  if (deps['zustand']) return 'Zustand';
  if (deps['@reduxjs/toolkit'] || deps['redux']) return 'Redux Toolkit';
  if (deps['recoil']) return 'Recoil';
  if (deps['jotai']) return 'Jotai';
  if (deps['mobx']) return 'MobX';
  if (deps['@tanstack/react-query']) return 'TanStack Query';
  if (deps['swr']) return 'SWR';
  return 'React Hooks / Context';
}

function detectPrimaryLanguage(deps, evidence) {
  if (deps['typescript'] || evidence.functions.some(f => /\.tsx?$/.test(f.file))) return 'TypeScript';
  if (evidence.functions.some(f => /\.py$/.test(f.file))) return 'Python';
  if (evidence.functions.some(f => /\.go$/.test(f.file))) return 'Go';
  if (evidence.functions.some(f => /\.rs$/.test(f.file))) return 'Rust';
  return 'JavaScript';
}

function detectLanguages(deps, evidence) {
  const langs = new Set();
  for (const f of evidence.functions) {
    if (/\.(ts|tsx)$/.test(f.file)) langs.add('TypeScript');
    if (/\.(js|jsx|mjs)$/.test(f.file)) langs.add('JavaScript');
    if (/\.py$/.test(f.file)) langs.add('Python');
    if (/\.go$/.test(f.file)) langs.add('Go');
    if (/\.rs$/.test(f.file)) langs.add('Rust');
  }
  if (deps['typescript']) langs.add('TypeScript');
  if (langs.size === 0) langs.add('JavaScript');
  return Array.from(langs);
}

// ─── HELPER: Classify architecture pattern ──────────────────────────

function classifyArchitecture(entryPoints, routes, frameworks, modules) {
  const hasNext = frameworks.some(f => /next/i.test(f));
  const hasExpress = frameworks.some(f => /express/i.test(f));
  const hasFastify = frameworks.some(f => /fastify/i.test(f));
  const hasNest = frameworks.some(f => /nest/i.test(f));
  
  if (hasNext && routes.length > 0) return 'Next.js Hybrid Server-Client Architecture';
  if (hasNest) return 'NestJS Modular Architecture';
  if (hasExpress || hasFastify) {
    if (modules.length > 3) return 'RESTful Layered Architecture';
    return 'Express.js Server Architecture';
  }
  if (modules.length > 5) return 'Modular Monorepo';
  if (entryPoints.some(e => e.type === 'frontend') && entryPoints.some(e => e.type === 'backend')) return 'Full-Stack Monorepo';
  return 'Modular Application Architecture';
}

// ─── HELPER: Build Mermaid from evidence ────────────────────────────

function buildMermaidFromEvidence(entryPoints, routes, models, databases) {
  let graph = 'graph TD\n';
  graph += '    User(["Client Browser"]) --> Router["Request Router"]\n';

  // Add entry points
  const frontendEntries = entryPoints.filter(e => e.type === 'frontend');
  const backendEntries = entryPoints.filter(e => e.type === 'backend');

  if (frontendEntries.length > 0) {
    const feFile = frontendEntries[0].file.split('/').pop();
    graph += `    Router --> FE["Frontend: ${feFile}"]\n`;
  }

  if (backendEntries.length > 0) {
    const beFile = backendEntries[0].file.split('/').pop();
    graph += `    Router --> BE["Backend: ${beFile}"]\n`;
  } else if (routes.length > 0) {
    graph += '    Router --> BE["API Handlers"]\n';
  }

  // Add route groups
  const routeGroups = {};
  for (const r of routes.slice(0, 8)) {
    const base = r.path.split('/').slice(0, 3).join('/') || r.path;
    if (!routeGroups[base]) routeGroups[base] = [];
    routeGroups[base].push(r);
  }

  let nodeId = 0;
  for (const [base, groupRoutes] of Object.entries(routeGroups)) {
    const label = base.length > 25 ? base.substring(0, 25) + '...' : base;
    const safeLabel = label.replace(/"/g, "'");
    graph += `    BE --> Route${nodeId}["${groupRoutes[0].method} ${safeLabel}"]\n`;
    nodeId++;
  }

  // Add database
  if (databases.length > 0) {
    const dbName = databases[0].length > 20 ? databases[0].substring(0, 20) : databases[0];
    graph += `    BE --> DB[("${dbName}")]\n`;
  }

  // Add models
  if (models.length > 0) {
    const modelNames = models.slice(0, 3).map(m => m.name).join(', ');
    graph += `    DB --> Models["Models: ${modelNames}"]\n`;
  }

  return graph;
}

// ─── HELPER: Detect modules from directory structure ────────────────

function detectModules(functions, routes, entryPoints) {
  const dirMap = {};
  const allItems = [
    ...functions.map(f => ({ file: f.file, type: 'function' })),
    ...routes.map(r => ({ file: r.file, type: 'route' })),
    ...entryPoints.map(e => ({ file: e.file, type: 'entry' }))
  ];

  for (const item of allItems) {
    const parts = item.file.split('/');
    if (parts.length >= 2) {
      const dir = parts.slice(0, 2).join('/');
      if (!dirMap[dir]) dirMap[dir] = { functions: 0, routes: 0, entries: 0, files: new Set() };
      dirMap[dir][item.type === 'function' ? 'functions' : item.type === 'route' ? 'routes' : 'entries']++;
      dirMap[dir].files.add(item.file);
    }
  }

  return Object.entries(dirMap)
    .filter(([_, stats]) => stats.files.size >= 1)
    .sort((a, b) => b[1].files.size - a[1].files.size)
    .slice(0, 8)
    .map(([dir, stats]) => ({
      name: dir.split('/').pop() || dir,
      path: dir,
      responsibility: `Contains ${stats.functions} functions, ${stats.routes} routes, ${stats.entries} entry points`,
      dependencies: []
    }));
}

// ─── HELPER: Build quickstart from real scripts ─────────────────────

function buildQuickstart(manifests, repoMetadata, infrastructure) {
  const steps = [];
  let stepNum = 1;

  // Clone command
  const repoUrl = repoMetadata.htmlUrl || (repoMetadata.name ? `https://github.com/${repoMetadata.name}` : 'https://github.com/OWNER/REPO');
  steps.push({ step: stepNum++, command: `git clone ${repoUrl}`, explanation: 'Clone the repository' });

  // Install command — from real scripts
  if (manifests.scripts?.['install'] || manifests.scripts?.['install:all']) {
    steps.push({ step: stepNum++, command: manifests.scripts['install:all'] || 'npm run install', explanation: 'Install all dependencies' });
  } else if (manifests.packageJson) {
    steps.push({ step: stepNum++, command: 'npm install', explanation: 'Install Node.js dependencies' });
  } else if (manifests.requirementsTxt) {
    steps.push({ step: stepNum++, command: 'pip install -r requirements.txt', explanation: 'Install Python dependencies' });
  } else if (manifests.goMod) {
    steps.push({ step: stepNum++, command: 'go mod download', explanation: 'Download Go module dependencies' });
  } else if (manifests.cargoToml) {
    steps.push({ step: stepNum++, command: 'cargo build', explanation: 'Build Rust project and fetch dependencies' });
  }

  // Dev command — from real scripts
  if (manifests.scripts?.['dev']) {
    steps.push({ step: stepNum++, command: 'npm run dev', explanation: `Start development server (runs: ${manifests.scripts.dev})` });
  } else if (manifests.scripts?.['start']) {
    steps.push({ step: stepNum++, command: 'npm start', explanation: `Start application (runs: ${manifests.scripts.start})` });
  }

  // Build command — from real scripts
  if (manifests.scripts?.['build']) {
    steps.push({ step: stepNum++, command: 'npm run build', explanation: 'Build for production' });
  }

  // Test command — from real scripts
  if (manifests.scripts?.['test']) {
    steps.push({ step: stepNum++, command: 'npm test', explanation: `Run test suite (runs: ${manifests.scripts.test})` });
  }

  // Prerequisites
  const prereqs = [];
  if (manifests.engines?.node) prereqs.push(`Node.js ${manifests.engines.node}`);
  else if (manifests.packageJson) prereqs.push('Node.js 18+');
  if (manifests.requirementsTxt || manifests.pyprojectToml) prereqs.push('Python 3.8+');
  if (manifests.goMod) prereqs.push('Go 1.21+');
  if (manifests.cargoToml) prereqs.push('Rust / Cargo');
  if (prereqs.length === 0) prereqs.push('Git');

  // Env vars from evidence
  const envVars = infrastructure.envVars.map(e => ({
    key: e.key,
    required: e.required,
    purpose: `Referenced in ${e.file}`
  }));

  return {
    prerequisites: prereqs,
    ai_quickstart_steps: steps,
    environment_variables: envVars
  };
}

// ─── HELPER: Build elevator pitch ───────────────────────────────────

function buildElevatorPitch(name, lang, frameworks, routes, models, complexity) {
  const parts = [`${name} is a ${lang} project`];
  if (frameworks.length > 0) parts.push(`built with ${frameworks.slice(0, 3).join(', ')}`);
  if (routes.length > 0) parts.push(`exposing ${routes.length} API endpoint${routes.length > 1 ? 's' : ''}`);
  if (models.length > 0) parts.push(`with ${models.length} data model${models.length > 1 ? 's' : ''}`);
  parts.push(`spanning ${complexity.totalLoc.toLocaleString()} lines of code across ${complexity.scannedFiles} scanned files.`);
  return parts.join(' ');
}

// ─── HELPER: Build architecture overview ────────────────────────────

function buildArchitectureOverview(complexity, entryPoints, routes, modules, lang) {
  const parts = [`Scanned ${complexity.scannedFiles} of ${complexity.totalFiles} repository files (${complexity.totalLoc.toLocaleString()} LoC).`];
  if (entryPoints.length > 0) parts.push(`Detected ${entryPoints.length} entry point${entryPoints.length > 1 ? 's' : ''}.`);
  if (routes.length > 0) parts.push(`Found ${routes.length} API route${routes.length > 1 ? 's' : ''}.`);
  if (modules.length > 0) parts.push(`Identified ${modules.length} module${modules.length > 1 ? 's' : ''} from directory structure.`);
  if (complexity.totalFunctions > 0) parts.push(`${complexity.totalFunctions} functions detected with avg length of ${complexity.avgFunctionLength} lines.`);
  return parts.join(' ');
}

// ─── HELPER: Build code smells from evidence ────────────────────────

function buildCodeSmells(complexity, tests, security) {
  const smells = [];

  if (complexity.avgFunctionLength > 50) {
    smells.push({
      category: 'Maintainability',
      description: `Average function length is ${complexity.avgFunctionLength} lines — consider breaking large functions into smaller units.`,
      impact: 'Functions over 50 lines are harder to test and maintain.'
    });
  }

  if (tests.testFiles === 0) {
    smells.push({
      category: 'Testing',
      description: 'No test files detected in the repository.',
      impact: 'Code changes cannot be validated automatically, increasing regression risk.'
    });
  } else if (tests.ratio < 0.1) {
    smells.push({
      category: 'Testing',
      description: `Test-to-source ratio is ${tests.ratio} (${tests.testFiles} test files / ${tests.sourceFiles} source files).`,
      impact: 'Low test coverage may leave critical paths unvalidated.'
    });
  }

  if (complexity.largestFiles?.length > 0) {
    const biggest = complexity.largestFiles[0];
    if (biggest.loc > 300) {
      smells.push({
        category: 'Structure',
        description: `Largest file ${biggest.file} has ${biggest.loc} lines — consider splitting into smaller modules.`,
        impact: 'Large files make code navigation, review, and maintenance difficult.'
      });
    }
  }

  const highSev = security.filter(s => s.severity === 'HIGH' || s.severity === 'CRITICAL');
  if (highSev.length > 0) {
    smells.push({
      category: 'Security',
      description: `${highSev.length} high/critical security finding${highSev.length > 1 ? 's' : ''} detected — immediate remediation recommended.`,
      impact: 'Unresolved security issues may expose the application to attacks.'
    });
  }

  return smells;
}
