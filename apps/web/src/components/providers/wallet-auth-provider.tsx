"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  useUnifiedWallet,
  useUnifiedWalletContext,
} from "@jup-ag/wallet-adapter";
import {
  clearStoredWalletSession,
  getStoredWalletSession,
  setStoredWalletSession,
  type WalletSession,
} from "@/lib/auth-storage";
import { requestWalletChallenge, verifyWalletChallenge } from "@/lib/api";

function toBase64(bytes: Uint8Array) {
  if (typeof window === "undefined") {
    return "";
  }

  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return window.btoa(binary);
}

type WalletAuthContextValue = {
  ready: boolean;
  authenticated: boolean;
  authenticating: boolean;
  walletAddress: string | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
};

const DEFAULT_WALLET_AUTH_CONTEXT: WalletAuthContextValue = {
  ready: false,
  authenticated: false,
  authenticating: false,
  walletAddress: null,
  login: async () => undefined,
  logout: async () => undefined,
};

const WalletAuthContext = createContext<WalletAuthContextValue>(DEFAULT_WALLET_AUTH_CONTEXT);

export function WalletAuthProvider({ children }: { children: ReactNode }) {
  const wallet = useUnifiedWallet();
  const { setShowModal } = useUnifiedWalletContext();
  const [mounted, setMounted] = useState(false);
  const [session, setSession] = useState<WalletSession | null>(null);
  const [authenticating, setAuthenticating] = useState(false);

  const walletAddress = wallet.publicKey?.toBase58() || null;
  const authenticated = Boolean(wallet.connected && walletAddress && session?.walletAddress === walletAddress);

  useEffect(() => {
    setMounted(true);
    setSession(getStoredWalletSession());
  }, []);

  useEffect(() => {
    if (walletAddress && session && session.walletAddress !== walletAddress) {
      setSession(null);
      clearStoredWalletSession();
    }
  }, [session, walletAddress]);

  const authenticate = useCallback(async () => {
    if (!walletAddress || !wallet.signMessage || authenticating) {
      return;
    }

    setAuthenticating(true);

    try {
      const challenge = await requestWalletChallenge(walletAddress);
      const encodedMessage = new TextEncoder().encode(challenge.message);
      const signature = await wallet.signMessage(encodedMessage);
      const nextSession = await verifyWalletChallenge({
        walletAddress,
        nonce: challenge.nonce,
        message: challenge.message,
        signature: toBase64(signature),
      });

      setStoredWalletSession(nextSession);
      setSession(nextSession);
    } finally {
      setAuthenticating(false);
    }
  }, [authenticating, wallet, walletAddress]);

  useEffect(() => {
    if (!mounted || !wallet.connected || !walletAddress || authenticated || authenticating) {
      return;
    }

    void authenticate();
  }, [authenticate, authenticated, authenticating, mounted, wallet.connected, walletAddress]);

  const login = useCallback(async () => {
    if (!wallet.connected) {
      setShowModal(true);
      return;
    }

    await authenticate();
  }, [authenticate, setShowModal, wallet.connected]);

  const logout = useCallback(async () => {
    clearStoredWalletSession();
    setSession(null);

    if (wallet.connected) {
      await wallet.disconnect();
    }
  }, [wallet]);

  const value = useMemo(
    () => ({
      ready: mounted,
      authenticated,
      authenticating,
      walletAddress,
      login,
      logout,
    }),
    [authenticated, authenticating, login, logout, mounted, walletAddress]
  );

  return <WalletAuthContext.Provider value={value}>{children}</WalletAuthContext.Provider>;
}

export function useWalletAuth() {
  return useContext(WalletAuthContext);
}
