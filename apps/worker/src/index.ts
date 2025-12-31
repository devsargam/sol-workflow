import { Worker, Job } from "bullmq";
import Redis from "ioredis";
import { processWorkflowEvent } from "./processors/workflow-processor";

const connection = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

// Workflow event processor
const workflowWorker = new Worker(
  "workflow-events",
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
    concurrency: Number(process.env.WORKER_CONCURRENCY) || 5,
    limiter: {
      max: Number(process.env.RATE_LIMIT_MAX) || 10,
      duration: Number(process.env.RATE_LIMIT_DURATION) || 1000,
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
