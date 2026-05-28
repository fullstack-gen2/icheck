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
  BookOpenIcon,
} from "lucide-react"
import { LogoWordmark } from "@/components/logo"

// All possible nav items — filtered by role below.
// STUDENT role sees only Attendance (dashboard overview) and Students.
const ALL_MAIN = [
  { title: "Attendance", url: "/dashboard",             icon: <LayoutDashboardIcon />, roles: ["ADMIN", "TEACHER", "STUDENT"] },
  { title: "Classes",    url: "/dashboard/classrooms",  icon: <BookOpenIcon />,        roles: ["ADMIN", "TEACHER", "STUDENT"] },
  { title: "Students",   url: "/students",              icon: <UsersIcon />,           roles: ["ADMIN", "TEACHER", "STUDENT"] },
  { title: "Sessions",   url: "/attendance",            icon: <CameraIcon />,          roles: ["ADMIN", "TEACHER"] },
  { title: "Schedule",   url: "/schedule",              icon: <ListIcon />,            roles: ["ADMIN", "TEACHER"] },
  { title: "Reports",    url: "/reports",               icon: <FileChartColumnIcon />, roles: ["ADMIN", "TEACHER"] },
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
              size="lg"
              className="h-14 data-[slot=sidebar-menu-button]:p-2!"
            >
              <Link href="/dashboard" className="flex items-center gap-2 py-2">
                {/* Combined logo + "i-Check" wordmark */}
                <LogoWordmark height={40} />
                <span className="text-xs text-muted-foreground capitalize ml-auto pr-1 font-medium">
                  {role === "ADMIN" ? "Admin" : role === "TEACHER" ? "Teacher" : role}
                </span>
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
