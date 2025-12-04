
# ------------ Build stage ------------

FROM oven/bun:1 AS base
WORKDIR /app

# Prune stage
FROM base AS pruner
WORKDIR /app
COPY . .
RUN bun install --no-frozen-lockfile --save-text-lockfile
RUN bun x turbo prune --scope=worker --docker

# Installer stage
FROM base AS installer
WORKDIR /app

# Copy pruned package.jsons and lockfile
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/bun.lock ./bun.lock

# Install production dependencies
RUN bun install --production --no-frozen-lockfile

# ------------ Runner stage ------------

FROM oven/bun:1-slim AS runner
WORKDIR /app

# Install rclone
RUN apt-get update && \
    apt-get install -y rclone && \
    rm -rf /var/lib/apt/lists/*

# Copy dependencies
COPY --from=installer /app/node_modules ./node_modules
COPY --from=installer /app/package.json ./package.json
COPY --from=installer /app/bun.lock ./bun.lock

# Copy source code
COPY --from=pruner /app/out/full/ .
COPY apps/worker/.env ./apps/worker/.env

# Copy sync script
COPY --from=pruner /app/out/full/apps/worker/sync-r2.sh /usr/local/bin/sync-r2.sh
RUN chmod +x /usr/local/bin/sync-r2.sh

WORKDIR /app/apps/worker

EXPOSE 9091

# Start rclone sync in the BG and then start the worker
CMD ["sh", "-c", "/usr/local/bin/sync-r2.sh & exec bun run start"]
