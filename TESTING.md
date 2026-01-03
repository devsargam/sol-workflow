# Testing Wallet Watching End-to-End

## 🎯 What We're Testing

The full flow: **Frontend → API → Database → Listener → Solana**

When you create a workflow through the UI and enable it, the listener service will subscribe to Solana and watch for balance changes on that wallet.

## 🚀 Quick Start

### 1. Install New Dependencies

```bash
pnpm install
```

### 2. Start Infrastructure

```bash
docker compose up -d
```

### 3. Run Migrations (if not done yet)

```bash
pnpm db:migrate
```

### 4. Start All Services

Open **4 terminal windows** and run:

```bash
# Terminal 1: Frontend
pnpm dev:web

# Terminal 2: API
pnpm dev:api

# Terminal 3: Worker
pnpm dev:worker

# Terminal 4: Listener
pnpm dev:listener
```

Or run everything together:

```bash
pnpm dev
```

## 📝 Step-by-Step Test

### Step 1: Create a Workflow

1. Open http://localhost:3000/workflows
2. Click **"Create Workflow"**
3. Fill in the form:
   - **Name**: "Watch My Wallet"
   - **Description**: "Test workflow"
   - **Solana Wallet**: Use any valid Solana address (e.g., a devnet wallet)
   - **Discord Webhook**: Get from Discord (Server Settings → Integrations → Webhooks)

4. Click **"Create Workflow"**

### Step 2: Enable the Workflow

1. You should see your workflow in the list
2. Click the **"○ Disabled"** button to toggle it to **"✓ Active"**

### Step 3: Check Listener Logs

In the listener terminal, you should see:

```
🔄 Reloading workflows...
📋 Currently 1 active workflows
✅ Subscribed to events for workflow: <workflow-id> (Watch My Wallet)
```

This means the listener is now watching that Solana address!

### Step 4: Trigger an Event (Optional)

To actually see it work, you'd need to send SOL to that wallet address. On devnet:

```bash
# Install Solana CLI if you haven't
# Then airdrop to the watched address
solana airdrop 1 <YOUR_WALLET_ADDRESS> --url devnet
```

When the balance changes, you should see:

1. **Listener logs**: Account change detected
2. **Worker logs**: Job processing
3. **Discord**: Notification sent

## 🔍 What to Look For

### Frontend (http://localhost:3000/workflows)

✅ **Can create workflows**
✅ **Can see workflows list**
✅ **Can toggle enabled/disabled**
✅ **Shows wallet address in trigger config**

### API Logs

```
GET /workflows → 200
POST /workflows → 201
POST /workflows/:id/toggle → 200
```

### Database

Check in Drizzle Studio:

```bash
pnpm db:studio
```

You should see:

- Workflows table has your workflow
- `enabled` = true when toggled
- `trigger_config` contains the wallet address

### Listener Logs

```
📋 Found 1 active workflows
✅ Subscribed to events for workflow: abc-123 (Watch My Wallet)
📊 Active subscriptions: 1
```

### When Balance Changes (if you test with actual SOL transfer)

```
🔔 Account change detected for <address>
Publishing job to queue: workflow-event
```

## 🐛 Troubleshooting

### "Failed to fetch workflows"

**Check:**

- Is API running? `curl http://localhost:3001/health`
- Is DATABASE_URL correct in `.env`?
- Did migrations run? `pnpm db:migrate`

### "No active workflows" in listener

**Check:**

- Is the workflow **enabled** (green button)?
- Listener reloads every 30 seconds, wait for next cycle
- Check listener logs for database connection errors

### Listener crashes with "Cannot find module @repo/db"

```bash
# Re-install dependencies
pnpm install
```

### React Query errors in frontend

**Check:**

- Is `QueryProvider` in `app/layout.tsx`?
- Is API URL correct? (Should be http://localhost:3001)

## 📊 Success Checklist

- [ ] Frontend loads at http://localhost:3000
- [ ] Can create a workflow via the form
- [ ] Workflow appears in the list
- [ ] Can toggle workflow to "Active"
- [ ] Listener logs show "Subscribed to events for workflow"
- [ ] Active subscriptions count = 1 (or number of enabled workflows)

## 🎉 What This Proves

✅ **Frontend ↔ API**: React Query + API routes working
✅ **API ↔ Database**: Drizzle ORM CRUD working
✅ **Listener ↔ Database**: Loading workflows from DB
✅ **Listener ↔ Solana**: WebSocket subscription active

**Next Steps:**

- Wire up the Worker to actually execute actions
- Test full flow with real Solana transactions
- Add error handling and retries

---

**Current Status**: Backend fully connected, wallet watching works! 🚀
