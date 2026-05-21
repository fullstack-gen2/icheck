"use client";

import { usePathname } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ChevronRightIcon } from "lucide-react";

const ROUTE_LABELS: Record<string, string> = {
  "/dashboard":  "Dashboard",
  "/dashboard/classrooms": "Classes",
  "/students":   "Students",
  "/attendance": "Attendance",
  "/schedule":   "Schedule",
  "/settings":   "Settings",
  "/reports":    "Reports",
  "/sessions":   "Session QR",
  "/student":    "My Attendance",
};

function getSegments(pathname: string): { label: string; path: string }[] {
  const parts = pathname.split("/").filter(Boolean);
  const segs: { label: string; path: string }[] = [{ label: "i-Check", path: "/" }];
  let accumulated = "";
  for (const part of parts) {
    accumulated += "/" + part;
    const label = ROUTE_LABELS[accumulated] ?? (part.match(/^\d+$/) ? `#${part}` : capitalize(part));
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
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height) bg-white">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-sm text-gray-500">
          {segments.map((seg, i) => (
            <span key={seg.path} className="flex items-center gap-1">
              {i > 0 && <ChevronRightIcon className="size-3.5 text-gray-300" />}
              <span
                className={
                  i === segments.length - 1
                    ? "font-semibold text-gray-900"
                    : "text-gray-400"
                }
              >
                {seg.label}
              </span>
            </span>
          ))}
        </nav>
      </div>
    </header>
  );
}
