export interface TriggerNodeData {
  label?: string;
  type?: string;
  triggerType?: string;
  config?: {
    inputFormat?: Array<{
      id?: string;
      name: string;
      type: "string" | "number" | "boolean" | "object";
      description?: string;
      value?: string;
    }>;
    address?: string;
    tokenAccount?: string;
    tokenMint?: string;
    walletAddress?: string;
    collectionAddress?: string;
    verifiedOnly?: boolean;
    programId?: string;
    logPattern?: string;
    minChange?: number;
    changeType?: string;
    minAmount?: number;
    // New token listing trigger specific
    source?: "birdeye";
    includeMemePlatforms?: boolean;
    minLiquidityUsd?: number;
    minVolume24hUsd?: number;
    limit?: number;
    pollIntervalSeconds?: number;
    // Cron trigger specific
    schedule?: string;
    timezone?: string;
    // Webhook trigger specific
    webhookId?: string;
    authEnabled?: boolean;
    authHeaderName?: string;
    authHeaderValue?: string;
    payTo?: string;
    price?: string;
    network?: string;
    description?: string;
  };
}

export interface FilterNodeData {
  label?: string;
  preset?: "copy_wallet";
  logic?: "and" | "or";
  conditions?: Array<{
    field: string;
    operator: string;
    value: string | number;
  }>;
}

export interface ActionNodeData {
  label?: string;
  type?: string;
  actionType?: string;
  config?: {
    toAddress?: string;
    amount?: number;
    fromKeypair?: string;
    tokenMint?: string;
    fromTokenAccount?: string;
    toTokenAccount?: string;
    decimals?: number;
    programId?: string;
    instruction?: string;
  };
}

export interface NotifyNodeData {
  label?: string;
  type?: string;
  notifyType?: string;
  webhookUrl?: string;
  webhookSecret?: string;
  template?: string;
  telegramBotToken?: string;
  telegramChatId?: string;
  telegramParseMode?: "Markdown" | "MarkdownV2" | "HTML";
  telegramDisableWebPreview?: boolean;
  customMessage?: string;
  notifications?: Array<{
    notifyType: string;
    webhookUrl?: string;
    webhookSecret?: string;
    telegramBotToken?: string;
    telegramChatId?: string;
    telegramParseMode?: "Markdown" | "MarkdownV2" | "HTML";
    telegramDisableWebPreview?: boolean;
    template?: string;
    customMessage?: string;
  }>;
}
