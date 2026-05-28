"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  ChevronsUpDownIcon,
  UserIcon,
  BellIcon,
  LogOutIcon,
} from "lucide-react"
import { useUser } from "@/components/user-provider"

function initials(name: string) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  // Multi-word names → first letter of each word (max 2)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  // Single word (e.g. "chanthorn") → first two letters
  return name.slice(0, 2).toUpperCase();
}

async function handleLogout() {
  try {
    // Spring Cloud Gateway BFF exposes POST /logout at the gateway root
    await fetch("/logout", { method: "POST", credentials: "include" });
  } catch {
    // ignore network errors — still redirect
  }
  // Redirect to IAM which will ask user to re-authenticate
  window.location.href =
    process.env.NEXT_PUBLIC_LOGIN_URL ?? "https://iam.istad.co";
}

export function NavUser({
  user: serverUser,
}: {
  user: { name: string; email: string; role: string }
}) {
  const { isMobile } = useSidebar()
  // Prefer live client-side user; fall back to server-rendered prop during SSR.
  const liveUser = useUser()
  const user = liveUser ?? serverUser

  const avatarBg = "bg-primary"

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarFallback className={`rounded-lg ${avatarBg} text-white text-xs font-semibold`}>
                  {initials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user.name || "—"}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {user.email || "—"}
                </span>
              </div>
              <ChevronsUpDownIcon className="ml-auto size-4 opacity-50" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-64 rounded-xl"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            {/* Profile header */}
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-3 px-3 py-3 text-left text-sm">
                <Avatar className="h-10 w-10 rounded-xl">
                  <AvatarFallback className={`rounded-xl ${avatarBg} text-white text-sm font-semibold`}>
                    {initials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left leading-tight gap-0.5">
                  <span className="font-semibold text-foreground">{user.name || "—"}</span>
                  <span className="text-xs text-muted-foreground truncate">
                    {user.email || "—"}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            {/* Menu items */}
            <DropdownMenuGroup>
              <DropdownMenuItem className="gap-3 py-2.5">
                <UserIcon className="size-4 text-muted-foreground" />
                <span>Account</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-3 py-2.5">
                <BellIcon className="size-4 text-muted-foreground" />
                <span>Notifications</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            {/* Log out */}
            <DropdownMenuItem
              className="gap-3 py-2.5 text-red-500 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-950/30"
              onClick={handleLogout}
            >
              <LogOutIcon className="size-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
