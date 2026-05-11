"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { LogOutIcon, MoonIcon, SunIcon } from "lucide-react";
import { useThemeToggle } from "./ui/theme-toggle";

export function NavUser({
  user,
  onLogout,
}: {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
  onLogout?: () => void;
}) {
  const themeToggle = useThemeToggle();
  const ThemeIcon = !themeToggle.mounted ? MoonIcon : themeToggle.isDark ? SunIcon : MoonIcon;
  const themeLabel = themeToggle.mounted ? themeToggle.label : "Toggle theme";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="default"
          onClick={themeToggle.toggleTheme}
          disabled={!themeToggle.mounted}
          aria-label={themeLabel}
          title={themeLabel}
          className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <ThemeIcon size={16} />
          <span className="flex-1 text-left">Toggle Theme</span>
        </SidebarMenuButton>

        <SidebarMenuButton
          size="lg"
          onClick={onLogout}
          className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <Avatar className="h-8 w-8 rounded-lg grayscale">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="rounded-lg">CN</AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">{user.name}</span>
            <span className="truncate text-xs text-muted-foreground">{user.email}</span>
          </div>
          <LogOutIcon className="ml-auto size-4" />
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
