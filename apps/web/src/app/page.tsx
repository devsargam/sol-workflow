import { Header } from "@/components/layout/header";
import { WorkflowAnimation } from "@/components/ui/workflow-animation";
import Link from "next/link";

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        {/* Hero Section */}
        <section className="min-h-[calc(100vh-73px)] max-w-[1000px] mx-auto border-x border-black flex flex-col items-center justify-center py-16">
          <div className="w-full text-center border-b border-black">
            {/* Tagline */}
            <p className="text-sm tracking-widest uppercase text-neutral-500 mb-4">
              Solana Automation Platform
            </p>

            {/* Headline */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-dynapuff font-bold tracking-tight mb-6">
              Automate your
              <br />
              on-chain workflows
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-neutral-600 max-w-xl mx-auto mb-10 leading-relaxed">
              Build visual workflows that respond to Solana events, execute actions, and send
              notifications. No code required.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link
                href="/workflows/builder"
                className="px-8 py-3 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors"
              >
                Try Now
              </Link>

              <Link
                href="/workflows"
                className="px-8 py-3 border border-neutral-300 text-neutral-700 text-sm font-medium rounded-lg hover:bg-neutral-50 transition-colors"
              >
                View Workflows
              </Link>
            </div>
          </div>
          <div className="w-full text-center p-8 border-b border-black">
            {/* Workflow Animation */}
            <WorkflowAnimation />
          </div>
          <div className="w-full text-center p-8 border-b border-black">
            <p className="font-semibold text-sm uppercase text-neutral-800">Use Cases</p>
          </div>
          <UseCases />
        </section>
      </main>
    </>
  );
}

function UseCases() {
  return (
    <div className="w-full text-center border-b border-black grid md:grid-cols-3 grid-cols-1">
      {/* Card 1 */}
      <div className="flex flex-col gap-y-5 items-center justify-between h-full w-full cursor-pointer">
        <div className="flex h-full w-full items-center justify-center rounded-t-xl border-b">
          <div className="h-[400px] w-[400px] bg-neutral-400 rounded-sm"></div>
        </div>
        <div className="flex flex-col gap-y-1 px-5 pb-4 items-center w-full text-center">
          <div className="font-semibold tracking-tight text-lg">Tool Integration</div>
          <div className="text-sm text-muted-foreground">
            Seamlessly integrate external APIs and tools into agent workflows.
          </div>
        </div>
      </div>
      {/* Card 2 */}
      <div className="flex flex-col gap-y-5 items-center justify-between h-full w-full cursor-pointer border-x border-black">
        <div className="flex h-full w-full items-center justify-center rounded-t-xl border-b">
          <div className="h-[400px] w-[400px] bg-neutral-400 rounded-sm"></div>
        </div>
        <div className="flex flex-col gap-y-1 px-5 pb-4 items-center w-full text-center">
          <div className="font-semibold tracking-tight text-lg">Tool Integration</div>
          <div className="text-sm text-muted-foreground">
            Seamlessly integrate external APIs and tools into agent workflows.
          </div>
        </div>
      </div>
      {/* Card 3 */}
      <div className="flex flex-col gap-y-5 items-center justify-between h-full w-full cursor-pointer">
        <div className="flex h-full w-full items-center justify-center rounded-t-xl border-b">
          <div className="h-[400px] w-[400px] bg-neutral-400 rounded-sm"></div>
        </div>
        <div className="flex flex-col gap-y-1 px-5 pb-4 items-center w-full text-center">
          <div className="font-semibold tracking-tight text-lg">Tool Integration</div>
          <div className="text-sm text-muted-foreground">
            Seamlessly integrate external APIs and tools into agent workflows.
          </div>
        </div>
      </div>
    </div>
  );
}
