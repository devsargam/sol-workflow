"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Pencil, Trash2, Workflow as WorkflowIcon } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DeleteModal } from "@/components/ui/delete-modal"
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

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Workflows</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Automations that react to onchain events.
          </p>
        </div>
        <Button onClick={() => router.push("/workflows/builder")}>
          <Plus className="size-4" />
          New workflow
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <WorkflowIcon className="size-4" />
            All workflows
          </CardTitle>
          <CardDescription>
            {isLoading
              ? "Loading…"
              : `${workflows.length} total · ${workflows.filter((w) => w.enabled).length} active`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : workflows.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-md border border-dashed py-12 text-center">
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
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workflows.map((w) => (
                  <TableRow key={w.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/workflows/${w.id}`}
                        className="hover:underline"
                      >
                        {w.name}
                      </Link>
                      {w.description ? (
                        <p className="text-xs text-muted-foreground">
                          {w.description}
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={w.enabled}
                          onCheckedChange={() =>
                            toggleMutation.mutate(w.id)
                          }
                          disabled={toggleMutation.isPending}
                        />
                        <Badge
                          variant={w.enabled ? "default" : "secondary"}
                        >
                          {w.enabled ? "Active" : "Paused"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(w.updatedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="flex justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() =>
                          router.push(`/workflows/${w.id}`)
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

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
