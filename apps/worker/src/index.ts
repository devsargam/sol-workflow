import { Worker, Job } from "bullmq";
import Redis from "ioredis";
import { processWorkflowEvent } from "./processors/workflow-processor";
import { ENV_DEFAULTS, QUEUES } from "utils";

const connection = new Redis(process.env.REDIS_URL || ENV_DEFAULTS.REDIS_URL, {
  maxRetriesPerRequest: null,
});

// Workflow event processor
const workflowWorker = new Worker(
  QUEUES.WORKFLOW_EVENTS,
  async (job: Job) => {
    console.log(`Processing job ${job.id} for workflow ${job.data.workflowId}`);

    try {
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
