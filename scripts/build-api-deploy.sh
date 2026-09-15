#!/bin/sh
# Build the standalone Vercel API-function deploy package:
#   deploy/api-func/api/index.mjs  <- serverless Express bundle
#   deploy/api-func/vercel.json    <- routes /api/* to the function
#
# Prerequisite: pnpm run build:serverless  (writes <repo-root>/api/index.mjs)
set -e
cd "$(dirname "$0")/.."

if [ ! -f api/index.mjs ]; then
  echo "api/index.mjs missing — run 'pnpm run build:serverless' first" >&2
  exit 1
fi

mkdir -p deploy/api-func/api
cp api/index.mjs deploy/api-func/api/index.mjs
echo "API deploy package ready: deploy/api-func"
