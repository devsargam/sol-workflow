# Deployment (Coolify)

## Stack Overview

This repo should be hosted as four long-running services plus one migration job:

- `web`: Next.js frontend on port `3000`
- `api`: Hono API on port `3001`
- `worker`: BullMQ worker process
- `listener`: Solana websocket listener
- `migrate`: one-off database migration job

Production PostgreSQL and Redis should be external managed services. Do not run the local `docker-compose.yml` database containers in production unless you are intentionally self-hosting stateful services.

## Docker Files

These images are included in the repo:

- `docker/web/Dockerfile`
- `docker/api/Dockerfile`
- `docker/worker/Dockerfile`
- `docker/listener/Dockerfile`
- `docker/migrate/Dockerfile`

For a full multi-service deployment in Coolify, use `docker-compose.coolify.yml`.

## Recommended Coolify Layout

Use one Coolify project with:

1. One Docker Compose stack from `docker-compose.coolify.yml`
2. One external PostgreSQL service
3. One external Redis service
4. One one-time migration job using `docker/migrate/Dockerfile`

This keeps all app services together while letting the database and Redis live on managed infrastructure.

## Step-By-Step Setup

### 1. Prepare Production Infrastructure

Provision these first:

- PostgreSQL 16+
- Redis 7+
- A Solana RPC endpoint
- A Solana WebSocket endpoint
- A Privy app with both app ID and secret

Make sure PostgreSQL allows inbound traffic from your Coolify host and that Redis requires authentication.

### 2. Create the Coolify Project

In Coolify:

1. Create a new project
2. Add a `Docker Compose` resource
3. Point it to this repository
4. Set the compose file to `docker-compose.coolify.yml`

### 3. Configure Environment Variables

Set these at the stack level in Coolify so all services can inherit them:

#### Required everywhere

- `DATABASE_URL`
- `REDIS_URL`
- `SOLANA_RPC_URL`
- `SOLANA_WS_URL`
- `SOLANA_NETWORK`

#### Required for the web app

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_SOLANA_RPC_URL`
- `NEXT_PUBLIC_SOLANA_NETWORK`
- `NEXT_PUBLIC_PRIVY_APP_ID`

#### Required for the API

- `CORS_ORIGIN`
- `PRIVY_APP_ID`
- `PRIVY_APP_SECRET`

#### Optional runtime tuning

- `PORT`
- `WORKER_CONCURRENCY`
- `RATE_LIMIT_MAX`
- `RATE_LIMIT_DURATION`
- `ENABLE_CRON`

Recommended example values:

```env
DATABASE_URL=postgresql://user:password@postgres-host:5432/solworkflow
REDIS_URL=redis://:password@redis-host:6379
SOLANA_RPC_URL=https://your-rpc-provider.example
SOLANA_WS_URL=wss://your-rpc-provider.example
SOLANA_NETWORK=mainnet-beta
CORS_ORIGIN=https://app.yourdomain.com
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_SOLANA_RPC_URL=https://your-rpc-provider.example
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
NEXT_PUBLIC_PRIVY_APP_ID=your-privy-app-id
PRIVY_APP_ID=your-privy-app-id
PRIVY_APP_SECRET=your-privy-app-secret
WORKER_CONCURRENCY=5
RATE_LIMIT_MAX=10
RATE_LIMIT_DURATION=1000
ENABLE_CRON=true
```

### 4. Attach Domains

Configure public domains in Coolify for:

- `web` service: `app.yourdomain.com`
- `api` service: `api.yourdomain.com`

The `worker` and `listener` services should remain internal and do not need public domains.

### 5. Deploy the Compose Stack

Deploy the stack. Coolify should build and start:

- `web`
- `api`
- `worker`
- `listener`

Check these after deploy:

- `web` responds on `/`
- `api` responds on `/live`
- `api` responds on `/ready`
- worker logs show BullMQ worker startup
- listener logs show Solana subscription startup

### 6. Run Database Migrations

Run migrations before using the app in production.

Recommended options:

1. Create a one-time Coolify service that uses `docker/migrate/Dockerfile`
2. Or run a one-off command from the repo image:

```bash
pnpm --filter @repo/db db:migrate
```

Run the migration job:

- on the first deployment
- after every schema migration

Do not run migrations from the `web`, `worker`, or `listener` services.

### 7. Verify the Full System

After deploy:

1. Open the frontend and confirm it can talk to the API
2. Hit `https://api.yourdomain.com/health`
3. Create or load a workflow in the UI
4. Confirm the API enqueues jobs
5. Confirm the worker processes jobs
6. Confirm the listener connects to Solana and loads active workflows

## Service Responsibilities

### `web`

- Public-facing Next.js app
- Builds with Next standalone output
- Needs only the public `NEXT_PUBLIC_*` variables at build/runtime

### `api`

- Public JSON API
- Needs PostgreSQL, Redis, Solana, and Privy credentials
- Exposes `/health`, `/ready`, and `/live`
- Also initializes cron scheduling unless `ENABLE_CRON=false`

### `worker`

- Background workflow execution
- Needs PostgreSQL, Redis, and Solana access
- Scale this horizontally if queue throughput becomes a bottleneck

### `listener`

- Long-running Solana websocket subscriber
- Needs PostgreSQL, Redis, Solana RPC, and Solana WS access
- Usually keep this as a single replica unless the subscription strategy is redesigned for distributed coordination

## Scaling Guidance

- Scale `web` horizontally behind Coolify if traffic grows
- Scale `api` horizontally as stateless HTTP traffic grows
- Scale `worker` horizontally for more queue throughput
- Keep `listener` at one instance unless you add leader election or coordination
- Use managed PostgreSQL backups and Redis persistence

## Important Notes

- The API must have `PRIVY_APP_ID` and `PRIVY_APP_SECRET` set at startup
- `NEXT_PUBLIC_*` values for the frontend should point at the public production API and RPC endpoints
- `CORS_ORIGIN` should be the exact public frontend URL
- `SOLANA_WS_URL` must be a websocket endpoint, not an HTTPS URL
- If cron scheduling should run in only one place, keep `ENABLE_CRON=true` on a single API instance
