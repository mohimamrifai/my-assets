"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, LayoutDashboard, Briefcase, PlusCircle, Settings } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/Logo";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { CurrencySwitcher } from "./CurrencySwitcher";
import { ThemeToggle } from "./ThemeToggle";
import { cn } from "@/lib/utils";

interface NavLink {
  href: string;
  labelKey: "dashboard" | "assets" | "newAsset" | "settings";
  icon: typeof LayoutDashboard;
}

const links: NavLink[] = [
  { href: "/dashboard", labelKey: "dashboard", icon: LayoutDashboard },
  { href: "/assets", labelKey: "assets", icon: Briefcase },
  { href: "/assets/new", labelKey: "newAsset", icon: PlusCircle },
  { href: "/settings", labelKey: "settings", icon: Settings },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const t = useTranslations("nav");

  const stripLocale = (path: string) => path.replace(/^\/(en|id)/, "") || "/";
  const isActive = (href: string) => {
    const path = stripLocale(pathname);
    if (href === "/dashboard") return path === "/dashboard" || path === "/";
    return path === href || path.startsWith(`${href}/`);
  };

  return (
    <header className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 h-14 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="-ml-2 text-foreground">
              <Menu size={20} />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64 bg-sidebar border-r border-sidebar-border">
            <SheetTitle className="sr-only">{t("dashboard")}</SheetTitle>
            <div className="px-6 py-6 border-b border-sidebar-border">
              <Logo size={28} />
            </div>
            <nav className="px-3 py-4">
              <ul className="space-y-0.5">
                {links.map((link) => {
                  const Icon = link.icon;
                  const active = isActive(link.href);
                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                          active
                            ? "bg-sidebar-accent text-sidebar-accent-foreground"
                            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                        )}
                      >
                        <Icon size={16} />
                        <span>{t(link.labelKey)}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </SheetContent>
        </Sheet>
        <Logo size={24} showText={false} />
      </div>

      <div className="flex items-center gap-1">
        <CurrencySwitcher />
        <LocaleSwitcher />
        <ThemeToggle />
      </div>
    </header>
  );
}