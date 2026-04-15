import type { Config } from "drizzle-kit";
import { getRequiredEnv } from "utils";

export default {
  schema: "./src/schema/index.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: getRequiredEnv("DATABASE_URL"),
  },
} satisfies Config;
