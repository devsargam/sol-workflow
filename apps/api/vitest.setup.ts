import { vi } from "vitest";

process.env.CORS_ORIGIN = "http://localhost:3000";
process.env.AUTH_SECRET = "test-auth-secret";
process.env.REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
process.env.NODE_ENV = "test";
process.env.ENABLE_CRON = "false";
