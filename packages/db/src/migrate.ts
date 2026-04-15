import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { getRequiredEnv } from "utils";

const connectionString = getRequiredEnv("DATABASE_URL");

const sql = postgres(connectionString, { max: 1 });
const db = drizzle(sql);

async function main() {
  console.log("Running migrations...");

  await migrate(db, { migrationsFolder: "./migrations" });

  console.log("✅ Migrations completed successfully");

  await sql.end();
  process.exit(0);
}

main().catch((error) => {
  console.error("❌ Migration failed:", error);
  process.exit(1);
});
