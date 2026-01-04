# Sol Workflow - Setup Guide

## ✅ Project Structure Created

```
sol-workflow/
├── apps/
│   ├── web/                  # Next.js 14 + shadcn/ui (Vega theme)
│   ├── api/                  # Hono API server (Bun runtime)
│   ├── worker/               # BullMQ workflow executor (Bun runtime)
│   └── listener/             # Solana WebSocket event listener (Bun runtime)
├── packages/
│   ├── db/                   # Drizzle ORM + PostgreSQL schema
│   ├── types/                # Shared TypeScript types + Zod schemas
│   ├── solana/               # Solana utilities (@solana/web3.js wrappers)
│   └── discord/              # Discord webhook client
├── docker-compose.yml        # PostgreSQL + Redis + Bull Board
└── package.json              # Monorepo root with workspace scripts
```

## 🚀 Quick Start

### 1. Copy Environment Variables

```bash
cp .env.example .env
```

Edit `.env` if needed (defaults work for local development).

### 2. Start Infrastructure

```bash
docker compose up -d
```

This starts:

- postgresql on; `localhost:5432`
- redis on; `localhost:6379`
- bull board (queue monitoring) on; `http://localhost:3002`

### 3. Run Database Migrations

```bash
pnpm db:migrate
```

### 4. Start All Services

```bash
pnpm dev
```

This starts:

- **Web UI**: http://localhost:3000
- **API**: http://localhost:3001
- **Worker**: Background process (no UI)
- **Listener**: Background process (no UI)

## 📦 Package Scripts

### Root Level

- `pnpm dev` - Start all services concurrently
- `pnpm build` - Build all apps
- `pnpm db:generate` - Generate new migrations from schema changes
- `pnpm db:migrate` - Run pending migrations
- `pnpm db:studio` - Open Drizzle Studio (database GUI)
- `pnpm db:push` - Push schema changes directly (dev only)
- `pnpm lint` - Lint all packages
- `pnpm type-check` - TypeScript check all packages

### Individual Apps

- `pnpm dev:web` - Start only Next.js
- `pnpm dev:api` - Start only API server
- `pnpm dev:worker` - Start only worker
- `pnpm dev:listener` - Start only listener

## 🗄️ Database Schema

### Tables

**workflows**

- Stores workflow definitions (trigger, filter, action, notify)
- Safety limits: max SOL per tx, max executions per hour
- Soft delete support

**executions**

- Execution history with idempotency tracking
- Links to workflow, stores trigger data, tx signature, errors
- Tracks notification delivery

**trigger_subscriptions**

- Active Solana subscriptions
- Tracks subscription health and errors

**audit_logs**

- Audit trail for all workflow operations
- For future compliance and debugging

## 🔧 Technology Stack

| Layer       | Technology               | Purpose                       |
| ----------- | ------------------------ | ----------------------------- |
| Frontend    | Next.js 14 + shadcn/ui   | Workflow builder UI           |
| API         | Hono + Bun               | RESTful API server            |
| Worker      | BullMQ + Bun             | Workflow execution engine     |
| Listener    | @solana/web3.js + Bun    | Solana event subscriptions    |
| Database    | PostgreSQL + Drizzle ORM | Persistent storage            |
| Cache/Queue | Redis + BullMQ           | Job queue + deduplication     |
| Blockchain  | Solana (devnet)          | On-chain triggers and actions |

## 📝 Next Steps

### Phase 1A: Complete Core Workflow Engine

1. **Integrate Database with API** (`apps/api/src/routes/workflows.ts`)
   - Replace in-memory storage with Drizzle queries
   - Add proper error handling and validation

2. **Wire up Listener Service** (`apps/listener/src/index.ts`)
   - Load active workflows from database
   - Create/remove subscriptions on workflow enable/disable
   - Test with real Solana accounts

3. **Complete Worker Logic** (`apps/worker/src/processors/workflow-processor.ts`)
   - Implement filter evaluation
   - Add transaction builders for each action type
   - Integrate Discord notifications using `@repo/discord`

4. **Build Workflow UI** (`apps/web`)
   - Create workflow builder components
   - Add form validation with Zod schemas from `@repo/types`
   - Connect to API endpoints

### Phase 1B: Safety & Testing

5. **Implement Safety Limits**
   - PDA-based transaction authorities
   - Rate limiting in worker
   - Transaction amount caps

6. **Add Monitoring**
   - Bull Board integration
   - Execution logs viewer
   - Health check endpoints

7. **Testing**
   - Unit tests for transaction builders
   - Integration tests for workflow execution
   - E2E tests with Solana devnet

### Phase 1C: Production Readiness

8. **Security Hardening**
   - Input sanitization
   - Webhook URL validation
   - Secret management (env vars)

9. **Documentation**
   - API documentation
   - User guide for creating workflows
   - Deployment guide

10. **Deployment**
    - Docker images for each service
    - Kubernetes manifests or fly.io config
    - CI/CD pipeline

## 🛠️ Development Tips

### Using Drizzle Studio

```bash
pnpm db:studio
```

Opens a web UI to browse and edit database records.

### Monitoring Bull Queue

Visit http://localhost:3002 to see:

- Pending jobs
- Active jobs
- Failed jobs
- Job retries

### Testing Solana Integration

Use Solana devnet faucet for test SOL:

```bash
solana airdrop 1 <YOUR_PUBLIC_KEY> --url devnet
```

### Hot Reload

All services support hot reload:

- Next.js: Built-in
- Bun apps: `--watch` flag enabled

## 🐛 Troubleshooting

**Database connection failed**

- Ensure Docker is running: `docker ps`
- Check PostgreSQL logs: `docker logs solworkflow-postgres`

**Redis connection failed**

- Check Redis logs: `docker logs solworkflow-redis`
- Verify port 6379 is not in use

**Migration failed**

- Drop database: `docker compose down -v`
- Recreate: `docker compose up -d && pnpm db:migrate`

**Type errors in packages**

- Rebuild TypeScript: `pnpm type-check`
- Clear cache: `rm -rf node_modules/.cache`

## 📚 Key Files to Understand

1. `packages/db/src/schema/* ` - Database schema definitions
2. `packages/types/src/*` - Zod validation schemas
3. `apps/listener/src/lib/subscription-manager.ts` - Solana event handling
4. `apps/worker/src/processors/workflow-processor.ts` - Workflow execution logic
5. `packages/discord/src/templates/index.ts` - Notification templates

## 🎯 Architecture Decision Records

**Why pnpm workspaces?**

- Better dependency management than npm/yarn
- Native monorepo support
- Works well with Bun runtime

**Why Bun for backend?**

- 3-4x faster than Node.js for I/O-heavy workloads
- Native TypeScript support (no transpilation)
- Better WebSocket performance

**Why Drizzle over Prisma?**

- Better TypeScript inference
- Faster with Bun
- Simpler migrations
- Less abstraction, closer to SQL

**Why BullMQ?**

- Battle-tested job queue
- Built-in retries and backpressure
- Excellent monitoring (Bull Board)
- Handles idempotency well

## 🤝 Contributing Guidelines

Coming soon in Phase 2...

---

**Status**: ✅ Fully scaffolded, ready for Phase 1A development

Last updated: 2026-01-01
*/