# Sol Workflow

Solana-native automation platform for DAO operators and NFT community managers.

## Phase 1: Linear Workflow Automation

Create simple workflows that react to on-chain events and automatically trigger on-chain actions with Discord notifications.

**Workflow Structure:** Trigger → Filter → Action → Notify

### Tech Stack

- **Frontend:** Next.js 14+ with shadcn/ui
- **Backend:** Bun + Hono API
- **Workers:** BullMQ with Redis
- **Database:** PostgreSQL with Drizzle ORM
- **Blockchain:** Solana (WebSocket subscriptions via @solana/web3.js)

## 🚀 Quick Start

### Automated Setup (Recommended)

```bash
# Run the setup script
./scripts/setup.sh

# Start all services
pnpm dev
```

### Manual Setup

**Prerequisites:**
- Node.js 20+
- pnpm 8+
- Bun 1.0+
- Docker & Docker Compose

```bash
# 1. Copy environment variables
cp .env.example .env

# 2. Install dependencies
pnpm install

# 3. Start infrastructure (PostgreSQL + Redis + Bull Board)
docker compose up -d

# 4. Run database migrations
pnpm db:migrate

# 5. Start all services
pnpm dev
```

### Access Points

- **Web UI:** http://localhost:3000 - Workflow builder interface
- **API:** http://localhost:3001 - REST API server
- **Bull Board:** http://localhost:3002 - Queue monitoring dashboard
- **DB Studio:** Run `pnpm db:studio` - Database browser

## 📖 Documentation

- **[SETUP.md](./SETUP.md)** - Detailed setup guide and troubleshooting
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture and design decisions
- **[ROADMAP.md](./ROADMAP.md)** - Development roadmap and feature timeline

### Monorepo Structure

```
.
├── apps/
│   ├── web/          # Next.js frontend
│   ├── api/          # Hono API server
│   ├── worker/       # BullMQ workflow executor
│   └── listener/     # Solana WebSocket event listener
├── packages/
│   ├── db/           # Drizzle ORM + PostgreSQL schema
│   ├── types/        # Shared TypeScript types + Zod schemas
│   ├── solana/       # Solana utilities
│   └── discord/      # Discord webhook client
└── docker-compose.yml
```

## Features

### Supported Triggers
- Wallet balance changes
- Token/NFT receipts
- Transaction success/failure
- Program log events

### Supported Actions
- Send SOL
- Send SPL tokens
- Call predefined program instructions (via IDLs)

### Notifications
- Discord webhooks with prebuilt templates

## Architecture

- **Real-time:** WebSocket-based Solana subscriptions
- **Reliability:** Idempotent execution with Redis deduplication
- **Security:** PDA-based authorities with strict limits (no custodial fund handling)
- **Scalability:** Worker queue architecture with BullMQ

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed system design.

## 🎯 Current Status

**Phase 1 - Week 0: Project Setup** ✅ **COMPLETE**

All infrastructure scaffolded and ready for development:
- ✅ Monorepo structure with pnpm workspaces
- ✅ Next.js frontend with shadcn/ui (Vega theme)
- ✅ Hono API server with Bun runtime
- ✅ BullMQ worker service
- ✅ Solana WebSocket listener
- ✅ PostgreSQL database with Drizzle ORM
- ✅ Shared type definitions and utilities
- ✅ Docker Compose for local development

**Next Up: Week 1-2 - Backend Integration**

See [ROADMAP.md](./ROADMAP.md) for the complete development timeline.

## 🤝 Contributing

Contributions are welcome! Please read the documentation first:

1. **Setup**: Follow [SETUP.md](./SETUP.md) for local development setup
2. **Architecture**: Understand the system in [ARCHITECTURE.md](./ARCHITECTURE.md)
3. **Roadmap**: Check [ROADMAP.md](./ROADMAP.md) for planned features

## 📄 License

MIT

---

**Built with** ❤️ **for the Solana ecosystem**
