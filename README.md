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
└── package.json          # Root workspace configuration
```

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) >= 1.0.0

### Installation

```bash
bun install
```

### Development

Run all apps in development mode:

```bash
bun run dev
```

### Building

Build all packages:

```bash
bun run build
```

### Type Checking

Run TypeScript type checking across all packages:

```bash
bun run typecheck
```

### Linting & Formatting

Check code formatting:

```bash
bun run format:check
```

Format all files:

```bash
bun run format
```

### Testing

Run tests across all packages:

```bash
bun test
```

## Package Details

### @gazette/shared

Shared utilities and types used across the monorepo. Located at `packages/shared`.

Import using the path alias:

```typescript
import { greeting } from "@gazette/shared";
```

### @gazette/frontend

Frontend application. Located at `apps/frontend`.

### @gazette/backend

Backend application with Bun server. Located at `apps/backend`.

## Scripts

- `dev` - Start all packages in development mode
- `build` - Build all packages
- `test` - Run tests across all packages
- `lint` - Lint all packages
- `format` - Format all files with Prettier
- `format:check` - Check if files are formatted
- `typecheck` - Run TypeScript type checking
- `clean` - Remove all node_modules and build artifacts

## Configuration

- **TypeScript**: Configured with strict mode and path aliases
- **Prettier**: Code formatting with 100 character line width
- **EditorConfig**: Consistent editor settings across the project
