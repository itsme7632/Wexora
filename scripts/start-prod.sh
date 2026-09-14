#!/bin/sh
# Production full-stack start: the API server serves BOTH the built frontend
# (artifacts/vaultx/dist/public) and /api on the same origin/port.
#
# Use this for hosted/test URLs where the frontend must reach a real API.
# Requires the build step to have produced:
#   - artifacts/vaultx/dist/public   (frontend, via pnpm --filter @workspace/vaultx run build)
#   - artifacts/api-server/dist      (API bundle,  via pnpm --filter @workspace/api-server run build)
set -e

cd "$(dirname "$0")/.."

# Source .env.local so DATABASE_URL and friends are available
if [ -f .env.local ]; then
  set -a
  . ./.env.local
  set +a
fi

export NODE_ENV=development
export PORT="${PORT:-8080}"

# Freebuff injects PORT; the API server binds it and serves everything.
exec node --import=./artifacts/api-server/dist/env-preload.mjs --enable-source-maps ./artifacts/api-server/dist/index.mjs
