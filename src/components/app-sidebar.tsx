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
  UsersIcon,
  Settings2Icon,
  FileChartColumnIcon,
  BookOpenIcon,
} from "lucide-react"
import { LogoWordmark } from "@/components/logo"
import { GrSchedules } from "react-icons/gr";

import { useUser } from "@/components/user-provider"


// All possible nav items — filtered by role below.
// STUDENT role sees the student home plus student/class shortcuts.
const ALL_MAIN = [
  { title: "Dashboard", url: "/dashboard",             icon: <LayoutDashboardIcon />, roles: ["ADMIN", "TEACHER"] },
  { title: "Dashboard", url: "/student",               icon: <LayoutDashboardIcon />, roles: ["STUDENT"] },
  { title: "Require Permission", url: "/student/require-permission",  icon: <FaWpforms />, roles: ["STUDENT"] },
  { title: "Classes",    url: "/dashboard/classrooms",  icon: <BookOpenIcon />,        roles: ["ADMIN", "TEACHER"] },
  { title: "Students",   url: "/students",              icon: <UsersIcon />,           roles: ["ADMIN", "TEACHER"] },
  { title: "Schedule",   url: "/schedule",              icon: <GrSchedules />,            roles: ["ADMIN", "TEACHER"] },
  { title: "Reports",    url: "/reports",               icon: <FileChartColumnIcon />, roles: ["ADMIN", "TEACHER"] },
];

const ALL_SECONDARY = [
  { title: "Settings", url: "/settings", icon: <Settings2Icon />, roles: ["ADMIN"] },
];

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: { name: string; email: string; role: string; displayRole?: string };
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const role = user.role;
  // Prefer the live client-side user (which always carries displayRole) so a
  // SUPER_ADMIN sees "Super Admin" instead of the SSR fallback "Admin".
  const liveUser = useUser();
  const displayRole =
    liveUser?.displayRole ??
    user.displayRole ??
    (role === "ADMIN" ? "Admin" : role === "TEACHER" ? "Teacher" : role === "STUDENT" ? "Student" : role);

  const mainItems = ALL_MAIN
    .filter((item) => item.roles.includes(role))
    .map(({ title, url, icon }) => ({ title, url, icon }));

  const secondaryItems = ALL_SECONDARY
    .filter((item) => item.roles.includes(role))
    .map(({ title, url, icon }) => ({ title, url, icon }));

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader className="hidden md:flex">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="lg"
              className="h-14 data-[slot=sidebar-menu-button]:p-2!">
              <Link href={role === "STUDENT" ? "/student" : "/dashboard"} className="flex items-center gap-2 py-2">
                {/* Combined logo + "i-Check" wordmark */}
                <LogoWordmark height={40} />
                <span className="ml-auto pr-1 text-sm font-medium text-muted-foreground">
                  {displayRole}
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
