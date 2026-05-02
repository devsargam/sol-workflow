"use client"

import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { Workflow, Book, PlugZap, ArrowRight } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useWalletAuth } from "@/components/providers/wallet-auth-provider"
import { fetchWorkflows, fetchExecutions } from "@/lib/api"

export default function DashboardPage() {
  const { walletAddress } = useWalletAuth()

  const workflowsQuery = useQuery({
    queryKey: ["workflows"],
    queryFn: fetchWorkflows,
  })

  const executionsQuery = useQuery({
    queryKey: ["executions"],
    queryFn: () => fetchExecutions(),
  })

  const workflows = workflowsQuery.data?.workflows ?? []
  const executions = executionsQuery.data?.executions ?? []
  const activeWorkflows = workflows.filter((w) => w.enabled).length
  const recentExecutions = executions.slice(0, 5)
  const successCount = executions.filter((e) => e.status === "success").length
  const successRate =
    executions.length > 0
      ? `${Math.round((successCount / executions.length) * 100)}%`
      : "—"

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {walletAddress
            ? `Connected as ${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`
            : "Manage your onchain workflows."}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Workflows"
          value={workflowsQuery.isLoading ? "—" : String(workflows.length)}
          description={`${activeWorkflows} active`}
          icon={<Workflow className="size-4" />}
        />
        <StatCard
          title="Executions"
          value={
            executionsQuery.isLoading ? "—" : String(executions.length)
          }
          description="Total runs"
          icon={<PlugZap className="size-4" />}
        />
        <StatCard
          title="Success rate"
          value={executionsQuery.isLoading ? "—" : successRate}
          description={`${successCount} of ${executions.length}`}
          icon={<Book className="size-4" />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Workflows</CardTitle>
              <CardDescription>Your latest automations</CardDescription>
            </div>
            <Link
              href="/dashboard/workflows"
              className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              View all <ArrowRight className="size-3" />
            </Link>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {workflowsQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : workflows.length === 0 ? (
              <EmptyState
                label="No workflows yet"
                href="/dashboard/workflows"
                cta="Create one"
              />
            ) : (
              workflows.slice(0, 5).map((w) => (
                <Link
                  key={w.id}
                  href={`/workflows/${w.id}`}
                  className="flex items-center justify-between rounded-md border px-3 py-2 text-sm transition hover:bg-accent"
                >
                  <span className="truncate">{w.name}</span>
                  <Badge variant={w.enabled ? "default" : "secondary"}>
                    {w.enabled ? "Active" : "Paused"}
                  </Badge>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent executions</CardTitle>
              <CardDescription>Last 5 runs</CardDescription>
            </div>
            <Link
              href="/executions"
              className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              View all <ArrowRight className="size-3" />
            </Link>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {executionsQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : recentExecutions.length === 0 ? (
              <EmptyState
                label="No executions yet"
                href="/dashboard/workflows"
                cta="Run a workflow"
              />
            ) : (
              recentExecutions.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                >
                  <span className="truncate font-mono text-xs">
                    {e.executionId.slice(0, 12)}
                  </span>
                  <Badge variant={statusVariant(e.status)}>{e.status}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  description,
  icon,
}: {
  title: string
  value: string
  description: string
  icon: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <span className="text-muted-foreground">{icon}</span>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

function EmptyState({
  label,
  href,
  cta,
}: {
  label: string
  href: string
  cta: string
}) {
  return (
    <div className="flex items-center justify-between rounded-md border border-dashed px-3 py-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <Link
        href={href}
        className="text-xs font-medium text-foreground hover:underline"
      >
        {cta} →
      </Link>
    </div>
  )
}

function statusVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  if (status === "success") return "default"
  if (status === "failed" || status === "error") return "destructive"
  if (status === "running" || status === "pending") return "secondary"
  return "outline"
}
