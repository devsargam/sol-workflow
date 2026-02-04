import { db, executions, workflows } from "@repo/db";
import { WORKFLOW_METADATA } from "utils";

export const TEST_USER_ID = "user-1";
export const WORKFLOW_ID = "00000000-0000-0000-0000-000000000001";
export const OTHER_WORKFLOW_ID = "00000000-0000-0000-0000-000000000002";

export const EXECUTION_UUID = "00000000-0000-0000-0000-000000000101";
export const EXECUTION_UUID_2 = "00000000-0000-0000-0000-000000000102";
export const EXECUTION_ID = "exec-001";
export const EXECUTION_ID_2 = "exec-002";

export const validGraph = {
  nodes: [
    {
      id: "trigger-1",
      type: "trigger",
      position: { x: 0, y: 0 },
      data: {
        nodeType: "trigger",
        triggerType: "cron",
        config: { schedule: "* * * * *" },
      },
    },
    {
      id: "action-1",
      type: "action",
      position: { x: 100, y: 0 },
      data: {
        nodeType: "action",
        actionType: "do_nothing",
        config: {},
      },
    },
  ],
  edges: [],
};

export async function seedDatabase() {
  await db.insert(workflows).values([
    {
      id: WORKFLOW_ID,
      name: "Workflow One",
      description: "Seed workflow",
      userId: TEST_USER_ID,
      graph: validGraph,
      metadata: {
        version: WORKFLOW_METADATA.VERSION,
        maxSolPerTx: WORKFLOW_METADATA.LIMITS.MAX_SOL_PER_TX,
        maxExecutionsPerHour: WORKFLOW_METADATA.LIMITS.MAX_EXECUTIONS_PER_HOUR,
        createdWith: WORKFLOW_METADATA.CREATED_WITH.API,
      },
      enabled: false,
    },
    {
      id: OTHER_WORKFLOW_ID,
      name: "Workflow Two",
      description: "Seed workflow two",
      userId: TEST_USER_ID,
      graph: validGraph,
      metadata: {
        version: WORKFLOW_METADATA.VERSION,
        maxSolPerTx: WORKFLOW_METADATA.LIMITS.MAX_SOL_PER_TX,
        maxExecutionsPerHour: WORKFLOW_METADATA.LIMITS.MAX_EXECUTIONS_PER_HOUR,
        createdWith: WORKFLOW_METADATA.CREATED_WITH.API,
      },
      enabled: true,
    },
  ]);

  await db.insert(executions).values([
    {
      id: EXECUTION_UUID,
      executionId: EXECUTION_ID,
      workflowId: WORKFLOW_ID,
      status: "success",
      triggerData: { source: "seed" },
    },
    {
      id: EXECUTION_UUID_2,
      executionId: EXECUTION_ID_2,
      workflowId: OTHER_WORKFLOW_ID,
      status: "failed",
      triggerData: { source: "seed" },
    },
  ]);
}
