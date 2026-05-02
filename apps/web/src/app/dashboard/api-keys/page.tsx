"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Webhook, Plus, Copy, Trash2, Check } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DeleteModal } from "@/components/ui/delete-modal"
import { useWalletAuth } from "@/components/providers/wallet-auth-provider"
import {
  createApiKey,
  fetchApiKeys,
  revokeApiKey,
  type ApiKey,
} from "@/lib/api"

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export default function ApiKeysPage() {
  const queryClient = useQueryClient()
  const { walletAddress } = useWalletAuth()
  const [showCreate, setShowCreate] = useState(false)
  const [newKeyName, setNewKeyName] = useState("")
  const [revealedKey, setRevealedKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [pendingRevoke, setPendingRevoke] = useState<ApiKey | null>(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ["api-keys", walletAddress],
    queryFn: fetchApiKeys,
    enabled: Boolean(walletAddress),
  })

  const createMutation = useMutation({
    mutationFn: createApiKey,
    onSuccess: (result) => {
      setRevealedKey(result.key)
      setNewKeyName("")
      setShowCreate(false)
      queryClient.invalidateQueries({ queryKey: ["api-keys"] })
    },
  })

  const revokeMutation = useMutation({
    mutationFn: revokeApiKey,
    onSuccess: () => {
      setPendingRevoke(null)
      queryClient.invalidateQueries({ queryKey: ["api-keys"] })
    },
  })

  const keys = data?.apiKeys ?? []
  const errorMessage = error instanceof Error ? error.message : null

  const handleCreate = () => {
    const name = newKeyName.trim()
    if (!name) return
    createMutation.mutate({ name })
  }

  const handleCopy = async (value: string) => {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">API keys</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create keys for agents and scripts that call the workflow API.
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="size-4" />
          New API key
        </Button>
      </div>

      {revealedKey ? (
        <Card className="border-[#9945ff]/30 bg-[#9945ff]/5">
          <CardHeader>
            <CardTitle className="text-base">Save your new key</CardTitle>
            <CardDescription>
              This is the only time the full key will be shown. Copy it now and
              store it securely.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <code className="min-w-0 flex-1 truncate rounded-md border bg-background px-3 py-2 font-mono text-sm">
              {revealedKey}
            </code>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopy(revealedKey)}
              >
                {copied ? (
                  <>
                    <Check className="size-4" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="size-4" /> Copy
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRevealedKey(null)}
              >
                Dismiss
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {showCreate ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Create API key</CardTitle>
            <CardDescription>
              Name it so you can identify where it's used.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="key-name">Name</Label>
              <Input
                id="key-name"
                placeholder="e.g. Production agent"
                value={newKeyName}
                onChange={(event) => setNewKeyName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") handleCreate()
                }}
                disabled={createMutation.isPending}
                autoFocus
              />
              {createMutation.error instanceof Error ? (
                <p className="text-sm text-destructive">
                  {createMutation.error.message}
                </p>
              ) : null}
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowCreate(false)
                  setNewKeyName("")
                }}
                disabled={createMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!newKeyName.trim() || createMutation.isPending}
              >
                {createMutation.isPending ? "Creating..." : "Create key"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="size-4" />
            Active keys
          </CardTitle>
          <CardDescription>
            {isLoading
              ? "Loading..."
              : `${keys.length} ${keys.length === 1 ? "key" : "keys"}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {errorMessage ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              {errorMessage}
            </div>
          ) : isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : keys.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-md border border-dashed py-12 text-center">
              <Webhook className="size-8 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">No API keys yet</p>
                <p className="text-xs text-muted-foreground">
                  Create a key to start using workflow automation from scripts.
                </p>
              </div>
              <Button size="sm" onClick={() => setShowCreate(true)}>
                <Plus className="size-4" />
                Create key
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last used</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keys.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell className="font-medium">{key.name}</TableCell>
                    <TableCell>
                      <code className="rounded bg-muted px-2 py-0.5 font-mono text-xs">
                        {key.keyPrefix}
                      </code>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(key.createdAt)}
                    </TableCell>
                    <TableCell>
                      {key.lastUsedAt ? (
                        <span className="text-sm text-muted-foreground">
                          {formatDate(key.lastUsedAt)}
                        </span>
                      ) : (
                        <Badge variant="secondary">Never</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setPendingRevoke(key)}
                        disabled={revokeMutation.isPending}
                        aria-label={`Revoke ${key.name}`}
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

      <DeleteModal
        isOpen={Boolean(pendingRevoke)}
        onClose={() => setPendingRevoke(null)}
        onConfirm={() => {
          if (pendingRevoke) revokeMutation.mutate(pendingRevoke.id)
        }}
        title="Revoke API key"
        description={
          pendingRevoke
            ? `This will immediately disable "${pendingRevoke.name}".`
            : undefined
        }
        isLoading={revokeMutation.isPending}
      />
    </div>
  )
}
