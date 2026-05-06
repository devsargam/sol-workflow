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

function toBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64");
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

export function WalletAuthProvider({
  children,
  initialSession = null,
}: {
  children: ReactNode;
  initialSession?: WalletSession | null;
}) {
  const wallet = useUnifiedWallet();
  const { setShowModal } = useUnifiedWalletContext();
  const [mounted, setMounted] = useState(Boolean(initialSession));
  const [session, setSession] = useState<WalletSession | null>(initialSession);
  const [authenticating, setAuthenticating] = useState(false);
  const [loginRequested, setLoginRequested] = useState(false);

  const connectedWalletAddress = wallet.publicKey?.toBase58() || null;
  const walletAddress = connectedWalletAddress ?? session?.walletAddress ?? null;
  const authenticated = Boolean(
    session && (!connectedWalletAddress || session.walletAddress === connectedWalletAddress)
  );

  useEffect(() => {
    setMounted(true);
    setSession(getStoredWalletSession() ?? initialSession);
  }, [initialSession]);

  useEffect(() => {
    if (connectedWalletAddress && session && session.walletAddress !== connectedWalletAddress) {
      setSession(null);
      clearStoredWalletSession();
    }
  }, [connectedWalletAddress, session]);

  const authenticate = useCallback(async () => {
    if (!connectedWalletAddress || !wallet.signMessage || authenticating) {
      return;
    }

    setAuthenticating(true);

    try {
      const challenge = await requestWalletChallenge(connectedWalletAddress);
      const encodedMessage = new TextEncoder().encode(challenge.message);
      const signature = await wallet.signMessage(encodedMessage);
      const nextSession = await verifyWalletChallenge({
        walletAddress: connectedWalletAddress,
        nonce: challenge.nonce,
        message: challenge.message,
        signature: toBase64(signature),
      });

      setStoredWalletSession(nextSession);
      setSession(nextSession);
    } catch (error) {
      console.error("Wallet authentication failed", error);
    } finally {
      setAuthenticating(false);
    }
  }, [authenticating, connectedWalletAddress, wallet]);

  useEffect(() => {
    if (!mounted || !loginRequested || !wallet.connected || !connectedWalletAddress || authenticated || authenticating) {
      return;
    }

    let cancelled = false;

    void (async () => {
      await authenticate();
      if (!cancelled) {
        setLoginRequested(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    authenticate,
    authenticated,
    authenticating,
    connectedWalletAddress,
    loginRequested,
    mounted,
    wallet.connected,
  ]);

  const login = useCallback(async () => {
    setLoginRequested(true);

    if (!wallet.connected) {
      setShowModal(true);
      return;
    }

    try {
      await authenticate();
    } catch {
      // authenticate already logs the failure and resets loading state.
    } finally {
      setLoginRequested(false);
    }
  }, [authenticate, setShowModal, wallet.connected]);

  const logout = useCallback(async () => {
    setLoginRequested(false);
    clearStoredWalletSession();
    setSession(null);

    if (wallet.connected) {
      await wallet.disconnect();
    }
  }, [wallet]);

  const value = useMemo(
    () => ({
      ready: mounted || Boolean(session),
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
