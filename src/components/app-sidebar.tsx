"use client"

import * as React from "react"
import Link from "next/link"
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
} from "lucide-react"
import { Logo } from "@/components/logo"

// All possible nav items — filtered by role below.
// STUDENT role sees only Attendance (dashboard overview) and Students.
const ALL_MAIN = [
  { title: "Attendance", url: "/dashboard",  icon: <LayoutDashboardIcon />, roles: ["ADMIN", "TEACHER", "STUDENT"] },
  { title: "Students",   url: "/students",   icon: <UsersIcon />,           roles: ["ADMIN", "TEACHER", "STUDENT"] },
  { title: "Sessions",   url: "/attendance", icon: <CameraIcon />,          roles: ["ADMIN", "TEACHER"] },
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
              <Link href="/dashboard" className="flex items-center gap-2">
                <Logo size={32} />
                <div className="flex flex-col leading-none">
                  <span className="text-sm font-bold tracking-tight">i-Check</span>
                  <span className="text-[10px] text-muted-foreground capitalize">
                    {role === "ADMIN" ? "Admin" : role === "TEACHER" ? "Teacher" : role}
                  </span>
                </div>
              </Link>
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
