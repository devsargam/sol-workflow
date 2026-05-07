import { Connection, PublicKey } from "@solana/web3.js";
import { Queue } from "bullmq";
import {
  BIRDEYE,
  TriggerType,
  JOB_NAMES,
  JOB_OPTIONS,
  SOLANA,
  INTERVALS,
  log,
  generateExecutionId,
} from "utils";
import { isTriggerNode, type WorkflowGraph } from "@repo/types";
import { db, triggerSubscriptions, eq } from "@repo/db";

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

type TokenListingSubscription = {
  config: any;
  triggerNodeId: string;
  workflow: Workflow;
};

type NormalizedTokenListing = {
  address: string;
  symbol?: string;
  name?: string;
  liquidityUsd?: number;
  volume24hUsd?: number;
  priceUsd?: number;
  marketCapUsd?: number;
  listedAt?: number | string;
  source: "birdeye";
  raw: Record<string, unknown>;
};

export class SubscriptionManager {
  private subscriptions: Map<string, number> = new Map();
  private balanceSnapshots: Map<string, number> = new Map();
  private tokenListingSubscriptions: Map<string, TokenListingSubscription> = new Map();
  private tokenListingSeen: Map<string, Set<string>> = new Map();
  private tokenListingSeeded: Set<string> = new Set();
  private tokenListingPollers: Map<string, NodeJS.Timeout> = new Map();
  private tokenListingPollIntervals: Map<string, number> = new Map();
  private tokenListingBackoffUntil: Map<string, number> = new Map();
  private tokenListingInFlight: Set<string> = new Set();
  private workflowSignatures: Map<string, string> = new Map();
  private birdeyeRequestQueue: Promise<void> = Promise.resolve();
  private lastBirdeyeRequestAt = 0;
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
    const triggerNodes = workflow.graph.nodes.filter((n) =>
      isTriggerNode(n)
    ) as unknown as TriggerNode[];

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
      this.workflowSignatures.set(workflow.id, getWorkflowSignature(workflow));
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
        case TriggerType.NEW_TOKEN_LISTING:
          await this.subscribeToNewTokenListings(workflow, triggerNode.id, config);
          break;
        case TriggerType.CRON:
        case TriggerType.WEBHOOK:
          log.debug(`Trigger type ${triggerType} does not require a listener subscription`, {
            service: "listener",
            workflowId: workflow.id,
            triggerNodeId: triggerNode.id,
            triggerType,
          });
          break;
        default:
          log.warn(`Unsupported trigger type: ${triggerType}`, {
            service: "listener",
            workflowId: workflow.id,
            triggerType,
          });
      }
    }

    this.workflowSignatures.set(workflow.id, getWorkflowSignature(workflow));
  }

  async reconcile(workflows: Workflow[]): Promise<void> {
    const activeWorkflowIds = new Set(workflows.map((workflow) => workflow.id));

    for (const workflowId of Array.from(this.workflowSignatures.keys())) {
      if (!activeWorkflowIds.has(workflowId)) {
        await this.unsubscribe(workflowId);
      }
    }

    for (const workflow of workflows) {
      const nextSignature = getWorkflowSignature(workflow);
      if (this.workflowSignatures.get(workflow.id) === nextSignature) {
        continue;
      }

      if (this.workflowSignatures.has(workflow.id)) {
        await this.unsubscribe(workflow.id);
      }

      await this.subscribe(workflow);
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
    const snapshotKey = `${workflow.id}:${triggerNodeId}:${address.toBase58()}`;

    try {
      const initialLamports = await this.connection.getBalance(address, SOLANA.COMMITMENT);
      this.balanceSnapshots.set(snapshotKey, initialLamports);
    } catch (error) {
      log.warn(`Unable to seed balance snapshot for ${address.toBase58()}`, {
        service: "listener",
        workflowId: workflow.id,
        triggerNodeId,
        address: address.toBase58(),
      });
    }

    const subscriptionId = this.connection.onAccountChange(
      address,
      async (accountInfo, context) => {
        const previousLamports = this.balanceSnapshots.get(snapshotKey) ?? accountInfo.lamports;
        const changeLamports = accountInfo.lamports - previousLamports;
        const changeDirection =
          changeLamports > 0 ? "increase" : changeLamports < 0 ? "decrease" : "same";
        const absoluteChange = Math.abs(changeLamports);
        const minChange = Number(config.minChange ?? 0);
        const requestedChangeType = config.changeType || "any";

        this.balanceSnapshots.set(snapshotKey, accountInfo.lamports);

        if (requestedChangeType === "increase" && changeLamports <= 0) {
          return;
        }

        if (requestedChangeType === "decrease" && changeLamports >= 0) {
          return;
        }

        if (absoluteChange < minChange) {
          return;
        }

        log.info(`Account change detected for ${address.toBase58()} (workflow: ${workflow.name})`, {
          service: "listener",
          workflowId: workflow.id,
          workflowName: workflow.name,
          address: address.toBase58(),
          previousLamports,
          lamports: accountInfo.lamports,
          changeLamports,
          changeDirection,
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
              previousLamports,
              lamports: accountInfo.lamports,
              changeLamports,
              changeSol: changeLamports / 1_000_000_000,
              changeDirection,
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

  private async subscribeToNewTokenListings(
    workflow: Workflow,
    triggerNodeId: string,
    config: any
  ): Promise<void> {
    if (!process.env.BIRDEYE_API_KEY?.trim()) {
      log.error(
        `Birdeye token listing trigger ${triggerNodeId} cannot start without BIRDEYE_API_KEY`,
        new Error("Missing BIRDEYE_API_KEY"),
        {
          service: "listener",
          workflowId: workflow.id,
          triggerNodeId,
        }
      );
      return;
    }

    const source = config.source || "birdeye";
    if (source !== "birdeye") {
      log.warn(`Unsupported token listing source: ${source}`, {
        service: "listener",
        workflowId: workflow.id,
        triggerNodeId,
        source,
      });
      return;
    }

    const subscriptionKey = `${workflow.id}-${triggerNodeId}`;
    this.tokenListingSubscriptions.set(subscriptionKey, {
      workflow,
      triggerNodeId,
      config,
    });

    const groupKey = this.getTokenListingGroupKey(config);
    this.ensureTokenListingPoller(groupKey);

    log.info(`✅ Subscribed to Birdeye new token listings`, {
      service: "listener",
      workflowId: workflow.id,
      triggerNodeId,
      includeMemePlatforms: Boolean(config.includeMemePlatforms),
      pollIntervalSeconds: config.pollIntervalSeconds,
    });
  }

  private getTokenListingGroupKey(config: any): string {
    return `birdeye:${config.includeMemePlatforms ? "meme" : "standard"}`;
  }

  private getTokenListingGroupSubscriptions(groupKey: string) {
    return Array.from(this.tokenListingSubscriptions.values()).filter(
      (subscription) => this.getTokenListingGroupKey(subscription.config) === groupKey
    );
  }

  private getTokenListingPollIntervalMs(groupKey: string): number {
    const configuredIntervals = this.getTokenListingGroupSubscriptions(groupKey)
      .map((subscription) => Number(subscription.config.pollIntervalSeconds))
      .filter(
        (seconds) => Number.isFinite(seconds) && seconds >= BIRDEYE.MIN_POLL_INTERVAL_SECONDS
      );

    const minConfiguredSeconds =
      configuredIntervals.length > 0 ? Math.min(...configuredIntervals) : undefined;

    return (minConfiguredSeconds ?? INTERVALS.BIRDEYE_TOKEN_LISTINGS / 1000) * 1000;
  }

  private ensureTokenListingPoller(groupKey: string): void {
    const intervalMs = this.getTokenListingPollIntervalMs(groupKey);
    const existingPoller = this.tokenListingPollers.get(groupKey);
    const existingIntervalMs = this.tokenListingPollIntervals.get(groupKey);

    if (existingPoller && existingIntervalMs && existingIntervalMs <= intervalMs) {
      return;
    }

    if (existingPoller) {
      clearInterval(existingPoller);
    }

    const poll = () => {
      const seedOnly = !this.tokenListingSeeded.has(groupKey);
      void this.pollBirdeyeTokenListings(groupKey, seedOnly);
    };

    poll();

    const poller = setInterval(poll, intervalMs);
    this.tokenListingPollers.set(groupKey, poller);
    this.tokenListingPollIntervals.set(groupKey, intervalMs);
  }

  private async pollBirdeyeTokenListings(groupKey: string, seedOnly: boolean): Promise<void> {
    if (this.tokenListingInFlight.has(groupKey)) {
      return;
    }

    const backoffUntil = this.tokenListingBackoffUntil.get(groupKey) ?? 0;
    if (Date.now() < backoffUntil) {
      return;
    }

    const subscriptions = this.getTokenListingGroupSubscriptions(groupKey);
    if (subscriptions.length === 0) {
      this.stopTokenListingPoller(groupKey);
      return;
    }

    this.tokenListingInFlight.add(groupKey);

    try {
      const includeMemePlatforms = groupKey.endsWith(":meme");
      const limit = Math.min(
        BIRDEYE.MAX_LIMIT,
        Math.max(
          BIRDEYE.DEFAULT_LIMIT,
          ...subscriptions.map((subscription) => Number(subscription.config.limit || 0))
        )
      );

      const listings = await this.fetchBirdeyeNewListings({
        includeMemePlatforms,
        limit,
      });

      const seen = this.tokenListingSeen.get(groupKey) ?? new Set<string>();
      this.tokenListingSeen.set(groupKey, seen);

      if (seedOnly) {
        for (const listing of listings) {
          seen.add(listing.address);
        }
        this.tokenListingSeeded.add(groupKey);
        log.info(`Seeded Birdeye token listing cursor`, {
          service: "listener",
          groupKey,
          listingCount: listings.length,
        });
        return;
      }

      const newListings = listings.filter((listing) => !seen.has(listing.address));
      for (const listing of newListings) {
        seen.add(listing.address);
        await this.queueTokenListingExecutions(subscriptions, listing);
      }
    } catch (error) {
      const status = (error as { status?: number }).status;
      if (status === 429) {
        const retryAfterMs = 60_000;
        this.tokenListingBackoffUntil.set(groupKey, Date.now() + retryAfterMs);
      }

      log.error("Failed to poll Birdeye token listings", error as Error, {
        service: "listener",
        groupKey,
        status,
      });
    } finally {
      this.tokenListingInFlight.delete(groupKey);
    }
  }

  private async fetchBirdeyeNewListings({
    includeMemePlatforms,
    limit,
  }: {
    includeMemePlatforms: boolean;
    limit: number;
  }): Promise<NormalizedTokenListing[]> {
    const baseUrl = process.env.BIRDEYE_API_BASE_URL || BIRDEYE.API_BASE_URL;
    const url = new URL(BIRDEYE.NEW_LISTINGS_PATH, baseUrl);
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("meme_platform_enabled", includeMemePlatforms ? "true" : "false");

    await this.waitForBirdeyeRequestSlot();

    const response = await fetch(url, {
      headers: {
        accept: "application/json",
        "x-chain": BIRDEYE.CHAIN,
        "X-API-KEY": process.env.BIRDEYE_API_KEY!,
      },
    });

    if (!response.ok) {
      const error = new Error(`Birdeye new listings request failed with ${response.status}`);
      (error as Error & { status?: number }).status = response.status;
      throw error;
    }

    const payload = await response.json();
    return extractBirdeyeListingItems(payload)
      .map(normalizeBirdeyeListing)
      .filter((listing): listing is NormalizedTokenListing => Boolean(listing));
  }

  private async waitForBirdeyeRequestSlot(): Promise<void> {
    const previousRequest = this.birdeyeRequestQueue;
    let releaseCurrentRequest!: () => void;

    this.birdeyeRequestQueue = new Promise<void>((resolve) => {
      releaseCurrentRequest = resolve;
    });

    await previousRequest;

    const elapsedMs = Date.now() - this.lastBirdeyeRequestAt;
    const waitMs = Math.max(0, BIRDEYE.MIN_REQUEST_INTERVAL_MS - elapsedMs);

    if (waitMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }

    this.lastBirdeyeRequestAt = Date.now();
    releaseCurrentRequest();
  }

  private async queueTokenListingExecutions(
    subscriptions: TokenListingSubscription[],
    listing: NormalizedTokenListing
  ): Promise<void> {
    for (const subscription of subscriptions) {
      const { workflow, triggerNodeId, config } = subscription;
      if (!passesTokenListingConfig(listing, config)) continue;

      const eventTime = listing.listedAt ?? Date.now();
      const executionId = generateExecutionId(
        workflow.id,
        eventTime,
        `${triggerNodeId}-${listing.address}`
      );

      await this.queue.add(
        JOB_NAMES.WORKFLOW_EVENT,
        {
          workflowId: workflow.id,
          executionId,
          triggerNodeId,
          triggerData: {
            type: TriggerType.NEW_TOKEN_LISTING,
            source: listing.source,
            firedAt: new Date().toISOString(),
            address: listing.address,
            mint: listing.address,
            symbol: listing.symbol,
            name: listing.name,
            liquidityUsd: listing.liquidityUsd,
            volume24hUsd: listing.volume24hUsd,
            priceUsd: listing.priceUsd,
            marketCapUsd: listing.marketCapUsd,
            listedAt: listing.listedAt,
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

      log.info(`✅ Queued token listing alert for workflow ${workflow.id}`, {
        service: "listener",
        workflowId: workflow.id,
        executionId,
        triggerNodeId,
        tokenAddress: listing.address,
        symbol: listing.symbol,
      });
    }
  }

  private stopTokenListingPoller(groupKey: string): void {
    const poller = this.tokenListingPollers.get(groupKey);
    if (poller) {
      clearInterval(poller);
      this.tokenListingPollers.delete(groupKey);
    }
    this.tokenListingPollIntervals.delete(groupKey);
    this.tokenListingBackoffUntil.delete(groupKey);
    this.tokenListingInFlight.delete(groupKey);
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

    // Remove from database
    await this.removeSubscriptionFromDb(workflowId);
    this.workflowSignatures.delete(workflowId);

    for (const key of Array.from(this.balanceSnapshots.keys())) {
      if (key.startsWith(`${workflowId}:`)) {
        this.balanceSnapshots.delete(key);
      }
    }

    for (const key of Array.from(this.tokenListingSubscriptions.keys())) {
      if (key.startsWith(`${workflowId}-`)) {
        const subscription = this.tokenListingSubscriptions.get(key);
        this.tokenListingSubscriptions.delete(key);

        if (subscription) {
          const groupKey = this.getTokenListingGroupKey(subscription.config);
          if (this.getTokenListingGroupSubscriptions(groupKey).length === 0) {
            this.stopTokenListingPoller(groupKey);
          }
        }
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
    this.balanceSnapshots.clear();

    for (const poller of this.tokenListingPollers.values()) {
      clearInterval(poller);
    }
    this.tokenListingPollers.clear();
    this.tokenListingPollIntervals.clear();
    this.tokenListingBackoffUntil.clear();
    this.tokenListingInFlight.clear();
    this.tokenListingSubscriptions.clear();
    this.tokenListingSeen.clear();
    this.tokenListingSeeded.clear();
    this.workflowSignatures.clear();
  }

  getStats() {
    return {
      activeSubscriptions: this.subscriptions.size,
      activeTokenListingSubscriptions: this.tokenListingSubscriptions.size,
      activeTokenListingPollers: this.tokenListingPollers.size,
      subscribedWorkflows: this.workflowSignatures.size,
      subscriptionKeys: Array.from(this.subscriptions.keys()),
    };
  }
}

function getWorkflowSignature(workflow: Workflow): string {
  return JSON.stringify({
    graph: workflow.graph,
    metadata: workflow.metadata,
  });
}

function extractBirdeyeListingItems(payload: any): Record<string, unknown>[] {
  const candidates = [
    payload?.data?.items,
    payload?.data?.tokens,
    payload?.data,
    payload?.items,
    payload,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate.filter((item) => item && typeof item === "object");
    }
  }

  return [];
}

function normalizeBirdeyeListing(item: Record<string, unknown>): NormalizedTokenListing | null {
  const address = getString(item, ["address", "tokenAddress", "token_address", "mint"]);
  if (!address) return null;

  return {
    address,
    symbol: getString(item, ["symbol", "tokenSymbol"]),
    name: getString(item, ["name", "tokenName"]),
    liquidityUsd: getNumber(item, ["liquidityUsd", "liquidityUSD", "liquidity", "liquidity_usd"]),
    volume24hUsd: getNumber(item, ["volume24hUsd", "volume24hUSD", "v24hUSD", "volume_24h_usd"]),
    priceUsd: getNumber(item, ["priceUsd", "priceUSD", "price", "price_usd"]),
    marketCapUsd: getNumber(item, ["marketCapUsd", "marketCapUSD", "mc", "market_cap"]),
    listedAt:
      getNumber(item, ["listedAt", "listedTime", "createdTime", "creationTime"]) ??
      getString(item, ["listedAt", "listedTime", "createdAt", "created_time"]),
    source: "birdeye",
    raw: item,
  };
}

function passesTokenListingConfig(listing: NormalizedTokenListing, config: any): boolean {
  if (
    config.minLiquidityUsd !== undefined &&
    Number(listing.liquidityUsd ?? 0) < Number(config.minLiquidityUsd)
  ) {
    return false;
  }

  if (
    config.minVolume24hUsd !== undefined &&
    Number(listing.volume24hUsd ?? 0) < Number(config.minVolume24hUsd)
  ) {
    return false;
  }

  return true;
}

function getString(item: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = item[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return undefined;
}

function getNumber(item: Record<string, unknown>, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = item[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string" && value.trim()) {
      const numeric = Number(value);
      if (Number.isFinite(numeric)) {
        return numeric;
      }
    }
  }
  return undefined;
}
