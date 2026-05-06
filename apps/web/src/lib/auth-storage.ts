"use client";

import {
  decodeWalletSession,
  encodeWalletSession,
  WALLET_SESSION_COOKIE_NAME,
  WALLET_SESSION_MAX_AGE_SECONDS,
  WALLET_SESSION_STORAGE_KEY,
  type WalletSession,
} from "./auth-session";

export type { WalletSession } from "./auth-session";

export function getStoredWalletSession(): WalletSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(WALLET_SESSION_STORAGE_KEY);
  if (!raw) {
    const cookieSession = getCookieWalletSession();
    if (cookieSession) {
      window.localStorage.setItem(WALLET_SESSION_STORAGE_KEY, JSON.stringify(cookieSession));
    }
    return cookieSession;
  }

  try {
    return JSON.parse(raw) as WalletSession;
  } catch {
    window.localStorage.removeItem(WALLET_SESSION_STORAGE_KEY);
    return null;
  }
}

function getCookieWalletSession(): WalletSession | null {
  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${WALLET_SESSION_COOKIE_NAME}=`));

  return decodeWalletSession(cookie?.split("=").slice(1).join("="));
}

export function setStoredWalletSession(session: WalletSession) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(WALLET_SESSION_STORAGE_KEY, JSON.stringify(session));
  document.cookie = [
    `${WALLET_SESSION_COOKIE_NAME}=${encodeWalletSession(session)}`,
    "path=/",
    `max-age=${WALLET_SESSION_MAX_AGE_SECONDS}`,
    "samesite=lax",
  ].join("; ");
}

export function clearStoredWalletSession() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(WALLET_SESSION_STORAGE_KEY);
  document.cookie = `${WALLET_SESSION_COOKIE_NAME}=; path=/; max-age=0; samesite=lax`;
}
