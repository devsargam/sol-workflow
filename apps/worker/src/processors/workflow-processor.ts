import Redis from "ioredis";
import { db, executions as executionsTable, eq } from "@repo/db";
import { WorkflowEngine } from "../lib/workflow-engine";
import type { WorkflowGraph } from "@repo/types";
import { ExecutionStatus, REDIS, DATABASE, getExecutionRedisKey } from "utils";

interface WorkflowEventData {
  workflowId: string;
  executionId: string;
  triggerNodeId: string;
  triggerData: any;
  graph: WorkflowGraph;
  metadata?: {
    maxSolPerTx?: number;
    maxExecutionsPerHour?: number;
  };
}

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

/**
 * Process workflow events using the graph-based engine
 */
export async function processWorkflowEvent(data: WorkflowEventData) {
  const { executionId, workflowId, graph, triggerNodeId, triggerData } = data;

  console.log(`📥 Processing execution ${executionId} for workflow ${workflowId} (graph-based)`);

  // Step 1: Check idempotency in Redis (fast check)
  const alreadyProcessed = await redis.get(getExecutionRedisKey(executionId));
  if (alreadyProcessed) {
    console.log(`⏭️  Execution ${executionId} already processed, skipping`);
    return { status: "skipped", reason: "already_processed" };
  }

  // Step 2: Create execution record in database
  try {
    await db.insert(executionsTable).values({
      executionId,
      workflowId,
      status: ExecutionStatus.PROCESSING,
      triggerData,
    });
    console.log(`✅ Created execution record in database`);
  } catch (error: any) {
    // If unique constraint fails, it means another worker processed it
    if (error.code === DATABASE.ERROR_CODES.UNIQUE_CONSTRAINT_VIOLATION) {
      console.log(`⏭️  Execution ${executionId} already exists in DB, skipping`);
      return { status: "skipped", reason: "already_processed" };
    }
    throw error;
  }

  // Step 3: Execute the workflow graph using the engine
  const engine = new WorkflowEngine();

  const context = {
    workflowId,
    executionId,
    triggerNodeId,
    triggerData,
    variables: new Map<string, any>(),
    executionPath: [],
    hasErrors: false,
  };

  try {
    const result = await engine.execute(graph, context);

    if (result.success) {
      // Mark as successful
      const txSignature = context.variables.get("txSignature") || null;

      await db
        .update(executionsTable)
        .set({
          status: ExecutionStatus.SUCCESS,
          txSignature,
          completedAt: new Date(),
        })
        .where(eq(executionsTable.executionId, executionId));

      await redis.setex(
        getExecutionRedisKey(executionId),
        REDIS.TTL.EXECUTION_CACHE,
        REDIS.VALUES.COMPLETED
      );

      console.log(`🎉 Execution ${executionId} completed successfully`);
      console.log(`  Execution path: ${result.executionPath.join(" → ")}`);

      return {
        status: ExecutionStatus.SUCCESS,
        executionId,
        txSignature,
        executionPath: result.executionPath,
      };
    } else {
      // Mark as failed
      const errorMessage = result.errors.join("; ");

      await db
        .update(executionsTable)
        .set({
          status: ExecutionStatus.FAILED,
          txError: errorMessage,
          completedAt: new Date(),
        })
        .where(eq(executionsTable.executionId, executionId));

      await redis.setex(
        getExecutionRedisKey(executionId),
        REDIS.TTL.EXECUTION_CACHE,
        ExecutionStatus.FAILED
      );

      console.error(`❌ Execution ${executionId} failed:`, result.errors);

      return {
        status: ExecutionStatus.FAILED,
        executionId,
        errors: result.errors,
        executionPath: result.executionPath,
      };
    }
  } catch (error) {
    console.error(`❌ Unexpected error in execution ${executionId}:`, error);

    await db
      .update(executionsTable)
      .set({
        status: ExecutionStatus.FAILED,
        txError: (error as Error).message,
        completedAt: new Date(),
      })
      .where(eq(executionsTable.executionId, executionId));

    await redis.setex(
      getExecutionRedisKey(executionId),
      REDIS.TTL.EXECUTION_CACHE,
      ExecutionStatus.FAILED
    );

    throw error;
  }
}
