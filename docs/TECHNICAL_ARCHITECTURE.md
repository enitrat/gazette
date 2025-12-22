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

## 5. Deployment

### 5.1 Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      VPS (Ubuntu)                       │
│                                                         │
│  ┌─────────────┐     ┌─────────────────────────────┐   │
│  │   Caddy     │────▶│     Bun App (PM2)           │   │
│  │    :80      │     │   - API Server :3000        │   │
│  └─────────────┘     │   - Worker (BullMQ)         │   │
│                      └─────────────────────────────┘   │
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

Access via `http://VPS_IP`

### 5.2 First-Time VPS Setup

Run these commands on your VPS:

```bash
# 1. Update system and install basics
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git unzip ufw redis-server

# 2. Create gazette user
sudo adduser gazette
sudo usermod -aG sudo gazette

# 3. Create directories
sudo mkdir -p /opt/gazette /var/lib/gazette/uploads
sudo chown -R gazette:gazette /opt/gazette /var/lib/gazette

# 4. Firewall
sudo ufw allow 22
sudo ufw allow 80
sudo ufw enable

# 5. Enable Redis
sudo systemctl enable --now redis-server

# 6. Install Caddy
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install caddy

# 7. Configure Caddy (copy ops/Caddyfile or create manually)
sudo tee /etc/caddy/Caddyfile << 'EOF'
:80 {
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
EOF
sudo systemctl reload caddy

# 8. Switch to gazette user and install Bun + PM2
sudo -iu gazette
curl -fsSL https://bun.sh/install | bash
source ~/.profile
bun add -g pm2
pm2 startup  # run the sudo command it prints
```

### 5.3 Local Setup (before first deploy)

Create `./ops/gazette.env` with your production config:

```bash
cp .env.example ./ops/gazette.env
# Edit with production values (API keys, URLs, secrets)
```

Key values to set:
- `VITE_API_URL=http://YOUR_VPS_IP/api`
- `APP_URL=http://YOUR_VPS_IP`
- `PUBLIC_APP_URL=http://YOUR_VPS_IP`
- `CORS_ORIGIN=http://YOUR_VPS_IP`
- All API keys (`WAN_API_KEY`, `GEMINI_API_KEY`, `JWT_SECRET`, etc.)

### 5.4 Deploy

From your local machine:

```bash
REMOTE_HOST=$VPS_IP REMOTE_USER=gazette ./deploy.sh
```

**What it does:**
1. Rsyncs local files → `/opt/gazette`
2. Uploads `./ops/gazette.env` → `/opt/gazette/.env`
3. Installs dependencies and builds
4. Runs database migrations
5. Reloads PM2

**Optional flags:**
- `SKIP_SYNC=1` - Skip rsync, only rebuild
- `REMOTE_PORT=2222` - Custom SSH port

### 5.5 Subsequent Deploys

Same command:

```bash
REMOTE_HOST=$VPS_IP REMOTE_USER=gazette ./deploy.sh
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
SIGNED_URL_SECRET=your-media-url-signing-secret
SIGNED_URL_TTL_SECONDS=3600

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

Note: In production, set `UPLOAD_DIR` to `/var/lib/gazette/uploads` (as in `ops/ecosystem.config.cjs`). If you leave it as `./uploads`, files will be stored inside the repo directory on the VPS, which is easy to overlook and may be wiped if you later change deploy paths or switch to rsync syncing.

---

## 7. Security Considerations

### 7.1 Authentication

- Project-based auth (name + password), no user accounts
- Passwords hashed with Bun.password (Argon2id)
- JWT tokens with 24-hour expiry
- Tokens stored in localStorage and sent via Authorization header

### 7.2 Signed Media URLs

- Image/video URLs are signed with a short-lived HMAC token
- Default TTL is 1 hour; expired URLs require a fresh API response
- Media endpoints validate `exp` + `sig` query params before serving files

### 7.2 Input Validation

- All inputs validated with Zod schemas
- File uploads: type checked, size limited
- SQL injection: prevented by Drizzle ORM parameterization

### 7.3 HTTPS

- Enforced via Caddy (automatic Let's Encrypt)

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
