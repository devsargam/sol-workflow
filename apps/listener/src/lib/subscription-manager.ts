import { Connection, PublicKey } from "@solana/web3.js";
import { Queue } from "bullmq";
import {
  TriggerType,
  JOB_NAMES,
  JOB_OPTIONS,
  SOLANA,
  NodeType,
  log,
  generateExecutionId,
} from "utils";
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
    const triggerNodes = workflow.graph.nodes.filter(
      (n) => n.type === NodeType.TRIGGER
    ) as TriggerNode[];

    log.debug(
      `[SubscriptionManager] Workflow ${workflow.id}: Found ${triggerNodes.length} trigger nodes out of ${workflow.graph.nodes.length} total nodes`,
      {
        service: "listener",
        workflowId: workflow.id,
        triggerNodeCount: triggerNodes.length,
        totalNodeCount: workflow.graph.nodes.length,
      }
    );

    if (triggerNodes.length === 0) {
      log.warn(`No trigger nodes found in workflow ${workflow.id}`, {
        service: "listener",
        workflowId: workflow.id,
        availableNodeTypes: workflow.graph.nodes.map((n) => n.type).join(", "),
      });
      return;
    }

    for (const triggerNode of triggerNodes) {
      log.debug(`[SubscriptionManager] Processing trigger node ${triggerNode.id}`, {
        service: "listener",
        workflowId: workflow.id,
        triggerNodeId: triggerNode.id,
        triggerNodeData: triggerNode.data,
      });

      const { triggerType, config } = triggerNode.data;

      if (!triggerType) {
        log.error(
          `[SubscriptionManager] Trigger node ${triggerNode.id} missing triggerType`,
          new Error("Missing triggerType"),
          {
            service: "listener",
            workflowId: workflow.id,
            triggerNodeId: triggerNode.id,
            triggerNodeData: triggerNode.data,
          }
        );
        continue;
      }

      if (!config) {
        log.error(
          `[SubscriptionManager] Trigger node ${triggerNode.id} missing config`,
          new Error("Missing config"),
          {
            service: "listener",
            workflowId: workflow.id,
            triggerNodeId: triggerNode.id,
            triggerNodeData: triggerNode.data,
          }
        );
        continue;
      }

      log.info(`Setting up subscription for trigger node ${triggerNode.id} (${triggerType})`, {
        service: "listener",
        workflowId: workflow.id,
        triggerNodeId: triggerNode.id,
        triggerType,
      });

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
          log.warn(`Unsupported trigger type: ${triggerType}`, {
            service: "listener",
            workflowId: workflow.id,
            triggerType,
          });
      }
    }
  }

  private async subscribeToBalanceChange(
    workflow: Workflow,
    triggerNodeId: string,
    config: any
  ): Promise<void> {
    if (!config.address) {
      log.error(
        `[SubscriptionManager] Balance change trigger ${triggerNodeId} missing address in config`,
        new Error("Missing address in config"),
        {
          service: "listener",
          workflowId: workflow.id,
          triggerNodeId,
          config,
        }
      );
      return;
    }

    log.info(
      `[SubscriptionManager] Subscribing to balance changes for address: ${config.address}`,
      {
        service: "listener",
        workflowId: workflow.id,
        triggerNodeId,
        address: config.address,
      }
    );
    const address = new PublicKey(config.address);

    const subscriptionId = this.connection.onAccountChange(
      address,
      async (accountInfo, context) => {
        log.info(`Account change detected for ${address.toBase58()} (workflow: ${workflow.name})`, {
          service: "listener",
          workflowId: workflow.id,
          workflowName: workflow.name,
          address: address.toBase58(),
          lamports: accountInfo.lamports,
          slot: context.slot,
        });

        const executionId = generateExecutionId(
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

        log.info(`✅ Queued execution ${executionId} for workflow ${workflow.id}`, {
          service: "listener",
          workflowId: workflow.id,
          executionId,
          triggerNodeId,
        });
      },
      SOLANA.COMMITMENT
    );

    this.subscriptions.set(`${workflow.id}-${triggerNodeId}`, subscriptionId);
    log.info(`✅ Subscribed to balance changes for ${address.toBase58()}`, {
      service: "listener",
      workflowId: workflow.id,
      triggerNodeId,
      address: address.toBase58(),
    });
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
        log.info(
          `Token account change detected for ${address.toBase58()} (workflow: ${workflow.name})`,
          {
            service: "listener",
            workflowId: workflow.id,
            workflowName: workflow.name,
            address: address.toBase58(),
            triggerType,
            slot: context.slot,
          }
        );

        const executionId = generateExecutionId(
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

        log.info(`✅ Queued execution ${executionId} for workflow ${workflow.id}`, {
          service: "listener",
          workflowId: workflow.id,
          executionId,
          triggerNodeId,
        });
      },
      SOLANA.COMMITMENT
    );

    this.subscriptions.set(`${workflow.id}-${triggerNodeId}`, subscriptionId);
    log.info(`✅ Subscribed to ${triggerType} for ${address.toBase58()}`, {
      service: "listener",
      workflowId: workflow.id,
      triggerNodeId,
      triggerType,
      address: address.toBase58(),
    });
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
        log.info(`Program logs detected for ${programId.toBase58()} (workflow: ${workflow.name})`, {
          service: "listener",
          workflowId: workflow.id,
          workflowName: workflow.name,
          programId: programId.toBase58(),
          signature: logs.signature,
          slot: context.slot,
        });

        // Check if logs match the pattern (if configured)
        if (config.logPattern) {
          const pattern = new RegExp(config.logPattern);
          const hasMatch = logs.logs.some((logEntry) => pattern.test(logEntry));
          if (!hasMatch) {
            return; // Skip if pattern doesn't match
          }
        }

        const executionId = generateExecutionId(
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

        log.info(`✅ Queued execution ${executionId} for workflow ${workflow.id}`, {
          service: "listener",
          workflowId: workflow.id,
          executionId,
          triggerNodeId,
        });
      },
      SOLANA.COMMITMENT
    );

    this.subscriptions.set(`${workflow.id}-${triggerNodeId}`, subscriptionId);
    log.info(`✅ Subscribed to program logs for ${programId.toBase58()}`, {
      service: "listener",
      workflowId: workflow.id,
      triggerNodeId,
      programId: programId.toBase58(),
    });
  }

  async unsubscribe(workflowId: string): Promise<void> {
    for (const [key, subscriptionId] of this.subscriptions.entries()) {
      if (key.startsWith(`${workflowId}-`)) {
        await this.connection.removeAccountChangeListener(subscriptionId);
        this.subscriptions.delete(key);
        log.info(`✅ Unsubscribed from ${key}`, {
          service: "listener",
          workflowId,
          subscriptionKey: key,
        });
      }
    }
  }

  async unsubscribeAll(): Promise<void> {
    for (const [key, subscriptionId] of this.subscriptions.entries()) {
      try {
        await this.connection.removeAccountChangeListener(subscriptionId);
        log.info(`✅ Unsubscribed from ${key}`, {
          service: "listener",
          subscriptionKey: key,
        });
      } catch (error) {
        log.error(`Failed to unsubscribe from ${key}`, error as Error, {
          service: "listener",
          subscriptionKey: key,
        });
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
}
