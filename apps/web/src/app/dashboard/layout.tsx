"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { useWalletAuth } from "@/components/providers/wallet-auth-provider"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { ready, authenticated } = useWalletAuth()
  const router = useRouter()

  useEffect(() => {
    if (ready && !authenticated) {
      router.replace("/")
    }
  }, [ready, authenticated, router])

  if (!ready || !authenticated) {
    return null
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 60)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar
        variant="inset"
        className="dark:[&_[data-slot=sidebar-inner]]:border dark:[&_[data-slot=sidebar-inner]]:border-white/10 dark:[&_[data-slot=sidebar-inner]]:bg-[#060606] dark:[&_[data-slot=sidebar-inner]]:shadow-[0_18px_50px_rgba(0,0,0,0.55)]"
      />
      <SidebarInset className="dark:bg-[#070707] dark:ring-1 dark:ring-white/10 dark:shadow-[0_22px_70px_rgba(0,0,0,0.65)]">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4 dark:border-white/10">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
