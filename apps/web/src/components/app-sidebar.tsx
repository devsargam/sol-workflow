"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { NavUser } from "@/components/nav-user"
import { Workflow, PlugZap, Webhook, Zap } from "lucide-react"
import { useWalletAuth } from "@/components/providers/wallet-auth-provider"

const navItems = [
  {
    title: "Workflows",
    url: "/dashboard/workflows",
    icon: Workflow,
  },
  {
    title: "Executions",
    url: "/dashboard/executions",
    icon: PlugZap,
  },
  {
    title: "API keys",
    url: "/dashboard/api-keys",
    icon: Webhook,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { walletAddress, logout } = useWalletAuth()

  const shortAddress = walletAddress
    ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`
    : null

  const user = {
    name: shortAddress ?? "Wallet",
    email: walletAddress ?? "",
    avatar: "",
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <Link href="/dashboard">
                <Zap className="size-5! text-[#9945ff]" />
                <span className="text-base font-semibold">Dolphinflow</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent className="flex flex-col gap-2">
            <SidebarGroupLabel>Workspace</SidebarGroupLabel>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive =
                  pathname === item.url || pathname.startsWith(item.url + "/")
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      isActive={isActive}
                      className="data-active:bg-neutral-950 data-active:text-white data-active:hover:bg-neutral-950 data-active:hover:text-white dark:data-active:bg-white dark:data-active:text-black dark:data-active:hover:bg-white dark:data-active:hover:text-black [&_svg]:text-current"
                    >
                      <Link href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        {walletAddress ? <NavUser user={user} onLogout={logout} /> : null}
      </SidebarFooter>
    </Sidebar>
  )
}
