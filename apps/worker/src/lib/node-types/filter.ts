import type { WorkflowNode, FilterNodeData } from "@repo/types";
import { NodeType } from "utils";
import type { ExecutionContext, NodeManifest, NodeExecutionResult } from "../node-registry";

interface FilterCondition {
  field: string;
  operator: string;
  value?: any;
}

function normalizeReference(field: string): string {
  const trimmed = field.trim();
  if (trimmed.startsWith("<") && trimmed.endsWith(">")) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function resolvePath(value: any, parts: string[]): any {
  let currentValue = value;
  for (const part of parts) {
    if (currentValue && typeof currentValue === "object") {
      currentValue = currentValue[part];
    } else {
      return undefined;
    }
  }
  return currentValue;
}

function resolveVariableReference(reference: string, context: ExecutionContext): any {
  const parts = reference.split(".").filter(Boolean);
  if (parts.length === 0) return undefined;

  const [rootKey, ...rest] = parts;
  if (!rootKey) return undefined;

  if (rootKey === "trigger") return resolvePath(context.triggerData, rest);
  if (rootKey === "workflow") return resolvePath(context.workflowVariables, rest);
  if (rootKey === "steps") {
    const [stepId, ...stepRest] = rest;
    if (!stepId) return context.stepOutputs;
    return resolvePath(context.stepOutputs[stepId], stepRest);
  }

  const rootValue = context.variables.get(rootKey);
  return resolvePath(rootValue, rest);
}

function getFieldValue(field: string, context: ExecutionContext): any {
  const normalized = normalizeReference(field);
  if (!normalized) return undefined;

  if (normalized.startsWith("$")) {
    return resolveVariableReference(normalized.slice(1), context);
  }

  const parts = normalized.split(".").filter(Boolean);
  if (parts.length === 0) return undefined;
  const rootPart = parts[0];
  if (!rootPart) return undefined;

  if (rootPart === "trigger") return resolvePath(context.triggerData, parts.slice(1));
  if (rootPart === "workflow") return resolvePath(context.workflowVariables, parts.slice(1));
  if (rootPart === "steps") {
    const [, stepId, ...rest] = parts;
    if (!stepId) return context.stepOutputs;
    return resolvePath(context.stepOutputs[stepId], rest);
  }

  if (rootPart in context.stepOutputs) {
    return resolvePath(context.stepOutputs[rootPart], parts.slice(1));
  }

  const fromTriggerData = resolvePath(context.triggerData, parts);
  if (fromTriggerData !== undefined) return fromTriggerData;

  return resolveVariableReference(normalized, context);
}

function evaluateCondition(condition: FilterCondition, context: ExecutionContext): boolean {
  const fieldValue = getFieldValue(condition.field, context);
  const compareValue = condition.value;

  switch (condition.operator) {
    case "equals":
    case "==":
      return fieldValue == compareValue;
    case "not_equals":
    case "!=":
      return fieldValue != compareValue;
    case "greater_than":
    case ">":
      return Number(fieldValue) > Number(compareValue);
    case "greater_than_or_equal":
    case ">=":
      return Number(fieldValue) >= Number(compareValue);
    case "less_than":
    case "<":
      return Number(fieldValue) < Number(compareValue);
    case "less_than_or_equal":
    case "<=":
      return Number(fieldValue) <= Number(compareValue);
    case "contains":
      return String(fieldValue).includes(String(compareValue));
    case "starts_with":
      return String(fieldValue).startsWith(String(compareValue));
    case "ends_with":
      return String(fieldValue).endsWith(String(compareValue));
    default:
      console.warn(`Unknown operator: ${condition.operator}`);
      return false;
  }
}

export const filterManifest: NodeManifest = {
  type: NodeType.FILTER,
  kind: "node",

  async execute(node: WorkflowNode, context: ExecutionContext): Promise<NodeExecutionResult> {
    const data = node.data as FilterNodeData & { nodeType: NodeType.FILTER };
    const conditions = data.conditions || [];
    const logic = data.logic || "and";

    console.log(
      `Filter node ${node.id}: Evaluating ${conditions.length} conditions with ${logic} logic`
    );

    if (conditions.length === 0) {
      return { success: true, output: true, handle: "if" };
    }

    const results = conditions.map((c: any) => evaluateCondition(c, context));
    const passed =
      logic === "and" ? results.every((r: boolean) => r) : results.some((r: boolean) => r);

    console.log(`Filter node ${node.id}: Result = ${passed}`);

    return {
      success: true,
      output: passed,
      handle: passed ? "if" : "else",
    };
  },

  scopeOutput(node, result) {
    const data = node.data as FilterNodeData & { nodeType: NodeType.FILTER };
    return {
      output: result.output,
      passed: result.output === true,
      logic: data.logic || "and",
      conditions: data.conditions || [],
    };
  },
};
