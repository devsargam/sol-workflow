import { X402_DEFAULT_PRICE as SHARED_X402_DEFAULT_PRICE, X402_DEVNET_NETWORK } from "@repo/types";
import { HonoAdapter } from "@x402/hono";
import {
  HTTPFacilitatorClient,
  x402HTTPResourceServer,
  x402ResourceServer,
  type HTTPProcessResult,
  type HTTPRequestContext,
  type HTTPResponseInstructions,
  type ProcessSettleResultResponse,
  type RouteConfig,
} from "@x402/core/server";
import { ExactSvmScheme } from "@x402/svm/exact/server";
import type { Context } from "hono";
import { z } from "zod";

export const X402_SOLANA_DEVNET_NETWORK = X402_DEVNET_NETWORK;
export const X402_DEFAULT_PRICE = SHARED_X402_DEFAULT_PRICE;
export const X402_DEFAULT_FACILITATOR_URL = "https://x402.org/facilitator";

const X402EnvSchema = z.object({
  X402_FACILITATOR_URL: z.string().trim().url().default(X402_DEFAULT_FACILITATOR_URL),
});

function getX402FacilitatorUrl() {
  return X402EnvSchema.parse({
    X402_FACILITATOR_URL: process.env.X402_FACILITATOR_URL?.trim() || undefined,
  }).X402_FACILITATOR_URL;
}

const facilitatorClient = new HTTPFacilitatorClient({
  url: getX402FacilitatorUrl(),
});

const resourceServer = new x402ResourceServer(facilitatorClient).register(
  X402_SOLANA_DEVNET_NETWORK,
  new ExactSvmScheme()
);

let initializationPromise: Promise<void> | null = null;

async function ensureX402Initialized() {
  if (!initializationPromise) {
    initializationPromise = resourceServer.initialize().catch((error) => {
      initializationPromise = null;
      throw error;
    });
  }

  return initializationPromise;
}

export function getX402RuntimeConfig() {
  return {
    facilitatorUrl: getX402FacilitatorUrl(),
    network: X402_SOLANA_DEVNET_NETWORK,
    defaultPrice: X402_DEFAULT_PRICE,
  };
}

export async function processX402Request(c: Context, routeConfig: RouteConfig) {
  await ensureX402Initialized();

  const httpServer = new x402HTTPResourceServer(resourceServer, routeConfig);
  const adapter = new HonoAdapter(c);
  const requestContext: HTTPRequestContext = {
    adapter,
    path: c.req.path,
    method: c.req.method,
    paymentHeader: adapter.getHeader("payment-signature") || adapter.getHeader("x-payment"),
  };

  const result = await httpServer.processHTTPRequest(requestContext, {
    appName: "Dolphinflow",
    testnet: true,
  });

  return {
    httpServer,
    requestContext,
    result,
  };
}

export async function settleX402Payment({
  httpServer,
  requestContext,
  result,
  responseBody,
  responseHeaders,
}: {
  httpServer: x402HTTPResourceServer;
  requestContext: HTTPRequestContext;
  result: Extract<HTTPProcessResult, { type: "payment-verified" }>;
  responseBody: Buffer;
  responseHeaders: Record<string, string>;
}): Promise<ProcessSettleResultResponse> {
  return httpServer.processSettlement(
    result.paymentPayload,
    result.paymentRequirements,
    result.declaredExtensions,
    {
      request: requestContext,
      responseBody,
      responseHeaders,
    }
  );
}

export function createX402ErrorResponse(response: HTTPResponseInstructions): Response {
  const headers = new Headers(response.headers);
  const body = response.isHtml
    ? String(response.body ?? "")
    : JSON.stringify(response.body ?? {});

  return new Response(body, {
    status: response.status,
    headers,
  });
}
