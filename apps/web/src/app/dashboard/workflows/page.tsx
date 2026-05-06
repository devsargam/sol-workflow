"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Plus,
  Pencil,
  Trash2,
  Workflow as WorkflowIcon,
  Pause,
  Play,
  Loader2,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DeleteModal } from "@/components/ui/delete-modal"
import { cn } from "@/lib/utils"
import { fetchWorkflows, deleteWorkflow, toggleWorkflow } from "@/lib/api"

export default function DashboardWorkflowsPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [pendingDelete, setPendingDelete] = useState<{
    id: string
    name: string
  } | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ["workflows"],
    queryFn: fetchWorkflows,
  })

  const toggleMutation = useMutation({
    mutationFn: (id: string) => toggleWorkflow(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workflows"] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteWorkflow(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] })
      setPendingDelete(null)
    },
  })

  const workflows = data?.workflows ?? []
  const activeCount = workflows.filter((w) => w.enabled).length

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Workflows</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isLoading
              ? "Loading…"
              : `${workflows.length} total · ${activeCount} active`}
          </p>
        </div>
        <Button onClick={() => router.push("/workflows/builder")}>
          <Plus className="size-4" />
          New workflow
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : workflows.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <WorkflowIcon className="size-8 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">No workflows yet</p>
              <p className="text-xs text-muted-foreground">
                Create your first automation to get started.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => router.push("/workflows/builder")}
            >
              <Plus className="size-4" />
              Create workflow
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workflows.map((w) => (
            <Card
              key={w.id}
              className="flex flex-col transition hover:border-foreground/20"
            >
              <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                <div className="min-w-0 flex-1">
                  <CardTitle className="truncate text-base">
                    <Link
                      href={`/workflows/builder?edit=${w.id}`}
                      className="hover:underline"
                    >
                      {w.name}
                    </Link>
                  </CardTitle>
                  {w.description ? (
                    <CardDescription className="mt-1 line-clamp-2">
                      {w.description}
                    </CardDescription>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-1.5 rounded-full border bg-background px-2.5 py-1">
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      w.enabled
                        ? "bg-[#14F195] shadow-[0_0_6px_#14F195]"
                        : "bg-muted-foreground",
                    )}
                  />
                  <span className="text-xs font-medium">
                    {w.enabled ? "Active" : "Paused"}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="mt-auto flex items-center justify-between gap-2 border-t pt-4">
                {(() => {
                  const isToggling =
                    toggleMutation.isPending &&
                    toggleMutation.variables === w.id
                  return (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleMutation.mutate(w.id)}
                      disabled={isToggling}
                    >
                      {isToggling ? (
                        <>
                          <Loader2 className="size-3.5 animate-spin" />
                          {w.enabled ? "Pausing…" : "Activating…"}
                        </>
                      ) : w.enabled ? (
                        <>
                          <Pause className="size-3.5" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="size-3.5" />
                          Activate
                        </>
                      )}
                    </Button>
                  )
                })()}
                <div className="flex items-center gap-1">
                  <span className="mr-1 text-xs text-muted-foreground">
                    {new Date(w.updatedAt).toLocaleDateString()}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() =>
                      router.push(`/workflows/builder?edit=${w.id}`)
                    }
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() =>
                      setPendingDelete({ id: w.id, name: w.name })
                    }
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {pendingDelete ? (
        <DeleteModal
          isOpen
          title={`Delete "${pendingDelete.name}"?`}
          description="This will permanently delete the workflow. This action cannot be undone."
          onConfirm={() => deleteMutation.mutate(pendingDelete.id)}
          onClose={() => setPendingDelete(null)}
          isLoading={deleteMutation.isPending}
        />
      ) : null}
    </div>
  )
}
