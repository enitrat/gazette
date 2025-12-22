#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# Gazette Deploy Script
# =============================================================================
# Usage: ./deploy.sh
#
# Required environment variables:
#   REMOTE_HOST     - VPS IP or hostname
#   REMOTE_USER     - SSH user (should be 'gazette')
#
# Optional:
#   REMOTE_PORT     - SSH port (default: 22)
#   SKIP_SYNC       - Set to 1 to skip rsync (default: 0)
# =============================================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info()    { echo -e "${BLUE}[INFO]${NC} $*"; }
log_success() { echo -e "${GREEN}[OK]${NC} $*"; }
log_warn()    { echo -e "${YELLOW}[WARN]${NC} $*"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $*" >&2; }

# Get script directory (local machine)
SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)

# Configuration
REMOTE_HOST=${REMOTE_HOST:-}
REMOTE_USER=${REMOTE_USER:-}
REMOTE_PORT=${REMOTE_PORT:-22}
SKIP_SYNC=${SKIP_SYNC:-0}

# Fixed paths
LOCAL_APP_DIR="$SCRIPT_DIR"
LOCAL_ENV_FILE="$SCRIPT_DIR/ops/gazette.env"
REMOTE_APP_DIR="/opt/gazette"
REMOTE_ENV_FILE="/opt/gazette/.env"

# Validate required vars
if [[ -z "$REMOTE_HOST" ]]; then
  log_error "REMOTE_HOST is required"
  echo "Usage: REMOTE_HOST=x.x.x.x REMOTE_USER=gazette ./deploy.sh"
  exit 1
fi

if [[ -z "$REMOTE_USER" ]]; then
  log_error "REMOTE_USER is required"
  exit 1
fi

# Validate local env file exists
if [[ ! -f "$LOCAL_ENV_FILE" ]]; then
  log_error "Missing local env file: $LOCAL_ENV_FILE"
  exit 1
fi

REMOTE_TARGET="$REMOTE_USER@$REMOTE_HOST"
SSH_CMD="ssh -p $REMOTE_PORT $REMOTE_TARGET"

log_info "Deploying to $REMOTE_TARGET"
log_info "  Local:  $LOCAL_APP_DIR"
log_info "  Remote: $REMOTE_APP_DIR"

# =============================================================================
# Step 1: Rsync files to remote
# =============================================================================
if [[ "$SKIP_SYNC" != "1" ]]; then
  log_info "Syncing files via rsync..."
  rsync -az --delete \
    -e "ssh -p $REMOTE_PORT" \
    --exclude ".git" \
    --exclude "node_modules" \
    --exclude "apps/*/dist" \
    --exclude "apps/*/node_modules" \
    --exclude "packages/*/node_modules" \
    --exclude ".env" \
    --exclude "*.db" \
    --exclude "*.db-journal" \
    --exclude "*.db-wal" \
    --exclude "*.db-shm" \
    --exclude "uploads/" \
    "$LOCAL_APP_DIR/" "$REMOTE_TARGET:$REMOTE_APP_DIR/"
  log_success "Files synced"
else
  log_warn "Skipping rsync (SKIP_SYNC=1)"
fi

# =============================================================================
# Step 2: Upload env file
# =============================================================================
log_info "Uploading env file..."
scp -P "$REMOTE_PORT" "$LOCAL_ENV_FILE" "$REMOTE_TARGET:$REMOTE_ENV_FILE"
log_success "Env file uploaded to $REMOTE_ENV_FILE"

# =============================================================================
# Step 3: Run build and deploy on remote
# =============================================================================
log_info "Running build and deploy on remote..."

$SSH_CMD << 'REMOTE_SCRIPT'
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info()    { echo -e "${BLUE}[REMOTE]${NC} $*"; }
log_success() { echo -e "${GREEN}[REMOTE OK]${NC} $*"; }
log_error()   { echo -e "${RED}[REMOTE ERROR]${NC} $*" >&2; }

APP_DIR="/opt/gazette"
ENV_FILE="/opt/gazette/.env"

# Add bun to PATH
export PATH="$HOME/.bun/bin:$PATH"

cd "$APP_DIR"
log_info "Working directory: $(pwd)"

# Load environment
log_info "Loading environment..."
set -a
source "$ENV_FILE"
set +a
log_success "Environment loaded"

# Install dependencies and build
log_info "Installing dependencies..."
bun install --frozen-lockfile
log_success "Dependencies installed"

log_info "Building for production..."
bun run build:production
log_success "Build complete"

# Run migrations
log_info "Running database migrations..."
bun run --filter '@gazette/backend' db:migrate
log_success "Migrations complete"

# Reload PM2
log_info "Reloading PM2..."
pm2 startOrReload "$APP_DIR/ops/ecosystem.config.cjs" --env production --update-env
pm2 save
log_success "PM2 reloaded"

log_success "Remote deploy complete!"
REMOTE_SCRIPT

log_success "Deploy complete!"
