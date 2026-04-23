"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { useUnifiedWallet } from "@jup-ag/wallet-adapter";
import { useQuery } from "@tanstack/react-query";
import { CopyIcon, CheckIcon, ArrowUpRightIcon } from "@phosphor-icons/react";
import { DarkNav } from "@/components/layout/dark-nav";
import { useWalletAuth } from "@/components/providers/wallet-auth-provider";
import { useWorkflows } from "@/lib/hooks/use-workflows";
import { useBalance } from "@/lib/hooks/use-balance";
import {
  requestAirdrop,
  fetchPlatformWallet,
  sendTelegramNotification,
} from "@/lib/api";

const RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com";

// ─── utils ────────────────────────────────────────────────────────────────────

function shortAddr(addr: string) {
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

function formatSol(lamports: number) {
  return (lamports / LAMPORTS_PER_SOL).toFixed(4);
}

// ─── copy button ──────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [text]);

  return (
    <button onClick={copy} className="text-muted-foreground transition-colors hover:text-foreground" aria-label="Copy">
      {copied ? <CheckIcon size={13} weight="bold" /> : <CopyIcon size={13} />}
    </button>
  );
}

// ─── activity feed ────────────────────────────────────────────────────────────

interface FeedItem {
  id: number;
  label: string;
  sub: string;
  tgStatus: "sending" | "sent" | "failed";
}

function Feed({ items }: { items: FeedItem[] }) {
  if (items.length === 0) {
    return <p className="text-[11px] text-muted-foreground">No activity yet.</p>;
  }
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.id} className="flex items-start gap-2">
          <span
            className="mt-[3px] size-1.5 shrink-0 rounded-full"
            style={{ background: item.tgStatus === "sent" ? "#14F195" : item.tgStatus === "failed" ? "#ef4444" : "#FFB800" }}
          />
          <div className="min-w-0">
            <p className="text-xs text-foreground">{item.label}</p>
            <p className="font-mono text-[10px] text-muted-foreground truncate">{item.sub}</p>
            <p
              className="text-[10px]"
              style={{
                color:
                  item.tgStatus === "sent"
                    ? "#14F195"
                    : item.tgStatus === "failed"
                      ? "#ef4444"
                      : "#FFB800",
              }}
            >
              {item.tgStatus === "sent"
                ? "→ Telegram sent ✓"
                : item.tgStatus === "failed"
                  ? "→ Telegram failed"
                  : "→ Sending to Telegram…"}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

// ─── left panel ───────────────────────────────────────────────────────────────

function ReceivePanel({ walletAddress }: { walletAddress: string }) {
  const { data: balanceData } = useBalance(walletAddress);
  const [airdropping, setAirdropping] = useState(false);
  const [airdropErr, setAirdropErr] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);
  const prevLamports = useRef<number | null>(null);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const counter = useRef(0);

  useEffect(() => {
    if (!balanceData) return;
    if (prevLamports.current !== null && balanceData.lamports > prevLamports.current) {
      setFlash(true);
      setTimeout(() => setFlash(false), 800);
    }
    prevLamports.current = balanceData.lamports;
  }, [balanceData]);

  const handleAirdrop = useCallback(async () => {
    setAirdropping(true);
    setAirdropErr(null);
    try {
      const result = await requestAirdrop();
      const id = ++counter.current;
      const item: FeedItem = {
        id,
        label: `+0.1 SOL airdropped`,
        sub: result.signature,
        tgStatus: "sending",
      };
      setFeed((f) => [item, ...f].slice(0, 5));

      try {
        await sendTelegramNotification(
          `🔔 *Balance Change Detected*\nWallet: \`${shortAddr(walletAddress)}\`\nAmount: +0.1 SOL\nNetwork: Devnet\nTx: \`${shortAddr(result.signature)}\``
        );
        setFeed((f) => f.map((x) => (x.id === id ? { ...x, tgStatus: "sent" } : x)));
      } catch {
        setFeed((f) => f.map((x) => (x.id === id ? { ...x, tgStatus: "failed" } : x)));
      }
    } catch (e: any) {
      setAirdropErr(e?.message || "Airdrop failed");
    } finally {
      setAirdropping(false);
    }
  }, [walletAddress]);

  return (
    <Panel>
      <SectionLabel>Your Wallet</SectionLabel>

      <div className="mt-4 flex items-center gap-2">
        <span className="font-mono text-xs text-muted-foreground">{shortAddr(walletAddress)}</span>
        <CopyButton text={walletAddress} />
        <a
          href={`https://explorer.solana.com/address/${walletAddress}?cluster=devnet`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowUpRightIcon size={13} />
        </a>
      </div>

      <div className="mt-5">
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Balance</p>
        <p
          className="mt-1 font-mono text-2xl font-medium transition-colors duration-300"
          style={{ color: flash ? "#14F195" : "var(--foreground)" }}
        >
          {balanceData ? formatSol(balanceData.lamports) : "—"}{" "}
          <span className="text-sm font-normal text-muted-foreground">SOL</span>
        </p>
        <LiveDot />
      </div>

      <div className="mt-6">
        <button
          onClick={handleAirdrop}
          disabled={airdropping}
          className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-50"
        >
          {airdropping ? "Requesting…" : "Airdrop 0.1 SOL"}
        </button>
        {airdropErr && <p className="mt-1 text-[10px] text-destructive">{airdropErr}</p>}
      </div>

      <Divider label="Activity" />
      <Feed items={feed} />
    </Panel>
  );
}

// ─── right panel ──────────────────────────────────────────────────────────────

function VaultPanel({ userWalletAddress }: { userWalletAddress: string }) {
  const wallet = useUnifiedWallet();

  const { data: platformData } = useQuery({
    queryKey: ["platform-wallet"],
    queryFn: fetchPlatformWallet,
    staleTime: Infinity,
  });

  const platformAddress = platformData?.address ?? null;
  const { data: vaultBalance } = useBalance(platformAddress);

  const [amount, setAmount] = useState("0.01");
  const [sending, setSending] = useState(false);
  const [sendErr, setSendErr] = useState<string | null>(null);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const counter = useRef(0);

  const handleSend = useCallback(async () => {
    if (!wallet.publicKey || !platformAddress || sending) return;
    setSending(true);
    setSendErr(null);

    try {
      const connection = new Connection(RPC_URL, "confirmed");
      const lamports = Math.round(parseFloat(amount) * LAMPORTS_PER_SOL);
      if (isNaN(lamports) || lamports <= 0) throw new Error("Invalid amount");

      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: wallet.publicKey,
          toPubkey: new PublicKey(platformAddress),
          lamports,
        })
      );
      const { blockhash } = await connection.getLatestBlockhash("confirmed");
      tx.recentBlockhash = blockhash;
      tx.feePayer = wallet.publicKey;

      const sig = await wallet.sendTransaction(tx, connection);
      await connection.confirmTransaction(sig, "confirmed");

      const id = ++counter.current;
      const item: FeedItem = {
        id,
        label: `+${parseFloat(amount).toFixed(4)} SOL received`,
        sub: sig,
        tgStatus: "sending",
      };
      setFeed((f) => [item, ...f].slice(0, 5));

      try {
        await sendTelegramNotification(
          `💰 *dolphinflow Vault Received*\nFrom: \`${shortAddr(userWalletAddress)}\`\nAmount: +${parseFloat(amount).toFixed(4)} SOL\nNetwork: Devnet\nTx: \`${shortAddr(sig)}\``
        );
        setFeed((f) => f.map((x) => (x.id === id ? { ...x, tgStatus: "sent" } : x)));
      } catch {
        setFeed((f) => f.map((x) => (x.id === id ? { ...x, tgStatus: "failed" } : x)));
      }
    } catch (e: any) {
      setSendErr(e?.message || "Transaction failed");
    } finally {
      setSending(false);
    }
  }, [amount, platformAddress, sending, userWalletAddress, wallet]);

  return (
    <Panel>
      <SectionLabel>dolphinflow Vault</SectionLabel>

      <div className="mt-4 flex items-center gap-2">
        {platformAddress ? (
          <>
            <span className="font-mono text-xs text-muted-foreground">{shortAddr(platformAddress)}</span>
            <CopyButton text={platformAddress} />
            <a
              href={`https://explorer.solana.com/address/${platformAddress}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowUpRightIcon size={13} />
            </a>
          </>
        ) : (
          <span className="text-xs text-muted-foreground">Not configured</span>
        )}
      </div>

      <div className="mt-5">
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Balance</p>
        <p className="mt-1 font-mono text-2xl font-medium text-foreground">
          {vaultBalance ? formatSol(vaultBalance.lamports) : "—"}{" "}
          <span className="text-sm font-normal text-muted-foreground">SOL</span>
        </p>
        <LiveDot />
      </div>

      <div className="mt-6 flex items-center gap-2">
        <div className="flex items-center rounded-lg border border-border bg-background px-3 py-1.5">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            step="0.01"
            min="0.001"
            className="w-16 bg-transparent font-mono text-xs text-foreground outline-none"
          />
          <span className="text-xs text-muted-foreground">SOL</span>
        </div>
        <button
          onClick={handleSend}
          disabled={sending || !platformAddress || !wallet.publicKey}
          className="rounded-lg bg-foreground px-3 py-1.5 text-xs font-medium text-background transition-colors hover:opacity-80 disabled:opacity-40"
        >
          {sending ? "Sending…" : "Send →"}
        </button>
      </div>
      {sendErr && <p className="mt-1 text-[10px] text-destructive">{sendErr}</p>}

      <Divider label="Incoming" />
      <Feed items={feed} />
    </Panel>
  );
}

// ─── layout atoms ─────────────────────────────────────────────────────────────

function Panel({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-border bg-card p-6">{children}</div>;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
      {children}
    </p>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <div className="my-5 flex items-center gap-3">
      <div className="h-px flex-1 bg-border" />
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

function LiveDot() {
  return (
    <div className="mt-1 flex items-center gap-1.5">
      <span className="size-1.5 animate-pulse rounded-full bg-green-400" />
      <span className="text-[10px] text-muted-foreground">live</span>
    </div>
  );
}

// ─── gate states ──────────────────────────────────────────────────────────────

function ConnectPrompt({ onConnect }: { onConnect: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <p className="text-sm text-muted-foreground">Connect your wallet to continue.</p>
      <button
        onClick={onConnect}
        className="mt-4 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background"
      >
        Connect Wallet
      </button>
    </div>
  );
}

function NotConfigured() {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <p className="text-sm text-muted-foreground">Set up a balance monitor workflow first.</p>
      <a
        href="/workflows"
        className="mt-4 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background"
      >
        Go to Workflows →
      </a>
    </div>
  );
}

// ─── root ─────────────────────────────────────────────────────────────────────

export default function SetupClientPage() {
  const { authenticated, ready, walletAddress, login } = useWalletAuth();
  const { data: workflowsData, isLoading: loadingWorkflows } = useWorkflows();

  const hasBalanceMonitor = Boolean(
    workflowsData?.workflows?.some((w) =>
      w.graph?.nodes?.some(
        (n: any) => n.type === "trigger" && n.data?.triggerType === "balance_change"
      )
    )
  );

  const showSkeleton = !ready || (authenticated && loadingWorkflows);

  return (
    <div className="min-h-screen bg-background">
      <DarkNav sticky />

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="mb-8">
          <h1 className="text-base font-semibold text-foreground">Setup</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Trigger an on-chain event and watch the automation respond.
          </p>
        </div>

        {showSkeleton ? null : !authenticated ? (
          <ConnectPrompt onConnect={login} />
        ) : !hasBalanceMonitor ? (
          <NotConfigured />
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <ReceivePanel walletAddress={walletAddress!} />
              <VaultPanel userWalletAddress={walletAddress!} />
            </div>

            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <span>See automation events live —</span>
              <a
                href="https://t.me/+D3mpRQyAwIgwMmM1"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 font-medium text-foreground underline underline-offset-2 transition-opacity hover:opacity-70"
              >
                Join our Telegram group
              </a>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
