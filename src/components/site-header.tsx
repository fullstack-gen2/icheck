"use client";

import { usePathname } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronRightIcon, BellIcon } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

const ROUTE_LABELS: Record<string, string> = {
  "/dashboard":            "Attendance",
  "/dashboard/classrooms": "Classes",
  "/students":             "Students",
  "/attendance":           "Sessions",
  "/schedule":             "Schedule",
  "/settings":             "Settings",
  "/reports":              "Reports",
  "/sessions":             "Session QR",
  "/student":              "My Attendance",
};

function getSegments(pathname: string): { label: string; path: string }[] {
  const parts = pathname.split("/").filter(Boolean);
  const segs: { label: string; path: string }[] = [
    { label: "i-Check", path: "/" },
  ];
  let accumulated = "";
  for (const part of parts) {
    accumulated += "/" + part;
    const label =
      ROUTE_LABELS[accumulated] ??
      (part.match(/^\d+$/) ? `#${part}` : capitalize(part));
    segs.push({ label, path: accumulated });
  }
  return segs;
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function SiteHeader() {
  const pathname = usePathname();
  const segments = getSegments(pathname);

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height) bg-background">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-sm text-gray-500">
          {segments.map((seg, i) => (
            <span key={seg.path} className="flex items-center gap-1">
              {i > 0 && (
                <ChevronRightIcon className="size-3.5 text-gray-300" />
              )}
              <span
                className={
                  i === segments.length - 1
                    ? "font-semibold text-gray-900 dark:text-gray-100"
                    : "text-gray-400"
                }
              >
                {seg.label}
              </span>
            </span>
          ))}
        </nav>

        {/* Right-side actions */}
        <div className="ml-auto flex items-center gap-1">
          {/* Notification bell */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
              >
                <BellIcon className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 p-0">
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <span className="text-sm font-semibold">Notifications</span>
                <span className="text-xs text-muted-foreground">0 new</span>
              </div>
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <BellIcon className="size-8 text-gray-200 mb-2" />
                <p className="text-sm text-muted-foreground">
                  No notifications yet
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  You&apos;re all caught up!
                </p>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme toggle (light / dark / system + color) */}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
