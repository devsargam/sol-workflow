export const WALLET_SESSION_STORAGE_KEY = "dolphinflow:wallet-session";
export const WALLET_SESSION_COOKIE_NAME = "dolphinflow_wallet_session";
export const WALLET_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export type WalletSession = {
  token: string;
  walletAddress: string;
};

export function encodeWalletSession(session: WalletSession) {
  return encodeURIComponent(JSON.stringify(session));
}

export function decodeWalletSession(raw: string | undefined | null): WalletSession | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as Partial<WalletSession>;

    if (typeof parsed.token !== "string" || typeof parsed.walletAddress !== "string") {
      return null;
    }

    return {
      token: parsed.token,
      walletAddress: parsed.walletAddress,
    };
  } catch {
    return null;
  }
}
