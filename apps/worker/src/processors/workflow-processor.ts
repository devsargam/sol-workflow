import Redis from "ioredis";
import { Connection } from "@solana/web3.js";
import { db, executions as executionsTable, workflows as workflowsTable, eq } from "@repo/db";
import { WorkflowEngine } from "../lib/workflow-engine";
import type { WorkflowGraph } from "@repo/types";
import {
  ExecutionStatus,
  REDIS,
  DATABASE,
  ENV_DEFAULTS,
  getExecutionRedisKey,
  logger,
} from "utils";

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

  const [workflow] = await db
    .select()
    .from(workflowsTable)
    .where(eq(workflowsTable.id, workflowId))
    .limit(1);

  if (!workflow) {
    throw new Error(`Workflow ${workflowId} not found`);
  }

  const connection = new Connection(process.env.SOLANA_RPC_URL || ENV_DEFAULTS.SOLANA_RPC_URL);

  const engine = new WorkflowEngine(connection);

  const context = {
    workflowId,
    executionId,
    triggerNodeId,
    triggerData,
    variables: new Map<string, any>(),
    executionPath: [],
    hasErrors: false,
    workflowMetadata: workflow.metadata as any,
  };

  try {
    const result = await engine.execute(graph, context);

    if (result.success) {
      // Mark as successful
      const txSignature = context.variables.get("txSignature") || null;
      const kalshiOrder = context.variables.get("kalshiOrder") || null;

      const executionMetadata: any = {};
      if (kalshiOrder) {
        executionMetadata.kalshiOrder = kalshiOrder;
      }

      await db
        .update(executionsTable)
        .set({
          status: ExecutionStatus.SUCCESS,
          txSignature,
          completedAt: new Date(),
          metadata: executionMetadata,
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
          metadata: { errors: result.errors },
        })
        .where(eq(executionsTable.executionId, executionId));

      await redis.setex(
        getExecutionRedisKey(executionId),
        REDIS.TTL.EXECUTION_CACHE,
        ExecutionStatus.FAILED
      );

      logger.error(`Execution ${executionId} failed:`, new Error(result.errors.join("; ")), {
        workflowId,
        executionId,
      });

      return {
        status: ExecutionStatus.FAILED,
        executionId,
        errors: result.errors,
        executionPath: result.executionPath,
      };
    }
  } catch (error) {
    logger.error(`Unexpected error in execution ${executionId}:`, new Error(error as string), {
      workflowId,
      executionId,
    });

    await db
      .update(executionsTable)
      .set({
        status: ExecutionStatus.FAILED,
        txError: (error as Error).message,
        completedAt: new Date(),
        metadata: { error: (error as Error).message },
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
