# 🔍 RepoLens (Scry-Github-Insights)

> **Deep Repository Intelligence Engine & Grounded Architectural Auditor**

RepoLens is a high-precision, evidence-first repository intelligence engine and developer auditor. Unlike standard LLM tools that invent plausible-sounding filler, RepoLens uses a **deterministic static scanning pipeline** to extract ground-truth evidence directly from codebases — with exact `file:line` citations, real route mappings, ORM schema models, security risk rules, and score metrics.

![RepoLens Minimal Black Interface](https://raw.githubusercontent.com/Skryyyyyy/Scry-Github-InSights/main/client/public/preview.png)

---

## 🌟 Why RepoLens?

Standard AI repository tools often suffer from **hallucination**: when presented with a repository URL, an LLM might guess endpoints or database models that don't exist. 

**RepoLens solves this through an Evidence-First Architecture:**
1. **Deterministic Static Analysis**: First, a pure static scanner inspects manifests, file trees, routes, function symbols, database models, security risks, and UI patterns.
2. **Evidence Bundle**: Every finding is packaged into a structured evidence object with `file:line` references and exact code snippets.
3. **Grounded AI Synthesis**: An LLM (Gemini 2.0 / 1.5 Flash) narrate and explain the extracted facts. The prompt strictly forbids inventing data not present in the evidence.
4. **Fallback Resilience**: If an LLM is offline or unconfigured, RepoLens assembles a complete report directly from the evidence bundle with zero downtime.

---

## ✨ Features

- 🏛️ **Live Mermaid.js Call Graphs**: Interactive pan, zoom, reset, SVG export, and code copy for logic diagrams built from real detected routes and entry points.
- 📊 **Evidence-Backed Health Gauge**: Animated 0–100 radial vitality dial with evidence counts (e.g. `✓ README · ✓ npm scripts`, `1 CRIT · 2 HIGH`) backing Documentation, Maintainability, Architecture, and Security.
- 🔬 **Deep Dive & API Surface Catalog**: Core function complexity analysis (`file:line`, parameters, LoC), REST/WS route directory with auth status, and database schema mappings (Prisma, Mongoose, Drizzle, SQLAlchemy).
- 🛡️ **Risk & Security Auditor**: Scans for hardcoded secrets, `eval()`, innerHTML XSS, SQL string concatenation, wildcard CORS, missing Helmet headers, and open redirects — complete with `file:line` locations and code snippets.
- 🎨 **UI/UX Heuristic Matrix**: Automated audit of accessibility (`alt` tags, `aria-label`), fluid responsiveness, missing loading states, and state management telemetry.
- 🚀 **AI Quickstart & Setup**: Copyable execution steps extracted from real `package.json` / build scripts with one-click `.env.example` generator.
- 📦 **Export Engine**: Export full JSON schema, copy markdown reports, or download `.env.example` files.
- 🖤 **Pitch-Black Minimal Aesthetics**: Pure `#000000` dark theme with sharp neutral borders and zero clutter.

---

## 🛠️ Tech Stack

- **Frontend**: HTML5, Vanilla JavaScript (ES modules), CSS3 (Custom CSS variables), Vite, Mermaid.js
- **Backend**: Node.js, Express.js, Axios, Google Generative AI SDK (`@google/generative-ai`)
- **Static Analysis Engine**: Built-in Regex AST & Manifest Ingestion Scanner (`staticScanner.js`)

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** (or `pnpm` / `yarn`)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Skryyyyyy/Scry-Github-InSights.git
   cd Scry-Github-InSights
   ```

2. **Install all dependencies**:
   ```bash
   npm run install:all
   ```

3. **Configure Environment Variables** (Optional):
   Create a `.env` file in the root directory:
   ```env
   PORT=3001
   GEMINI_API_KEY=your_google_gemini_api_key
   GITHUB_TOKEN=your_github_personal_access_token
   ```

4. **Run the Development Server**:
   ```bash
   npm run dev
   ```

   - **Client**: `http://localhost:5173` (or `5174`)
   - **Backend**: `http://localhost:3001`

---

## 📡 API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/analyze` | `POST` | Analyzes a GitHub repository URL or raw snapshot using the Evidence-First pipeline |
| `/api/demo` | `GET` | Lists pre-analyzed benchmark datasets |
| `/api/demo/:id` | `GET` | Fetches a specific benchmark dataset (`nextjs-commerce`, `fastapi-microservice`, `rust-hyper-cli`) |
| `/api/export/markdown` | `POST` | Converts audit JSON into a formatted Markdown report |
| `/api/health` | `GET` | Server health status and AI provider information |

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
