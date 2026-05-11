"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
} from "@/components/ui/sidebar";
import { NavUser } from "@/components/nav-user";
import { Home, Plus, PlugZap, Webhook, Workflow } from "lucide-react";
import { useWalletAuth } from "@/components/providers/wallet-auth-provider";
import { useChatSessions } from "@/lib/hooks/use-chat-sessions";
import { useWorkflows } from "@/lib/hooks/use-workflows";

const workspaceNavItems = [
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
];

function getSidebarChatTitle(title: string) {
  const compactTitle = title.replace(/\s+/g, " ").trim();
  return compactTitle.length > 32 ? `${compactTitle.slice(0, 29).trim()}...` : compactTitle;
}

function getSidebarWorkflowTitle(title: string) {
  const compactTitle = title.replace(/\s+/g, " ").trim();
  return compactTitle.length > 32 ? `${compactTitle.slice(0, 29).trim()}...` : compactTitle;
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { walletAddress, logout } = useWalletAuth();
  const { data: chatHistory, isLoading: isChatHistoryLoading } = useChatSessions();
  const { data: workflowHistory, isLoading: isWorkflowHistoryLoading } = useWorkflows();
  const activeChatId = searchParams.get("chat") ?? searchParams.get("id");
  const activeWorkflowId = searchParams.get("edit");
  const isWorkflowsActive =
    pathname === "/dashboard/workflows" || pathname.startsWith("/dashboard/workflows/");
  const isHomeActive = pathname === "/dashboard" && !activeChatId;

  const shortAddress = walletAddress
    ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`
    : null;

  const user = {
    name: shortAddress ?? "Wallet",
    email: walletAddress ?? "",
    avatar: "",
  };

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:p-1.5!">
              <Link href="/dashboard">
                <Image
                  src="/logo.jpg"
                  alt="dolphinflow logo"
                  width={24}
                  height={24}
                  className="size-6 rounded-full object-cover"
                  priority
                />
                <span className="text-base font-semibold">Dolphinflow</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarGroupLabel>Workspace</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  size="sm"
                  tooltip="Home"
                  isActive={isHomeActive}
                  className="data-active:bg-neutral-950 data-active:text-white data-active:hover:bg-neutral-950 data-active:hover:text-white dark:data-active:bg-white dark:data-active:text-black dark:data-active:hover:bg-white dark:data-active:hover:text-black [&_svg]:text-current"
                >
                  <Link href="/dashboard" className="font-medium">
                    <Home />
                    <span>Home</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {workspaceNavItems.map((item) => {
                const isActive = pathname === item.url || pathname.startsWith(item.url + "/");
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      size="sm"
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
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupContent>
            <SidebarGroupLabel>Workflows</SidebarGroupLabel>
            <SidebarGroupAction asChild title="New workflow">
              <Link href="/dashboard/workflows/builder">
                <Plus />
                <span className="sr-only">New workflow</span>
              </Link>
            </SidebarGroupAction>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  size="sm"
                  isActive={isWorkflowsActive && !activeWorkflowId}
                  className="data-active:bg-neutral-950 data-active:text-white data-active:hover:bg-neutral-950 data-active:hover:text-white dark:data-active:bg-white dark:data-active:text-black dark:data-active:hover:bg-white dark:data-active:hover:text-black [&_svg]:text-current"
                >
                  <Link href="/dashboard/workflows">
                    <Workflow />
                    <span>All workflows</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {isWorkflowHistoryLoading ? (
                <>
                  <SidebarMenuSkeleton showIcon />
                  <SidebarMenuSkeleton showIcon />
                  <SidebarMenuSkeleton showIcon />
                </>
              ) : workflowHistory?.workflows.length ? (
                workflowHistory.workflows.map((workflow) => {
                  const title = getSidebarWorkflowTitle(workflow.name);
                  return (
                    <SidebarMenuItem key={workflow.id}>
                      <SidebarMenuButton
                        asChild
                        size="sm"
                        isActive={activeWorkflowId === workflow.id}
                        title={workflow.name}
                        className="data-active:bg-neutral-950 data-active:text-white data-active:hover:bg-neutral-950 data-active:hover:text-white dark:data-active:bg-white dark:data-active:text-black dark:data-active:hover:bg-white dark:data-active:hover:text-black [&_svg]:text-current"
                      >
                        <Link
                          href={`/dashboard/workflows/builder?edit=${encodeURIComponent(workflow.id)}`}
                        >
                          <span>{title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })
              ) : (
                <SidebarMenuItem>
                  <span className="block px-2 py-1.5 text-xs text-sidebar-foreground/60">
                    No workflows yet
                  </span>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupContent>
            <SidebarGroupLabel>Chats</SidebarGroupLabel>
            <SidebarGroupAction asChild title="New chat">
              <Link href="/dashboard">
                <Plus />
                <span className="sr-only">New chat</span>
              </Link>
            </SidebarGroupAction>
            <SidebarMenu>
              {isChatHistoryLoading ? (
                <>
                  <SidebarMenuSkeleton showIcon />
                  <SidebarMenuSkeleton showIcon />
                  <SidebarMenuSkeleton showIcon />
                </>
              ) : chatHistory?.sessions.length ? (
                chatHistory.sessions.map((session) => {
                  const title = getSidebarChatTitle(session.title);
                  return (
                    <SidebarMenuItem key={session.id}>
                      <SidebarMenuButton
                        asChild
                        size="sm"
                        isActive={activeChatId === session.id}
                        title={session.title}
                        className="data-active:bg-neutral-950 data-active:text-white data-active:hover:bg-neutral-950 data-active:hover:text-white dark:data-active:bg-white dark:data-active:text-black dark:data-active:hover:bg-white dark:data-active:hover:text-black [&_svg]:text-current"
                      >
                        <Link href={`/dashboard?chat=${encodeURIComponent(session.id)}`}>
                          <span>{title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })
              ) : (
                <SidebarMenuItem>
                  <span className="block px-2 py-1.5 text-xs text-sidebar-foreground/60">
                    No previous chats
                  </span>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        {walletAddress ? <NavUser user={user} onLogout={logout} /> : null}
      </SidebarFooter>
    </Sidebar>
  );
}
