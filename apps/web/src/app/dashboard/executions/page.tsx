"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Activity, ArrowUpRight, Clock, ListFilter } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useExecutions } from "@/lib/hooks/use-executions"
import { useWorkflows } from "@/lib/hooks/use-workflows"

export default function DashboardExecutionsPage() {
  const { data: workflowsData, isLoading: workflowsLoading } = useWorkflows()
  const workflows = workflowsData?.workflows ?? []
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>("")
  const effectiveWorkflowId = selectedWorkflowId || workflows[0]?.id || ""
  const selectedWorkflow = workflows.find((workflow) => workflow.id === effectiveWorkflowId)

  const {
    data: executionsData,
    isLoading: executionsLoading,
    error,
  } = useExecutions(effectiveWorkflowId || undefined)

  const executions = executionsData?.executions ?? []
  const completedExecutions = executions.filter((execution) => execution.completedAt)
  const successCount = executions.filter((execution) => execution.status === "success").length
  const failureCount = executions.filter(
    (execution) => execution.status === "failed" || execution.status === "error",
  ).length
  const averageDuration = useMemo(() => {
    const durations = completedExecutions
      .map((execution) => {
        const started = new Date(execution.startedAt).getTime()
        const completed = execution.completedAt
          ? new Date(execution.completedAt).getTime()
          : Number.NaN

        return completed - started
      })
      .filter((duration) => Number.isFinite(duration) && duration >= 0)

    if (durations.length === 0) {
      return "—"
    }

    const averageMs = durations.reduce((sum, duration) => sum + duration, 0) / durations.length
    return formatDuration(averageMs)
  }, [completedExecutions])

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Executions</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review every run for a selected workflow.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Select
            value={effectiveWorkflowId}
            onValueChange={setSelectedWorkflowId}
            disabled={workflowsLoading || workflows.length === 0}
          >
            <SelectTrigger className="w-full sm:w-72">
              <SelectValue placeholder="Select workflow" />
            </SelectTrigger>
            <SelectContent>
              {workflows.map((workflow) => (
                <SelectItem key={workflow.id} value={workflow.id}>
                  {workflow.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button asChild variant="outline" disabled={!effectiveWorkflowId}>
            <Link href="/dashboard/workflows">
              <ListFilter className="size-4" />
              Workflows
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard
          title="Total runs"
          value={executionsLoading ? "—" : String(executions.length)}
          description={selectedWorkflow?.name ?? "Select a workflow"}
          icon={<Activity className="size-4" />}
        />
        <SummaryCard
          title="Success"
          value={executionsLoading ? "—" : String(successCount)}
          description={failureCount > 0 ? `${failureCount} failed` : "No failures"}
          icon={<ArrowUpRight className="size-4" />}
        />
        <SummaryCard
          title="Average duration"
          value={executionsLoading ? "—" : averageDuration}
          description={`${completedExecutions.length} completed`}
          icon={<Clock className="size-4" />}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Workflow execution history</CardTitle>
          <CardDescription>
            {selectedWorkflow
              ? `Showing runs for ${selectedWorkflow.name}`
              : "Choose a workflow to inspect its runs"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {workflowsLoading ? (
            <p className="text-sm text-muted-foreground">Loading workflows…</p>
          ) : workflows.length === 0 ? (
            <EmptyState
              title="No workflows yet"
              description="Create a workflow before reviewing execution history."
              href="/dashboard/workflows"
              cta="Create workflow"
            />
          ) : error ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              Failed to load executions: {(error as Error).message}
            </div>
          ) : executionsLoading ? (
            <p className="text-sm text-muted-foreground">Loading executions…</p>
          ) : executions.length === 0 ? (
            <EmptyState
              title="No executions for this workflow"
              description="Runs will appear here after the workflow is triggered."
              href={`/workflows/${effectiveWorkflowId}`}
              cta="Open workflow"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Execution</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Transaction</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {executions.map((execution) => (
                  <TableRow key={execution.id}>
                    <TableCell>
                      <div className="font-mono text-xs">{execution.executionId.slice(0, 16)}</div>
                      <div className="mt-1 max-w-64 truncate text-xs text-muted-foreground">
                        {formatTriggerData(execution.triggerData)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(execution.status)}>
                        {execution.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(execution.startedAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {execution.completedAt
                        ? formatDuration(
                            new Date(execution.completedAt).getTime() -
                              new Date(execution.startedAt).getTime(),
                          )
                        : "Running"}
                    </TableCell>
                    <TableCell>
                      {execution.txSignature ? (
                        <Button asChild size="sm" variant="ghost">
                          <a
                            href={`https://solscan.io/tx/${execution.txSignature}?cluster=devnet`}
                            rel="noreferrer"
                            target="_blank"
                          >
                            Solscan
                            <ArrowUpRight className="size-3.5" />
                          </a>
                        </Button>
                      ) : execution.txError ? (
                        <span className="text-xs text-destructive">{execution.txError}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function SummaryCard({
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
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <span className="text-muted-foreground">{icon}</span>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="truncate text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

function EmptyState({
  title,
  description,
  href,
  cta,
}: {
  title: string
  description: string
  href: string
  cta: string
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-md border border-dashed py-12 text-center">
      <Activity className="size-8 text-muted-foreground" />
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Button asChild size="sm">
        <Link href={href}>{cta}</Link>
      </Button>
    </div>
  )
}

function statusVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  if (status === "success") return "default"
  if (status === "failed" || status === "error") return "destructive"
  if (status === "running" || status === "pending" || status === "processing") return "secondary"
  return "outline"
}

function formatDuration(durationMs: number) {
  if (!Number.isFinite(durationMs) || durationMs < 0) {
    return "—"
  }

  const seconds = Math.round(durationMs / 1000)
  if (seconds < 60) {
    return `${seconds}s`
  }

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}m ${remainingSeconds}s`
}

function formatTriggerData(triggerData: unknown) {
  if (!triggerData) {
    return "No trigger data"
  }

  try {
    return JSON.stringify(triggerData)
  } catch {
    return "Trigger data unavailable"
  }
}
