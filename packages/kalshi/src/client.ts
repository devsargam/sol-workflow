import { Configuration, PortfolioApi, MarketApi, OrdersApi } from "kalshi-typescript";
import { z } from "zod";
import { randomUUID } from "crypto";

export const KalshiCredentialsSchema = z.object({
  apiKey: z.string().min(1),
  privateKeyPem: z.string().optional(),
  privateKeyPath: z.string().optional(),
  demoMode: z.boolean().default(true),
});

export type KalshiCredentials = z.infer<typeof KalshiCredentialsSchema>;

export interface KalshiOrderResult {
  orderId: string;
  marketId: string;
  side: "yes" | "no";
  count: number;
  price: number;
  status: string;
  cost: number;
  demo: boolean;
  placedAt: string;
}

export interface KalshiMarketPrice {
  ticker: string;
  yesBid: number;
  yesAsk: number;
  noBid: number;
  noAsk: number;
  lastPrice?: number;
  volume: number;
  volume24h: number;
  openInterest: number;
  status: string;
}

export class KalshiClient {
  private portfolioApi: PortfolioApi;
  private marketsApi: MarketApi;
  private ordersApi: OrdersApi;
  private demoMode: boolean;

  constructor(credentials: KalshiCredentials) {
    this.demoMode = credentials.demoMode ?? true;

    const basePath = this.demoMode
      ? "https://demo-api.kalshi.co/trade-api/v2"
      : "https://api.elections.kalshi.com/trade-api/v2";

    const config = new Configuration({
      apiKey: credentials.apiKey,
      privateKeyPem: credentials.privateKeyPem,
      privateKeyPath: credentials.privateKeyPath,
      basePath,
    });

    this.portfolioApi = new PortfolioApi(config);
    this.marketsApi = new MarketApi(config);
    this.ordersApi = new OrdersApi(config);
  }

  async getMarket(ticker: string): Promise<any> {
    const res = await this.marketsApi.getMarket(ticker);
    return res.data.market;
  }

  async getMarketPrice(ticker: string): Promise<KalshiMarketPrice> {
    const market = await this.getMarket(ticker);

    return {
      ticker: market.ticker,
      yesBid: market.yes_bid || 0,
      yesAsk: market.yes_ask || 0,
      noBid: market.no_bid || 0,
      noAsk: market.no_ask || 0,
      lastPrice: market.last_price,
      volume: market.volume || 0,
      volume24h: market.volume_24h || 0,
      openInterest: market.open_interest || 0,
      status: market.status,
    };
  }

  async getPositions(): Promise<any> {
    const res = await this.portfolioApi.getPositions();
    return res.data;
  }

  async placeOrder(
    ticker: string,
    side: "yes" | "no",
    action: "buy" | "sell",
    count: number,
    price: number,
    type: "limit" | "market" = "limit"
  ): Promise<KalshiOrderResult> {
    if (count <= 0) throw new Error("Count must be > 0");
    if (type === "limit" && (price < 1 || price > 99)) {
      throw new Error("Price must be 1–99 cents for limit orders");
    }

    const payload: any = {
      ticker,
      side,
      action,
      count,
      type,
      client_order_id: randomUUID(),
    };

    if (type === "limit") {
      if (side === "yes") payload.yes_price = price;
      else payload.no_price = price;
    }

    const res = await this.ordersApi.createOrder(payload);
    const order = res.data.order;

    return {
      orderId: order.order_id,
      marketId: ticker,
      side,
      count,
      price: type === "limit" ? price : 0,
      status: order.status,
      cost: type === "limit" ? (price * count) / 100 : 0,
      demo: this.demoMode,
      placedAt: new Date().toISOString(),
    };
  }
}

export function createKalshiClient(credentials: KalshiCredentials) {
  return new KalshiClient(credentials);
}
