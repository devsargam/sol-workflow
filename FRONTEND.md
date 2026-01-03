# Frontend Development Guide

## 🎨 Tech Stack

- **Next.js 14** - App Router, React Server Components
- **shadcn/ui** - Prebuilt components (Vega theme with Stone base, Blue accent)
- **Tailwind CSS** - Utility-first CSS
- **React Query** - Server state management
- **Zustand** - Client state management
- **Solana Wallet Adapter** - Wallet connection

## 🚀 Quick Start

### Running the Frontend

```bash
# Option 1: Run all services
pnpm dev

# Option 2: Run only frontend
pnpm dev:web

# Option 3: From web directory
cd apps/web
pnpm dev
```

Visit: http://localhost:3000

### Current Pages

- `/` - Home page with overview
- `/workflows` - Workflows list (starter template created)
- `/executions` - Executions history (needs to be built)

## 📦 Adding shadcn/ui Components

shadcn/ui components are installed on-demand:

```bash
cd apps/web

# Add individual components
pnpm dlx shadcn@latest add button
pnpm dlx shadcn@latest add form
pnpm dlx shadcn@latest add card

# Add multiple at once
pnpm dlx shadcn@latest add button card input label select textarea dialog badge alert table

# See all available components
pnpm dlx shadcn@latest add
```

Components are added to `src/components/ui/`

## 🏗️ Project Structure

```
apps/web/
├── src/
│   ├── app/                          # App Router
│   │   ├── layout.tsx               # Root layout (header included)
│   │   ├── page.tsx                 # Home page
│   │   ├── globals.css              # Vega theme styles
│   │   ├── workflows/
│   │   │   ├── page.tsx            # Workflows list
│   │   │   ├── new/
│   │   │   │   └── page.tsx        # Create workflow wizard
│   │   │   └── [id]/
│   │   │       ├── page.tsx        # Workflow detail
│   │   │       └── edit/
│   │   │           └── page.tsx    # Edit workflow
│   │   └── executions/
│   │       ├── page.tsx            # Executions list
│   │       └── [id]/
│   │           └── page.tsx        # Execution detail
│   ├── components/
│   │   ├── ui/                     # shadcn/ui components
│   │   ├── layout/                 # Layout components
│   │   │   └── header.tsx
│   │   ├── workflows/              # Workflow-specific components
│   │   │   ├── workflow-card.tsx
│   │   │   ├── workflow-form.tsx
│   │   │   └── workflow-wizard/
│   │   │       ├── trigger-step.tsx
│   │   │       ├── filter-step.tsx
│   │   │       ├── action-step.tsx
│   │   │       └── notify-step.tsx
│   │   └── executions/             # Execution components
│   │       ├── execution-card.tsx
│   │       └── execution-timeline.tsx
│   ├── lib/
│   │   ├── utils.ts               # Utilities (cn function)
│   │   ├── api.ts                 # API client
│   │   └── hooks/                 # Custom hooks
│   │       ├── use-workflows.ts
│   │       └── use-executions.ts
│   └── types/
│       └── api.ts                 # API types
└── public/                        # Static assets
```

## 🎨 Vega Theme Colors

Your theme is already configured in `tailwind.config.ts`:

```typescript
// Primary (Blue)
bg - primary; // #3B82F6
text - primary - foreground;

// Background (Stone)
bg - background; // White (#FFFFFF)
bg - card; // White
bg - muted; // Stone-100 (#F5F5F4)

// Text
text - foreground; // Stone-950
text - muted - foreground; // Stone-500

// Accents
border; // Stone-200
ring; // Blue-500
```

## 🔌 API Integration

### Setup React Query

```bash
cd apps/web
# React Query is already in package.json, just install if needed
pnpm install
```

**Create API client** (`src/lib/api.ts`):

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export async function fetchWorkflows() {
  const res = await fetch(`${API_URL}/workflows`);
  if (!res.ok) throw new Error("Failed to fetch workflows");
  return res.json();
}

export async function createWorkflow(data: any) {
  const res = await fetch(`${API_URL}/workflows`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create workflow");
  return res.json();
}
```

**Create React Query hook** (`src/lib/hooks/use-workflows.ts`):

```typescript
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchWorkflows, createWorkflow } from "@/lib/api";

export function useWorkflows() {
  return useQuery({
    queryKey: ["workflows"],
    queryFn: fetchWorkflows,
  });
}

export function useCreateWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createWorkflow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
    },
  });
}
```

**Use in component**:

```typescript
"use client";

import { useWorkflows } from "@/lib/hooks/use-workflows";

export default function WorkflowsPage() {
  const { data, isLoading, error } = useWorkflows();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading workflows</div>;

  return (
    <div>
      {data?.workflows?.map((workflow) => (
        <div key={workflow.id}>{workflow.name}</div>
      ))}
    </div>
  );
}
```

## 🧩 Component Examples

### Workflow Card

```typescript
// src/components/workflows/workflow-card.tsx
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function WorkflowCard({ workflow }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">{workflow.name}</h3>
        <Badge variant={workflow.enabled ? "default" : "secondary"}>
          {workflow.enabled ? "Active" : "Disabled"}
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        {workflow.description}
      </p>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>{workflow.triggerType}</span>
        <span>→</span>
        <span>{workflow.actionType}</span>
      </div>
    </Card>
  );
}
```

### Workflow Wizard Step

```typescript
// src/components/workflows/workflow-wizard/trigger-step.tsx
"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export function TriggerStep({ value, onChange }) {
  const [triggerType, setTriggerType] = useState(value?.type || "");

  return (
    <div className="space-y-4">
      <div>
        <Label>Trigger Type</Label>
        <Select value={triggerType} onValueChange={setTriggerType}>
          <SelectTrigger>
            <SelectValue placeholder="Select trigger type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="balance_change">Balance Change</SelectItem>
            <SelectItem value="token_receipt">Token Receipt</SelectItem>
            <SelectItem value="nft_receipt">NFT Receipt</SelectItem>
            <SelectItem value="program_log">Program Log</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {triggerType === "balance_change" && (
        <div>
          <Label>Wallet Address</Label>
          <Input
            placeholder="Enter Solana address"
            value={value?.config?.address || ""}
            onChange={(e) => onChange({
              type: triggerType,
              config: { address: e.target.value }
            })}
          />
        </div>
      )}
    </div>
  );
}
```

## 🔐 Solana Wallet Integration

**Setup Wallet Adapter** (`src/components/providers/wallet-provider.tsx`):

```typescript
"use client";

import { useMemo } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";

require("@solana/wallet-adapter-react-ui/styles.css");

export function SolanaWalletProvider({ children }: { children: React.ReactNode }) {
  const endpoint = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com";

  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
```

**Add to root layout** (`src/app/layout.tsx`):

```typescript
import { SolanaWalletProvider } from "@/components/providers/wallet-provider";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <SolanaWalletProvider>
          <Header />
          <main>{children}</main>
        </SolanaWalletProvider>
      </body>
    </html>
  );
}
```

**Use in header** (`src/components/layout/header.tsx`):

```typescript
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export function Header() {
  return (
    <header className="border-b">
      <div className="container flex justify-between items-center py-4">
        <nav>...</nav>
        <WalletMultiButton />
      </div>
    </header>
  );
}
```

## 📝 Form Validation with Zod

Use the shared schemas from `@repo/types`:

```typescript
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateWorkflowSchema } from "@repo/types";

export function WorkflowForm() {
  const form = useForm({
    resolver: zodResolver(CreateWorkflowSchema),
    defaultValues: {
      name: "",
      trigger: { type: "balance_change", config: {} },
      filter: { conditions: [] },
      action: { type: "send_sol", config: {} },
      notify: { type: "discord", webhookUrl: "", template: "default" },
    },
  });

  const onSubmit = form.handleSubmit(async (data) => {
    // Create workflow
    console.log(data);
  });

  return <form onSubmit={onSubmit}>...</form>;
}
```

## 🎯 Development Workflow

### 1. Start with UI mockups

Build static components first:

```typescript
// Start with hardcoded data
const mockWorkflow = {
  id: "1",
  name: "Test Workflow",
  enabled: true,
  // ...
};
```

### 2. Add shadcn/ui components

```bash
pnpm dlx shadcn@latest add button card input
```

### 3. Connect to API

```typescript
// Replace mock data with React Query
const { data } = useWorkflows();
```

### 4. Add state management

```typescript
// For complex client state (wizard, drafts)
import { create } from "zustand";

const useWorkflowDraft = create((set) => ({
  draft: null,
  setDraft: (draft) => set({ draft }),
}));
```

## 🐛 Debugging Tips

**Check if API is running:**

```bash
curl http://localhost:3001/health
```

**Check React Query DevTools:**

```bash
pnpm add @tanstack/react-query-devtools
```

```typescript
// In layout.tsx
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

<ReactQueryDevtools initialIsOpen={false} />
```

**Tailwind not working?**
Check that files are included in `tailwind.config.ts`:

```typescript
content: [
  "./src/**/*.{js,ts,jsx,tsx,mdx}",
],
```

## 📚 Next Steps

1. **Add shadcn components**: `pnpm dlx shadcn@latest add button card input form`
2. **Set up React Query provider** in `app/layout.tsx`
3. **Create workflow list page** with `useWorkflows()` hook
4. **Build workflow wizard** with step-by-step forms
5. **Add Solana wallet connection**
6. **Connect to API endpoints**

## 🔗 Useful Resources

- **shadcn/ui docs**: https://ui.shadcn.com/docs
- **Next.js App Router**: https://nextjs.org/docs/app
- **React Query**: https://tanstack.com/query/latest
- **Solana Wallet Adapter**: https://github.com/anza-xyz/wallet-adapter

---

**Current Status**: Basic pages created, ready to add shadcn components and build workflow UI!
