# Deployment (Coolify)

## Recommended Approach

Use the Docker Compose stack defined in `docker-compose.coolify.yml`. It runs:

- web (Next.js)
- api (Bun)
- worker (Bun)
- listener (Bun)
- postgres
- redis

## Coolify Setup

1. Create a new project in Coolify.
2. Add a Docker Compose service and point it at `docker-compose.coolify.yml`.
3. Add the required environment variables in Coolify.
4. Deploy the stack.
5. Run database migrations once after the first deploy.

## Required Environment Variables

- DATABASE_URL (use `postgres` hostname inside the stack)
- REDIS_URL (use `redis` hostname inside the stack)
- SOLANA_RPC_URL
- SOLANA_WS_URL
- SOLANA_NETWORK
- CORS_ORIGIN (public web URL)
- NEXT_PUBLIC_API_URL (public api URL)
- NEXT_PUBLIC_SOLANA_RPC_URL
- NEXT_PUBLIC_SOLANA_NETWORK
- NEXT_PUBLIC_PRIVY_APP_ID
- PRIVY_APP_ID
- PRIVY_APP_SECRET
- WORKER_CONCURRENCY (optional)
- RATE_LIMIT_MAX (optional)
- RATE_LIMIT_DURATION (optional)

## Example Internal URLs

- DATABASE_URL=postgresql://postgres:postgres@postgres:5432/solworkflow
- REDIS_URL=redis://redis:6379

## Migrations

Run once after the first deploy:

```bash
pnpm db:migrate
```

In Coolify this can be run as a one-off command or as a post-deploy command.
