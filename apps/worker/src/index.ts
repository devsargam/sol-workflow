import { Worker, Job } from "bullmq";
import Redis from "ioredis";
import crypto from "crypto";
import { processWorkflowEvent } from "./processors/workflow-processor";
import { ENV_DEFAULTS, QUEUES, JOB_NAMES } from "utils";

const connection = new Redis(process.env.REDIS_URL || ENV_DEFAULTS.REDIS_URL, {
  maxRetriesPerRequest: null,
});

/**
 * Generate a unique execution ID for cron triggers
 */
function generateCronExecutionId(workflowId: string, triggerNodeId: string): string {
  const hash = crypto.createHash("sha256");
  hash.update(`${workflowId}:${Date.now()}:${triggerNodeId}:cron`);
  return hash.digest("hex");
}

// Workflow event processor
const workflowWorker = new Worker(
  QUEUES.WORKFLOW_EVENTS,
  async (job: Job) => {
    console.log(`Processing job ${job.id} (${job.name}) for workflow ${job.data.workflowId}`);

    try {
      // Handle cron-trigger jobs
      if (job.name === JOB_NAMES.CRON_TRIGGER) {
        const { workflowId, triggerNodeId, graph, metadata } = job.data;

        // Generate a unique execution ID for this cron run
        const executionId = generateCronExecutionId(workflowId, triggerNodeId);

        // Get repeat info from job options
        const repeatPattern = (job.opts as any).repeat?.pattern;
        const repeatTz = (job.opts as any).repeat?.tz;

        console.log(`Cron trigger fired for workflow ${workflowId}, node ${triggerNodeId}`);

        // Process as a standard workflow event with cron trigger data
        const result = await processWorkflowEvent({
          workflowId,
          executionId,
          triggerNodeId,
          triggerData: {
            type: "cron",
            firedAt: new Date().toISOString(),
            schedule: repeatPattern || "unknown",
            timezone: repeatTz || "UTC",
          },
          graph,
          metadata,
        });

        return result;
      }

      // Handle regular workflow events
      const result = await processWorkflowEvent(job.data);
      return result;
    } catch (error) {
      console.error(`Error processing job ${job.id}:`, error);
      throw error;
    }
  },
  {
    connection,
    concurrency: Number(process.env.WORKER_CONCURRENCY) || ENV_DEFAULTS.WORKER_CONCURRENCY,
    limiter: {
      max: Number(process.env.RATE_LIMIT_MAX) || ENV_DEFAULTS.RATE_LIMIT_MAX,
      duration: Number(process.env.RATE_LIMIT_DURATION) || ENV_DEFAULTS.RATE_LIMIT_DURATION,
    },
  }
);

workflowWorker.on("completed", (job) => {
  console.log(`✅ Job ${job.id} completed successfully`);
});

workflowWorker.on("failed", (job, err) => {
  console.error(`❌ Job ${job?.id} failed:`, err.message);
});

workflowWorker.on("error", (err) => {
  console.error("Worker error:", err);
});

console.log("🔄 Worker started and listening for jobs...");

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, closing worker...");
  await workflowWorker.close();
  await connection.quit();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT received, closing worker...");
  await workflowWorker.close();
  await connection.quit();
  process.exit(0);
});
