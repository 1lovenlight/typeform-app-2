"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

export function ThemeSwitch() {
  const { setTheme, theme } = useTheme();

  return (
    <Button
      variant="secondary"
      type="button"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      <Sun className="size-5 dark:hidden" />
      <Moon className="size-5 hidden dark:block" />
      <span>Switch theme</span>
    </Button>
  );
}
