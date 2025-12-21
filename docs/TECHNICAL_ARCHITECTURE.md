# La Gazette de la Vie - Technical Architecture

> System architecture, technology stack, and deployment strategy

---

## 1. System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                            │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                    React + TypeScript + Vite                  │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐  │  │
│  │  │   Router    │ │   State     │ │    UI Components        │  │  │
│  │  │  (Tanstack) │ │  (Zustand)  │ │   (shadcn/ui)           │  │  │
│  │  └─────────────┘ └─────────────┘ └─────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ HTTP/REST
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         SERVER (VPS)                                │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                        Bun + Hono                             │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐  │  │
│  │  │   Auth      │ │   Project   │ │    Generation           │  │  │
│  │  │  Middleware │ │   CRUD      │ │    Queue                │  │  │
│  │  └─────────────┘ └─────────────┘ └─────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                  │                                  │
│         ┌────────────────────────┼────────────────────────┐         │
│         ▼                        ▼                        ▼         │
│  ┌─────────────┐         ┌─────────────┐         ┌─────────────┐   │
│  │   SQLite    │         │ File System │         │  External   │   │
│  │  (Metadata) │         │  (Assets)   │         │    APIs     │   │
│  └─────────────┘         └─────────────┘         └─────────────┘   │
│                                                         │           │
└─────────────────────────────────────────────────────────│───────────┘
                                                          │
                           ┌──────────────────────────────┘
                           ▼
              ┌─────────────────────────┐
              │      WAN 2.x API        │
              │   (Image-to-Video)      │
              └─────────────────────────┘
              ┌─────────────────────────┐
              │ Gemini 3 Flash Preview  │
              │  (Animation Suggest)    │
              └─────────────────────────┘
```

---

## 2. Technology Stack

### 2.1 Frontend

| Layer         | Technology      | Version | Justification                                   |
| ------------- | --------------- | ------- | ----------------------------------------------- |
| Framework     | React           | 18.x    | Mature ecosystem, component model               |
| Language      | TypeScript      | 5.x     | Type safety, better DX                          |
| Build         | Vite            | 5.x     | Fast HMR, modern bundling                       |
| Routing       | TanStack Router | 1.x     | Type-safe routing                               |
| State         | Zustand         | 4.x     | Simple, performant, TypeScript-friendly         |
| UI Components | shadcn/ui       | latest  | Accessible, customizable, copy-paste components |
| Drag/Drop     | dnd-kit         | 6.x     | Accessible, performant drag-and-drop            |
| Styling       | Tailwind CSS    | 3.x     | Utility-first, shadcn/ui foundation             |
| Validation    | Zod             | 3.x     | Runtime type checking, schema validation        |
| HTTP Client   | ky              | 1.x     | Lightweight, typed fetch wrapper                |
| Icons         | Lucide React    | latest  | Consistent icons, shadcn/ui default             |

### 2.2 Backend

| Layer         | Technology       | Version  | Justification                                         |
| ------------- | ---------------- | -------- | ----------------------------------------------------- |
| Runtime       | Bun              | 1.x      | Fast runtime, native TypeScript, built-in test runner |
| Framework     | Hono             | 4.x      | Lightweight, fast, TypeScript-first                   |
| Database      | SQLite           | 3.x      | Simple, file-based, no setup                          |
| DB Driver     | bun:sqlite       | built-in | Native Bun SQLite driver, zero dependencies           |
| ORM           | Drizzle          | 0.29+    | Type-safe, lightweight                                |
| File Storage  | Local filesystem | -        | Simple for VPS deployment                             |
| Queue         | BullMQ           | 5.x      | Reliable job processing                               |
| Queue Backend | Redis            | 7.x      | Required for BullMQ                                   |
| Validation    | Zod              | 3.x      | Shared schemas with frontend                          |
| Auth          | jose             | 5.x      | JWT handling                                          |
| Password      | Bun.password     | built-in | Native Bun password hashing (Argon2id)                |

### 2.3 Package Management

| Tool           | Usage                                          |
| -------------- | ---------------------------------------------- |
| Bun            | Package manager, runtime, bundler, test runner |
| Bun Workspaces | Monorepo management                            |

### 2.4 External Services

| Service        | Provider                        | Purpose                           |
| -------------- | ------------------------------- | --------------------------------- |
| Image-to-Video | WAN 2.x API (Alibaba)           | Core video generation (~5s clips) |
| Image Analysis | Gemini 3 Flash Preview (Google) | Animation suggestions             |

---

## 3. Directory Structure

```
gazette/
├── apps/
│   ├── web/                          # Frontend React app
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── editor/           # Gazette editor components
│   │   │   │   │   ├── Canvas.tsx
│   │   │   │   │   ├── ImageFrame.tsx
│   │   │   │   │   ├── TextElement.tsx
│   │   │   │   │   ├── Toolbar.tsx
│   │   │   │   │   └── PageSidebar.tsx
│   │   │   │   ├── layout/           # Page layout/template components
│   │   │   │   │   ├── ClassicFrontPage.tsx
│   │   │   │   │   ├── TwoColumn.tsx
│   │   │   │   │   ├── GridGallery.tsx
│   │   │   │   │   └── MagazineSpread.tsx
│   │   │   │   ├── modals/           # Modal dialogs
│   │   │   │   │   ├── UploadModal.tsx
│   │   │   │   │   ├── SuggestionModal.tsx
│   │   │   │   │   ├── TemplateModal.tsx
│   │   │   │   │   └── GenerationProgress.tsx
│   │   │   │   ├── ui/               # shadcn/ui components (auto-generated)
│   │   │   │   │   ├── button.tsx
│   │   │   │   │   ├── input.tsx
│   │   │   │   │   ├── dialog.tsx
│   │   │   │   │   ├── dropdown-menu.tsx
│   │   │   │   │   ├── progress.tsx
│   │   │   │   │   ├── card.tsx
│   │   │   │   │   ├── tooltip.tsx
│   │   │   │   │   └── ...
│   │   │   │   └── viewer/           # Read-only viewer
│   │   │   │       └── GazetteViewer.tsx
│   │   │   ├── hooks/                # Custom React hooks
│   │   │   │   ├── useProject.ts
│   │   │   │   ├── useGeneration.ts
│   │   │   │   └── useDragDrop.ts
│   │   │   ├── lib/                  # Utilities, API client
│   │   │   │   ├── api.ts            # API client (ky wrapper)
│   │   │   │   ├── auth.ts           # Token management
│   │   │   │   └── utils.ts          # shadcn/ui cn() helper
│   │   │   ├── routes/               # TanStack Router routes
│   │   │   │   ├── __root.tsx
│   │   │   │   ├── index.tsx         # Landing/login
│   │   │   │   ├── editor.$projectId.tsx
│   │   │   │   └── view.$slug.tsx
│   │   │   ├── stores/               # Zustand stores
│   │   │   │   ├── editorStore.ts
│   │   │   │   ├── projectStore.ts
│   │   │   │   └── generationStore.ts
│   │   │   ├── styles/               # Global styles
│   │   │   │   ├── globals.css       # Tailwind + shadcn/ui base
│   │   │   │   └── gazette.css       # Custom gazette theming
│   │   │   └── main.tsx
│   │   ├── public/
│   │   │   ├── textures/             # Paper textures
│   │   │   │   └── paper-grain.png
│   │   │   └── favicon.ico
│   │   ├── index.html
│   │   ├── components.json           # shadcn/ui configuration
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.ts
│   │   └── tsconfig.json
│   │
│   └── server/                       # Backend API
│       ├── src/
│       │   ├── routes/               # API route handlers
│       │   │   ├── projects.ts
│       │   │   ├── pages.ts
│       │   │   ├── elements.ts
│       │   │   ├── images.ts
│       │   │   ├── generation.ts
│       │   │   └── viewer.ts
│       │   ├── services/             # Business logic
│       │   │   ├── project.service.ts
│       │   │   ├── generation.service.ts
│       │   │   ├── suggestion.service.ts
│       │   │   └── export.service.ts
│       │   ├── db/                   # Database
│       │   │   ├── schema.ts         # Drizzle schema
│       │   │   ├── migrations/
│       │   │   └── index.ts
│       │   ├── queue/                # Job queue
│       │   │   ├── worker.ts
│       │   │   └── jobs/
│       │   │       └── generateVideo.ts
│       │   ├── middleware/           # Hono middleware
│       │   │   ├── auth.ts
│       │   │   └── validation.ts
│       │   ├── lib/                  # Utilities
│       │   │   ├── wan-client.ts     # WAN API client
│       │   │   ├── gemini-client.ts  # Gemini API client
│       │   │   └── jwt.ts
│       │   └── index.ts              # Entry point
│       ├── uploads/                  # Uploaded files (gitignored)
│       │   ├── images/
│       │   └── videos/
│       ├── tsconfig.json
│       └── package.json
│
├── packages/
│   └── shared/                       # Shared types and schemas
│       ├── src/
│       │   ├── schemas/              # Zod schemas
│       │   │   ├── project.ts
│       │   │   ├── page.ts
│       │   │   ├── element.ts
│       │   │   ├── image.ts
│       │   │   └── generation.ts
│       │   ├── types/                # TypeScript types (inferred)
│       │   │   └── index.ts
│       │   └── index.ts
│       ├── tsconfig.json
│       └── package.json
│
├── docker/                           # Docker configuration
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── docker-compose.prod.yml
│
├── docs/                             # Documentation
│   ├── PRD.md
│   ├── BRANDING.md
│   ├── USER_STORIES.md
│   ├── TECHNICAL_ARCHITECTURE.md
│   ├── API_SPEC.md
│   ├── DATA_MODELS.md
│   └── UI_MOCKUPS.md
│
├── package.json                      # Workspace root (bun workspaces)
├── bun.lock                          # Bun lockfile
├── bunfig.toml                       # Bun configuration
├── .env.example
├── .gitignore
└── README.md
```

---

## 4. Data Flow

### 4.1 Project Access Flow

```
User → Enter credentials → POST /api/projects/access
                                    ↓
                         Server verifies password
                                    ↓
                         Returns JWT + project data
                                    ↓
                         Frontend stores token
                                    ↓
                         Redirects to editor
```

### 4.2 Image Upload Flow

```
User → Select image → Frontend validates format/size
                              ↓
                     POST /api/projects/:id/images (multipart)
                              ↓
                     Server saves to filesystem
                              ↓
                     Creates DB record
                              ↓
                     Returns image metadata
                              ↓
                     POST /api/images/:id/analyze
                              ↓
                     Server calls Gemini 3 Flash Preview
                              ↓
                     Returns animation suggestions
                              ↓
                     Frontend shows suggestion modal
```

### 4.3 Video Generation Flow

```
User → Click "Generate" → POST /api/pages/:id/generate (or /api/projects/:id/generate)
                                    ↓
                         Server creates jobs in BullMQ
                                    ↓
                         Returns job IDs immediately
                                    ↓
                         Worker processes jobs async
                                    ↓
                         Each job calls WAN API
                                    ↓
                         Downloads video to filesystem
                                    ↓
                         Updates DB with video URL
                                    ↓
                         Frontend polls for status
                                    ↓
                         Videos appear as ready
```

---

## 5. Deployment Strategy

### 5.1 Target Environment

- **Provider**: Hetzner or OVH VPS
- **Specs**: 2 vCPU, 4GB RAM, 40GB SSD
- **OS**: Ubuntu 22.04 LTS
- **Domain**: `gazette.example.com` (DNS A/AAAA to VPS)

### 5.2 Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      VPS (Ubuntu)                       │
│                                                         │
│  ┌─────────────┐     ┌─────────────────────────────┐   │
│  │   Caddy     │────▶│     Bun App (PM2)           │   │
│  │  (HTTPS)    │     │   - API Server :3000        │   │
│  │  :443/:80   │     │   - Worker (BullMQ)         │   │
│  └─────────────┘     └─────────────────────────────┘   │
│                                  │                      │
│                      ┌───────────┼───────────┐         │
│                      ▼           ▼           ▼         │
│               ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│               │  SQLite  │ │  Redis   │ │  Files   │   │
│               │   .db    │ │  :6379   │ │ /uploads │   │
│               └──────────┘ └──────────┘ └──────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 5.3 VPS Setup (Hetzner/OVH)

1. **Provision VPS**
   - Create VPS and attach SSH key.
   - Configure DNS A/AAAA record for `gazette.example.com`.

2. **Harden Base OS**

   ```bash
   sudo apt update && sudo apt upgrade -y
   sudo apt install -y curl git unzip ufw fail2ban sqlite3

   # Create non-root user
   sudo adduser gazette
   sudo usermod -aG sudo gazette

   # Firewall
   sudo ufw allow 22
   sudo ufw allow 80
   sudo ufw allow 443
   sudo ufw enable
   ```

3. **Directory Layout**

   ```bash
   sudo mkdir -p /opt/gazette /var/lib/gazette/uploads /var/backups/gazette /etc/gazette
   sudo chown -R gazette:gazette /opt/gazette /var/lib/gazette /var/backups/gazette
   sudo chmod 750 /etc/gazette
   ```

### 5.4 Install Dependencies (Bun, Redis, Caddy, PM2)

```bash
# Bun (as gazette user)
curl -fsSL https://bun.sh/install | bash
echo 'export PATH="$HOME/.bun/bin:$PATH"' >> ~/.profile
source ~/.profile

# PM2 (process manager)
bun add -g pm2

# Redis
sudo apt install -y redis-server
sudo systemctl enable --now redis-server

# Caddy (official repo)
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install caddy
```

### 5.5 Application Deployment (First-Time)

```bash
sudo -iu gazette
git clone https://github.com/user/gazette.git /opt/gazette
cd /opt/gazette

# Configure environment
sudo nano /etc/gazette/gazette.env
sudo chmod 600 /etc/gazette/gazette.env
```

Notes on `.env` management:

- The production env file **lives on the VPS** at `/etc/gazette/gazette.env` and is not checked into git.
- After editing the env file, rerun `deploy.sh` (or `pm2 startOrReload ... --update-env`) so PM2 picks up changes.
- You can override the env file path via `ENV_FILE=/path/to/file` when running `deploy.sh`.

```bash
# Build and migrate
set -a && source /etc/gazette/gazette.env && set +a
./scripts/build-production.sh
bun run --filter '@gazette/backend' db:migrate

# Start PM2
pm2 startOrReload ops/ecosystem.config.cjs --env production --update-env
pm2 save
pm2 startup
```

#### One-Click Deploy (SSH)

`deploy.sh` can be run on the VPS, or from your laptop as a one-click SSH deploy that runs the exact same steps on the server (git pull → build → migrate → PM2 reload).

From your local machine:

```bash
REMOTE_HOST=your.vps.ip \
REMOTE_USER=gazette \
REMOTE_APP_DIR=/opt/gazette \
./deploy.sh
```

Optional SSH conveniences:

- **Rsync file sync** (useful if you have local uncommitted changes):
  ```bash
  SYNC=1 SKIP_GIT=1 \
  REMOTE_HOST=your.vps.ip \
  REMOTE_USER=gazette \
  REMOTE_APP_DIR=/opt/gazette \
  ./deploy.sh
  ```
- **Sync env file** (only if you want to update it from local):
  ```bash
  SYNC_ENV=1 ENV_FILE_LOCAL=./ops/gazette.env \
  REMOTE_HOST=your.vps.ip \
  REMOTE_USER=gazette \
  ./deploy.sh
  ```

By default, deploys use **git pull on the server**; no file sync happens unless you set `SYNC=1`.

### 5.6 Caddy Reverse Proxy + HTTPS

Use the template in `ops/Caddyfile` and install to `/etc/caddy/Caddyfile`:

```caddyfile
gazette.example.com {
  encode zstd gzip

  handle /api/* {
    reverse_proxy 127.0.0.1:3000
  }

  handle /health {
    reverse_proxy 127.0.0.1:3000
  }

  handle {
    root * /opt/gazette/apps/frontend/dist
    try_files {path} /index.html
    file_server
  }
}
```

```bash
sudo systemctl reload caddy
```

### 5.7 PM2 Process Management

Production PM2 configuration lives in `ops/ecosystem.config.cjs` and runs:

- `gazette-api` → `apps/backend/dist/index.js`
- `gazette-worker` → `apps/backend/dist/queue/worker.js`

### 5.8 Production Build Scripts

- `scripts/build-production.sh` installs dependencies and builds both apps.
- Root script `bun run build:production` is available for CI/CD use.
- `VITE_API_URL` must be set in the environment before running the frontend build.
- `deploy.sh` performs git pull, build, migrations, and PM2 reloads on the VPS.
  - It can also be run locally with `REMOTE_HOST=...` to trigger a one-click SSH deploy.
  - Environment variables are loaded from `/etc/gazette/gazette.env` by default.

### 5.9 Redis Production Setup

- Keep Redis bound to localhost (`bind 127.0.0.1`).
- Enable supervised mode (`supervised systemd`) in `/etc/redis/redis.conf`.
- If you set `requirepass`, update `REDIS_URL` to:
  `redis://:YOUR_PASSWORD@127.0.0.1:6379`.

### 5.10 SQLite Backup Strategy

- Use `scripts/backup-sqlite.sh` for consistent `.backup` snapshots.
- Schedule with cron (daily) and keep 30 days of gzip archives:

```bash
crontab -e
0 3 * * * /opt/gazette/scripts/backup-sqlite.sh >/var/log/gazette-backup.log 2>&1
```

### 5.11 Health Check Monitoring

- Health endpoint: `GET /health`
- Suggested monitoring:
  - Uptime Kuma or Healthchecks.io with a 1–5 minute check interval.
  - Example: `curl -fsS https://gazette.example.com/health`.

### 5.12 Docker Alternative

```dockerfile
# Dockerfile
FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json bun.lock ./
COPY apps/frontend/package.json ./apps/frontend/
COPY apps/backend/package.json ./apps/backend/
COPY packages/shared/package.json ./packages/shared/
RUN bun install --frozen-lockfile

# Build frontend
FROM deps AS builder
COPY . .
RUN bun run build

# Production
FROM base AS runner
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/apps/backend ./apps/backend
COPY --from=builder /app/apps/frontend/dist ./apps/frontend/dist
COPY --from=builder /app/packages ./packages

ENV NODE_ENV=production
EXPOSE 3000
CMD ["bun", "run", "./apps/backend/src/index.ts"]
```

```yaml
# docker-compose.prod.yml
version: "3.8"

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=/data/gazette.db
      - REDIS_URL=redis://redis:6379
    volumes:
      - ./data:/data
      - ./uploads:/app/uploads
    depends_on:
      - redis
    restart: unless-stopped

  worker:
    build: .
    command: bun run ./apps/backend/src/queue/worker.ts
    environment:
      - NODE_ENV=production
      - DATABASE_URL=/data/gazette.db
      - REDIS_URL=redis://redis:6379
    volumes:
      - ./data:/data
      - ./uploads:/app/uploads
    depends_on:
      - redis
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis-data:/data
    restart: unless-stopped

volumes:
  redis-data:
```

---

## 6. Environment Variables

```bash
# .env.example

# Server
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:5173

# Database
DATABASE_URL=./data/gazette.db

# Redis (for BullMQ)
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-key-change-in-production

# Public URLs
APP_URL=http://localhost:5173
PUBLIC_APP_URL=http://localhost:5173

# File Storage
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760  # 10MB

# External APIs
WAN_API_KEY=your-wan-api-key
WAN_API_URL=https://api.wan.example.com
GEMINI_API_KEY=your-gemini-api-key

# Frontend (build-time)
VITE_API_URL=http://localhost:3000/api
```

---

## 7. Security Considerations

### 7.1 Authentication

- Project-based auth (name + password), no user accounts
- Passwords hashed with Bun.password (Argon2id)
- JWT tokens with 24-hour expiry
- Tokens stored in httpOnly cookies (production)

### 7.2 Input Validation

- All inputs validated with Zod schemas
- File uploads: type checked, size limited
- SQL injection: prevented by Drizzle ORM parameterization

### 7.3 Rate Limiting

- API rate limiting per IP
- Generation requests limited per project

### 7.4 HTTPS

- Enforced via Caddy (automatic Let's Encrypt)
- HSTS headers enabled

---

## 8. Performance Considerations

### 8.1 Frontend

- Code splitting per route
- Lazy loading of heavy components
- Image optimization on upload
- Video streaming (not full download)

### 8.2 Backend

- SQLite with WAL mode for concurrency
- Connection pooling for Redis
- File streaming for large uploads
- Async job processing

### 8.3 Caching

- Static assets: CDN/Caddy caching
- API responses: ETag/conditional requests
- Generated videos: long cache TTL

---

## 9. shadcn/ui Setup

### 9.1 Installation

```bash
# Initialize shadcn/ui in the web app
cd apps/frontend
bunx shadcn@latest init

# Install components as needed
bunx shadcn@latest add button input dialog card progress dropdown-menu tooltip
```

### 9.2 Configuration (components.json)

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/styles/globals.css",
    "baseColor": "neutral",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

### 9.3 Theming for Gazette

Override CSS variables in `gazette.css` to match the vintage aesthetic:

```css
/* gazette.css - Custom theme overrides */
:root {
  /* Override shadcn/ui defaults with gazette colors */
  --background: 45 30% 96%; /* cream */
  --foreground: 30 24% 16%; /* newspaper black */
  --primary: 43 69% 47%; /* antique gold */
  --primary-foreground: 30 24% 16%;
  --secondary: 24 29% 28%; /* sepia ink */
  --secondary-foreground: 45 30% 96%;
  --muted: 30 16% 44%; /* faded gray */
  --muted-foreground: 30 16% 44%;
  --accent: 43 69% 47%;
  --accent-foreground: 30 24% 16%;
  --border: 24 29% 28% / 0.2;
  --ring: 43 69% 47%;
}
```

---

_Technical Architecture v1.1_
_Last Updated: December 19, 2025_
