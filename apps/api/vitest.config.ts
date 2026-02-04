import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["apps/api/src/**/*.test.ts"],
    globals: true,
    isolate: true,
    setupFiles: ["apps/api/vitest.setup.ts"],
  },
});
