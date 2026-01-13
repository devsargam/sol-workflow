export interface TriggerNodeData {
  label?: string;
  type?: string;
  config?: {
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
    // Cron trigger specific
    schedule?: string;
    timezone?: string;
  };
}

export interface FilterNodeData {
  label?: string;
  conditions?: Array<{
    field: string;
    operator: string;
    value: string;
  }>;
}

export interface ActionNodeData {
  label?: string;
  type?: string;
  config?: {
    // Send SOL specific
    toAddress?: string;
    amount?: number;
    fromKeypair?: string;
    // Send SPL Token specific
    tokenMint?: string;
    fromTokenAccount?: string;
    toTokenAccount?: string;
    decimals?: number;
    // Call Program specific
    programId?: string;
    instruction?: string;
    // Kalshi specific
    ticker?: string;
    marketId?: string; // Backward compatibility
    side?: "yes" | "no";
    action?: "buy" | "sell";
    count?: number;
    price?: number;
    type?: "limit" | "market";
    maxCost?: number;
    maxPositionSize?: number;
  };
}

export interface NotifyNodeData {
  label?: string;
  type?: string;
  notifyType?: string;
  webhookUrl?: string;
  template?: string;
  telegramBotToken?: string;
  telegramChatId?: string;
  telegramParseMode?: "Markdown" | "MarkdownV2" | "HTML";
  telegramDisableWebPreview?: boolean;
  customMessage?: string;
  notifications?: Array<{
    notifyType: string;
    webhookUrl?: string;
    telegramBotToken?: string;
    telegramChatId?: string;
    telegramParseMode?: "Markdown" | "MarkdownV2" | "HTML";
    telegramDisableWebPreview?: boolean;
    template?: string;
    customMessage?: string;
  }>;
}
