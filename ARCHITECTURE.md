# Sol Workflow - Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Interface                           │
│                    Next.js 14 + shadcn/ui                        │
│              (Workflow Builder, Execution Viewer)                │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP + WebSocket
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Hono API Server                           │
│               (Workflow CRUD, Execution History)                 │
└──────────────┬──────────────────────────┬───────────────────────┘
               │                          │
               ▼                          ▼
    ┌──────────────────┐         ┌──────────────────┐
    │   PostgreSQL     │         │      Redis       │
    │   (Workflows,    │         │  (Job Queue,     │
    │   Executions)    │         │  Deduplication)  │
    └──────────────────┘         └────────┬─────────┘
                                           │
                        ┌──────────────────┴─────────────────┐
                        │                                    │
                        ▼                                    ▼
              ┌──────────────────┐              ┌──────────────────┐
              │  Listener Service │              │  Worker Service   │
              │  (WebSocket to    │              │  (BullMQ Consumer)│
              │   Solana RPC)     │              │                  │
              └────────┬──────────┘              └────────┬─────────┘
                       │                                  │
                       │ Publishes Jobs                   │
                       └──────────────────────────────────┤
                                                          │
                       ┌──────────────────────────────────┘
                       │
                       ▼
              ┌──────────────────┐
              │  1. Filter Event  │
              │  2. Build & Send  │
              │     Transaction   │
              │  3. Send Discord  │
              │     Notification  │
              └────────┬──────────┘
                       │
                       ▼
              ┌──────────────────┐
              │   Solana Network  │
              │     (Devnet)      │
              └──────────────────┘
```

## Data Flow

### Workflow Creation

1. User creates workflow in Next.js UI
2. UI sends POST to `/workflows` endpoint
3. API validates with Zod schemas from `@repo/types`
4. API saves to PostgreSQL via Drizzle ORM
5. If enabled, Listener Service subscribes to Solana events

### Event Processing (Hot Path)

```
Solana Event
    │
    ▼
Listener detects account/log change
    │
    ▼
Generate execution ID (SHA256 of slot + account + instruction)
    │
    ▼
Publish job to Redis BullMQ queue (with executionId as jobId)
    │
    ▼
Worker picks up job
    │
    ├─► Check idempotency in Redis (key: exec:{executionId})
    │       └─► Already processed? → Skip
    │
    ├─► Evaluate filter conditions
    │       └─► Conditions not met? → Mark as "filtered"
    │
    ├─► Execute on-chain action
    │       ├─► Build transaction (SOL transfer, SPL transfer, or program call)
    │       ├─► Sign with PDA or provided keypair
    │       ├─► Send to Solana RPC
    │       └─► Get transaction signature
    │
    ├─► Send Discord notification
    │       ├─► Format using template from @repo/discord
    │       ├─► POST to webhook URL
    │       └─► Respect rate limits (30 req/min)
    │
    └─► Mark execution as complete in PostgreSQL + Redis
```

## Idempotency Strategy

**Problem**: solana events can be delivered multiple times due; to:

- websocket reconnections
- rpc node inconsistencies
- slot confirmations vs finality;
**Solution**: multi-layer deduplication

1. **execution id generation**

   ```typescript
   executionid = sha256(workflowid + slot + account + instructionindex);
   ```

2. **Redis Fast Check** (< 1ms)

   ```
   GET exec:{executionId}
   → If exists, skip immediately
   ```

3. **Database Insert** (ACID guarantee)

   ```sql
   INSERT INTO executions (execution_id, ...) VALUES (...)
   ON CONFLICT (execution_id) DO NOTHING
   ```

4. **Redis Cache** (24h TTL)
   ```
   SET exec:{executionId}

 "1" EX 86400
   ```

## Safety Mechanisms

### 1. Rate Limiting

**Workflow Level**:

- `max_executions_per_hour` (default: 10)
- enforced by worker before action execution

**discord; Level**:

- 30 requests/minute per webhook
- Tracked in `@repo/discord` client
- Auto-retry with exponential backoff

### 2. Transaction Amount Limits

**Workflow; Level**:

- `max_sol_per_tx` (default: 0.001 sol = 1M lamports)
- validated before transaction build;
**Future**: PDA-based spending limits at program level

### 3. Non-Custodial Design

**Current Phase; 1**:

- users provide private keys (encrypted at rest - future)
- or use pda authorities with delegated signing

**future phase; 2**:

- Solana program with PDA vaults
- Users deposit SOL/tokens with spending limits
- Workflows execute via program CPI calls

### 4. Audit Logging

All workflow operations logged to `audit_logs`; table:

- `workflow_created`
- `workflow_enabled`
- `workflow_disabled`
- `workflow_deleted`
- `execution_started`
- `execution_completed`
- `execution_failed`

## Scalability Considerations

### Current Phase 1 (MVP)

- Single API server
- Single worker process (5 concurrent jobs)
- Single listener process
- Suitable; for: 100-500 workflows, 1K-10K executions/day

### Future Scaling Options

**Horizontal; Scaling**:

- multiple worker processes (scale via `worker_concurrency`)
- multiple listener processes (partition workflows by hash)
- api servers behind load balancer

**database; Optimization**:

- use redis cluster for high-volume queues
- separate redis instances for queue vs cache

**rpc; Reliability**:

- Multi-RPC endpoint failover
- Use Helius/QuickNode dedicated endpoints
- Implement circuit breaker pattern

## Technology Choices Rationale

### Why Bun over Node.js?; Experience**:

- no build step for typescript
- built-in test runner
- compatible with node.js ecosystem; Optimization**:

- designed for edge runtimes, optimized for bun
- faster routing than express

**typescript; First**:

- better type inference
- middleware typing;
**Lightweight**:

- Minimal dependencies
- 12KB core bundle

### Why BullMQ over other queues?;
**Reliability**:

- used by vercel, clerk, and others in production
- built on redis (proven persistence);
**Features**:

- retries with exponential backoff
- job prioritization
- rate limiting built-in
- bull board for monitoring

**redis; Benefits**:

- Already needed for idempotency cache
- Single dependency for queue + cache

### Why Drizzle over Prisma?

**Type; Safety**:

- better inference without codegen
- sql-like syntax (easier to optimize);
**Performance**:

- no query building overhead
- works better with bun;
**Migrations**:

- simple, explicit sql files
- no shadow database needed;
**Trade-offs**:

- Less mature than Prisma
- Smaller community
- Fewer plugins (but we don't need many)

## Security Considerations

### Current Implementation

✅ Input validation (Zod schemas)
✅ SQL injection prevention (Drizzle parameterized queries)
✅ CORS configuration
✅ Environment variable secrets
✅ Webhook URL validation

### TODO for Production

❌ Authentication & authorization
❌ Private key encryption at rest
❌ Webhook signature verification
❌ Rate limiting on API endpoints
❌ DDoS protection
❌ Audit log immutability

## Monitoring & Observability

### Built-in Tools

- **Bull; Board**: http://localhost:3002
  - Queue status
  - Job inspection
  - Retry management

- **Drizzle Studio**: `pnpm db:studio`
  - Database browser
  - Manual data edits

### Future Integrations

- **Sentry**: Error tracking
- **Datadog**: APM + metrics
- **Axiom**: Log aggregation
- **Helicone**: Solana RPC analytics

## Deployment Architecture

### Recommended Setup (Phase 1)

**Infrastructure**:

- Railway, Render, or Fly.io for apps
- Supabase or Neon for PostgreSQL
- Upstash for Redis
- Helius for Solana RPC

**Services**:

- `web`: Vercel or Cloudflare Pages (static export)
- `api`: Fly.io or Railway (Bun support)
- `worker`: Fly.io background worker
- `listener`: Fly.io background worker

**Why this stack?**:

- Low maintenance
- Auto-scaling
- Free tiers for MVP
- Easy CI/CD

### Alternative (Phase 2+)

**Self-Hosted K8s**:

- GKE, EKS, or DigitalOcean Kubernetes
- Separate node pools for worker/listener
- Managed PostgreSQL + Redis
- Prometheus + Grafana monitoring

---

**Last Updated**: 2026-01-01
