import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EmptyStateAction {
  label: string;
  href: string;
}

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: EmptyStateAction;
  icon?: LucideIcon;
  className?: string;
}

export function EmptyState({ title, description, action, icon: Icon, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-card px-6 py-12 text-center",
        className,
      )}
    >
      {Icon && (
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <Icon className="size-5" />
        </div>
      )}
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {description && (
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action && (
        <Link
          href={action.href}
          className="mt-2 inline-flex h-8 items-center justify-center rounded-md border border-transparent bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}