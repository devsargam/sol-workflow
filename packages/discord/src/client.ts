export interface DiscordEmbed {
  title?: string;
  description?: string;
  color?: number;
  fields?: Array<{
    name: string;
    value: string;
    inline?: boolean;
  }>;
  footer?: {
    text: string;
  };
  timestamp?: string;
}

export interface DiscordWebhookPayload {
  content?: string;
  embeds?: DiscordEmbed[];
}

export class DiscordWebhookClient {
  private webhookUrl: string;
  private rateLimitRemaining: number = 30;
  private rateLimitResetTime: number = Date.now() + 60000;

  constructor(webhookUrl: string) {
    this.webhookUrl = webhookUrl;
  }

  async send(payload: DiscordWebhookPayload): Promise<void> {
    // Check rate limit
    await this.checkRateLimit();

    const response = await fetch(this.webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    // Update rate limit info from response headers
    this.updateRateLimitInfo(response);

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Discord webhook failed: ${response.status} - ${error}`);
    }
  }

  async sendEmbed(embed: DiscordEmbed): Promise<void> {
    await this.send({ embeds: [embed] });
  }

  async sendMessage(content: string): Promise<void> {
    await this.send({ content });
  }

  private async checkRateLimit(): Promise<void> {
    const now = Date.now();

    // Reset rate limit if time has passed
    if (now >= this.rateLimitResetTime) {
      this.rateLimitRemaining = 30;
      this.rateLimitResetTime = now + 60000;
    }

    // Wait if rate limited
    if (this.rateLimitRemaining <= 0) {
      const waitTime = this.rateLimitResetTime - now;
      console.warn(`Discord rate limit hit, waiting ${waitTime}ms`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      this.rateLimitRemaining = 30;
      this.rateLimitResetTime = Date.now() + 60000;
    }

    this.rateLimitRemaining--;
  }

  private updateRateLimitInfo(response: Response): void {
    const remaining = response.headers.get("X-RateLimit-Remaining");
    const reset = response.headers.get("X-RateLimit-Reset");

    if (remaining) {
      this.rateLimitRemaining = parseInt(remaining, 10);
    }

    if (reset) {
      this.rateLimitResetTime = parseFloat(reset) * 1000;
    }
  }
}

// Factory function
export function createDiscordClient(webhookUrl: string): DiscordWebhookClient {
  return new DiscordWebhookClient(webhookUrl);
}
