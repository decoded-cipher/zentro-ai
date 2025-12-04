#!/bin/sh

# Folder inside the container you’re mounting from the host
: "${BACKUP_SRC:=/backup}"

# Rclone remote target, e.g. R2:my-bucket/prefix
: "${BACKUP_REMOTE:=}"

# Interval in seconds
: "${BACKUP_INTERVAL:=60}"

if [ -z "$BACKUP_REMOTE" ]; then
  echo "BACKUP_REMOTE is not set; skipping sync loop."
  # Still keep the container alive & let worker run
  exit 0
fi

echo "Starting R2 sync: $BACKUP_SRC -> $BACKUP_REMOTE every $BACKUP_INTERVAL seconds"

while true; do
  echo "[$(date)] Syncing..."
  rclone sync "$BACKUP_SRC" "$BACKUP_REMOTE" --delete-during
  sleep "$BACKUP_INTERVAL"
done
