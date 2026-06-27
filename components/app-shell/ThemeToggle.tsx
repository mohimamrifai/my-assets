"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMounted } from "@/hooks/useMounted";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const mounted = useMounted();

  const current = mounted ? resolvedTheme ?? theme : undefined;
  const isDark = current === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className="text-muted-foreground hover:text-foreground"
    >
      {mounted && isDark ? <Sun size={18} /> : <Moon size={18} />}
    </Button>
  );
}