import { Connection, PublicKey } from "@solana/web3.js";
import { Queue } from "bullmq";
import crypto from "crypto";
import type { WorkflowGraph } from "@repo/types";

interface WorkflowV2 {
  id: string;
  name: string;
  graph: WorkflowGraph;
  metadata?: {
    maxSolPerTx?: number;
    maxExecutionsPerHour?: number;
  };
  enabled: boolean;
}

interface LegacyWorkflow {
  id: string;
  trigger: {
    type: "balance_change" | "token_receipt" | "nft_receipt" | "transaction_status" | "program_log";
    config: any;
  };
  filter: any;
  action: any;
  notify: any;
}

type Workflow = WorkflowV2 | LegacyWorkflow;

export class SubscriptionManagerV2 {
  private subscriptions: Map<string, number> = new Map();
  private connection: Connection;
  private queue: Queue;

  constructor(connection: Connection, queue: Queue) {
    this.connection = connection;
    this.queue = queue;
  }

  async subscribe(workflow: Workflow): Promise<void> {
    if (this.isGraphWorkflow(workflow)) {
      await this.subscribeGraphWorkflow(workflow);
    } else {
      await this.subscribeLegacyWorkflow(workflow as LegacyWorkflow);
    }
  }

  private isGraphWorkflow(workflow: Workflow): workflow is WorkflowV2 {
    return "graph" in workflow;
  }

  /**
   * Subscribe to events for a graph-based workflow
   */
  private async subscribeGraphWorkflow(workflow: WorkflowV2): Promise<void> {
    // Find all trigger nodes in the graph
    const triggerNodes = workflow.graph.nodes.filter(n => n.type === "trigger");

    for (const triggerNode of triggerNodes) {
      const triggerData = triggerNode.data as any;
      const triggerType = triggerData.triggerType;
      const config = triggerData.config || {};

      console.log(`Setting up subscription for trigger node ${triggerNode.id} (${triggerType})`);

      switch (triggerType) {
        case "balance_change":
          await this.subscribeToBalanceChangeV2(workflow, triggerNode.id, config);
          break;
        case "token_receipt":
        case "nft_receipt":
          await this.subscribeToTokenReceiptV2(workflow, triggerNode.id, triggerType, config);
          break;
        case "program_log":
          await this.subscribeToProgramLogsV2(workflow, triggerNode.id, config);
          break;
        default:
          console.warn(`Unsupported trigger type: ${triggerType}`);
      }
    }
  }

  /**
   * Subscribe to balance changes for a graph workflow
   */
  private async subscribeToBalanceChangeV2(
    workflow: WorkflowV2,
    triggerNodeId: string,
    config: any
  ): Promise<void> {
    const address = new PublicKey(config.address);

    const subscriptionId = this.connection.onAccountChange(
      address,
      async (accountInfo, context) => {
        console.log(`Account change detected for ${address.toBase58()} (workflow: ${workflow.name})`);

        const executionId = this.generateExecutionId(
          workflow.id,
          context.slot,
          `${triggerNodeId}-${address.toBase58()}`
        );

        const triggerData = {
          triggerNodeId,
          address: address.toBase58(),
          lamports: accountInfo.lamports,
          slot: context.slot,
          // Calculate balance change if we have previous balance
          // This would require tracking state, omitted for simplicity
        };

        await this.queue.add(
          "workflow-event",
          {
            workflowId: workflow.id,
            executionId,
            graph: workflow.graph,
            triggerData,
            metadata: workflow.metadata,
          },
          {
            jobId: executionId, // Use execution ID as job ID for deduplication
            removeOnComplete: 100,
            removeOnFail: 1000,
          }
        );

        console.log(`✅ Queued execution ${executionId} for workflow ${workflow.id}`);
      },
      "confirmed"
    );

    this.subscriptions.set(`${workflow.id}-${triggerNodeId}`, subscriptionId);
    console.log(`✅ Subscribed to balance changes for ${address.toBase58()}`);
  }

  /**
   * Subscribe to token/NFT receipts for a graph workflow
   */
  private async subscribeToTokenReceiptV2(
    workflow: WorkflowV2,
    triggerNodeId: string,
    type: "token_receipt" | "nft_receipt",
    config: any
  ): Promise<void> {
    // Implementation similar to balance change but for token accounts
    const tokenAccount = config.tokenAccount || config.walletAddress;
    if (!tokenAccount) {
      console.warn(`No token account configured for ${type} trigger`);
      return;
    }

    const account = new PublicKey(tokenAccount);

    const subscriptionId = this.connection.onAccountChange(
      account,
      async (accountInfo, context) => {
        console.log(`Token account change detected for ${account.toBase58()}`);

        const executionId = this.generateExecutionId(
          workflow.id,
          context.slot,
          `${triggerNodeId}-${account.toBase58()}`
        );

        const triggerData = {
          triggerNodeId,
          tokenAccount: account.toBase58(),
          accountData: accountInfo.data,
          slot: context.slot,
          type,
        };

        await this.queue.add(
          "workflow-event",
          {
            workflowId: workflow.id,
            executionId,
            graph: workflow.graph,
            triggerData,
            metadata: workflow.metadata,
          },
          {
            jobId: executionId,
            removeOnComplete: 100,
            removeOnFail: 1000,
          }
        );
      },
      "confirmed"
    );

    this.subscriptions.set(`${workflow.id}-${triggerNodeId}`, subscriptionId);
    console.log(`✅ Subscribed to ${type} for ${account.toBase58()}`);
  }

  /**
   * Subscribe to program logs for a graph workflow
   */
  private async subscribeToProgramLogsV2(
    workflow: WorkflowV2,
    triggerNodeId: string,
    config: any
  ): Promise<void> {
    const programId = new PublicKey(config.programId);

    const subscriptionId = this.connection.onLogs(
      programId,
      async (logs, context) => {
        console.log(`Program logs detected for ${programId.toBase58()}`);

        // Check if logs match the pattern (if configured)
        if (config.logPattern) {
          const pattern = new RegExp(config.logPattern);
          const hasMatch = logs.logs.some(log => pattern.test(log));
          if (!hasMatch) {
            return; // Skip if pattern doesn't match
          }
        }

        const executionId = this.generateExecutionId(
          workflow.id,
          context.slot,
          `${triggerNodeId}-${logs.signature}`
        );

        const triggerData = {
          triggerNodeId,
          programId: programId.toBase58(),
          signature: logs.signature,
          logs: logs.logs,
          slot: context.slot,
        };

        await this.queue.add(
          "workflow-event",
          {
            workflowId: workflow.id,
            executionId,
            graph: workflow.graph,
            triggerData,
            metadata: workflow.metadata,
          },
          {
            jobId: executionId,
            removeOnComplete: 100,
            removeOnFail: 1000,
          }
        );
      },
      "confirmed"
    );

    this.subscriptions.set(`${workflow.id}-${triggerNodeId}`, subscriptionId);
    console.log(`✅ Subscribed to program logs for ${programId.toBase58()}`);
  }

  /**
   * Subscribe to legacy workflow (for backward compatibility)
   */
  private async subscribeLegacyWorkflow(workflow: LegacyWorkflow): Promise<void> {
    const { trigger } = workflow;

    switch (trigger.type) {
      case "balance_change":
        await this.subscribeToBalanceChangeLegacy(workflow);
        break;
      case "token_receipt":
      case "nft_receipt":
        await this.subscribeToTokenReceiptLegacy(workflow);
        break;
      case "program_log":
        await this.subscribeToProgramLogsLegacy(workflow);
        break;
      default:
        console.warn(`Unsupported trigger type: ${trigger.type}`);
    }
  }

  private async subscribeToBalanceChangeLegacy(workflow: LegacyWorkflow): Promise<void> {
    const address = new PublicKey(workflow.trigger.config.address);

    const subscriptionId = this.connection.onAccountChange(
      address,
      async (accountInfo, context) => {
        console.log(`Account change detected for ${address.toBase58()} (legacy workflow)`);

        const executionId = this.generateExecutionId(
          workflow.id,
          context.slot,
          address.toBase58()
        );

        await this.queue.add(
          "workflow-event",
          {
            workflowId: workflow.id,
            executionId,
            trigger: {
              type: "balance_change",
              data: {
                address: address.toBase58(),
                lamports: accountInfo.lamports,
                slot: context.slot,
              },
            },
            filter: workflow.filter,
            action: workflow.action,
            notify: workflow.notify,
          },
          {
            jobId: executionId,
            removeOnComplete: 100,
            removeOnFail: 1000,
          }
        );
      },
      "confirmed"
    );

    this.subscriptions.set(`${workflow.id}`, subscriptionId);
  }

  private async subscribeToTokenReceiptLegacy(workflow: LegacyWorkflow): Promise<void> {
    // Similar to balance change, omitted for brevity
    console.log("Token receipt subscription for legacy workflow");
  }

  private async subscribeToProgramLogsLegacy(workflow: LegacyWorkflow): Promise<void> {
    // Similar to balance change, omitted for brevity
    console.log("Program logs subscription for legacy workflow");
  }

  /**
   * Generate a deterministic execution ID
   */
  private generateExecutionId(workflowId: string, slot: number, identifier: string): string {
    const hash = crypto.createHash("sha256");
    hash.update(`${workflowId}:${slot}:${identifier}`);
    return hash.digest("hex");
  }

  /**
   * Unsubscribe from all subscriptions
   */
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

  /**
   * Get subscription statistics
   */
  getStats() {
    return {
      activeSubscriptions: this.subscriptions.size,
      subscriptionKeys: Array.from(this.subscriptions.keys()),
    };
  }
}