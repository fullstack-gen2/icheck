"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { SunMoon, PaletteIcon, ChevronDownIcon, CheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const NAMED_THEMES = [
  { name: "i-Check",  value: "icheck"   },
  { name: "Claude",   value: "claude"   },
  { name: "Supabase", value: "supabase" },
  { name: "Vercel",   value: "vercel"   },
  { name: "Mono",     value: "mono"     },
  { name: "Rose",     value: "rose"     },
  { name: "Emerald",  value: "emerald"  },
  { name: "Violet",   value: "violet"   },
  { name: "Amber",    value: "amber"    },
];

function applyNamedTheme(value: string) {
  localStorage.setItem("named-theme", value);
  // "icheck" = default; no data-theme attribute needed
  if (value === "icheck") {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.setAttribute("data-theme", value);
  }
}

/** Small circle button — toggles dark ↔ light mode */
export function DarkModeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="size-8" />;

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-8 text-muted-foreground hover:text-foreground"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <SunMoon className="size-4" />
    </Button>
  );
}

/** Pill button — opens named-theme dropdown (Insight-style) */
export function ThemeSelector() {
  const [namedTheme, setNamedTheme] = useState("icheck");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("named-theme") ?? "icheck";
    setNamedTheme(saved);
    applyNamedTheme(saved);
  }, []);

  function selectTheme(value: string) {
    setNamedTheme(value);
    applyNamedTheme(value);
  }

  if (!mounted) return <div className="h-8 w-24" />;

  const currentLabel =
    NAMED_THEMES.find((t) => t.value === namedTheme)?.name ?? "i-Check";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-8 gap-1.5 px-2.5 text-sm font-normal text-muted-foreground hover:text-foreground"
        >
          <PaletteIcon className="size-4 shrink-0" />
          <span className="hidden sm:inline">{currentLabel}</span>
          <ChevronDownIcon className="size-3.5 shrink-0 opacity-60" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel className="text-xs text-muted-foreground pb-1">
          themes
        </DropdownMenuLabel>
        {NAMED_THEMES.map((t) => (
          <DropdownMenuItem
            key={t.value}
            onClick={() => selectTheme(t.value)}
            className="flex items-center justify-between"
          >
            {t.name}
            {namedTheme === t.value && (
              <CheckIcon className="size-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
