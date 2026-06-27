"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Briefcase, PlusCircle, Settings, LogOut } from "lucide-react";
import { useTranslations } from "next-intl";
import { authClient } from "@/lib/auth-client";
import { Logo } from "@/components/shared/Logo";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  labelKey: "dashboard" | "assets" | "newAsset" | "settings";
  icon: typeof LayoutDashboard;
}

const navItems: NavItem[] = [
  { href: "/dashboard", labelKey: "dashboard", icon: LayoutDashboard },
  { href: "/assets", labelKey: "assets", icon: Briefcase },
  { href: "/assets/new", labelKey: "newAsset", icon: PlusCircle },
];

const footerItems: NavItem[] = [
  { href: "/settings", labelKey: "settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const { data: session } = authClient.useSession();

  const handleLogout = async () => {
    await authClient.signOut();
    window.location.href = "/login";
  };

  const stripLocale = (path: string) => path.replace(/^\/(en|id)/, "") || "/";

  const isActive = (href: string) => {
    const path = stripLocale(pathname);
    if (href === "/dashboard") return path === "/dashboard" || path === "/";
    return path === href || path.startsWith(`${href}/`);
  };

  return (
    <aside className="hidden md:flex w-60 flex-col border-r border-sidebar-border bg-sidebar fixed inset-y-0 left-0 z-40">
      <div className="px-6 py-6 border-b border-sidebar-border">
        <Logo size={28} />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  )}
                >
                  <Icon size={16} strokeWidth={2} />
                  <span>{t(item.labelKey)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-sidebar-border px-3 py-4">
        <ul className="space-y-0.5">
          {footerItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  )}
                >
                  <Icon size={16} strokeWidth={2} />
                  <span>{t(item.labelKey)}</span>
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
            >
              <LogOut size={16} strokeWidth={2} />
              <span>{t("logout")}</span>
            </button>
          </li>
        </ul>

        {session?.user && (
          <div className="mt-4 px-3 pt-4 border-t border-sidebar-border">
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                {session.user.name?.[0]?.toUpperCase() ?? "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {session.user.name}
                </p>
                <p className="text-xs text-sidebar-foreground/60 truncate">
                  {session.user.email}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}