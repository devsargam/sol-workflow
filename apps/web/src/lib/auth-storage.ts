"use client";

const STORAGE_KEY = "sol-workflow:wallet-session";

export type WalletSession = {
  token: string;
  walletAddress: string;
};

export function getStoredWalletSession(): WalletSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as WalletSession;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function setStoredWalletSession(session: WalletSession) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearStoredWalletSession() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
}
