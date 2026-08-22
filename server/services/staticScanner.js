/**
 * RepoLens Static Scanner — Deterministic Evidence Extraction Engine
 * 
 * Pure functions that take { fileContents, filePaths } and return
 * a structured Evidence Bundle. No LLM calls. No network calls.
 * Every finding has a file:line reference.
 */

// ─── MANIFEST SCANNER ───────────────────────────────────────────────

export function scanManifests(fileContents) {
  const result = {
    packageJson: null,
    cargoToml: null,
    pyprojectToml: null,
    goMod: null,
    requirementsTxt: null,
    dependencies: {},
    devDependencies: {},
    scripts: {},
    engines: null
  };

  for (const f of fileContents) {
    // package.json
    if (/^(.*\/)?package\.json$/i.test(f.path) && !f.path.includes('node_modules')) {
      try {
        const pkg = JSON.parse(f.content);
        result.packageJson = {
          name: pkg.name,
          version: pkg.version,
          description: pkg.description,
          file: f.path
        };
        result.dependencies = pkg.dependencies || {};
        result.devDependencies = pkg.devDependencies || {};
        result.scripts = pkg.scripts || {};
        result.engines = pkg.engines || null;
      } catch (e) { /* skip malformed */ }
    }

    // requirements.txt
    if (/requirements\.txt$/i.test(f.path)) {
      const deps = {};
      const lines = f.content.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const match = trimmed.match(/^([a-zA-Z0-9_-]+)\s*([><=!~]+\s*[\d.]+)?/);
          if (match) deps[match[1]] = (match[2] || '').trim();
        }
      }
      result.requirementsTxt = { file: f.path, deps };
    }

    // go.mod
    if (/go\.mod$/i.test(f.path)) {
      const deps = {};
      const lines = f.content.split('\n');
      for (const line of lines) {
        const match = line.trim().match(/^\s*([a-zA-Z0-9./\-_]+)\s+v([\d.]+)/);
        if (match) deps[match[1]] = match[2];
      }
      result.goMod = { file: f.path, module: (f.content.match(/module\s+(\S+)/) || [])[1], deps };
    }

    // Cargo.toml
    if (/Cargo\.toml$/i.test(f.path)) {
      result.cargoToml = { file: f.path, raw: f.content.substring(0, 2000) };
    }

    // pyproject.toml
    if (/pyproject\.toml$/i.test(f.path)) {
      result.pyprojectToml = { file: f.path, raw: f.content.substring(0, 2000) };
    }
  }

  return result;
}

// ─── ENTRY POINT SCANNER ────────────────────────────────────────────

export function scanEntryPoints(fileContents, filePaths) {
  const entries = [];
  const patterns = [
    { pattern: /^app\/(page|layout)\.(tsx|jsx|ts|js)$/i, type: 'frontend', purpose: 'Next.js App Router entry' },
    { pattern: /^app\/api\/.*\/route\.(ts|js)$/i, type: 'backend', purpose: 'Next.js API route handler' },
    { pattern: /^pages\/index\.(tsx|jsx|ts|js)$/i, type: 'frontend', purpose: 'Next.js Pages Router index' },
    { pattern: /^pages\/api\/.*\.(tsx|jsx|ts|js)$/i, type: 'backend', purpose: 'Next.js Pages API route' },
    { pattern: /^src\/(index|main|App)\.(tsx|jsx|ts|js)$/i, type: 'frontend', purpose: 'SPA client bootstrap' },
    { pattern: /^(index|main|server|app)\.(js|ts|mjs)$/i, type: 'backend', purpose: 'Server application entry' },
    { pattern: /^server\/(index|main|app)\.(js|ts)$/i, type: 'backend', purpose: 'Server module entry' },
    { pattern: /^(main|app)\.py$/i, type: 'backend', purpose: 'Python application entry' },
    { pattern: /^main\.go$/i, type: 'backend', purpose: 'Go binary entry' },
    { pattern: /^cmd\/.*\/main\.go$/i, type: 'backend', purpose: 'Go CLI entry' },
    { pattern: /^src\/main\.rs$/i, type: 'backend', purpose: 'Rust binary entry' },
    { pattern: /^src\/lib\.rs$/i, type: 'backend', purpose: 'Rust library entry' },
    { pattern: /^Dockerfile$/i, type: 'config', purpose: 'Container build definition' },
    { pattern: /^docker-compose\.ya?ml$/i, type: 'config', purpose: 'Multi-container orchestration' }
  ];

  for (const path of filePaths) {
    for (const p of patterns) {
      if (p.pattern.test(path)) {
        // Find the line with the main export/function
        const file = fileContents.find(fc => fc.path === path);
        let line = 1;
        if (file) {
          const lines = file.content.split('\n');
          for (let i = 0; i < lines.length; i++) {
            if (/^(export\s+default|export\s+async|app\.|createApp|createServer|func\s+main|fn\s+main|def\s+main|if\s+__name__)/.test(lines[i].trim())) {
              line = i + 1;
              break;
            }
          }
        }
        entries.push({ file: path, line, type: p.type, purpose: p.purpose, evidence: `Matched pattern: ${p.pattern.source}` });
        break;
      }
    }
  }

  return entries;
}

// ─── ROUTE SCANNER ──────────────────────────────────────────────────

export function scanRoutes(fileContents) {
  const routes = [];

  for (const f of fileContents) {
    const lines = f.content.split('\n');

    // Next.js App Router: app/api/.../route.ts
    if (/app\/api\/.*\/route\.(ts|js)$/i.test(f.path)) {
      const routePath = '/' + f.path.replace(/^app/, '').replace(/\/route\.(ts|js)$/, '').replace(/^\//, '');
      for (let i = 0; i < lines.length; i++) {
        const methodMatch = lines[i].match(/export\s+(?:async\s+)?function\s+(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)/i);
        if (methodMatch) {
          const hasAuth = /auth|session|jwt|token|bearer|getServerSession|currentUser|getUser/i.test(f.content);
          routes.push({
            method: methodMatch[1].toUpperCase(),
            path: routePath,
            file: f.path,
            line: i + 1,
            auth: hasAuth,
            evidence: lines[i].trim().substring(0, 120)
          });
        }
      }
    }

    // Next.js Pages API: pages/api/*.ts
    if (/pages\/api\/.*\.(ts|js)$/i.test(f.path)) {
      const routePath = '/' + f.path.replace(/^pages/, '').replace(/\.(ts|js)$/, '').replace(/\/index$/, '');
      const hasAuth = /auth|session|jwt|token/i.test(f.content);
      routes.push({
        method: 'HANDLER',
        path: routePath,
        file: f.path,
        line: 1,
        auth: hasAuth,
        evidence: 'Next.js Pages API handler'
      });
    }

    // Express/Fastify: app.get('/path', ...) or router.post('/path', ...)
    if (/\.(js|ts|mjs)$/i.test(f.path)) {
      for (let i = 0; i < lines.length; i++) {
        const expressMatch = lines[i].match(/(app|router|server)\.(get|post|put|delete|patch|all|use)\(\s*['"`]([^'"`]+)['"`]/i);
        if (expressMatch) {
          const method = expressMatch[2].toUpperCase();
          if (method === 'USE' && !/\/api|\/auth|\/v\d/.test(expressMatch[3])) continue; // skip middleware
          const hasAuth = /auth|jwt|verify|passport|protect|guard/i.test(lines[i]) || 
                          (i > 0 && /auth|middleware/i.test(lines[i-1]));
          routes.push({
            method: method === 'USE' ? 'MIDDLEWARE' : method,
            path: expressMatch[3],
            file: f.path,
            line: i + 1,
            auth: hasAuth,
            evidence: lines[i].trim().substring(0, 120)
          });
        }
      }
    }

    // FastAPI/Flask Python routes
    if (/\.py$/i.test(f.path)) {
      for (let i = 0; i < lines.length; i++) {
        const pyMatch = lines[i].match(/@(?:app|router|api_router)\.(get|post|put|delete|patch)\(\s*['"]([^'"]+)['"]/i);
        if (pyMatch) {
          const hasAuth = /Depends|get_current_user|login_required|auth/i.test(f.content);
          routes.push({
            method: pyMatch[1].toUpperCase(),
            path: pyMatch[2],
            file: f.path,
            line: i + 1,
            auth: hasAuth,
            evidence: lines[i].trim().substring(0, 120)
          });
        }
        // Django URL patterns
        const djangoMatch = lines[i].match(/path\(\s*['"]([^'"]+)['"]\s*,\s*(\w+)/i);
        if (djangoMatch) {
          routes.push({
            method: 'VIEW',
            path: djangoMatch[1],
            file: f.path,
            line: i + 1,
            auth: /login_required|permission_required|IsAuthenticated/i.test(f.content),
            evidence: lines[i].trim().substring(0, 120)
          });
        }
      }
    }
  }

  return routes;
}

// ─── FUNCTION/SYMBOL SCANNER ────────────────────────────────────────

export function scanFunctions(fileContents) {
  const functions = [];

  for (const f of fileContents) {
    if (f.path.includes('node_modules') || f.path.includes('.min.')) continue;
    const lines = f.content.split('\n');

    // JS/TS exported functions
    if (/\.(ts|tsx|js|jsx|mjs)$/i.test(f.path)) {
      for (let i = 0; i < lines.length; i++) {
        // export function name(params)
        const funcMatch = lines[i].match(/export\s+(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)/);
        if (funcMatch) {
          const name = funcMatch[1];
          if (['default'].includes(name)) continue;
          const loc = countFunctionLoc(lines, i);
          functions.push({
            name,
            file: f.path,
            line: i + 1,
            params: funcMatch[2].trim().split(',').filter(Boolean).length,
            paramSignature: funcMatch[2].trim().substring(0, 80),
            loc,
            complexity: loc > 50 ? 'high' : loc > 20 ? 'medium' : 'low',
            kind: 'function',
            evidence: lines[i].trim().substring(0, 120)
          });
        }

        // export const name = (params) => or export const name = async (params) =>
        const arrowMatch = lines[i].match(/export\s+const\s+(\w+)\s*=\s*(?:async\s*)?\(([^)]*)\)\s*(?::\s*\w+)?\s*=>/);
        if (arrowMatch) {
          const name = arrowMatch[1];
          const loc = countFunctionLoc(lines, i);
          functions.push({
            name,
            file: f.path,
            line: i + 1,
            params: arrowMatch[2].trim().split(',').filter(Boolean).length,
            paramSignature: arrowMatch[2].trim().substring(0, 80),
            loc,
            complexity: loc > 50 ? 'high' : loc > 20 ? 'medium' : 'low',
            kind: 'arrow',
            evidence: lines[i].trim().substring(0, 120)
          });
        }

        // React components: export default function ComponentName or export function ComponentName
        const componentMatch = lines[i].match(/export\s+(?:default\s+)?function\s+([A-Z]\w+)\s*\(/);
        if (componentMatch && !functions.some(fn => fn.name === componentMatch[1] && fn.file === f.path)) {
          functions.push({
            name: componentMatch[1],
            file: f.path,
            line: i + 1,
            params: 0,
            paramSignature: 'props',
            loc: countFunctionLoc(lines, i),
            complexity: 'medium',
            kind: 'component',
            evidence: lines[i].trim().substring(0, 120)
          });
        }

        // Class declarations
        const classMatch = lines[i].match(/export\s+(?:default\s+)?class\s+(\w+)/);
        if (classMatch) {
          functions.push({
            name: classMatch[1],
            file: f.path,
            line: i + 1,
            params: 0,
            paramSignature: '',
            loc: countFunctionLoc(lines, i),
            complexity: 'high',
            kind: 'class',
            evidence: lines[i].trim().substring(0, 120)
          });
        }
      }
    }

    // Python functions
    if (/\.py$/i.test(f.path)) {
      for (let i = 0; i < lines.length; i++) {
        const pyFunc = lines[i].match(/^(?:async\s+)?def\s+(\w+)\s*\(([^)]*)\)/);
        if (pyFunc && !pyFunc[1].startsWith('_')) {
          const loc = countPythonFunctionLoc(lines, i);
          functions.push({
            name: pyFunc[1],
            file: f.path,
            line: i + 1,
            params: pyFunc[2].split(',').filter(p => p.trim() && p.trim() !== 'self' && p.trim() !== 'cls').length,
            paramSignature: pyFunc[2].trim().substring(0, 80),
            loc,
            complexity: loc > 40 ? 'high' : loc > 15 ? 'medium' : 'low',
            kind: 'function',
            evidence: lines[i].trim().substring(0, 120)
          });
        }

        // Python classes
        const pyClass = lines[i].match(/^class\s+(\w+)\s*[(:]/);
        if (pyClass && !pyClass[1].startsWith('_')) {
          functions.push({
            name: pyClass[1],
            file: f.path,
            line: i + 1,
            params: 0,
            paramSignature: '',
            loc: countPythonFunctionLoc(lines, i),
            complexity: 'high',
            kind: 'class',
            evidence: lines[i].trim().substring(0, 120)
          });
        }
      }
    }

    // Go functions
    if (/\.go$/i.test(f.path)) {
      for (let i = 0; i < lines.length; i++) {
        const goFunc = lines[i].match(/^func\s+(?:\([^)]+\)\s+)?(\w+)\s*\(([^)]*)\)/);
        if (goFunc) {
          functions.push({
            name: goFunc[1],
            file: f.path,
            line: i + 1,
            params: goFunc[2].split(',').filter(Boolean).length,
            paramSignature: goFunc[2].trim().substring(0, 80),
            loc: countFunctionLoc(lines, i),
            complexity: 'medium',
            kind: 'function',
            evidence: lines[i].trim().substring(0, 120)
          });
        }
      }
    }

    // Rust functions
    if (/\.rs$/i.test(f.path)) {
      for (let i = 0; i < lines.length; i++) {
        const rsFunc = lines[i].match(/pub\s+(?:async\s+)?fn\s+(\w+)\s*\(([^)]*)\)/);
        if (rsFunc) {
          functions.push({
            name: rsFunc[1],
            file: f.path,
            line: i + 1,
            params: rsFunc[2].split(',').filter(Boolean).length,
            paramSignature: rsFunc[2].trim().substring(0, 80),
            loc: countFunctionLoc(lines, i),
            complexity: 'medium',
            kind: 'function',
            evidence: lines[i].trim().substring(0, 120)
          });
        }
      }
    }
  }

  return functions;
}

/** Count lines of a brace-delimited function body */
function countFunctionLoc(lines, startIdx) {
  let braceDepth = 0;
  let started = false;
  let count = 0;
  for (let i = startIdx; i < Math.min(lines.length, startIdx + 200); i++) {
    const line = lines[i];
    for (const ch of line) {
      if (ch === '{') { braceDepth++; started = true; }
      if (ch === '}') braceDepth--;
    }
    if (started) count++;
    if (started && braceDepth <= 0) break;
  }
  return count || 1;
}

/** Count lines of a Python indentation-delimited block */
function countPythonFunctionLoc(lines, startIdx) {
  if (startIdx >= lines.length) return 1;
  const baseIndent = lines[startIdx].match(/^(\s*)/)[1].length;
  let count = 1;
  for (let i = startIdx + 1; i < Math.min(lines.length, startIdx + 200); i++) {
    const line = lines[i];
    if (line.trim() === '') { count++; continue; }
    const indent = line.match(/^(\s*)/)[1].length;
    if (indent <= baseIndent) break;
    count++;
  }
  return count;
}

// ─── MODEL SCANNER ──────────────────────────────────────────────────

export function scanModels(fileContents) {
  const models = [];

  for (const f of fileContents) {
    const lines = f.content.split('\n');

    // Prisma schema models
    if (/prisma\/schema\.prisma$/i.test(f.path) || /\.prisma$/i.test(f.path)) {
      let currentModel = null;
      let fields = [];
      let relations = [];
      for (let i = 0; i < lines.length; i++) {
        const modelStart = lines[i].match(/^model\s+(\w+)\s*\{/);
        if (modelStart) {
          if (currentModel) {
            models.push({ name: currentModel.name, file: f.path, line: currentModel.line, fields, relations, orm: 'Prisma' });
          }
          currentModel = { name: modelStart[1], line: i + 1 };
          fields = [];
          relations = [];
          continue;
        }
        if (currentModel && lines[i].trim() === '}') {
          models.push({ name: currentModel.name, file: f.path, line: currentModel.line, fields, relations, orm: 'Prisma' });
          currentModel = null;
          continue;
        }
        if (currentModel) {
          const fieldMatch = lines[i].trim().match(/^(\w+)\s+(\w+)/);
          if (fieldMatch && !lines[i].trim().startsWith('//') && !lines[i].trim().startsWith('@@')) {
            fields.push(fieldMatch[1]);
            if (/\[\]|@relation/.test(lines[i])) {
              relations.push(`${fieldMatch[1]} -> ${fieldMatch[2]}`);
            }
          }
        }
      }
      if (currentModel) {
        models.push({ name: currentModel.name, file: f.path, line: currentModel.line, fields, relations, orm: 'Prisma' });
      }
    }

    // Mongoose schemas
    if (/\.(js|ts)$/i.test(f.path) && /new\s+(?:mongoose\.)?Schema\s*\(/i.test(f.content)) {
      for (let i = 0; i < lines.length; i++) {
        const mongooseModel = lines[i].match(/(?:mongoose\.model|model)\s*\(\s*['"](\w+)['"]/);
        if (mongooseModel) {
          models.push({
            name: mongooseModel[1],
            file: f.path,
            line: i + 1,
            fields: extractMongooseFields(lines, i),
            relations: [],
            orm: 'Mongoose'
          });
        }
      }
    }

    // Drizzle schemas
    if (/\.(ts|js)$/i.test(f.path) && /(?:pgTable|mysqlTable|sqliteTable)\s*\(/i.test(f.content)) {
      for (let i = 0; i < lines.length; i++) {
        const drizzleMatch = lines[i].match(/(?:export\s+)?(?:const|let)\s+(\w+)\s*=\s*(?:pgTable|mysqlTable|sqliteTable)\s*\(\s*['"](\w+)['"]/);
        if (drizzleMatch) {
          models.push({
            name: drizzleMatch[2],
            file: f.path,
            line: i + 1,
            fields: extractDrizzleFields(lines, i),
            relations: [],
            orm: 'Drizzle'
          });
        }
      }
    }

    // SQLAlchemy models
    if (/\.py$/i.test(f.path) && /class\s+\w+.*(?:Base|Model|db\.Model)/i.test(f.content)) {
      for (let i = 0; i < lines.length; i++) {
        const sqlaMatch = lines[i].match(/class\s+(\w+)\s*\(.*(?:Base|Model|db\.Model)/);
        if (sqlaMatch) {
          const fields = [];
          const relations = [];
          for (let j = i + 1; j < Math.min(lines.length, i + 50); j++) {
            if (/^\S/.test(lines[j]) && lines[j].trim() !== '') break;
            const colMatch = lines[j].match(/(\w+)\s*=\s*(?:Column|db\.Column|mapped_column)/);
            if (colMatch) fields.push(colMatch[1]);
            const relMatch = lines[j].match(/(\w+)\s*=\s*(?:relationship|db\.relationship)/);
            if (relMatch) relations.push(relMatch[1]);
          }
          models.push({ name: sqlaMatch[1], file: f.path, line: i + 1, fields, relations, orm: 'SQLAlchemy' });
        }
      }
    }
  }

  return models;
}

function extractMongooseFields(lines, modelLine) {
  const fields = [];
  // Scan upwards to find the Schema definition
  for (let i = Math.max(0, modelLine - 60); i < modelLine; i++) {
    const fieldMatch = lines[i].match(/^\s+(\w+)\s*:\s*\{?\s*(type\s*:|String|Number|Boolean|Date|ObjectId|Array|\[)/i);
    if (fieldMatch) fields.push(fieldMatch[1]);
  }
  return fields;
}

function extractDrizzleFields(lines, startLine) {
  const fields = [];
  for (let i = startLine + 1; i < Math.min(lines.length, startLine + 30); i++) {
    if (/^\s*\}\s*\)/.test(lines[i])) break;
    const fieldMatch = lines[i].match(/(\w+)\s*:\s*(?:text|integer|varchar|boolean|timestamp|serial|uuid|real|numeric|jsonb?)/i);
    if (fieldMatch) fields.push(fieldMatch[1]);
  }
  return fields;
}

// ─── SECURITY SCANNER ───────────────────────────────────────────────

export function scanSecurity(fileContents) {
  const findings = [];

  const rules = [
    {
      id: 'HARDCODED_SECRET',
      severity: 'HIGH',
      regex: /(?:api[_-]?key|secret[_-]?key|password|auth[_-]?token|private[_-]?key)\s*[:=]\s*['"`](?![A-Z_]+['"`])([a-zA-Z0-9/+=_\-.]{16,})['"`]/i,
      title: 'Hardcoded Secret / API Credential',
      remediation: 'Move to environment variables. Use .env file with dotenv or platform secret manager.'
    },
    {
      id: 'EVAL_USAGE',
      severity: 'HIGH',
      regex: /\beval\s*\(/,
      title: 'Dynamic Code Execution via eval()',
      remediation: 'Replace eval() with JSON.parse(), Function constructor, or structured parsers.'
    },
    {
      id: 'INNER_HTML',
      severity: 'MEDIUM',
      regex: /(?:dangerouslySetInnerHTML|\.innerHTML\s*=)/i,
      title: 'Raw HTML Injection Risk (XSS Vector)',
      remediation: 'Use DOMPurify to sanitize HTML or switch to text-based rendering.'
    },
    {
      id: 'SQL_CONCAT',
      severity: 'HIGH',
      regex: /(?:query|execute|raw)\s*\(\s*(?:`[^`]*\$\{|['"][^'"]*['"]\s*\+\s*(?:req\.|params\.|body\.))/i,
      title: 'SQL Injection via String Concatenation',
      remediation: 'Use parameterized queries ($1, ?) or ORM query builders instead of string interpolation.'
    },
    {
      id: 'WILDCARD_CORS',
      severity: 'MEDIUM',
      regex: /cors\(\s*\{?\s*origin\s*:\s*['"`]\*['"`]/i,
      title: 'Wildcard CORS — All Origins Allowed',
      remediation: 'Restrict origin to explicitly authorized domains.'
    },
    {
      id: 'NO_HELMET',
      severity: 'LOW',
      regex: null, // checked separately
      title: 'Missing Security Headers (Helmet)',
      remediation: 'Add helmet() middleware for Express to set security-related HTTP headers.'
    },
    {
      id: 'OPEN_REDIRECT',
      severity: 'MEDIUM',
      regex: /res\.redirect\(\s*(?:req\.(?:query|params|body)\.\w+|`[^`]*\$\{req\.)/i,
      title: 'Open Redirect via User-Controlled Input',
      remediation: 'Validate redirect URLs against an allowlist of trusted domains.'
    },
    {
      id: 'EXEC_SPAWN',
      severity: 'HIGH',
      regex: /(?:child_process|exec|execSync|spawn|spawnSync)\s*\(/i,
      title: 'Shell Command Execution',
      remediation: 'If unavoidable, validate and sanitize all inputs. Never pass user input directly to shell.'
    },
    {
      id: 'CONSOLE_LOG_SENSITIVE',
      severity: 'LOW',
      regex: /console\.log\s*\([^)]*(?:password|secret|token|key|credential)/i,
      title: 'Sensitive Data Logged to Console',
      remediation: 'Remove or mask sensitive values in log statements.'
    },
    {
      id: 'WEAK_CRYPTO',
      severity: 'MEDIUM',
      regex: /(?:createHash|createCipher)\s*\(\s*['"](?:md5|sha1|des|rc4)['"]/i,
      title: 'Weak Cryptographic Algorithm',
      remediation: 'Use SHA-256 or stronger. Replace DES/RC4 with AES-256-GCM.'
    }
  ];

  for (const f of fileContents) {
    if (f.path.includes('node_modules') || f.path.includes('.min.') || /\.(md|txt|svg|png|jpg|lock)$/i.test(f.path)) continue;
    const lines = f.content.split('\n');

    for (const rule of rules) {
      if (!rule.regex) continue;
      for (let i = 0; i < lines.length; i++) {
        if (rule.regex.test(lines[i])) {
          // Avoid duplicate findings for same rule in same file
          if (!findings.some(ff => ff.rule === rule.id && ff.file === f.path && ff.line === i + 1)) {
            findings.push({
              severity: rule.severity,
              rule: rule.id,
              title: rule.title,
              file: f.path,
              line: i + 1,
              evidence: lines[i].trim().substring(0, 150),
              remediation: rule.remediation
            });
          }
        }
      }
    }
  }

  // Check for missing helmet (Express apps)
  const hasExpress = fileContents.some(f => /require\s*\(\s*['"]express['"]\)|from\s+['"]express['"]/i.test(f.content));
  const hasHelmet = fileContents.some(f => /helmet/i.test(f.content));
  if (hasExpress && !hasHelmet) {
    const serverFile = fileContents.find(f => /server|index|app/i.test(f.path) && /express/i.test(f.content));
    findings.push({
      severity: 'LOW',
      rule: 'NO_HELMET',
      title: 'Missing Security Headers (Helmet)',
      file: serverFile?.path || 'server/index.js',
      line: 1,
      evidence: 'Express server detected without helmet middleware',
      remediation: 'Install and use helmet: npm i helmet → app.use(helmet())'
    });
  }

  // Check for missing input validation
  for (const f of fileContents) {
    if (/\.(js|ts|mjs)$/i.test(f.path)) {
      const lines = f.content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (/req\.body\.\w+/.test(lines[i]) && !/zod|joi|yup|validate|schema|sanitize/i.test(f.content)) {
          if (!findings.some(ff => ff.rule === 'NO_VALIDATION' && ff.file === f.path)) {
            findings.push({
              severity: 'MEDIUM',
              rule: 'NO_VALIDATION',
              title: 'Request Body Used Without Schema Validation',
              file: f.path,
              line: i + 1,
              evidence: lines[i].trim().substring(0, 150),
              remediation: 'Add runtime validation with Zod, Joi, or Yup before using req.body properties.'
            });
          }
        }
      }
    }
  }

  return findings;
}

// ─── UI PATTERN SCANNER ─────────────────────────────────────────────

export function scanUIPatterns(fileContents) {
  const issues = [];

  for (const f of fileContents) {
    if (!/\.(tsx|jsx|html|vue|svelte)$/i.test(f.path)) continue;
    const lines = f.content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      // Missing alt on img
      if (/<img\s+(?![^>]*\balt=)[^>]*>/i.test(lines[i])) {
        if (!issues.some(iss => iss.rule === 'IMG_NO_ALT' && iss.file === f.path)) {
          issues.push({
            rule: 'IMG_NO_ALT',
            issue: 'Image element missing alt attribute',
            category: 'Accessibility',
            impact: 'HIGH',
            file: f.path,
            line: i + 1,
            evidence: lines[i].trim().substring(0, 120),
            recommendation: 'Add alt="descriptive text" or alt="" for decorative images.'
          });
        }
      }

      // Icon-only button without aria-label
      if (/<button[^>]*>\s*<(?:svg|i|Icon)/i.test(lines[i]) && !/aria-label/i.test(lines[i])) {
        if (!issues.some(iss => iss.rule === 'ICON_BTN_NO_LABEL' && iss.file === f.path && Math.abs(iss.line - (i+1)) < 3)) {
          issues.push({
            rule: 'ICON_BTN_NO_LABEL',
            issue: 'Icon-only button missing aria-label',
            category: 'Accessibility',
            impact: 'HIGH',
            file: f.path,
            line: i + 1,
            evidence: lines[i].trim().substring(0, 120),
            recommendation: 'Add aria-label="Action description" to icon-only buttons.'
          });
        }
      }

      // Hardcoded pixel widths (>300px)
      if (/(?:width|min-width|max-width)\s*:\s*\d{3,4}px/i.test(lines[i]) && !/max-width/i.test(lines[i])) {
        if (!issues.some(iss => iss.rule === 'FIXED_WIDTH' && iss.file === f.path)) {
          issues.push({
            rule: 'FIXED_WIDTH',
            issue: 'Hardcoded pixel width may break on mobile',
            category: 'Responsiveness',
            impact: 'MEDIUM',
            file: f.path,
            line: i + 1,
            evidence: lines[i].trim().substring(0, 120),
            recommendation: 'Use relative units (%, rem, vw) or CSS max-width instead of fixed pixels.'
          });
        }
      }

      // Form without loading/disabled state
      if (/<form[^>]*onSubmit/i.test(lines[i]) || /handleSubmit|onSubmit/i.test(lines[i])) {
        const nearbyContent = lines.slice(Math.max(0, i - 5), Math.min(lines.length, i + 15)).join('\n');
        if (!/disabled|isLoading|isSubmitting|isPending|loading|spinner/i.test(nearbyContent)) {
          if (!issues.some(iss => iss.rule === 'FORM_NO_LOADING' && iss.file === f.path)) {
            issues.push({
              rule: 'FORM_NO_LOADING',
              issue: 'Form submission without loading/disabled state',
              category: 'User Feedback',
              impact: 'HIGH',
              file: f.path,
              line: i + 1,
              evidence: lines[i].trim().substring(0, 120),
              recommendation: 'Disable submit button and show loading indicator during async form submissions.'
            });
          }
        }
      }

      // Missing error boundary / error handling for data fetching
      if (/useEffect|useSWR|useQuery|fetch\(|axios/i.test(lines[i])) {
        const nearbyContent = lines.slice(i, Math.min(lines.length, i + 20)).join('\n');
        if (!/catch|onError|error|ErrorBoundary/i.test(nearbyContent)) {
          if (!issues.some(iss => iss.rule === 'NO_ERROR_HANDLING' && iss.file === f.path)) {
            issues.push({
              rule: 'NO_ERROR_HANDLING',
              issue: 'Data fetching without visible error handling',
              category: 'User Feedback',
              impact: 'MEDIUM',
              file: f.path,
              line: i + 1,
              evidence: lines[i].trim().substring(0, 120),
              recommendation: 'Add try/catch with user-facing error messages or use ErrorBoundary components.'
            });
          }
        }
      }
    }
  }

  return issues;
}

// ─── INFRASTRUCTURE SCANNER ─────────────────────────────────────────

export function scanInfrastructure(fileContents, filePaths) {
  const infra = {
    hasDocker: false,
    dockerFiles: [],
    hasCI: false,
    ciPipelines: [],
    envVars: [],
    cloudProvider: null
  };

  for (const path of filePaths) {
    if (/Dockerfile$/i.test(path)) {
      infra.hasDocker = true;
      infra.dockerFiles.push(path);
    }
    if (/docker-compose\.ya?ml$/i.test(path)) {
      infra.hasDocker = true;
      infra.dockerFiles.push(path);
    }
    if (/\.github\/workflows\/.*\.ya?ml$/i.test(path)) {
      infra.hasCI = true;
      infra.ciPipelines.push({ type: 'GitHub Actions', file: path });
    }
    if (/\.gitlab-ci\.ya?ml$/i.test(path)) {
      infra.hasCI = true;
      infra.ciPipelines.push({ type: 'GitLab CI', file: path });
    }
    if (/Jenkinsfile$/i.test(path)) {
      infra.hasCI = true;
      infra.ciPipelines.push({ type: 'Jenkins', file: path });
    }
    if (/\.circleci\/config\.ya?ml$/i.test(path)) {
      infra.hasCI = true;
      infra.ciPipelines.push({ type: 'CircleCI', file: path });
    }
  }

  // Extract env vars from .env.example, .env.sample, or code
  for (const f of fileContents) {
    if (/\.env\.(example|sample|template)$/i.test(f.path)) {
      const lines = f.content.split('\n');
      for (const line of lines) {
        const match = line.match(/^([A-Z][A-Z0-9_]+)\s*=/);
        if (match) {
          infra.envVars.push({
            key: match[1],
            file: f.path,
            required: !/optional|#\s*optional/i.test(line)
          });
        }
      }
    }
  }

  // Also scan for process.env references
  for (const f of fileContents) {
    if (/\.(js|ts|mjs)$/i.test(f.path)) {
      const envMatches = f.content.matchAll(/process\.env\.([A-Z][A-Z0-9_]+)/g);
      for (const m of envMatches) {
        if (!infra.envVars.some(e => e.key === m[1])) {
          infra.envVars.push({ key: m[1], file: f.path, required: true });
        }
      }
    }
  }

  // Detect cloud providers
  const allContent = fileContents.map(f => f.content).join('\n');
  if (/vercel|VERCEL/i.test(allContent) || filePaths.some(p => /vercel\.json/i.test(p))) infra.cloudProvider = 'Vercel';
  else if (/aws-sdk|AWS_|lambda|s3/i.test(allContent)) infra.cloudProvider = 'AWS';
  else if (/@google-cloud|GOOGLE_CLOUD|gcloud/i.test(allContent)) infra.cloudProvider = 'Google Cloud';
  else if (/azure|AZURE/i.test(allContent)) infra.cloudProvider = 'Azure';

  return infra;
}

// ─── TEST COVERAGE SCANNER ──────────────────────────────────────────

export function scanTestCoverage(fileContents, filePaths) {
  const testPatterns = [
    /\.(test|spec)\.(ts|tsx|js|jsx|mjs)$/i,
    /__(tests|test)__\/.*\.(ts|tsx|js|jsx)$/i,
    /test_.*\.py$/i,
    /.*_test\.py$/i,
    /.*_test\.go$/i
  ];

  const testFiles = filePaths.filter(p => testPatterns.some(pat => pat.test(p)));
  const sourceExtensions = /\.(ts|tsx|js|jsx|py|go|rs)$/i;
  const sourceFiles = filePaths.filter(p => 
    sourceExtensions.test(p) && 
    !testPatterns.some(pat => pat.test(p)) &&
    !p.includes('node_modules') &&
    !p.includes('.config.')
  );

  // Detect test framework
  let framework = null;
  const allContent = fileContents.map(f => f.content).join('\n');
  const allDeps = fileContents.find(f => f.path.endsWith('package.json'));
  if (allDeps) {
    try {
      const pkg = JSON.parse(allDeps.content);
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      if (deps['vitest']) framework = 'Vitest';
      else if (deps['jest']) framework = 'Jest';
      else if (deps['mocha']) framework = 'Mocha';
      else if (deps['@testing-library/react']) framework = 'React Testing Library';
      else if (deps['cypress']) framework = 'Cypress';
      else if (deps['playwright'] || deps['@playwright/test']) framework = 'Playwright';
    } catch (e) { /* skip */ }
  }
  if (!framework && /pytest/i.test(allContent)) framework = 'pytest';
  if (!framework && /testing\.T\b/i.test(allContent)) framework = 'Go testing';

  return {
    framework,
    testFiles: testFiles.length,
    sourceFiles: sourceFiles.length,
    ratio: sourceFiles.length > 0 ? +(testFiles.length / sourceFiles.length).toFixed(2) : 0,
    testFilePaths: testFiles.slice(0, 15)
  };
}

// ─── COMPLEXITY SCANNER ─────────────────────────────────────────────

export function scanComplexity(fileContents, filePaths) {
  let totalLoc = 0;
  let totalFunctions = 0;
  let totalFunctionLines = 0;
  const fileSizes = [];

  for (const f of fileContents) {
    if (f.path.includes('node_modules') || /\.(lock|svg|png|jpg|ico|woff)$/i.test(f.path)) continue;
    const lines = f.content.split('\n');
    const nonEmptyLines = lines.filter(l => l.trim().length > 0).length;
    totalLoc += nonEmptyLines;

    // Count function definitions
    let funcCount = 0;
    const funcStarts = [];
    for (let i = 0; i < lines.length; i++) {
      if (/(?:function\s+\w+|=>\s*\{|def\s+\w+|func\s+\w+|fn\s+\w+)/.test(lines[i])) {
        funcCount++;
        funcStarts.push(i);
      }
    }
    totalFunctions += funcCount;

    // Estimate avg function length
    for (const start of funcStarts) {
      const loc = /\.py$/i.test(f.path) ? countPythonFunctionLoc(lines, start) : countFunctionLoc(lines, start);
      totalFunctionLines += loc;
    }

    fileSizes.push({ file: f.path, loc: nonEmptyLines });
  }

  fileSizes.sort((a, b) => b.loc - a.loc);

  return {
    totalLoc,
    totalFunctions,
    avgFunctionLength: totalFunctions > 0 ? +(totalFunctionLines / totalFunctions).toFixed(1) : 0,
    totalFiles: filePaths.length,
    scannedFiles: fileContents.length,
    largestFiles: fileSizes.slice(0, 5)
  };
}

// ─── DETERMINISTIC SCORING ENGINE ───────────────────────────────────

export function calculateScores(evidence) {
  const { manifests, entryPoints, routes, functions, models, security, uiPatterns, infrastructure, tests, complexity } = evidence;

  // Documentation score (0-100)
  let docScore = 50;
  const allDeps = { ...manifests.dependencies, ...manifests.devDependencies };
  if (manifests.packageJson) docScore += 10;
  if (manifests.scripts && Object.keys(manifests.scripts).length > 0) docScore += 10;
  // Check if README exists via entry points or known paths
  if (entryPoints.some(e => /readme/i.test(e.file))) docScore += 15;
  else docScore += 15; // Assume README exists if we got here (it's fetched by githubService)
  if (manifests.engines) docScore += 5;
  if (manifests.scripts?.test) docScore += 5;
  if (manifests.scripts?.lint) docScore += 5;
  docScore = Math.min(100, docScore);

  // Maintainability score (0-100)
  let maintScore = 50;
  const hasTS = allDeps['typescript'] || Object.keys(allDeps).some(k => k.startsWith('@types/'));
  if (hasTS) maintScore += 15;
  if (allDeps['eslint'] || allDeps['biome'] || allDeps['prettier']) maintScore += 10;
  if (tests.ratio > 0.3) maintScore += 15;
  else if (tests.ratio > 0.1) maintScore += 8;
  else if (tests.testFiles > 0) maintScore += 3;
  if (complexity.avgFunctionLength > 0 && complexity.avgFunctionLength < 30) maintScore += 10;
  else if (complexity.avgFunctionLength >= 30 && complexity.avgFunctionLength < 60) maintScore += 5;
  if (infrastructure.hasCI) maintScore += 5;
  maintScore = Math.min(100, maintScore);

  // Architecture score (0-100)
  let archScore = 50;
  if (entryPoints.length >= 1) archScore += 10;
  if (entryPoints.length >= 3) archScore += 5;
  if (routes.length >= 1) archScore += 10;
  if (routes.length >= 5) archScore += 5;
  if (models.length >= 1) archScore += 10;
  if (functions.length >= 5) archScore += 5;
  if (functions.length >= 10) archScore += 5;
  archScore = Math.min(100, archScore);

  // Security score (0-100)
  let secScore = 100;
  const criticals = security.filter(s => s.severity === 'CRITICAL').length;
  const highs = security.filter(s => s.severity === 'HIGH').length;
  const mediums = security.filter(s => s.severity === 'MEDIUM').length;
  const lows = security.filter(s => s.severity === 'LOW').length;
  secScore -= criticals * 25;
  secScore -= highs * 12;
  secScore -= mediums * 5;
  secScore -= lows * 2;
  secScore = Math.max(0, Math.min(100, secScore));

  // Overall (weighted)
  const overall = Math.round(
    docScore * 0.15 +
    maintScore * 0.25 +
    archScore * 0.25 +
    secScore * 0.35
  );

  // Verdict
  let verdict;
  if (overall >= 90) verdict = 'Excellent — Production-Ready';
  else if (overall >= 80) verdict = 'Strong — Minor Improvements Recommended';
  else if (overall >= 65) verdict = 'Moderate — Refactoring Recommended';
  else if (overall >= 50) verdict = 'Fair — Significant Improvements Needed';
  else verdict = 'Weak — Major Overhaul Required';

  return {
    overall_score: overall,
    breakdown: {
      documentation: docScore,
      maintainability: maintScore,
      architecture_clarity: archScore,
      security_posture: secScore
    },
    evidence_summary: {
      documentation: { hasReadme: true, hasScripts: Object.keys(manifests.scripts || {}).length > 0, hasTypes: !!hasTS },
      maintainability: { hasLinter: !!(allDeps['eslint'] || allDeps['biome']), testRatio: tests.ratio, avgFuncLength: complexity.avgFunctionLength, hasCI: infrastructure.hasCI },
      architecture: { entryPoints: entryPoints.length, routes: routes.length, models: models.length, functions: functions.length },
      security: { critical: criticals, high: highs, medium: mediums, low: lows, total: security.length }
    },
    verdict
  };
}

// ─── MASTER SCAN ORCHESTRATOR ───────────────────────────────────────

/**
 * Runs all scanners and returns the complete Evidence Bundle.
 * @param {{ fileContents: Array<{path: string, content: string}>, filePaths: string[] }} input
 * @returns {object} Evidence Bundle
 */
export function runFullScan({ fileContents, filePaths }) {
  const manifests = scanManifests(fileContents);
  const entryPoints = scanEntryPoints(fileContents, filePaths);
  const routes = scanRoutes(fileContents);
  const functions = scanFunctions(fileContents);
  const models = scanModels(fileContents);
  const security = scanSecurity(fileContents);
  const uiPatterns = scanUIPatterns(fileContents);
  const infrastructure = scanInfrastructure(fileContents, filePaths);
  const tests = scanTestCoverage(fileContents, filePaths);
  const complexity = scanComplexity(fileContents, filePaths);

  const evidence = { manifests, entryPoints, routes, functions, models, security, uiPatterns, infrastructure, tests, complexity };
  const scores = calculateScores(evidence);

  return { ...evidence, scores };
}
