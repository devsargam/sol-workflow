#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/docker-compose.test.yml"

export DATABASE_URL="postgresql://postgres:postgres@localhost:55432/solworkflow_test"
export REDIS_URL="redis://localhost:56379"
export NODE_ENV="test"
export CORS_ORIGIN="http://localhost:3000"
export PRIVY_APP_ID="test-app-id"
export PRIVY_APP_SECRET="test-app-secret"
export SOLANA_NETWORK="devnet"

cleanup() {
  docker compose -f "$COMPOSE_FILE" down -v
}

trap cleanup EXIT

docker compose -f "$COMPOSE_FILE" up -d

for i in {1..30}; do
  if docker compose -f "$COMPOSE_FILE" exec -T postgres pg_isready -U postgres >/dev/null 2>&1; then
    break
  fi
  sleep 1
  if [ "$i" -eq 30 ]; then
    echo "Postgres did not become ready in time" >&2
    exit 1
  fi
done

for i in {1..30}; do
  if docker compose -f "$COMPOSE_FILE" exec -T redis redis-cli ping >/dev/null 2>&1; then
    break
  fi
  sleep 1
  if [ "$i" -eq 30 ]; then
    echo "Redis did not become ready in time" >&2
    exit 1
  fi
done

DATABASE_URL="$DATABASE_URL" pnpm --filter @repo/db run db:migrate
DATABASE_URL="$DATABASE_URL" REDIS_URL="$REDIS_URL" pnpm test:api:integration
