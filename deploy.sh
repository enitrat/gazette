#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
APP_DIR=${APP_DIR:-$SCRIPT_DIR}
BRANCH=${BRANCH:-main}
ENV_FILE=${ENV_FILE:-/etc/gazette/gazette.env}
PM2_CONFIG=${PM2_CONFIG:-$APP_DIR/ops/ecosystem.config.cjs}

export PATH="$HOME/.bun/bin:$PATH"

print_usage() {
  cat <<'USAGE'
Usage:
  ./deploy.sh                           # run on the server
  REMOTE_HOST=host ./deploy.sh          # run remotely via SSH

Remote options (env vars):
  REMOTE_HOST        Required for SSH mode (e.g. 203.0.113.10)
  REMOTE_USER        Optional SSH user (default: current user)
  REMOTE_PORT        Optional SSH port (default: 22)
  REMOTE_APP_DIR     Remote app path (default: /opt/gazette)
  REMOTE_PM2_CONFIG  Remote PM2 config (default: $REMOTE_APP_DIR/ops/ecosystem.config.cjs)
  SYNC=1             Rsync repo to server before deploy (default: 0)
  LOCAL_APP_DIR      Local repo path for rsync (default: script directory)
  SYNC_ENV=1         Upload env file to server before deploy (default: 0)
  ENV_FILE_LOCAL     Local env file to upload (default: $ENV_FILE)

General options (env vars):
  APP_DIR            Local/remote app path for deploy execution
  BRANCH             Git branch to deploy (default: main)
  ENV_FILE           Env file path on the server (default: /etc/gazette/gazette.env)
  PM2_CONFIG         PM2 config path (default: $APP_DIR/ops/ecosystem.config.cjs)
  SKIP_GIT=1         Skip git fetch/checkout/pull (default: 0)
USAGE
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  print_usage
  exit 0
fi

REMOTE_HOST=${REMOTE_HOST:-}
REMOTE_USER=${REMOTE_USER:-}
REMOTE_PORT=${REMOTE_PORT:-22}
REMOTE_APP_DIR=${REMOTE_APP_DIR:-/opt/gazette}
REMOTE_PM2_CONFIG=${REMOTE_PM2_CONFIG:-$REMOTE_APP_DIR/ops/ecosystem.config.cjs}
SYNC=${SYNC:-0}
LOCAL_APP_DIR=${LOCAL_APP_DIR:-$APP_DIR}
SYNC_ENV=${SYNC_ENV:-0}
ENV_FILE_LOCAL=${ENV_FILE_LOCAL:-$ENV_FILE}
SKIP_GIT=${SKIP_GIT:-0}

if [[ -n "$REMOTE_HOST" && -z "${REMOTE_EXEC:-}" ]]; then
  remote_target="$REMOTE_HOST"
  if [[ -n "$REMOTE_USER" ]]; then
    remote_target="$REMOTE_USER@$REMOTE_HOST"
  fi

  if [[ "$SYNC" == "1" ]]; then
    rsync -az --delete -e "ssh -p $REMOTE_PORT" \
      --exclude ".git" \
      --exclude "node_modules" \
      --exclude "apps/*/dist" \
      "$LOCAL_APP_DIR"/ "$remote_target:$REMOTE_APP_DIR"/
  fi

  if [[ "$SYNC_ENV" == "1" ]]; then
    if [[ ! -f "$ENV_FILE_LOCAL" ]]; then
      echo "Missing local env file: $ENV_FILE_LOCAL" >&2
      exit 1
    fi
    scp -P "$REMOTE_PORT" "$ENV_FILE_LOCAL" "$remote_target:$ENV_FILE"
    ssh -p "$REMOTE_PORT" "$remote_target" "chmod 600 '$ENV_FILE'"
  fi

  ssh -p "$REMOTE_PORT" "$remote_target" \
    "APP_DIR='$REMOTE_APP_DIR' BRANCH='$BRANCH' ENV_FILE='$ENV_FILE' PM2_CONFIG='$REMOTE_PM2_CONFIG' SKIP_GIT='$SKIP_GIT' REMOTE_EXEC=1 bash -s" \
    < "$0"
  exit 0
fi

cd "$APP_DIR"

if [[ "$SKIP_GIT" != "1" ]]; then
  git fetch --prune

  git checkout "$BRANCH"

  git pull --ff-only origin "$BRANCH"
fi

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
