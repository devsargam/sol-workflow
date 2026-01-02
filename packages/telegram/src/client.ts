export type TelegramParseMode = "Markdown" | "MarkdownV2" | "HTML";

export interface TelegramSendMessagePayload {
  chat_id: string | number;
  text: string;
  parse_mode?: TelegramParseMode;
  disable_web_page_preview?: boolean;
}

export interface TelegramApiResponse<T> {
  ok: boolean;
  result?: T;
  description?: string;
  error_code?: number;
}

export class TelegramBotClient {
  private botToken: string;
  private rateLimitRemaining = 30;
  private rateLimitResetTime = Date.now() + 60000;

  constructor(botToken: string) {
    this.botToken = botToken;
  }

  async sendMessage(payload: TelegramSendMessagePayload): Promise<void> {
    await this.checkRateLimit();

    const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`Telegram sendMessage failed: ${response.status} - ${text}`);
    }

    const json = (await response.json()) as TelegramApiResponse<unknown>;
    if (!json.ok) {
      throw new Error(
        `Telegram sendMessage failed: ${json.error_code ?? response.status} - ${json.description ?? "Unknown error"}`
      );
    }
  }

  private async checkRateLimit(): Promise<void> {
    const now = Date.now();
    if (now >= this.rateLimitResetTime) {
      this.rateLimitRemaining = 30;
      this.rateLimitResetTime = now + 60000;
    }

    if (this.rateLimitRemaining <= 0) {
      const waitTime = this.rateLimitResetTime - now;
      if (waitTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
      this.rateLimitRemaining = 30;
      this.rateLimitResetTime = Date.now() + 60000;
    }

    this.rateLimitRemaining--;
  }
}

export function createTelegramClient(botToken: string): TelegramBotClient {
  return new TelegramBotClient(botToken);
}
