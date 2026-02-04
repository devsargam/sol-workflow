import type { Queue } from "bullmq";
import { CronScheduler } from "./lib/cron-scheduler";
import { db, workflows as workflowsTable } from "@repo/db";
import { log } from "utils";

let cronScheduler: CronScheduler | null = null;

export function getCronScheduler(): CronScheduler | null {
  return cronScheduler;
}

export async function initCronScheduler(workflowQueue: Queue) {
  try {
    cronScheduler = new CronScheduler(workflowQueue);

    const allWorkflows = await db.select().from(workflowsTable);

    const workflowsForReconciliation = allWorkflows.map((w) => ({
      id: w.id,
      graph: w.graph as any,
      metadata: w.metadata,
      enabled: w.enabled,
    }));

    const result = await cronScheduler.reconcileAll(workflowsForReconciliation);

    log.info(
      `Cron scheduler initialized: ${result.added} jobs added, ${result.removed} jobs removed`,
      {
        service: "api",
        added: result.added,
        removed: result.removed,
      }
    );
  } catch (error) {
    log.error("Failed to initialize cron scheduler", error as Error, {
      service: "api",
    });
  }
}
