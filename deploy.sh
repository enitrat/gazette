#!/usr/bin/env bash
set -euo pipefail

APP_DIR=${APP_DIR:-/opt/gazette}
BRANCH=${BRANCH:-main}
ENV_FILE=${ENV_FILE:-/etc/gazette/gazette.env}
PM2_CONFIG=${PM2_CONFIG:-$APP_DIR/ops/ecosystem.config.cjs}

export PATH="$HOME/.bun/bin:$PATH"

cd "$APP_DIR"

git fetch --prune

git checkout "$BRANCH"

git pull --ff-only origin "$BRANCH"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing env file: $ENV_FILE" >&2
  exit 1
fi

set -a
source "$ENV_FILE"
set +a

./scripts/build-production.sh

bun run --filter '@gazette/backend' db:migrate

pm2 startOrReload "$PM2_CONFIG" --env production --update-env
pm2 save
