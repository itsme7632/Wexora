#!/bin/sh
# Dev startup: API server (port 8080) + Vite frontend (PORT env var)
set -e

cd "$(dirname "$0")/.."

# Source .env.local to ensure env vars are available
if [ -f .env.local ]; then
  set -a
  . ./.env.local
  set +a
fi

# Build and start API server in background
echo "→ Building API server..."
pnpm --filter @workspace/api-server run build
echo "→ Starting API server on port 8080..."
PORT=8080 node --import=./artifacts/api-server/dist/env-preload.mjs --enable-source-maps ./artifacts/api-server/dist/index.mjs &
API_PID=$!

# Wait for API server to be ready
echo "→ Waiting for API server..."
for i in $(seq 1 30); do
  if curl -sf http://localhost:8080/api/healthz > /dev/null 2>&1; then
    echo "→ API server ready ✓"
    break
  fi
  sleep 1
done

# Start Vite frontend
echo "→ Starting Vite frontend..."
exec pnpm --filter @workspace/vaultx run dev
