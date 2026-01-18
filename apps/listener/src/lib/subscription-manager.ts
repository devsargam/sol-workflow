import { Connection, PublicKey } from "@solana/web3.js";
import { Queue } from "bullmq";
import { Cron } from "croner";
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
import { db, triggerSubscriptions, eq } from "@repo/db";
import { createKalshiClient } from "@repo/kalshi";

type SubscriptionValue = number | Cron;

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
  private subscriptions: Map<string, SubscriptionValue> = new Map();
  private connection: Connection;
  private queue: Queue;

  constructor(connection: Connection, queue: Queue) {
    this.connection = connection;
    this.queue = queue;
  }

  /**
   * Persist subscription to database
   */
  private async persistSubscription(
    workflowId: string,
    triggerNodeId: string,
    subscriptionType: string,
    solanaAddress: string,
    subscriptionId: number
  ): Promise<void> {
    try {
      await db.insert(triggerSubscriptions).values({
        workflowId,
        subscriptionType,
        solanaAddress,
        subscriptionId,
        active: "true",
      });
      log.debug(`Persisted subscription to database`, {
        service: "listener",
        workflowId,
        triggerNodeId,
        subscriptionType,
        solanaAddress,
      });
    } catch (error) {
      log.error(`Failed to persist subscription to database`, error as Error, {
        service: "listener",
        workflowId,
        triggerNodeId,
      });
    }
  }

  /**
   * Update subscription status in database
   */
  private async updateSubscriptionStatus(
    workflowId: string,
    active: boolean,
    lastError?: string
  ): Promise<void> {
    try {
      const updateData: any = { active: active ? "true" : "false" };
      if (lastError) {
        updateData.lastError = lastError;
        updateData.lastErrorAt = new Date();
        // Increment error count
        const [existing] = await db
          .select()
          .from(triggerSubscriptions)
          .where(eq(triggerSubscriptions.workflowId, workflowId))
          .limit(1);
        if (existing) {
          updateData.errorCount = existing.errorCount + 1;
        }
      }
      await db
        .update(triggerSubscriptions)
        .set(updateData)
        .where(eq(triggerSubscriptions.workflowId, workflowId));
    } catch (error) {
      log.error(`Failed to update subscription status`, error as Error, {
        service: "listener",
        workflowId,
      });
    }
  }

  /**
   * Record last event time for a subscription
   */
  private async recordEventTime(workflowId: string): Promise<void> {
    try {
      await db
        .update(triggerSubscriptions)
        .set({ lastEventAt: new Date() })
        .where(eq(triggerSubscriptions.workflowId, workflowId));
    } catch (error) {
      // Don't log every time - this is non-critical
    }
  }

  /**
   * Remove subscription from database
   */
  private async removeSubscriptionFromDb(workflowId: string): Promise<void> {
    try {
      await db.delete(triggerSubscriptions).where(eq(triggerSubscriptions.workflowId, workflowId));
      log.debug(`Removed subscription from database`, {
        service: "listener",
        workflowId,
      });
    } catch (error) {
      log.error(`Failed to remove subscription from database`, error as Error, {
        service: "listener",
        workflowId,
      });
    }
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
        case TriggerType.MARKET_PRICE_CHECK:
          await this.subscribeToMarketPriceCheck(workflow, triggerNode.id, config);
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

        // Record event time in database
        await this.recordEventTime(workflow.id);

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

    // Persist subscription to database
    await this.persistSubscription(
      workflow.id,
      triggerNodeId,
      "account",
      address.toBase58(),
      subscriptionId
    );

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

        // Record event time in database
        await this.recordEventTime(workflow.id);

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

    // Persist subscription to database
    await this.persistSubscription(
      workflow.id,
      triggerNodeId,
      "token_account",
      address.toBase58(),
      subscriptionId
    );

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

        // Record event time in database
        await this.recordEventTime(workflow.id);

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

    // Persist subscription to database
    await this.persistSubscription(
      workflow.id,
      triggerNodeId,
      "logs",
      programId.toBase58(),
      subscriptionId
    );

    log.info(`✅ Subscribed to program logs for ${programId.toBase58()}`, {
      service: "listener",
      workflowId: workflow.id,
      triggerNodeId,
      programId: programId.toBase58(),
    });
  }

  async unsubscribe(workflowId: string): Promise<void> {
    for (const [key, subscription] of this.subscriptions.entries()) {
      if (key.startsWith(`${workflowId}-`)) {
        if (typeof subscription === "number") {
          await this.connection.removeAccountChangeListener(subscription);
        } else if (subscription && typeof subscription.stop === "function") {
          subscription.stop();
        }

        this.subscriptions.delete(key);
        log.info(`✅ Unsubscribed from ${key}`, {
          service: "listener",
          workflowId,
          subscriptionKey: key,
        });
      }
    }

    // Remove from database
    await this.removeSubscriptionFromDb(workflowId);
  }

  async unsubscribeAll(): Promise<void> {
    for (const [key, subscription] of this.subscriptions.entries()) {
      try {
        if (typeof subscription === "number") {
          await this.connection.removeAccountChangeListener(subscription);
        } else if (subscription && typeof subscription.stop === "function") {
          subscription.stop();
        }

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

  private async subscribeToMarketPriceCheck(
    workflow: Workflow,
    triggerNodeId: string,
    config: any
  ): Promise<void> {
    if (!config.ticker) {
      log.error(
        `[SubscriptionManager] Market price check trigger ${triggerNodeId} missing ticker in config`,
        new Error("Missing ticker in config"),
        {
          service: "listener",
          workflowId: workflow.id,
          triggerNodeId,
          config,
        }
      );
      return;
    }

    const interval = config.interval || "1m";
    const cronExpression = this.intervalToCron(interval);

    log.info(
      `[SubscriptionManager] Setting up market price check for ticker: ${config.ticker} with interval: ${interval}`,
      {
        service: "listener",
        workflowId: workflow.id,
        triggerNodeId,
        ticker: config.ticker,
        interval,
        cronExpression,
      }
    );

    try {
      const kalshiCredentials = workflow.metadata?.kalshiCredentials;
      if (!kalshiCredentials) {
        throw new Error("Kalshi credentials not found in workflow metadata");
      }

      const kalshiClient = createKalshiClient(kalshiCredentials);

      const cronJob = new Cron(cronExpression, async () => {
        try {
          log.debug(`Checking market price for ${config.ticker}`, {
            service: "listener",
            workflowId: workflow.id,
            ticker: config.ticker,
          });

          const marketPrice = await kalshiClient.getMarketPrice(config.ticker);

          log.debug(
            `Market price for ${config.ticker}: YES bid=${marketPrice.yesBid}¢ ask=${marketPrice.yesAsk}¢ | NO bid=${marketPrice.noBid}¢ ask=${marketPrice.noAsk}¢`,
            {
              service: "listener",
              workflowId: workflow.id,
              ticker: config.ticker,
              marketPrice,
            }
          );

          const executionId = generateExecutionId(
            workflow.id,
            Date.now(),
            `${triggerNodeId}-${config.ticker}`
          );

          await this.queue.add(
            JOB_NAMES.WORKFLOW_EVENT,
            {
              workflowId: workflow.id,
              executionId,
              triggerNodeId,
              triggerData: {
                ticker: config.ticker,
                interval,
                baseCurrency: config.baseCurrency || "yes",
                marketPrice,
                timestamp: new Date().toISOString(),
              },
              graph: workflow.graph,
              metadata: workflow.metadata,
            },
            {
              jobId: executionId,
              ...JOB_OPTIONS.DEFAULT,
            }
          );

          await this.recordEventTime(workflow.id);

          log.info(
            `✅ Queued market price check execution ${executionId} for workflow ${workflow.id}`,
            {
              service: "listener",
              workflowId: workflow.id,
              executionId,
              triggerNodeId,
              ticker: config.ticker,
              yesBid: marketPrice.yesBid,
              yesAsk: marketPrice.yesAsk,
            }
          );
        } catch (error) {
          log.error(`Failed to check market price for ${config.ticker}`, error as Error, {
            service: "listener",
            workflowId: workflow.id,
            triggerNodeId,
            ticker: config.ticker,
          });

          await this.updateSubscriptionStatus(workflow.id, true, (error as Error).message);
        }
      });

      const subscriptionKey = `${workflow.id}-${triggerNodeId}`;
      this.subscriptions.set(subscriptionKey, cronJob);

      await this.persistSubscription(
        workflow.id,
        triggerNodeId,
        "market_price_check",
        config.ticker,
        0
      );

      log.info(`✅ Subscribed to market price checks for ${config.ticker}`, {
        service: "listener",
        workflowId: workflow.id,
        triggerNodeId,
        ticker: config.ticker,
        interval,
      });
    } catch (error) {
      log.error(`Failed to set up market price check subscription`, error as Error, {
        service: "listener",
        workflowId: workflow.id,
        triggerNodeId,
        ticker: config.ticker,
        interval,
      });

      await this.updateSubscriptionStatus(workflow.id, false, (error as Error).message);
    }
  }

  private intervalToCron(interval: string): string {
    const match = interval.match(/^(\d+)([mh])$/);
    if (!match) {
      return "*/1 * * * *";
    }

    const [, numberStr, unit] = match;
    const num = parseInt(numberStr || "1", 10);

    if (unit === "m") {
      if (num === 1) return "*/1 * * * *";
      if (num === 5) return "*/5 * * * *";
      if (num === 15) return "*/15 * * * *";
      if (num === 30) return "*/30 * * * *";
      return "*/1 * * * *";
    } else if (unit === "h") {
      if (num === 1) return "0 */1 * * *";
      return "0 */1 * * *";
    }

    return "*/1 * * * *";
  }

  getStats() {
    return {
      activeSubscriptions: this.subscriptions.size,
      subscriptionKeys: Array.from(this.subscriptions.keys()),
    };
  }
}
