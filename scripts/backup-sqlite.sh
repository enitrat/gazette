#!/usr/bin/env bash
set -euo pipefail

DB_PATH=${DB_PATH:-${DATABASE_URL:-/var/lib/gazette/gazette.db}}
BACKUP_DIR=${BACKUP_DIR:-/var/backups/gazette}
RETENTION_DAYS=${RETENTION_DAYS:-30}

mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date -u +"%Y%m%dT%H%M%SZ")
BACKUP_PATH="$BACKUP_DIR/gazette-${TIMESTAMP}.db"

sqlite3 "$DB_PATH" ".backup '$BACKUP_PATH'"
gzip -f "$BACKUP_PATH"

find "$BACKUP_DIR" -name "gazette-*.db.gz" -mtime +"$RETENTION_DAYS" -delete
