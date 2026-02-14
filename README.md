# Zentro AI

### Worker

```bash
docker build \
  --file apps/worker/Dockerfile \
  --tag zentro-worker:latest \
  --no-cache \
  --progress=plain \
  .
```

### Code server

```bash
docker build \
  --file apps/code-server/Dockerfile \
  --tag zentro-code-server:latest \
  --no-cache \
  --progress=plain \
  apps/code-server
```
