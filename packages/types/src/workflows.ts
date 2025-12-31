import { z } from "zod";
import { TriggerSchema } from "./triggers";
import { ActionSchema } from "./actions";
import { NotificationSchema } from "./notifications";

// Filter condition
export const FilterConditionSchema = z.object({
  field: z.string(),
  operator: z.enum(["equals", "not_equals", "greater_than", "less_than", "contains", "regex"]),
  value: z.union([z.string(), z.number(), z.boolean()]),
});

export type FilterCondition = z.infer<typeof FilterConditionSchema>;

// Filter schema
export const FilterSchema = z.object({
  conditions: z.array(FilterConditionSchema),
  logic: z.enum(["AND", "OR"]).default("AND"),
});

export type Filter = z.infer<typeof FilterSchema>;

// Complete workflow schema
export const WorkflowSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  trigger: TriggerSchema,
  filter: FilterSchema,
  action: ActionSchema,
  notify: NotificationSchema,
  maxSolPerTx: z.number().positive().optional().default(1000000), // 0.001 SOL default
  maxExecutionsPerHour: z.number().int().positive().optional().default(10),
  enabled: z.boolean().default(false),
});

export type Workflow = z.infer<typeof WorkflowSchema>;

// Create workflow request
export const CreateWorkflowSchema = WorkflowSchema.omit({ enabled: true });

export type CreateWorkflow = z.infer<typeof CreateWorkflowSchema>;

// Update workflow request
export const UpdateWorkflowSchema = WorkflowSchema.partial();

export type UpdateWorkflow = z.infer<typeof UpdateWorkflowSchema>;

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
