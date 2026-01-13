import { Header } from "@/components/layout/header";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { UseCases } from "@/components/landing/use-cases";
import { WorkflowAnimation } from "@/components/ui/workflow-animation";
import Link from "next/link";

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <section className="max-w-[1000px] mx-auto border-x border-black flex flex-col items-center justify-center">
          <Hero />

          <div className="w-full text-center p-8 border-b border-black">
            <p className="font-semibold text-sm uppercase text-neutral-800">Use Cases</p>
          </div>
          <UseCases />

          <div className="w-full text-center p-8 border-b border-black">
            <WorkflowAnimation />
          </div>

          <div className="w-full text-center p-8 border-b border-black">
            <p className="font-semibold text-sm uppercase text-neutral-800">How It Works</p>
          </div>
          <HowItWorks />

          {/* Integrations Header */}
          <div className="w-full text-center p-8 border-b border-black">
            <p className="font-semibold text-sm uppercase text-neutral-800">Integrations</p>
          </div>
          <Integrations />

          {/* Open Source Banner */}
          <div className="w-full text-center p-12 border-b border-black">
            <p className="text-2xl font-dynapuff font-bold mb-3">Open Source</p>
            <p className="text-neutral-600 mb-6 max-w-md mx-auto">
              Self-host on your own infrastructure. Full control over your automation workflows.
            </p>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 px-6 py-2.5 border border-black text-sm font-medium rounded-lg hover:bg-black hover:text-white transition-all duration-200"
            >
              <svg
                className="w-5 h-5 transition-transform group-hover:scale-110"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  fillRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  clipRule="evenodd"
                />
              </svg>
              View on GitHub
            </a>
          </div>
        </section>

        {/* Footer */}
        <Footer />

        {/* Large Brand Text */}
        <div className="max-w-[1000px] mx-auto border-x border-black py-2 overflow-hidden">
          <div className="flex items-center justify-center">
            <span
              style={{ "--text": "'SOL Workflow'" } as React.CSSProperties}
              className="relative pointer-events-none text-center before:bg-gradient-to-b before:from-neutral-500 before:to-neutral-400/70 before:to-80% before:bg-clip-text before:text-transparent before:content-[var(--text)] after:absolute after:inset-0 after:bg-neutral-600/70 after:bg-clip-text after:text-transparent after:mix-blend-darken after:content-[var(--text)] after:[text-shadow:0_1px_0_white] text-[clamp(2rem,10vw,6rem)] overflow-hidden font-mono tracking-tighter font-medium"
            />
          </div>
        </div>
      </main>
    </>
  );
}

function Integrations() {
  const integrations = [
    { name: "Discord", icon: DiscordIcon },
    { name: "Telegram", icon: TelegramIcon },
    { name: "Webhook", icon: WebhookIcon },
    { name: "Jupiter", icon: JupiterIcon },
    { name: "Raydium", icon: RaydiumIcon },
  ];

  return (
    <div className="w-full border-b border-black p-8">
      <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
        {integrations.map((integration) => (
          <div
            key={integration.name}
            className="flex flex-col items-center gap-2 text-neutral-400 hover:text-neutral-900 transition-all duration-200 hover:-translate-y-1"
          >
            <integration.icon className="w-8 h-8" />
            <span className="text-xs font-medium">{integration.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="max-w-[1000px] mx-auto border-x border-black">
      <div className="grid md:grid-cols-4 grid-cols-2 gap-8 p-8 border-b border-black">
        {/* Brand */}
        <div className="col-span-2 md:col-span-1">
          <p className="font-dynapuff font-bold text-lg mb-2">SOL Workflow</p>
          <p className="text-sm text-neutral-600">Solana-native automation for everyone.</p>
        </div>

        {/* Product */}
        <div>
          <p className="font-semibold text-sm mb-3">Product</p>
          <ul className="space-y-2 text-sm text-neutral-600">
            <li>
              <Link
                href="/workflows/builder"
                className="hover:text-neutral-900 hover:underline underline-offset-4"
              >
                Builder
              </Link>
            </li>
            <li>
              <Link
                href="/workflows"
                className="hover:text-neutral-900 hover:underline underline-offset-4"
              >
                Workflows
              </Link>
            </li>
            <li>
              <Link
                href="/executions"
                className="hover:text-neutral-900 hover:underline underline-offset-4"
              >
                Executions
              </Link>
            </li>
          </ul>
        </div>

        {/* Resources */}
        <div>
          <p className="font-semibold text-sm mb-3">Resources</p>
          <ul className="space-y-2 text-sm text-neutral-600">
            <li>
              <a
                href="https://github.com"
                className="hover:text-neutral-900 hover:underline underline-offset-4"
              >
                Documentation
              </a>
            </li>
            <li>
              <a
                href="https://github.com"
                className="hover:text-neutral-900 hover:underline underline-offset-4"
              >
                GitHub
              </a>
            </li>
          </ul>
        </div>

        {/* Community */}
        <div>
          <p className="font-semibold text-sm mb-3">Community</p>
          <ul className="space-y-2 text-sm text-neutral-600">
            <li>
              <a
                href="https://twitter.com"
                className="hover:text-neutral-900 hover:underline underline-offset-4"
              >
                Twitter
              </a>
            </li>
            <li>
              <a
                href="https://discord.com"
                className="hover:text-neutral-900 hover:underline underline-offset-4"
              >
                Discord
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="pt-6 text-center text-sm text-neutral-500">
        <p>&copy; {new Date().getFullYear()} SOL Workflow. All rights reserved.</p>
      </div>
    </footer>
  );
}

// Icons
function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

function WebhookIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
    >
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="18" r="3" />
      <circle cx="12" cy="6" r="3" />
      <path d="M12 9v3l-6 3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 12l6 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function JupiterIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M7 12h10M12 7v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function RaydiumIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path
        d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
