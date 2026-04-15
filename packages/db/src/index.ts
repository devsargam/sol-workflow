import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getRequiredEnv } from "utils";
import * as schema from "./schema";

const connectionString = getRequiredEnv("DATABASE_URL");

// Disable prefetch for Bun compatibility
const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, { schema });

export * from "./schema";
export { eq, and, or, isNull, isNotNull, inArray, sql } from "drizzle-orm";
export type { Workflow, NewWorkflow } from "./schema/workflows";
export type { Execution, NewExecution } from "./schema/executions";
export type { TriggerSubscription, NewTriggerSubscription } from "./schema/trigger-subscriptions";
export type { AuditLog, NewAuditLog } from "./schema/audit-logs";
