#!/bin/sh
# Deploy the standalone API function (deploy/api-func) to Vercel and wire env.
#
# Usage:
#   VERCEL_TOKEN=<token> sh scripts/deploy-api-vercel.sh
#
# Environment:
#   VERCEL_TOKEN    (required) Vercel deploy token (Account Settings → Tokens)
#   DATABASE_URL    (optional) Postgres URL; must already exist on the Vercel
#                   project as DATABASE_URL if unset
#   SESSION_SECRET  (optional) session secret; a strong random one is
#                   generated if unset
#   VERCEL_SCOPE    (optional) team/scope name
set -e
cd "$(dirname "$0")/../deploy/api-func"

: "${VERCEL_TOKEN:?VERCEL_TOKEN is required (Vercel → Account Settings → Tokens)}"

SCOPE_ARGS=""
if [ -n "$VERCEL_SCOPE" ]; then
  SCOPE_ARGS="--scope $VERCEL_SCOPE"
fi

V="npx --yes vercel@latest"

echo "==> Building fresh API bundle"
sh ../../scripts/build-api-deploy.sh

echo "==> Linking Vercel project (estatefund-api)"
$V link --yes --project estatefund-api $SCOPE_ARGS --token "$VERCEL_TOKEN"

echo "==> Wiring environment variables (production)"
if [ -n "$DATABASE_URL" ]; then
  $V env rm DATABASE_URL production --yes $SCOPE_ARGS --token "$VERCEL_TOKEN" >/dev/null 2>&1 || true
  printf '%s' "$DATABASE_URL" | $V env add DATABASE_URL production $SCOPE_ARGS --token "$VERCEL_TOKEN"
  echo "    DATABASE_URL: set (value hidden)"
else
  echo "    DATABASE_URL: skipped (expected to already exist on the project)"
fi
if [ -z "$SESSION_SECRET" ]; then
  SESSION_SECRET="$(node -e 'console.log(require("crypto").randomBytes(48).toString("base64url"))')"
fi
$V env rm SESSION_SECRET production --yes $SCOPE_ARGS --token "$VERCEL_TOKEN" >/dev/null 2>&1 || true
printf '%s' "$SESSION_SECRET" | $V env add SESSION_SECRET production $SCOPE_ARGS --token "$VERCEL_TOKEN"
echo "    SESSION_SECRET: set (value hidden)"

echo "==> Deploying to production"
DEPLOY_URL="$($V deploy --prod $SCOPE_ARGS --token "$VERCEL_TOKEN" | tail -1)"

echo ""
echo "API deployed: $DEPLOY_URL"
echo "Next: set VITE_API_URL=$DEPLOY_URL in Freebuff production env and redeploy the static site."
