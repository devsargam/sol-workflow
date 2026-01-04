import { z } from "zod";

// Filter condition (still used in graph nodes)
export const FilterConditionSchema = z.object({
  field: z.string(),
  operator: z.enum(["equals", "not_equals", "greater_than", "less_than", "contains", "regex"]),
  value: z.union([z.string(), z.number(), z.boolean()]),
});

export type FilterCondition = z.infer<typeof FilterConditionSchema>;

// Workflow execution status
export const ExecutionStatusEnum = z.enum([
  "pending",
  "processing",
  "success",
  "failed",
  "filtered",
]);

export type ExecutionStatus = z.infer<typeof ExecutionStatusEnum>;

// Workflow execution result
export const WorkflowExecutionSchema = z.object({
  id: z.string().uuid(),
  workflowId: z.string().uuid(),
  executionId: z.string(),
  status: ExecutionStatusEnum,
  triggerData: z.record(z.any()),
  txSignature: z.string().optional(),
  txError: z.string().optional(),
  notificationSent: z.string().datetime().optional(),
  notificationError: z.string().optional(),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime().optional(),
  metadata: z.record(z.any()).optional(),
});

export type WorkflowExecution = z.infer<typeof WorkflowExecutionSchema>;
