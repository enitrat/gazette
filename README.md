# Gazette Monorepo

A bun workspace-based monorepo for the Gazette project.

## Structure

```
.
├── apps/
│   ├── backend/          # Backend application
│   └── frontend/         # Frontend application
├── packages/
│   └── shared/           # Shared utilities and types
├── docker-compose.yml    # Redis for BullMQ
└── package.json          # Root workspace configuration
```

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) >= 1.0.0
- [Docker](https://docker.com) (for Redis)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd gazette

# Install dependencies
bun install
```

This will also set up git hooks via husky.

### Starting Services

Start Redis (required for BullMQ job queue):

```bash
docker compose up -d
```

### Development

Run all apps in development mode:

```bash
bun run dev
```

Run individual apps:

```bash
# Frontend only
bun run dev:frontend

# Backend only
bun run dev:backend
```

### WAN Video Generation Setup

To enable WAN 2.x image-to-video generation, set the following environment variables for the backend:

- `WAN_API_KEY` (required): Alibaba Cloud Model Studio / DashScope API key.
- `WAN_BASE_URL` (optional): Defaults to `https://dashscope-intl.aliyuncs.com/api/v1`.
- `WAN_MODEL` (optional): Defaults to `wan2.1-i2v-turbo`.
- `WAN_POLL_INTERVAL_MS` (optional): Polling interval in ms (default 15000).
- `WAN_MAX_POLL_MS` (optional): Max polling time in ms (default 12 minutes).
- `WAN_PUBLIC_BASE_URL` (optional): Public base URL of your backend (e.g. `https://api.example.com`).
- `WAN_IMAGE_TOKEN` (optional): Shared token used to grant WAN access to source images.

Notes:

- If `WAN_PUBLIC_BASE_URL` + `WAN_IMAGE_TOKEN` are set, WAN will fetch images from
  `/api/images/:id/public?token=...`. Otherwise, images are sent as base64 data URLs.
- Generated videos are stored under `apps/backend/uploads/videos/` and served via
  `/api/videos/:jobId/file` (auth required).

Example env (local):

```bash
WAN_API_KEY=your_dashscope_key
WAN_PUBLIC_BASE_URL=http://localhost:3000
WAN_IMAGE_TOKEN=dev-token-change-me
```

### Building for Production

Build all packages:

```bash
bun run build
```

Build individual apps:

```bash
bun run build:frontend
bun run build:backend
```

### Starting Production

```bash
bun run start
```

Or just the backend:

```bash
bun run start:backend
```

## Code Quality

### Type Checking

Run TypeScript type checking across all packages:

```bash
bun run typecheck
```

### Linting

Check for linting errors:

```bash
bun run lint
```

Fix linting errors automatically:

```bash
bun run lint:fix
```

### Formatting

Check code formatting:

```bash
bun run format:check
```

Format all files:

```bash
bun run format
```

### Pre-commit Hooks

This project uses husky with lint-staged to run linting and formatting on staged files before each commit. This is set up automatically when you run `bun install`.

### Testing

Run tests across all packages:

```bash
bun test
```

## Docker Services

### Redis

Redis is used for BullMQ job queue functionality.

```bash
# Start Redis
docker compose up -d

# Stop Redis
docker compose down

# View logs
docker compose logs -f redis

# Stop and remove data
docker compose down -v
```

Redis will be available at `localhost:6379`.

## Package Details

### @gazette/shared

Shared utilities and types used across the monorepo. Located at `packages/shared`.

Import using the workspace alias:

```typescript
import { greeting } from "@gazette/shared";
```

### @gazette/frontend

Frontend application. Located at `apps/frontend`.

### @gazette/backend

Backend application with Bun server. Located at `apps/backend`.

## Scripts Reference

| Script           | Description                                 |
| ---------------- | ------------------------------------------- |
| `dev`            | Start all packages in development mode      |
| `dev:frontend`   | Start frontend in development mode          |
| `dev:backend`    | Start backend in development mode           |
| `build`          | Build all packages                          |
| `build:frontend` | Build frontend for production               |
| `build:backend`  | Build backend for production                |
| `start`          | Start all packages in production mode       |
| `start:backend`  | Start backend in production mode            |
| `test`           | Run tests across all packages               |
| `lint`           | Check for linting errors                    |
| `lint:fix`       | Fix linting errors                          |
| `format`         | Format all files with Prettier              |
| `format:check`   | Check if files are formatted                |
| `typecheck`      | Run TypeScript type checking                |
| `clean`          | Remove all node_modules and build artifacts |

## Configuration

- **TypeScript**: Configured with strict mode and path aliases
- **ESLint**: TypeScript-aware linting with Prettier integration
- **Prettier**: Code formatting with 100 character line width
- **Husky**: Git hooks for pre-commit linting
- **lint-staged**: Run linters on staged files only
- **EditorConfig**: Consistent editor settings across the project
