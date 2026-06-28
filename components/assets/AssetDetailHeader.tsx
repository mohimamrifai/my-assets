"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Trash2, Edit, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { AssetWithLatestValuation } from "@/types";
import { cn } from "@/lib/utils";

interface AssetDetailHeaderProps {
  asset: AssetWithLatestValuation;
}

const typeStyles: Record<string, string> = {
  SAHAM: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  CRYPTO: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  EMAS: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  REKSA_DANA: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
  P2P: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  LAINNYA: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20",
};

export function AssetDetailHeader({ asset }: AssetDetailHeaderProps) {
  const router = useRouter();
  const t = useTranslations("assets.detail");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/assets/${asset.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success(t("toast.deleted"));
        router.push("/dashboard");
      } else {
        toast.error(data.error || t("toast.deleteFailed"));
        setIsDeleting(false);
      }
    } catch (error) {
      console.error(error);
      toast.error(t("toast.networkError"));
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">
      <div className="flex items-start gap-3 min-w-0">
        <Button variant="outline" size="icon" asChild className="shrink-0 mt-1">
          <Link href="/assets">
            <ChevronLeft size={18} />
          </Link>
        </Button>
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">
            {asset.name || asset.platformName || t("untitled")}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Badge variant="outline" className={cn("border font-medium", typeStyles[asset.type] ?? typeStyles.LAINNYA)}>
              {asset.type}
            </Badge>
            <Badge
              variant="outline"
              className={cn(
                "border font-medium",
                asset.mode === "INVESTING"
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                  : "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
              )}
            >
              {asset.mode}
            </Badge>
            {asset.platformName && asset.name && (
              <Badge variant="secondary" className="bg-muted text-muted-foreground">
                {asset.platformName}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
        {asset.status !== "SOLD" && (
          <Button variant="outline" asChild>
            <Link href={`/assets/${asset.id}/deposit`}>
              <ArrowDownToLine size={16} className="mr-2" />
              {t("actions.deposit")}
            </Link>
          </Button>
        )}
        {asset.mode === "INVESTING" && asset.status !== "SOLD" && (
          <Button variant="outline" asChild>
            <Link href={`/assets/${asset.id}/sell`}>
              {t("actions.sell")}
            </Link>
          </Button>
        )}
        {asset.mode === "TRADING" && (
          <Button variant="outline" asChild>
            <Link href={`/assets/${asset.id}/transaction`}>
              <ArrowUpFromLine size={16} className="mr-2" />
              {t("actions.withdraw")}
            </Link>
          </Button>
        )}
        <Button asChild>
          <Link href={`/assets/${asset.id}/update`}>
            <Edit size={16} className="mr-2" />
            {t("actions.update")}
          </Link>
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="icon" aria-label={t("actions.delete")}>
              <Trash2 size={16} />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("delete.title")}</AlertDialogTitle>
              <AlertDialogDescription>{t("delete.description")}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>{t("delete.cancel")}</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  handleDelete();
                }}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? t("delete.deleting") : t("delete.confirm")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}