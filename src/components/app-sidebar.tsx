"use client"

import * as React from "react"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import {
  LayoutDashboardIcon,
  ListIcon,
  CameraIcon,
  UsersIcon,
  Settings2Icon,
  FileChartColumnIcon,
  CommandIcon,
} from "lucide-react"

// All possible nav items — filtered by role below
const ALL_MAIN = [
  { title: "Dashboard",  url: "/dashboard",  icon: <LayoutDashboardIcon />, roles: ["ADMIN", "TEACHER"] },
  { title: "Students",   url: "/students",   icon: <UsersIcon />,           roles: ["ADMIN", "TEACHER"] },
  { title: "Attendance", url: "/attendance", icon: <CameraIcon />,          roles: ["ADMIN", "TEACHER"] },
  { title: "Schedule",   url: "/schedule",   icon: <ListIcon />,            roles: ["ADMIN", "TEACHER"] },
  { title: "Reports",    url: "/reports",    icon: <FileChartColumnIcon />, roles: ["ADMIN", "TEACHER"] },
];

const ALL_SECONDARY = [
  { title: "Settings", url: "/settings", icon: <Settings2Icon />, roles: ["ADMIN"] },
];

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: { name: string; email: string; role: string };
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const role = user.role;

  const mainItems = ALL_MAIN
    .filter((item) => item.roles.includes(role))
    .map(({ title, url, icon }) => ({ title, url, icon }));

  const secondaryItems = ALL_SECONDARY
    .filter((item) => item.roles.includes(role))
    .map(({ title, url, icon }) => ({ title, url, icon }));

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <a href="/dashboard" className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#273C97] text-white">
                  <CommandIcon className="size-4" />
                </div>
                <div className="flex flex-col leading-none">
                  <span className="text-sm font-bold tracking-tight">i-Check</span>
                  <span className="text-[10px] text-muted-foreground capitalize">
                    {role === "ADMIN" ? "Admin" : role === "TEACHER" ? "Teacher" : role}
                  </span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={mainItems} />

        {secondaryItems.length > 0 && (
          <>
            <SidebarSeparator />
            <NavSecondary items={secondaryItems} />
          </>
        )}
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
