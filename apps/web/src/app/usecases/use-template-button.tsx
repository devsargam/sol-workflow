"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useWalletAuth } from "@/components/providers/wallet-auth-provider";

export function UseTemplateButton({ href }: { href: string }) {
  const router = useRouter();
  const { ready, authenticated } = useWalletAuth();

  const handleClick = () => {
    if (!ready) {
      toast.info("Checking wallet session. Try again in a moment.");
      return;
    }

    if (!authenticated) {
      toast.error("Connect your wallet to create this workflow.");
      return;
    }

    router.push(href);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-foreground px-4 text-sm font-medium text-background transition hover:bg-foreground/90"
    >
      Use template
    </button>
  );
}
