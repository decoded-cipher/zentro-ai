FROM oven/bun:1

WORKDIR /app

# Copy root package files for workspace resolution
COPY package.json .
COPY bun.lockb .

# Copy workspace packages
COPY packages/queue packages/queue
COPY packages/redis packages/redis
COPY packages/db packages/db

# Copy worker app
COPY apps/worker apps/worker

# Install dependencies from root (workspace resolution)
RUN bun install

WORKDIR /app/apps/worker

EXPOSE 9091

CMD ["bun", "run", "start"]
