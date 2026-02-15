#!/bin/bash

set -e

: "${BACKUP_SRC:?BACKUP_SRC environment variable is required}"
: "${BACKUP_REMOTE:?BACKUP_REMOTE environment variable is required}"

log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] pull-r2: $*"
}

log "Pulling from R2: $BACKUP_REMOTE -> $BACKUP_SRC"

if ! command -v rclone >/dev/null 2>&1; then
  log "WARNING: rclone not found, skipping R2 pull"
  exit 0
fi

# Ensure destination exists
mkdir -p "$BACKUP_SRC"

# rclone copy: remote -> local (additive, does not delete local files)
# Non-fatal: new projects have no R2 data; old projects restore assets
if rclone copy "$BACKUP_REMOTE" "$BACKUP_SRC" \
  --ignore-errors \
  --stats 1m \
  --stats-one-line; then
  log "R2 pull completed"
else
  log "R2 pull finished (remote may be empty or path not yet created)"
fi

exit 0
