FROM oven/bun:1

WORKDIR /app

# Copy root package files for workspace resolution
COPY package.json .
COPY bun.lockb .

# Copy workspace packages
COPY packages/queue packages/queue
COPY packages/redis packages/redis

# Copy worker app
COPY apps/worker apps/worker

# Install dependencies from root (workspace resolution)
RUN bun install

WORKDIR /app/apps/worker

CMD ["bun", "run", "./index.ts"]
