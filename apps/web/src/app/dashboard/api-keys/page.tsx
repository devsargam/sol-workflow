"use client"

import { useState } from "react"
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

type ApiKey = {
  id: string
  name: string
  prefix: string
  createdAt: string
  lastUsed: string | null
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [newKeyName, setNewKeyName] = useState("")
  const [revealedKey, setRevealedKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleCreate = () => {
    if (!newKeyName.trim()) return
    const id = crypto.randomUUID()
    const fullKey = `dk_live_${id.replace(/-/g, "")}`
    const newKey: ApiKey = {
      id,
      name: newKeyName.trim(),
      prefix: `${fullKey.slice(0, 12)}...`,
      createdAt: new Date().toISOString(),
      lastUsed: null,
    }
    setKeys([newKey, ...keys])
    setRevealedKey(fullKey)
    setNewKeyName("")
    setShowCreate(false)
  }

  const handleCopy = async (value: string) => {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const handleDelete = (id: string) => {
    setKeys(keys.filter((k) => k.id !== id))
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">API keys</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Use these keys to call Dolphinflow webhooks and trigger workflows
            programmatically.
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
          <CardContent className="flex items-center gap-2">
            <code className="flex-1 truncate rounded-md border bg-background px-3 py-2 font-mono text-sm">
              {revealedKey}
            </code>
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
                placeholder="e.g. Production webhook"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate()
                }}
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowCreate(false)
                  setNewKeyName("")
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={!newKeyName.trim()}>
                Create key
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
            {keys.length === 0
              ? "No API keys yet"
              : `${keys.length} ${keys.length === 1 ? "key" : "keys"}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {keys.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-md border border-dashed py-12 text-center">
              <Webhook className="size-8 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">No API keys yet</p>
                <p className="text-xs text-muted-foreground">
                  Create a key to start sending webhook events.
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
                {keys.map((k) => (
                  <TableRow key={k.id}>
                    <TableCell className="font-medium">{k.name}</TableCell>
                    <TableCell>
                      <code className="rounded bg-muted px-2 py-0.5 font-mono text-xs">
                        {k.prefix}
                      </code>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(k.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {k.lastUsed ? (
                        <span className="text-sm text-muted-foreground">
                          {new Date(k.lastUsed).toLocaleDateString()}
                        </span>
                      ) : (
                        <Badge variant="secondary">Never</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(k.id)}
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
    </div>
  )
}
