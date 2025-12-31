import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-[calc(100vh-73px)]">
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-6 pt-24 pb-16">
        <div className="max-w-3xl">
          <h1 className="text-6xl font-bold tracking-tight mb-6">
            Automate Solana
            <br />
            <span className="text-neutral-500">without code</span>
          </h1>
          <p className="text-xl text-neutral-600 mb-8 leading-relaxed">
            Monitor wallets, react to on-chain events, and trigger automated actions.
            Built for DAO operators and NFT community managers.
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/workflows"
              className="px-6 py-3 bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors font-medium"
            >
              Get Started →
            </Link>
            <Link
              href="/executions"
              className="px-6 py-3 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors font-medium"
            >
              View Executions
            </Link>
          </div>
        </div>
      </div>

      {/* Workflow Flow */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="rounded-2xl border border-neutral-200 bg-white p-12">
          <h2 className="text-sm uppercase tracking-wider text-neutral-500 mb-6">
            Simple Workflow Design
          </h2>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold">Trigger</p>
                <p className="text-sm text-neutral-500">Detect events</p>
              </div>
            </div>

            <svg className="w-6 h-6 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold">Filter</p>
                <p className="text-sm text-neutral-500">Apply conditions</p>
              </div>
            </div>

            <svg className="w-6 h-6 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </div>
              <div>
                <p className="font-semibold">Action</p>
                <p className="text-sm text-neutral-500">Execute on-chain</p>
              </div>
            </div>

            <svg className="w-6 h-6 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <div>
                <p className="font-semibold">Notify</p>
                <p className="text-sm text-neutral-500">Send alerts</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-sm uppercase tracking-wider text-neutral-500 mb-8">
          Features
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="rounded-xl border border-neutral-200 bg-white p-8">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Real-time Triggers</h3>
            <p className="text-neutral-600 text-sm leading-relaxed">
              Monitor wallet balances, token transfers, NFT receipts, and program logs in real-time via WebSocket.
            </p>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-8">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">On-chain Actions</h3>
            <p className="text-neutral-600 text-sm leading-relaxed">
              Automatically send SOL, transfer SPL tokens, or call program instructions when conditions are met.
            </p>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-8">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Non-custodial</h3>
            <p className="text-neutral-600 text-sm leading-relaxed">
              Your funds stay safe with PDA-based authorities. No private keys, no custody risks.
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="rounded-2xl border border-neutral-200 bg-gradient-to-br from-neutral-50 to-white p-12">
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">~2s</div>
              <div className="text-sm text-neutral-600">Event detection latency</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">10s</div>
              <div className="text-sm text-neutral-600">Balance refresh interval</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">100%</div>
              <div className="text-sm text-neutral-600">Execution tracking</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
