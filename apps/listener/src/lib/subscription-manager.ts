import { Connection, PublicKey } from "@solana/web3.js";
import { Queue } from "bullmq";
import crypto from "crypto";
import { TriggerType, JOB_NAMES, JOB_OPTIONS, SOLANA, NodeType } from "utils";
import type { WorkflowGraph } from "@repo/types";

interface Workflow {
  id: string;
  name: string;
  graph: WorkflowGraph;
  metadata: any;
}

interface TriggerNode {
  id: string;
  type: string;
  data: {
    triggerType: TriggerType;
    config: any;
  };
}

export class SubscriptionManager {
  private subscriptions: Map<string, number> = new Map();
  private connection: Connection;
  private queue: Queue;

  constructor(connection: Connection, queue: Queue) {
    this.connection = connection;
    this.queue = queue;
  }

  async subscribe(workflow: Workflow): Promise<void> {
    // Extract all trigger nodes from the graph
    const triggerNodes = workflow.graph.nodes.filter(
      (n) => n.type === NodeType.TRIGGER
    ) as TriggerNode[];

    if (triggerNodes.length === 0) {
      console.warn(`No trigger nodes found in workflow ${workflow.id}`);
      return;
    }

    // Subscribe to each trigger node
    for (const triggerNode of triggerNodes) {
      const { triggerType, config } = triggerNode.data;

      console.log(`Setting up subscription for trigger node ${triggerNode.id} (${triggerType})`);

      switch (triggerType) {
        case TriggerType.BALANCE_CHANGE:
          await this.subscribeToBalanceChange(workflow, triggerNode.id, config);
          break;
        case TriggerType.TOKEN_RECEIPT:
        case TriggerType.NFT_RECEIPT:
          await this.subscribeToTokenReceipt(workflow, triggerNode.id, triggerType, config);
          break;
        case TriggerType.PROGRAM_LOG:
          await this.subscribeToProgramLogs(workflow, triggerNode.id, config);
          break;
        default:
          console.warn(`Unsupported trigger type: ${triggerType}`);
      }
    }
  }

  private async subscribeToBalanceChange(
    workflow: Workflow,
    triggerNodeId: string,
    config: any
  ): Promise<void> {
    const address = new PublicKey(config.address);

    const subscriptionId = this.connection.onAccountChange(
      address,
      async (accountInfo, context) => {
        console.log(
          `Account change detected for ${address.toBase58()} (workflow: ${workflow.name})`
        );

        const executionId = this.generateExecutionId(
          workflow.id,
          context.slot,
          `${triggerNodeId}-${address.toBase58()}`
        );

        await this.queue.add(
          JOB_NAMES.WORKFLOW_EVENT,
          {
            workflowId: workflow.id,
            executionId,
            triggerNodeId,
            triggerData: {
              address: address.toBase58(),
              lamports: accountInfo.lamports,
              slot: context.slot,
            },
            graph: workflow.graph,
            metadata: workflow.metadata,
          },
          {
            jobId: executionId,
            ...JOB_OPTIONS.DEFAULT,
          }
        );

        console.log(`✅ Queued execution ${executionId} for workflow ${workflow.id}`);
      },
      SOLANA.COMMITMENT
    );

    this.subscriptions.set(`${workflow.id}-${triggerNodeId}`, subscriptionId);
    console.log(`✅ Subscribed to balance changes for ${address.toBase58()}`);
  }

  private async subscribeToTokenReceipt(
    workflow: Workflow,
    triggerNodeId: string,
    triggerType: TriggerType.TOKEN_RECEIPT | TriggerType.NFT_RECEIPT,
    config: any
  ): Promise<void> {
    const address = new PublicKey(config.address);

    const subscriptionId = this.connection.onAccountChange(
      address,
      async (accountInfo, context) => {
        console.log(
          `Token account change detected for ${address.toBase58()} (workflow: ${workflow.name})`
        );

        const executionId = this.generateExecutionId(
          workflow.id,
          context.slot,
          `${triggerNodeId}-${address.toBase58()}`
        );

        await this.queue.add(
          JOB_NAMES.WORKFLOW_EVENT,
          {
            workflowId: workflow.id,
            executionId,
            triggerNodeId,
            triggerData: {
              address: address.toBase58(),
              slot: context.slot,
              accountData: accountInfo.data.toString("base64"),
              type: triggerType,
            },
            graph: workflow.graph,
            metadata: workflow.metadata,
          },
          {
            jobId: executionId,
            ...JOB_OPTIONS.DEFAULT,
          }
        );

        console.log(`✅ Queued execution ${executionId} for workflow ${workflow.id}`);
      },
      SOLANA.COMMITMENT
    );

    this.subscriptions.set(`${workflow.id}-${triggerNodeId}`, subscriptionId);
    console.log(`✅ Subscribed to ${triggerType} for ${address.toBase58()}`);
  }

  private async subscribeToProgramLogs(
    workflow: Workflow,
    triggerNodeId: string,
    config: any
  ): Promise<void> {
    const programId = new PublicKey(config.programId);

    const subscriptionId = this.connection.onLogs(
      programId,
      async (logs, context) => {
        console.log(
          `Program logs detected for ${programId.toBase58()} (workflow: ${workflow.name})`
        );

        // Check if logs match the pattern (if configured)
        if (config.logPattern) {
          const pattern = new RegExp(config.logPattern);
          const hasMatch = logs.logs.some((log) => pattern.test(log));
          if (!hasMatch) {
            return; // Skip if pattern doesn't match
          }
        }

        const executionId = this.generateExecutionId(
          workflow.id,
          context.slot,
          `${triggerNodeId}-${logs.signature}`
        );

        await this.queue.add(
          JOB_NAMES.WORKFLOW_EVENT,
          {
            workflowId: workflow.id,
            executionId,
            triggerNodeId,
            triggerData: {
              programId: programId.toBase58(),
              signature: logs.signature,
              logs: logs.logs,
              slot: context.slot,
              err: logs.err,
            },
            graph: workflow.graph,
            metadata: workflow.metadata,
          },
          {
            jobId: executionId,
            ...JOB_OPTIONS.DEFAULT,
          }
        );

        console.log(`✅ Queued execution ${executionId} for workflow ${workflow.id}`);
      },
      SOLANA.COMMITMENT
    );

    this.subscriptions.set(`${workflow.id}-${triggerNodeId}`, subscriptionId);
    console.log(`✅ Subscribed to program logs for ${programId.toBase58()}`);
  }

  async unsubscribe(workflowId: string): Promise<void> {
    for (const [key, subscriptionId] of this.subscriptions.entries()) {
      if (key.startsWith(`${workflowId}-`)) {
        await this.connection.removeAccountChangeListener(subscriptionId);
        this.subscriptions.delete(key);
        console.log(`✅ Unsubscribed from ${key}`);
      }
    }
  }

  async unsubscribeAll(): Promise<void> {
    for (const [key, subscriptionId] of this.subscriptions.entries()) {
      try {
        await this.connection.removeAccountChangeListener(subscriptionId);
        console.log(`✅ Unsubscribed from ${key}`);
      } catch (error) {
        console.error(`Failed to unsubscribe from ${key}:`, error);
      }
    }
    this.subscriptions.clear();
  }

  getStats() {
    return {
      activeSubscriptions: this.subscriptions.size,
      subscriptionKeys: Array.from(this.subscriptions.keys()),
    };
  }

  private generateExecutionId(workflowId: string, slot: number, identifier: string): string {
    const hash = crypto.createHash("sha256");
    hash.update(`${workflowId}:${slot}:${identifier}`);
    return hash.digest("hex");
  }
}
