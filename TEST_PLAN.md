# Test Plan (API)

This file is a shared checklist for expanding API test coverage. It is written so other agents can pick up tasks without extra context.

## ✅ Baseline (Now)
- [x] Add Vitest configuration for API
- [x] Add mocked tests for `/live`, `/ready`, `/health`

## 🔧 Next: Core Route Coverage
- [x] Add `/workflows` list test (mock db select)
- [x] Add `/workflows/:id` fetch test (mock db select with one row)
- [x] Add `/executions` list test (mock db select)
- [ ] Add validation error test for create workflow (invalid payload)

## 🧭 Solana Routes
- [x] Add `/solana/health` test (mock connection)
- [x] Add `/solana/balance/:address` validation + success tests
- [x] Add `/solana/account/:address` validation + success tests

## 🔐 Auth & Security
- [ ] Add test for missing/invalid auth (when auth middleware is enabled)
- [ ] Add CORS origin test for allowed/blocked origins

## ⚙️ Cron & Worker Integration (Mocked)
- [ ] Add test for enabling workflow triggers cron scheduler updates
- [ ] Add test for disabling workflow removes cron

## 🧱 Integration Tests (Real DB/Redis)
- [x] Add docker-compose test setup for Postgres + Redis
- [x] Add migration step before tests
- [x] Add integration tests with seeded data
- [x] Add integration tests for Solana routes

## 📈 Reliability
- [ ] Add API error shape tests (consistent error format)
- [ ] Add request id / tracing headers test if supported

## ⚡ Performance
- [ ] Add simple load test for `/health` under N requests

## 🧪 Tooling Notes
- Keep tests in `apps/api/src/**/__tests__/*.test.ts`
- Use module mocks for `@repo/db`, `bullmq`, `ioredis`, `CronScheduler`
- Prefer `api.fetch(new Request(...))` for Hono without starting a server
