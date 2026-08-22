import axios from 'axios';

/**
 * Parses GitHub repository URL or slug into { owner, repo, branch }
 */
export function parseGitHubUrl(input) {
  if (!input || typeof input !== 'string') {
    throw new Error('Repository URL or slug is required');
  }

  const cleaned = input.trim().replace(/\/$/, '');
  
  // Format: https://github.com/owner/repo/tree/branch
  const treeMatch = cleaned.match(/github\.com\/([^/]+)\/([^/]+)\/tree\/([^/]+)/);
  if (treeMatch) {
    return { owner: treeMatch[1], repo: treeMatch[2], branch: treeMatch[3] };
  }

  // Format: https://github.com/owner/repo or http://...
  const urlMatch = cleaned.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (urlMatch) {
    return { owner: urlMatch[1], repo: urlMatch[2].replace(/\.git$/, ''), branch: null };
  }

  // Format: owner/repo
  const slugMatch = cleaned.match(/^([^/]+)\/([^/]+)$/);
  if (slugMatch) {
    return { owner: slugMatch[1], repo: slugMatch[2].replace(/\.git$/, ''), branch: null };
  }

  throw new Error(`Invalid GitHub repository format: "${input}". Please use "owner/repo" or "https://github.com/owner/repo".`);
}

/**
 * Creates an Axios instance with optional GitHub auth token
 */
function getGitHubClient(token) {
  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'Scry-Repository-Intelligence'
  };

  if (token) {
    headers['Authorization'] = `token ${token}`;
  }

  return axios.create({
    baseURL: 'https://api.github.com',
    headers,
    timeout: 20000
  });
}

/**
 * Fetches repository snapshot from GitHub API
 */
export async function fetchRepositorySnapshot({ owner, repo, branch = null, token = null }) {
  const client = getGitHubClient(token);

  // 1. Fetch Repository Metadata
  const repoRes = await client.get(`/repos/${owner}/${repo}`);
  const repoData = repoRes.data;
  const defaultBranch = branch || repoData.default_branch || 'main';

  // 2. Fetch File Tree (recursive)
  let treeItems = [];
  try {
    const treeRes = await client.get(`/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`);
    treeItems = treeRes.data.tree || [];
  } catch (err) {
    console.warn(`Failed to fetch full recursive tree for ${owner}/${repo}: ${err.message}`);
  }

  // Identify file paths
  const filePaths = treeItems
    .filter(item => item.type === 'blob')
    .map(item => item.path);

  // 3. Filter Priority Manifests and Source Files
  const manifestPatterns = [
    /package\.json$/i,
    /Cargo\.toml$/i,
    /pyproject\.toml$/i,
    /requirements\.txt$/i,
    /go\.mod$/i,
    /pom\.xml$/i,
    /build\.gradle/i,
    /Dockerfile$/i,
    /docker-compose\.ya?ml$/i,
    /\.github\/workflows\/.*\.ya?ml$/i,
    /tsconfig\.json$/i,
    /prisma\/schema\.prisma$/i,
    /alembic\.ini$/i,
    /\.env\.(example|sample|template)$/i,
    /drizzle\.config\.(ts|js)$/i,
    /\.eslintrc/i,
    /biome\.json$/i
  ];

  const docPatterns = [
    /^readme(\.md|\.markdown|\.txt)?$/i,
    /^architecture(\.md)?$/i,
    /^contributing(\.md)?$/i
  ];

  const entryPatterns = [
    /^(index|main|server|app)\.(ts|js|py|rs|go|jsx|tsx)$/i,
    /^src\/(index|main|server|app|App)\.(ts|js|py|rs|go|jsx|tsx)$/i,
    /^app\/(page|layout|route)\.(ts|js|jsx|tsx)$/i,
    /^cmd\/.*\/main\.go$/i
  ];

  const selectedFiles = new Set();

  for (const path of filePaths) {
    // Check manifests
    if (manifestPatterns.some(pat => pat.test(path))) {
      selectedFiles.add(path);
    }
    // Check docs
    if (docPatterns.some(pat => pat.test(path))) {
      selectedFiles.add(path);
    }
    // Check entry points
    if (entryPatterns.some(pat => pat.test(path))) {
      selectedFiles.add(path);
    }
  }

  // Also include source files from key directories
  const sourceDirs = ['src/', 'app/', 'lib/', 'server/', 'api/', 'routes/', 'controllers/', 'services/', 'models/', 'components/'];
  for (const path of filePaths) {
    if (selectedFiles.size >= 55) break;
    if (sourceDirs.some(dir => path.startsWith(dir) || path.includes('/' + dir))) {
      if (/\.(ts|js|py|rs|go|jsx|tsx|vue|svelte)$/i.test(path)) {
        selectedFiles.add(path);
      }
    }
  }

  // Include test files for coverage scanning
  for (const path of filePaths) {
    if (selectedFiles.size >= 60) break;
    if (/\.(test|spec)\.(ts|tsx|js|jsx)$/i.test(path) || /__tests__/i.test(path)) {
      selectedFiles.add(path);
    }
  }

  // 4. Fetch Contents of Selected Files in Parallel
  const fileContents = [];
  const filesToFetch = Array.from(selectedFiles).slice(0, 60); // Increased cap for deeper scanning

  await Promise.all(
    filesToFetch.map(async (filePath) => {
      try {
        const rawRes = await axios.get(
          `https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/${filePath}`,
          { timeout: 10000, responseType: 'text' }
        );
        let text = typeof rawRes.data === 'string' ? rawRes.data : JSON.stringify(rawRes.data);
        // Truncate overly long single files at last complete line
        if (text.length > 25000) {
          const lastNewline = text.lastIndexOf('\n', 25000);
          text = text.substring(0, lastNewline > 0 ? lastNewline : 25000) + '\n/* ... [Truncated by RepoLens] ... */';
        }
        fileContents.push({ path: filePath, content: text });
      } catch (err) {
        // Soft fail on single file fetch
        console.warn(`Could not fetch file ${filePath}: ${err.message}`);
      }
    })
  );

  // 5. Structure into Master Prompt Context
  const formattedSnapshot = buildPromptContext({
    repoData,
    defaultBranch,
    totalFiles: filePaths.length,
    filePaths,
    fileContents
  });

  return {
    metadata: {
      name: repoData.full_name,
      owner: repoData.owner?.login || owner,
      ownerAvatar: repoData.owner?.avatar_url || `https://github.com/${owner}.png`,
      ownerUrl: repoData.owner?.html_url || `https://github.com/${owner}`,
      description: repoData.description,
      stars: repoData.stargazers_count || 0,
      forks: repoData.forks_count || 0,
      openIssues: repoData.open_issues_count || 0,
      language: repoData.language,
      topics: repoData.topics || [],
      defaultBranch,
      totalFiles: filePaths.length,
      sampledFilesCount: fileContents.length,
      htmlUrl: repoData.html_url || `https://github.com/${owner}/${repo}`,
      createdAt: repoData.created_at,
      updatedAt: repoData.updated_at
    },
    formattedSnapshot,
    fileContents,
    filePaths
  };
}

/**
 * Builds the structured 4-part input payload matching gitvision_master_prompt.md
 */
function buildPromptContext({ repoData, defaultBranch, totalFiles, filePaths, fileContents }) {
  let context = '';

  // 1. METADATA & METRICS
  context += `=== SECTION 1: METADATA & METRICS ===\n`;
  context += `Repository: ${repoData.full_name}\n`;
  context += `Description: ${repoData.description || 'No description provided.'}\n`;
  context += `Stars: ${repoData.stargazers_count} | Forks: ${repoData.forks_count} | Open Issues: ${repoData.open_issues_count}\n`;
  context += `Primary Language: ${repoData.language || 'Unknown'}\n`;
  context += `Default Branch: ${defaultBranch}\n`;
  context += `Total Files in Tree: ${totalFiles}\n`;
  context += `Created: ${repoData.created_at} | Last Updated: ${repoData.updated_at}\n\n`;

  // 2. FILE TREE
  context += `=== SECTION 2: FILE TREE ===\n`;
  const treePreview = filePaths.slice(0, 150).join('\n');
  context += treePreview + (filePaths.length > 150 ? `\n... (+ ${filePaths.length - 150} more files)` : '') + '\n\n';

  // 3. MANIFESTS & CONFIGS
  context += `=== SECTION 3: MANIFESTS & CONFIGS ===\n`;
  const manifestFiles = fileContents.filter(f => 
    /package\.json|Cargo\.toml|pyproject\.toml|requirements\.txt|go\.mod|Dockerfile|docker-compose/i.test(f.path)
  );
  if (manifestFiles.length === 0) {
    context += `No standard package manifest files detected.\n\n`;
  } else {
    for (const f of manifestFiles) {
      context += `--- CONFIG FILE: ${f.path} ---\n${f.content}\n\n`;
    }
  }

  // 4. SOURCE CODE
  context += `=== SECTION 4: SOURCE CODE ===\n`;
  const sourceFiles = fileContents.filter(f => 
    !/package\.json|Cargo\.toml|pyproject\.toml|requirements\.txt|go\.mod|Dockerfile|docker-compose/i.test(f.path)
  );
  for (const f of sourceFiles) {
    context += `--- FILE: ${f.path} ---\n${f.content}\n\n`;
  }

  return context;
}
