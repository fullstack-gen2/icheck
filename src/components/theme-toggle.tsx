"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { SunIcon, MoonIcon, MonitorIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const COLOR_THEMES = [
  { name: "Navy",    value: "navy",    color: "#273C97" },
  { name: "Emerald", value: "emerald", color: "#059669" },
  { name: "Rose",    value: "rose",    color: "#e11d48" },
  { name: "Amber",   value: "amber",   color: "#d97706" },
  { name: "Violet",  value: "violet",  color: "#7c3aed" },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [colorTheme, setColorTheme] = useState("navy");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("color-theme") ?? "navy";
    setColorTheme(saved);
    document.documentElement.setAttribute("data-color", saved);
  }, []);

  function applyColorTheme(value: string) {
    setColorTheme(value);
    localStorage.setItem("color-theme", value);
    document.documentElement.setAttribute("data-color", value);
  }

  if (!mounted) return <div className="size-8" />;

  const Icon =
    theme === "dark" ? MoonIcon : theme === "light" ? SunIcon : MonitorIcon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
        >
          <Icon className="size-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Appearance
        </DropdownMenuLabel>

        <DropdownMenuItem onClick={() => setTheme("light")}>
          <SunIcon className="size-4 mr-2" />
          Light
          {theme === "light" && (
            <span className="ml-auto text-xs text-primary">✓</span>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <MoonIcon className="size-4 mr-2" />
          Dark
          {theme === "dark" && (
            <span className="ml-auto text-xs text-primary">✓</span>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          <MonitorIcon className="size-4 mr-2" />
          System
          {theme === "system" && (
            <span className="ml-auto text-xs text-primary">✓</span>
          )}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Color
        </DropdownMenuLabel>
        <div className="flex items-center gap-2 px-2 py-2">
          {COLOR_THEMES.map((ct) => (
            <button
              key={ct.value}
              title={ct.name}
              onClick={() => applyColorTheme(ct.value)}
              style={{ background: ct.color }}
              className={`size-6 rounded-full border-2 transition-all ${
                colorTheme === ct.value
                  ? "border-gray-800 dark:border-white scale-110 shadow"
                  : "border-transparent hover:border-gray-400"
              }`}
            />
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
