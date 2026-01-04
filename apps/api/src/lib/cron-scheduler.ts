import { Queue } from "bullmq";
import { Cron } from "croner";
import type { WorkflowGraph } from "@repo/types";
import { CRON, JOB_OPTIONS, TriggerType, NodeType, JOB_NAMES, log } from "utils";

interface CronJobData {
  workflowId: string;
  triggerNodeId: string;
  schedule: string;
  timezone: string;
  graph: WorkflowGraph;
  metadata: any;
}

interface CronTriggerInfo {
  nodeId: string;
  schedule: string;
  timezone: string;
}

export class CronScheduler {
  private queue: Queue;

  constructor(queue: Queue) {
    this.queue = queue;
  }

  /**
   * Generate a unique job ID for a cron trigger
   */
  private getJobId(workflowId: string, triggerNodeId: string): string {
    return `cron:${workflowId}:${triggerNodeId}`;
  }

  /**
   * Validate a cron expression and check minimum interval (1 minute)
   */
  validateCronExpression(schedule: string): { valid: boolean; error?: string } {
    try {
      const cron = new Cron(schedule);

      // Get next 2 runs to calculate interval
      const nextRuns = cron.nextRuns(2);
      if (nextRuns.length >= 2 && nextRuns[0] && nextRuns[1]) {
        const intervalMs = nextRuns[1].getTime() - nextRuns[0].getTime();
        if (intervalMs < CRON.MIN_INTERVAL_SECONDS * 1000) {
          return {
            valid: false,
            error: `Cron interval must be at least ${CRON.MIN_INTERVAL_SECONDS} seconds (1 minute). Your schedule would run every ${Math.round(intervalMs / 1000)} seconds.`,
          };
        }
      }

      return { valid: true };
    } catch (e) {
      return {
        valid: false,
        error: `Invalid cron expression: ${(e as Error).message}`,
      };
    }
  }

  /**
   * Get the next N scheduled run times for a cron expression
   */
  getNextRuns(schedule: string, count: number = 3): Date[] {
    try {
      const cron = new Cron(schedule);
      return cron.nextRuns(count);
    } catch {
      return [];
    }
  }

  /**
   * Schedule a cron trigger as a BullMQ repeatable job
   */
  async scheduleCronTrigger(data: CronJobData): Promise<void> {
    const jobId = this.getJobId(data.workflowId, data.triggerNodeId);

    // First remove any existing job with this ID to handle updates
    await this.removeCronTrigger(data.workflowId, data.triggerNodeId);

    await this.queue.add(
      JOB_NAMES.CRON_TRIGGER,
      {
        workflowId: data.workflowId,
        triggerNodeId: data.triggerNodeId,
        graph: data.graph,
        metadata: data.metadata,
      },
      {
        repeat: {
          pattern: data.schedule,
          tz: data.timezone || "UTC",
        },
        jobId,
        removeOnComplete: JOB_OPTIONS.DEFAULT.removeOnComplete,
        removeOnFail: JOB_OPTIONS.DEFAULT.removeOnFail,
      }
    );

    log.info(`Scheduled cron trigger: ${jobId} with pattern "${data.schedule}"`, {
      service: "api",
      workflowId: data.workflowId,
      triggerNodeId: data.triggerNodeId,
      schedule: data.schedule,
      timezone: data.timezone,
    });
  }

  /**
   * Remove a specific cron trigger's repeatable job
   */
  async removeCronTrigger(workflowId: string, triggerNodeId: string): Promise<boolean> {
    const jobId = this.getJobId(workflowId, triggerNodeId);
    const repeatableJobs = await this.queue.getRepeatableJobs();

    for (const job of repeatableJobs) {
      if (job.id === jobId) {
        await this.queue.removeRepeatableByKey(job.key);
        log.info(`Removed cron trigger: ${jobId}`, {
          service: "api",
          workflowId,
          triggerNodeId,
        });
        return true;
      }
    }
    return false;
  }

  /**
   * Remove all cron triggers for a workflow
   */
  async removeAllForWorkflow(workflowId: string): Promise<number> {
    const repeatableJobs = await this.queue.getRepeatableJobs();
    let removed = 0;

    for (const job of repeatableJobs) {
      if (job.id?.startsWith(`cron:${workflowId}:`)) {
        await this.queue.removeRepeatableByKey(job.key);
        removed++;
      }
    }

    if (removed > 0) {
      log.info(`Removed ${removed} cron trigger(s) for workflow ${workflowId}`, {
        service: "api",
        workflowId,
        removedCount: removed,
      });
    }

    return removed;
  }

  /**
   * Extract cron triggers from a workflow graph
   */
  getCronTriggersFromGraph(graph: WorkflowGraph): CronTriggerInfo[] {
    return graph.nodes
      .filter((n) => {
        const data = n.data as any;
        return n.type === NodeType.TRIGGER && data?.triggerType === TriggerType.CRON;
      })
      .map((n) => {
        const data = n.data as any;
        return {
          nodeId: n.id,
          schedule: data?.config?.schedule || "",
          timezone: data?.config?.timezone || "UTC",
        };
      })
      .filter((t) => t.schedule); // Only include triggers with a schedule
  }

  /**
   * Validate all cron triggers in a workflow graph
   */
  validateWorkflowCronTriggers(graph: WorkflowGraph): { valid: boolean; errors: string[] } {
    const cronTriggers = this.getCronTriggersFromGraph(graph);
    const errors: string[] = [];

    for (const trigger of cronTriggers) {
      const validation = this.validateCronExpression(trigger.schedule);
      if (!validation.valid) {
        errors.push(`Trigger node ${trigger.nodeId}: ${validation.error}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Sync cron jobs for a workflow (add/remove as needed based on enabled state)
   */
  async syncWorkflowCronJobs(
    workflowId: string,
    graph: WorkflowGraph,
    metadata: any,
    enabled: boolean
  ): Promise<{ added: number; removed: number }> {
    const cronTriggers = this.getCronTriggersFromGraph(graph);
    let added = 0;
    let removed = 0;

    // If workflow is disabled or has no cron triggers, remove all cron jobs
    if (!enabled || cronTriggers.length === 0) {
      removed = await this.removeAllForWorkflow(workflowId);
      return { added, removed };
    }

    // Get existing jobs for this workflow
    const repeatableJobs = await this.queue.getRepeatableJobs();
    const existingJobIds = new Set(
      repeatableJobs.filter((j) => j.id?.startsWith(`cron:${workflowId}:`)).map((j) => j.id)
    );

    const expectedJobIds = new Set<string>();

    // Add/update cron jobs for each trigger
    for (const trigger of cronTriggers) {
      const jobId = this.getJobId(workflowId, trigger.nodeId);
      expectedJobIds.add(jobId);

      // Always reschedule to handle config updates
      await this.scheduleCronTrigger({
        workflowId,
        triggerNodeId: trigger.nodeId,
        schedule: trigger.schedule,
        timezone: trigger.timezone,
        graph,
        metadata,
      });

      if (!existingJobIds.has(jobId)) {
        added++;
      }
    }

    // Remove orphaned jobs (triggers that were removed from the workflow)
    for (const jobId of existingJobIds) {
      if (!expectedJobIds.has(jobId!)) {
        const parts = jobId!.split(":");
        const triggerNodeId = parts.slice(2).join(":"); // Handle node IDs that might contain colons
        await this.removeCronTrigger(workflowId, triggerNodeId);
        removed++;
      }
    }

    return { added, removed };
  }

  /**
   * Reconcile all cron jobs with database state (call on API startup)
   */
  async reconcileAll(
    activeWorkflows: Array<{
      id: string;
      graph: WorkflowGraph;
      metadata: any;
      enabled: boolean;
    }>
  ): Promise<{ added: number; removed: number }> {
    let totalAdded = 0;
    let totalRemoved = 0;

    // Build set of expected job IDs from enabled workflows
    const expectedJobIds = new Set<string>();

    for (const workflow of activeWorkflows) {
      if (!workflow.enabled) continue;

      const cronTriggers = this.getCronTriggersFromGraph(workflow.graph);
      for (const trigger of cronTriggers) {
        expectedJobIds.add(this.getJobId(workflow.id, trigger.nodeId));
      }
    }

    // Get all existing cron jobs
    const repeatableJobs = await this.queue.getRepeatableJobs();
    const existingCronJobs = repeatableJobs.filter((j) => j.id?.startsWith("cron:"));

    // Remove orphaned jobs (workflows that were deleted or disabled)
    for (const job of existingCronJobs) {
      if (!expectedJobIds.has(job.id!)) {
        await this.queue.removeRepeatableByKey(job.key);
        totalRemoved++;
      }
    }

    // Add missing jobs for enabled workflows
    for (const workflow of activeWorkflows) {
      if (!workflow.enabled) continue;

      const cronTriggers = this.getCronTriggersFromGraph(workflow.graph);
      for (const trigger of cronTriggers) {
        const jobId = this.getJobId(workflow.id, trigger.nodeId);

        // Check if job already exists
        const existingJob = existingCronJobs.find((j) => j.id === jobId);
        if (!existingJob) {
          await this.scheduleCronTrigger({
            workflowId: workflow.id,
            triggerNodeId: trigger.nodeId,
            schedule: trigger.schedule,
            timezone: trigger.timezone,
            graph: workflow.graph,
            metadata: workflow.metadata,
          });
          totalAdded++;
        }
      }
    }

    log.info(`Cron reconciliation complete: ${totalAdded} added, ${totalRemoved} removed`, {
      service: "api",
      added: totalAdded,
      removed: totalRemoved,
    });

    return { added: totalAdded, removed: totalRemoved };
  }

  /**
   * Get stats about active cron jobs
   */
  async getStats(): Promise<{ activeCronJobs: number; jobIds: string[] }> {
    const repeatableJobs = await this.queue.getRepeatableJobs();
    const cronJobs = repeatableJobs.filter((j) => j.id?.startsWith("cron:"));

    return {
      activeCronJobs: cronJobs.length,
      jobIds: cronJobs.map((j) => j.id!),
    };
  }
}
