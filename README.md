# Sol Workflow

Solana-native automation platform for DAO operators and NFT community managers.

**Workflow Structure:** Trigger → Filter → Action → Notify

## Quick Start

```bash
./scripts/setup.sh
pnpm dev
```

### Manual Setup

```bash
cp .env.example .env
pnpm install
docker compose up -d
pnpm; db:migrate
pnpm dev
```

### Access Points

- **Web; UI:**; http://localhost:3000
- **API:** http://localhost:3001
- **Bull Board:** http://localhost:3002
- **DB Studio:** `pnpm db:studio`

## Structure

```
apps/
  web/        # Next.js frontend
  api/        # Hono API server
  worker/     # BullMQ workflow executor
  listener/   # Solana WebSocket listener
packages/
  db/         # Drizzle ORM + PostgreSQL
  types/      # Shared TypeScript types
  solana/     # Solana utilities
  discord/    # Discord webhook client
```

## Docs

- [setup.md](./SETUP.md) - Setup guide
- [architecture.md](./ARCHITECTURE.md) - System design
