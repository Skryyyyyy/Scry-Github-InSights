/**
 * Pre-analyzed high-fidelity sample datasets adhering strictly to the Scry schema.
 * Used for instant demo loads, benchmarks, and fallback testing.
 */

export const mockRepositories = {
  'nextjs-commerce': {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "project_overview": {
      "name": "Next.js High-Performance Commerce",
      "tagline": "Next-generation headless e-commerce storefront powered by Next.js App Router and Stripe",
      "elevator_pitch": "An enterprise-grade headless commerce platform featuring dynamic edge rendering, optimistic cart mutations, streaming SSR, and server action payment fulfillment.",
      "vitality_score": {
        "overall_score": 93,
        "breakdown": {
          "documentation": 95,
          "maintainability": 92,
          "architecture_clarity": 94,
          "security_posture": 91
        },
        "verdict": "Production-Ready Enterprise Architecture"
      },
      "tech_stack": {
        "primary_language": "TypeScript",
        "languages": ["TypeScript", "CSS", "SQL"],
        "frameworks": ["Next.js 14 (App Router)", "React 18", "Tailwind CSS"],
        "databases": ["PostgreSQL (Supabase)", "Prisma ORM"],
        "caching_and_queues": ["Upstash Redis", "Vercel Data Cache"],
        "devops_and_cloud": ["Vercel Edge Network", "Docker", "GitHub Actions CI/CD"],
        "third_party_services": ["Stripe Checkout", "Algolia Search", "Resend Email"]
      }
    },
    "architecture": {
      "pattern": "Modular Feature-Driven Headless Storefront (App Router Architecture)",
      "overview": "Employs Next.js 14 React Server Components (RSC) with Suspense boundaries for zero-bundle rendering, backed by Server Actions for atomic checkout and cart mutations with edge caching.",
      "logic_flow_mermaid": "graph TD\n    Client([User Browser]) -->|HTTP / React Server Components| Edge[Vercel Edge Gateway]\n    Edge -->|Cache Hit| DataCache[(Vercel Data Cache)]\n    Edge -->|SSR / Hydration| AppRouter[Next.js 14 App Router]\n    AppRouter -->|Server Action: AddToCart| CartAction[app/actions/cart.ts]\n    AppRouter -->|Query Products| PrismaClient[Prisma ORM Layer]\n    CartAction -->|Atomic Hash Set| Redis[(Upstash Redis Cache)]\n    PrismaClient -->|Connection Pool| Postgres[(Supabase Postgres DB)]\n    CartAction -->|Webhook Checkout| Stripe[Stripe Payment API]",
      "entry_points": [
        {
          "file": "app/layout.tsx",
          "purpose": "Root layout rendering global providers, telemetry headers, and navigation state.",
          "type": "frontend"
        },
        {
          "file": "app/api/webhooks/stripe/route.ts",
          "purpose": "Webhook listener validating HMAC cryptographic signatures and completing orders.",
          "type": "backend"
        },
        {
          "file": "middleware.ts",
          "purpose": "Edge session resolver, geolocation router, and bot protection layer.",
          "type": "config"
        }
      ],
      "modules": [
        {
          "name": "Cart & Checkout Engine",
          "path": "components/cart/",
          "responsibility": "Handles optimistic state transitions, local storage sync, and server-side cart hydration.",
          "dependencies": ["@tanstack/react-query", "zustand", "stripe"]
        },
        {
          "name": "Product Catalog & Filtering",
          "path": "app/products/",
          "responsibility": "Faceted search, category hierarchy traversal, and dynamic image optimization.",
          "dependencies": ["algoliasearch", "next/image"]
        },
        {
          "name": "Database & ORM Gateway",
          "path": "lib/prisma.ts",
          "responsibility": "Singleton database client handling connection pooling and query metrics.",
          "dependencies": ["@prisma/client"]
        }
      ]
    },
    "deep_dive_analysis": {
      "core_functions": [
        {
          "symbol": "createCheckoutSession(cartId, customerId)",
          "file": "app/actions/checkout.ts",
          "logic_summary": "Verifies stock availability inside an isolated transaction, generates idempotent line items, and constructs Stripe session.",
          "complexity": "medium",
          "use_case": "Initiating secure off-site payment flow for customers"
        },
        {
          "symbol": "revalidateProductTags(slug)",
          "file": "app/api/revalidate/route.ts",
          "logic_summary": "Invokes Next.js on-demand ISR cache invalidation across edge nodes based on CMS webhook events.",
          "complexity": "low",
          "use_case": "Instant catalog updates without cold rebuilds"
        },
        {
          "symbol": "applyOptimisticDiscount(couponCode)",
          "file": "hooks/useCartOptimism.ts",
          "logic_summary": "Calculates tiered tax rules and promo deductions client-side while dispatching async verification action.",
          "complexity": "high",
          "use_case": "Instant UX feedback during promotional events"
        }
      ],
      "api_surface": [
        {
          "method": "POST",
          "endpoint": "/api/webhooks/stripe",
          "file": "app/api/webhooks/stripe/route.ts",
          "description": "Validates Stripe webhook signature and triggers order fulfillment pipeline",
          "auth_required": true
        },
        {
          "method": "GET",
          "endpoint": "/api/products/search",
          "file": "app/api/products/search/route.ts",
          "description": "Full-text search endpoint with fuzzy matching and category facets",
          "auth_required": false
        },
        {
          "method": "POST",
          "endpoint": "/api/cart/sync",
          "file": "app/api/cart/sync/route.ts",
          "description": "Merges guest session cart with authenticated user cart",
          "auth_required": true
        }
      ],
      "database_schema_summary": {
        "orm_or_tool": "Prisma ORM (PostgreSQL)",
        "models": [
          {
            "name": "Product",
            "fields_key": ["id", "slug", "title", "priceInCents", "inventoryCount", "metadata"],
            "relationships": ["hasMany Variants", "belongsTo Category", "hasMany Review"]
          },
          {
            "name": "Order",
            "fields_key": ["id", "stripeSessionId", "userId", "status", "totalAmount", "createdAt"],
            "relationships": ["belongsTo User", "hasMany OrderItem"]
          },
          {
            "name": "Cart",
            "fields_key": ["id", "token", "expiresAt", "itemsJson"],
            "relationships": ["belongsTo User (optional)"]
          }
        ]
      }
    },
    "ui_ux_audit": {
      "has_frontend": true,
      "design_system": "Tailwind CSS + Radix UI Primitives",
      "state_management": "Zustand (Cart state) + React Server Components Context",
      "heuristics": {
        "accessibility_rating": "Good",
        "responsiveness": "Good",
        "design_consistency": "High"
      },
      "key_views_and_components": [
        {
          "name": "ProductDetailView",
          "path": "app/products/[slug]/page.tsx",
          "type": "Page",
          "description": "High-conversion product page featuring variant selectors, 3D model viewer, and instant buy CTA."
        },
        {
          "name": "CartDrawer",
          "path": "components/cart/CartDrawer.tsx",
          "type": "UI Component",
          "description": "Slide-over drawer with smooth spring physics, shipping progress bar, and cross-sell recommendations."
        },
        {
          "name": "GlobalNavbar",
          "path": "components/layout/Navbar.tsx",
          "type": "Layout",
          "description": "Sticky glassmorphic navbar with mega-menu category preview and live search preview dropdown."
        }
      ]
    },
    "risk_and_security_audit": {
      "security_warnings": [
        {
          "severity": "MEDIUM",
          "issue": "Webhook Secret Raw Buffer Handling",
          "location": "app/api/webhooks/stripe/route.ts#L18",
          "remediation": "Ensure req.text() is used instead of req.json() to prevent JSON serialization mutations that invalidate HMAC verification."
        },
        {
          "severity": "LOW",
          "issue": "Missing Rate Limiter on Search Route",
          "location": "app/api/products/search/route.ts",
          "remediation": "Add Upstash Ratelimit middleware to prevent potential DDoS scraping on faceted search."
        }
      ],
      "code_smells_and_technical_debt": [
        {
          "category": "Performance",
          "description": "Unmemoized array filtering inside ProductGrid component causes unnecessary re-renders on filter clicks.",
          "impact": "Slight input latency on lower-end mobile devices with >500 items."
        },
        {
          "category": "Maintainability",
          "description": "Duplicate currency formatting logic found across 4 distinct helper modules.",
          "impact": "Violates DRY principle; should centralize under lib/currency.ts."
        }
      ]
    },
    "onboarding_and_usage": {
      "prerequisites": [
        "Node.js 18.17+ or 20+",
        "pnpm (preferred) or npm",
        "Docker (for local Supabase/PostgreSQL instance)"
      ],
      "ai_quickstart_steps": [
        {
          "step": 1,
          "command": "git clone https://github.com/example/nextjs-commerce.git && cd nextjs-commerce",
          "explanation": "Clone the repository and enter the project root directory."
        },
        {
          "step": 2,
          "command": "cp .env.example .env.local",
          "explanation": "Create local environment file with development credentials."
        },
        {
          "step": 3,
          "command": "pnpm install && pnpm prisma db push && pnpm prisma db seed",
          "explanation": "Install all dependencies, push Prisma schema to local DB, and populate mock products."
        },
        {
          "step": 4,
          "command": "pnpm dev",
          "explanation": "Start the Next.js development server on http://localhost:3000."
        }
      ],
      "environment_variables": [
        {
          "key": "DATABASE_URL",
          "required": true,
          "purpose": "PostgreSQL connection string with connection pool parameters"
        },
        {
          "key": "STRIPE_SECRET_KEY",
          "required": true,
          "purpose": "Stripe API secret key for payment session creation"
        },
        {
          "key": "STRIPE_WEBHOOK_SECRET",
          "required": true,
          "purpose": "HMAC secret used to verify webhook integrity"
        },
        {
          "key": "UPSTASH_REDIS_REST_URL",
          "required": false,
          "purpose": "Serverless Redis URL for edge cart synchronization"
        }
      ]
    }
  },

  'fastapi-microservice': {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "project_overview": {
      "name": "FastAPI Distributed Event Core",
      "tagline": "Asynchronous event-driven microservice architecture with Celery task queues and Redis streams",
      "elevator_pitch": "A high-throughput Python backend service engineered for async task dispatch, WebSocket real-time analytics streaming, and transactional PostgreSQL persistence.",
      "vitality_score": {
        "overall_score": 89,
        "breakdown": {
          "documentation": 88,
          "maintainability": 90,
          "architecture_clarity": 92,
          "security_posture": 86
        },
        "verdict": "Production-Grade Distributed Backend"
      },
      "tech_stack": {
        "primary_language": "Python",
        "languages": ["Python", "SQL", "Dockerfile"],
        "frameworks": ["FastAPI", "Pydantic v2", "SQLAlchemy 2.0 (Async)"],
        "databases": ["PostgreSQL 16", "Alembic Migrations"],
        "caching_and_queues": ["Redis 7 (Streams)", "Celery Task Broker"],
        "devops_and_cloud": ["Docker Compose", "Kubernetes Helm", "Prometheus & Grafana"],
        "third_party_services": ["Sentry Error Tracking", "JWT Auth (OAuth2)"]
      }
    },
    "architecture": {
      "pattern": "Clean Layered Hexagonal / Event-Driven Microservice",
      "overview": "Separates Domain Entities, Repositories, Use Cases, and API Routers into decoupled layers, utilizing AsyncIO event loops for non-blocking I/O operations and Celery workers for background workloads.",
      "logic_flow_mermaid": "graph TD\n    Client([API Consumer / Webhook]) -->|OAuth2 Bearer Token| Traefik[Traefik Ingress Controller]\n    Traefik -->|Async Request| FastAPIRouter[FastAPI App Instance]\n    FastAPIRouter -->|Dependency Injection| AuthService[Auth & Security Guard]\n    FastAPIRouter -->|Dispatch Command| TaskDispatcher[Celery Task Dispatcher]\n    FastAPIRouter -->|Async Session| AsyncSQLAlchemy[SQLAlchemy Async Engine]\n    AsyncSQLAlchemy -->|Pool| Postgres[(PostgreSQL 16 Cluster)]\n    TaskDispatcher -->|Enqueue Message| RedisBroker[(Redis Message Broker)]\n    RedisBroker -->|Consume| CeleryWorker[Celery Worker Cluster]\n    CeleryWorker -->|Emit Event| RedisStreams[(Redis PubSub / Streams)]\n    RedisStreams -->|Broadcast| WSHandler[WebSocket Stream Manager]\n    WSHandler -->|Real-time Frame| Client",
      "entry_points": [
        {
          "file": "app/main.py",
          "purpose": "FastAPI application initialization, CORS middleware, exception handlers, and lifespan manager.",
          "type": "backend"
        },
        {
          "file": "app/worker.py",
          "purpose": "Celery worker daemon entry point for background processing jobs.",
          "type": "background_worker"
        },
        {
          "file": "Dockerfile",
          "purpose": "Multi-stage production container build with non-root security context.",
          "type": "config"
        }
      ],
      "modules": [
        {
          "name": "Authentication & RBAC",
          "path": "app/core/security.py",
          "responsibility": "JWT signing, password hashing with Argon2, and role-based permissions matrix.",
          "dependencies": ["pyjwt", "passlib[argon2]"]
        },
        {
          "name": "Async Persistence Layer",
          "path": "app/db/repositories/",
          "responsibility": "Generic async repository patterns for CRUD operations with query optimization.",
          "dependencies": ["sqlalchemy", "asyncpg"]
        },
        {
          "name": "Realtime Telemetry Stream",
          "path": "app/api/v1/endpoints/stream.py",
          "responsibility": "Manages persistent WebSocket connections and broadcasts system telemetry.",
          "dependencies": ["fastapi", "redis.asyncio"]
        }
      ]
    },
    "deep_dive_analysis": {
      "core_functions": [
        {
          "symbol": "dispatch_batch_job(payload: BatchJobSchema)",
          "file": "app/services/job_service.py",
          "logic_summary": "Validates payload schema, assigns cryptographic UUID, writes idempotency record, and enqueues to Redis queue.",
          "complexity": "medium",
          "use_case": "Asynchronous data pipeline processing"
        },
        {
          "symbol": "get_current_active_user(token: str = Depends(oauth2_scheme))",
          "file": "app/api/deps.py",
          "logic_summary": "Decodes JWT claims, validates token expiration and revocation list, queries user cache.",
          "complexity": "low",
          "use_case": "Route guard dependency injection across all protected endpoints"
        }
      ],
      "api_surface": [
        {
          "method": "POST",
          "endpoint": "/api/v1/auth/token",
          "file": "app/api/v1/endpoints/auth.py",
          "description": "OAuth2 password flow token generation with refresh token rotation",
          "auth_required": false
        },
        {
          "method": "GET",
          "endpoint": "/api/v1/metrics/summary",
          "file": "app/api/v1/endpoints/metrics.py",
          "description": "Aggregated telemetry metrics with Redis cache layer",
          "auth_required": true
        },
        {
          "method": "WS",
          "endpoint": "/api/v1/ws/live-events",
          "file": "app/api/v1/endpoints/stream.py",
          "description": "WebSocket endpoint broadcasting real-time event pipeline logs",
          "auth_required": true
        }
      ],
      "database_schema_summary": {
        "orm_or_tool": "SQLAlchemy 2.0 Async (PostgreSQL)",
        "models": [
          {
            "name": "User",
            "fields_key": ["id", "email", "hashed_password", "role", "is_active", "created_at"],
            "relationships": ["hasMany JobRun", "hasMany ApiKey"]
          },
          {
            "name": "JobRun",
            "fields_key": ["id", "user_id", "status", "execution_time_ms", "result_json", "created_at"],
            "relationships": ["belongsTo User"]
          }
        ]
      }
    },
    "ui_ux_audit": {
      "has_frontend": false,
      "design_system": "FastAPI Auto-Generated Swagger UI & ReDoc",
      "state_management": "None (Backend Service)",
      "heuristics": {
        "accessibility_rating": "N/A",
        "responsiveness": "N/A",
        "design_consistency": "High"
      },
      "key_views_and_components": [
        {
          "name": "Swagger Interactive Docs",
          "path": "/docs",
          "type": "Page",
          "description": "OpenAPI 3.1 interactive test client with OAuth2 token inject."
        },
        {
          "name": "Prometheus Metrics Endpoint",
          "path": "/metrics",
          "type": "Container",
          "description": "Raw Prometheus time-series metrics exporter."
        }
      ]
    },
    "risk_and_security_audit": {
      "security_warnings": [
        {
          "severity": "HIGH",
          "issue": "JWT Secret Key Missing Rotation Strategy",
          "location": "app/core/config.py#L42",
          "remediation": "Implement JWKS (JSON Web Key Set) or asymmetric RS256 key pair to decouple signing from verification."
        }
      ],
      "code_smells_and_technical_debt": [
        {
          "category": "Testing",
          "description": "E2E integration test suite lacks mocked Redis connection, causing test runs to rely on external network sockets.",
          "impact": "Test flakiness in CI pipelines when Docker daemon is busy."
        }
      ]
    },
    "onboarding_and_usage": {
      "prerequisites": [
        "Python 3.11+",
        "Poetry or pipenv",
        "Docker & Docker Compose"
      ],
      "ai_quickstart_steps": [
        {
          "step": 1,
          "command": "git clone https://github.com/example/fastapi-event-core.git && cd fastapi-event-core",
          "explanation": "Clone repository and enter root."
        },
        {
          "step": 2,
          "command": "docker compose up -d postgres redis",
          "explanation": "Start background dependencies (PostgreSQL 16 and Redis 7)."
        },
        {
          "step": 3,
          "command": "poetry install && poetry run alembic upgrade head",
          "explanation": "Install virtual environment dependencies and execute database migrations."
        },
        {
          "step": 4,
          "command": "poetry run uvicorn app.main:app --reload --port 8000",
          "explanation": "Start Uvicorn ASGI server with live hot-reload."
        }
      ],
      "environment_variables": [
        {
          "key": "DATABASE_ASYNC_URL",
          "required": true,
          "purpose": "AsyncPG connection string postgresql+asyncpg://..."
        },
        {
          "key": "REDIS_URL",
          "required": true,
          "purpose": "Redis connection URI for broker and pubsub"
        },
        {
          "key": "SECRET_KEY",
          "required": true,
          "purpose": "256-bit cryptographic secret for token signature"
        }
      ]
    }
  },

  'rust-hyper-cli': {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "project_overview": {
      "name": "HyperSync Rust CLI Engine",
      "tagline": "Ultra-fast multi-threaded binary synchronizer and diff analyzer built with Rust and Tokio",
      "elevator_pitch": "A zero-cost abstraction command-line utility for bidirectional directory synchronization, content-addressable chunk hashing, and real-time delta compression.",
      "vitality_score": {
        "overall_score": 96,
        "breakdown": {
          "documentation": 94,
          "maintainability": 98,
          "architecture_clarity": 97,
          "security_posture": 96
        },
        "verdict": "Exceptional Memory-Safe Systems Software"
      },
      "tech_stack": {
        "primary_language": "Rust",
        "languages": ["Rust", "Shell"],
        "frameworks": ["Tokio Async Runtime", "Clap v4", "Rayon Parallelism"],
        "databases": ["SQLite (Embedded sled / rusqlite)"],
        "caching_and_queues": ["In-Memory LRU Cache", "Crossbeam MPMC Channels"],
        "devops_and_cloud": ["GitHub Actions Cross-Compilation", "Cargo Release"],
        "third_party_services": ["crates.io", "AWS S3 SDK for Rust"]
      }
    },
    "architecture": {
      "pattern": "Actor-Based Pipeline with Work-Stealing Parallelism",
      "overview": "Leverages Rayon work-stealing threads for CPU-bound BLAKE3 hash calculation combined with Tokio async I/O actors for zero-copy file descriptor streaming.",
      "logic_flow_mermaid": "graph LR\n    CLI[CLI Args: clap] --> ConfigParser[Config & Filter Engine]\n    ConfigParser --> Walker[Fast Directory Walker: jwalk]\n    Walker -->|File Batches| Channel[Crossbeam MPMC Channel]\n    Channel --> HashWorker1[Rayon BLAKE3 Worker 1]\n    Channel --> HashWorker2[Rayon BLAKE3 Worker 2]\n    HashWorker1 --> StateDB[(Local Sled State Index)]\n    HashWorker2 --> StateDB\n    StateDB --> DiffCalc[Delta Graph Resolver]\n    DiffCalc --> AsyncTransfer[Tokio Async Transfer Pool]\n    AsyncTransfer -->|Zero-Copy Stream| Target[Remote / Local Target]",
      "entry_points": [
        {
          "file": "src/main.rs",
          "purpose": "Binary entry point, CLI arguments parsing, signal handling, and runtime execution.",
          "type": "cli"
        },
        {
          "file": "src/lib.rs",
          "purpose": "Public library crate exports for programmatic integration.",
          "type": "backend"
        }
      ],
      "modules": [
        {
          "name": "Hasher & Content Addressing",
          "path": "src/hasher.rs",
          "responsibility": "SIMD-accelerated BLAKE3 chunk hashing and rolling checksum calculation.",
          "dependencies": ["blake3", "rayon"]
        },
        {
          "name": "State Snapshot Store",
          "path": "src/state.rs",
          "responsibility": "ACID transactional indexing of local file states using embedded key-value store.",
          "dependencies": ["sled", "serde_json"]
        }
      ]
    },
    "deep_dive_analysis": {
      "core_functions": [
        {
          "symbol": "compute_chunk_diff(src_tree: &Snapshot, dst_tree: &Snapshot)",
          "file": "src/diff.rs",
          "logic_summary": "Executes dual-pointer graph comparison on content hashes to generate minimal delta patch sets.",
          "complexity": "high",
          "use_case": "Determining exact binary delta needed for synchronization"
        }
      ],
      "api_surface": [],
      "database_schema_summary": {
        "orm_or_tool": "Sled Embedded KV Store",
        "models": [
          {
            "name": "FileMetaRecord",
            "fields_key": ["path_hash: u64", "blake3_digest: [u8; 32]", "size: u64", "mtime: i64"],
            "relationships": ["references ChunkIndex"]
          }
        ]
      }
    },
    "ui_ux_audit": {
      "has_frontend": false,
      "design_system": "Indicatif Interactive Terminal Spinners & Colorful Ratatui TUI",
      "state_management": "None (Rust Ownership & MPSC Channels)",
      "heuristics": {
        "accessibility_rating": "N/A",
        "responsiveness": "Good",
        "design_consistency": "High"
      },
      "key_views_and_components": [
        {
          "name": "Interactive Progress Dashboard",
          "path": "src/tui.rs",
          "type": "UI Component",
          "description": "Multi-bar terminal progress reporting transfer speed, ETA, and compression ratio."
        }
      ]
    },
    "risk_and_security_audit": {
      "security_warnings": [],
      "code_smells_and_technical_debt": [
        {
          "category": "Maintainability",
          "description": "Custom error enum in src/error.rs contains redundant variant conversions; can be streamlined with thiserror.",
          "impact": "Minor boilerplate code."
        }
      ]
    },
    "onboarding_and_usage": {
      "prerequisites": [
        "Rust toolchain 1.75+ (cargo, rustc)",
        "GCC / Clang linker"
      ],
      "ai_quickstart_steps": [
        {
          "step": 1,
          "command": "cargo install --path .",
          "explanation": "Compile with release optimizations and install binary to cargo bin path."
        },
        {
          "step": 2,
          "command": "hypersync sync ./source-dir ./target-dir --threads 8",
          "explanation": "Execute multithreaded sync with 8 concurrent worker threads."
        }
      ],
      "environment_variables": [
        {
          "key": "RUST_LOG",
          "required": false,
          "purpose": "Log level filter (e.g. hypersync=debug,tokio=warn)"
        }
      ]
    }
  }
};
