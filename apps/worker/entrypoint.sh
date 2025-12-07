#!/bin/bash

set -e

# Source .env file if it exists
if [ -f /app/apps/worker/.env ]; then
    echo "Loading environment variables from .env file..."
    set -a
    source /app/apps/worker/.env
    set +a
fi

export BACKUP_SRC="${BACKUP_SRC:-/tmp/zentro}"
export BACKUP_REMOTE="${BACKUP_REMOTE:-R2:zentro-ai/projects/${PROJECT_ID}}"

RCLONE_R2_VARS=(
  RCLONE_CONFIG_R2_TYPE
  RCLONE_CONFIG_R2_PROVIDER
  RCLONE_CONFIG_R2_REGION
  RCLONE_CONFIG_R2_ACL
  RCLONE_CONFIG_R2_ACCESS_KEY_ID
  RCLONE_CONFIG_R2_SECRET_ACCESS_KEY
  RCLONE_CONFIG_R2_ENDPOINT
)

for var in "${RCLONE_R2_VARS[@]}"; do
  eval ": \${$var:?$var environment variable is required}"
  eval "export $var"
done

# Export environment variables for cron
printenv | grep -E '^(BACKUP_|RCLONE_)' >> /etc/environment

# Setup cron job
echo "Setting up rclone sync cron job..."

# Create cron job that sources environment and runs sync
cat > /etc/cron.d/rclone-sync << CRON
SHELL=/bin/sh
PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin
* * * * * root . /etc/environment; /usr/local/bin/sync-r2.sh >> /var/log/rclone-sync.log 2>&1
CRON

chmod 0644 /etc/cron.d/rclone-sync
crontab /etc/cron.d/rclone-sync

echo "Cron job configured. Sync will run every minute."

# Start cron daemon
cron

# Start the worker
exec bun run start
