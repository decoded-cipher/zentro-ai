#!/bin/bash

set -e

: "${BACKUP_SRC:?BACKUP_SRC environment variable is required}"
: "${BACKUP_REMOTE:?BACKUP_REMOTE environment variable is required}"

log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*"
}

log "Starting sync: $BACKUP_SRC -> $BACKUP_REMOTE"

if [ ! -d "$BACKUP_SRC" ]; then
  log "ERROR: Source directory does not exist: $BACKUP_SRC"
  exit 1
fi

if ! command -v rclone >/dev/null 2>&1; then
  log "ERROR: rclone command not found"
  exit 1
fi

# Use rclone filter file for exclusion
if [ -f /usr/local/bin/rclone_filters.txt ]; then
  log "Using rclone_filters.txt for exclusion rules"
  set -- --filter-from /usr/local/bin/rclone_filters.txt
else
  log "WARNING: rclone_filters.txt not found, syncing all files"
  set --
fi

if rclone sync "$BACKUP_SRC" "$BACKUP_REMOTE" \
  "$@" \
  --delete-during \
  --verbose \
  --stats 1m \
  --stats-one-line; then
  log "Sync completed successfully"
else
  exit_code=$?
  log "ERROR: Sync failed with exit code: $exit_code"
  exit $exit_code
fi
