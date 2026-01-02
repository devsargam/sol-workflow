import { Connection, PublicKey, Commitment } from "@solana/web3.js";
import { Queue } from "bullmq";
import crypto from "crypto";
import { TriggerType, JOB_NAMES, JOB_OPTIONS, SOLANA } from "utils";

interface Workflow {
  id: string;
  name: string;
  graph: any; // The workflow graph with nodes and edges
  metadata: any;
  trigger: {
    type: TriggerType;
    config: any;
  } | null;
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
    const { trigger } = workflow;

    switch (trigger.type) {
      case TriggerType.BALANCE_CHANGE:
        await this.subscribeToBalanceChange(workflow);
        break;
      case TriggerType.TOKEN_RECEIPT:
      case TriggerType.NFT_RECEIPT:
        await this.subscribeToTokenReceipt(workflow);
        break;
      case TriggerType.PROGRAM_LOG:
        await this.subscribeToProgramLogs(workflow);
        break;
      default:
        console.warn(`Unsupported trigger type: ${trigger.type}`);
    }
  }

  private async subscribeToBalanceChange(workflow: Workflow): Promise<void> {
    const address = new PublicKey(workflow.trigger.config.address);

    const subscriptionId = this.connection.onAccountChange(
      address,
      async (accountInfo, context) => {
        console.log(`Account change detected for ${address.toBase58()}`);

        const executionId = this.generateExecutionId(
          workflow.id,
          context.slot,
          address.toBase58()
        );

        await this.queue.add(
          JOB_NAMES.WORKFLOW_EVENT,
          {
            workflowId: workflow.id,
            executionId,
            trigger: {
              type: TriggerType.BALANCE_CHANGE,
              data: {
                address: address.toBase58(),
                lamports: accountInfo.lamports,
                slot: context.slot,
              },
            },
            graph: workflow.graph,
            metadata: workflow.metadata,
          },
          {
            jobId: executionId, // Use execution ID as job ID for deduplication
            ...JOB_OPTIONS.DEFAULT,
          }
        );
      },
      SOLANA.COMMITMENT
    );

    this.subscriptions.set(`${workflow.id}:account`, subscriptionId);
  }

  private async subscribeToTokenReceipt(workflow: Workflow): Promise<void> {
    const address = new PublicKey(workflow.trigger.config.address);

    const subscriptionId = this.connection.onAccountChange(
      address,
      async (accountInfo, context) => {
        console.log(`Token account change detected for ${address.toBase58()}`);

        const executionId = this.generateExecutionId(
          workflow.id,
          context.slot,
          address.toBase58()
        );

        await this.queue.add(
          JOB_NAMES.WORKFLOW_EVENT,
          {
            workflowId: workflow.id,
            executionId,
            trigger: {
              type: workflow.trigger.type,
              data: {
                address: address.toBase58(),
                slot: context.slot,
                accountData: accountInfo.data.toString("base64"),
              },
            },
            graph: workflow.graph,
            metadata: workflow.metadata,
          },
          {
            jobId: executionId,
            ...JOB_OPTIONS.DEFAULT,
          }
        );
      },
      SOLANA.COMMITMENT
    );

    this.subscriptions.set(`${workflow.id}:token`, subscriptionId);
  }

  private async subscribeToProgramLogs(workflow: Workflow): Promise<void> {
    const programId = new PublicKey(workflow.trigger.config.programId);

    const subscriptionId = this.connection.onLogs(
      programId,
      async (logs, context) => {
        console.log(`Program logs detected for ${programId.toBase58()}`);

        const executionId = this.generateExecutionId(
          workflow.id,
          context.slot,
          logs.signature
        );

        await this.queue.add(
          JOB_NAMES.WORKFLOW_EVENT,
          {
            workflowId: workflow.id,
            executionId,
            trigger: {
              type: TriggerType.PROGRAM_LOG,
              data: {
                programId: programId.toBase58(),
                signature: logs.signature,
                logs: logs.logs,
                slot: context.slot,
                err: logs.err,
              },
            },
            graph: workflow.graph,
            metadata: workflow.metadata,
          },
          {
            jobId: executionId,
            ...JOB_OPTIONS.DEFAULT,
          }
        );
      },
      SOLANA.COMMITMENT
    );

    this.subscriptions.set(`${workflow.id}:logs`, subscriptionId);
  }

  async unsubscribe(workflowId: string): Promise<void> {
    for (const [key, subscriptionId] of this.subscriptions.entries()) {
      if (key.startsWith(`${workflowId}:`)) {
        await this.connection.removeAccountChangeListener(subscriptionId);
        this.subscriptions.delete(key);
      }
    }
  }

  async unsubscribeAll(): Promise<void> {
    for (const subscriptionId of this.subscriptions.values()) {
      await this.connection.removeAccountChangeListener(subscriptionId);
    }
    this.subscriptions.clear();
  }

  getStats() {
    return {
      activeSubscriptions: this.subscriptions.size,
    };
  }

  private generateExecutionId(workflowId: string, slot: number, identifier: string): string {
    const data = `${workflowId}:${slot}:${identifier}`;
    return crypto.createHash("sha256").update(data).digest("hex");
  }
}
