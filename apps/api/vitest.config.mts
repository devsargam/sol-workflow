import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["apps/api/src/**/*.test.ts"],
    exclude: ["apps/api/src/**/__tests__/integration/**"],
    globals: true,
    isolate: true,
    setupFiles: ["apps/api/vitest.setup.ts"],
  },
});
