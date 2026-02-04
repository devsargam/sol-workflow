import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["apps/api/src/**/__tests__/integration/**/*.test.ts"],
    globals: true,
    isolate: true,
    setupFiles: ["apps/api/vitest.integration.setup.ts"],
    testTimeout: 20000,
    maxConcurrency: 1,
    sequence: {
      concurrent: false,
    },
    pool: "threads",
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
  },
});
