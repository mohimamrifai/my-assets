"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import Link from "next/link";
import {
  Briefcase,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  ArrowUpRight,
  Plus,
} from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { CurrencyDisplay } from "@/components/shared/CurrencyDisplay";
import { GainLossBadge } from "@/components/shared/GainLossBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { AssetType, AssetMode } from "@/types";

interface EnrichedAsset {
  id: string;
  name: string | null;
  type: AssetType;
  mode: AssetMode;
  platformName: string | null;
  status: string;
  currentValue: number;
  totalModal: number;
  gainLoss: { nominal: number; percent: number };
}

type SortKey = "name" | "currentValue" | "totalModal" | "gainLoss";
type SortDir = "asc" | "desc";
type TypeFilter = "ALL" | AssetType;
type ModeFilter = "ALL" | AssetMode;

const PAGE_SIZE = 10;

const typeColor: Record<AssetType, string> = {
  SAHAM: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  CRYPTO: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  EMAS: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  REKSA_DANA: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  P2P: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  LAINNYA: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400",
};

export function AssetsListClient() {
  const t = useTranslations("assets");
  const tNav = useTranslations("nav");
  const tFilters = useTranslations("filters");
  const tAssetTypes = useTranslations("assetTypes");
  const tErrors = useTranslations("errors");
  const tCommon = useTranslations("common");

  const [assets, setAssets] = useState<EnrichedAsset[] | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");
  const [modeFilter, setModeFilter] = useState<ModeFilter>("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("currentValue");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/assets");
        const json = await res.json();
        if (!cancelled) {
          if (json.success) {
            setAssets(json.data);
          } else {
            toast.error(tErrors("loadFailed"));
          }
        }
      } catch {
        if (!cancelled) toast.error(tErrors("networkError"));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tErrors]);

  const filtered = useMemo(() => {
    if (!assets) return [];
    const q = search.trim().toLowerCase();
    return assets.filter((a) => {
      if (typeFilter !== "ALL" && a.type !== typeFilter) return false;
      if (modeFilter !== "ALL" && a.mode !== modeFilter) return false;
      if (!q) return true;
      const haystack = `${a.name ?? ""} ${a.platformName ?? ""}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [assets, search, typeFilter, modeFilter]);

  const sorted = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      switch (sortKey) {
        case "name":
          return dir * (a.name ?? "").localeCompare(b.name ?? "");
        case "currentValue":
          return dir * (a.currentValue - b.currentValue);
        case "totalModal":
          return dir * (a.totalModal - b.totalModal);
        case "gainLoss":
          return dir * (a.gainLoss.nominal - b.gainLoss.nominal);
      }
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const pageEnd = pageStart + PAGE_SIZE;
  const paginated = sorted.slice(pageStart, pageEnd);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1);
  }, [search, typeFilter, modeFilter, sortKey, sortDir]);

  if (assets === null) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("title")} subtitle={t("subtitle")} />
        <Skeleton className="h-[400px] w-full rounded-lg" />
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("title")} subtitle={t("subtitle")} />
        <EmptyState
          icon={Briefcase}
          title={t("empty.title")}
          description={t("empty.description")}
          action={{
            label: t("empty.cta"),
            href: "/assets/new",
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <PageHeader title={t("title")} subtitle={t("subtitle")}>
        <Button asChild>
          <Link href="/assets/new">
            <Plus size={16} className="mr-2" />
            {tNav("newAsset")}
          </Link>
        </Button>
      </PageHeader>

      <Card className="bg-card border-border rounded-lg overflow-hidden">
        <div className="flex flex-col gap-3 p-4 border-b border-border/60 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search
              size={16}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="pl-9 h-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as TypeFilter)}>
              <SelectTrigger className="h-9 w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{tFilters("all")}</SelectItem>
                <SelectItem value="SAHAM">{tAssetTypes("SAHAM")}</SelectItem>
                <SelectItem value="CRYPTO">{tAssetTypes("CRYPTO")}</SelectItem>
                <SelectItem value="EMAS">{tAssetTypes("EMAS")}</SelectItem>
                <SelectItem value="REKSA_DANA">{tAssetTypes("REKSA_DANA")}</SelectItem>
                <SelectItem value="P2P">{tAssetTypes("P2P")}</SelectItem>
                <SelectItem value="LAINNYA">{tAssetTypes("LAINNYA")}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={modeFilter} onValueChange={(v) => setModeFilter(v as ModeFilter)}>
              <SelectTrigger className="h-9 w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{tFilters("all")}</SelectItem>
                <SelectItem value="INVESTING">{tAssetTypes("SAHAM") ? "Investing" : "Investing"}</SelectItem>
                <SelectItem value="TRADING">Trading</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={`${sortKey}-${sortDir}`}
              onValueChange={(v) => {
                const [k, d] = v.split("-") as [SortKey, SortDir];
                setSortKey(k);
                setSortDir(d);
              }}
            >
              <SelectTrigger className="h-9 w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="currentValue-desc">Nilai ↓</SelectItem>
                <SelectItem value="currentValue-asc">Nilai ↑</SelectItem>
                <SelectItem value="totalModal-desc">Modal ↓</SelectItem>
                <SelectItem value="totalModal-asc">Modal ↑</SelectItem>
                <SelectItem value="gainLoss-desc">Gain ↓</SelectItem>
                <SelectItem value="gainLoss-asc">Gain ↑</SelectItem>
                <SelectItem value="name-asc">A → Z</SelectItem>
                <SelectItem value="name-desc">Z → A</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/20">
              <TableRow className="border-border/60 hover:bg-transparent">
                <TableHead className="font-medium text-xs uppercase tracking-wider h-10 px-4">
                  {t("table.name")}
                </TableHead>
                <TableHead className="font-medium text-xs uppercase tracking-wider h-10">
                  {t("table.type")}
                </TableHead>
                <TableHead className="font-medium text-xs uppercase tracking-wider h-10 text-right">
                  {t("table.capital")}
                </TableHead>
                <TableHead className="font-medium text-xs uppercase tracking-wider h-10 text-right">
                  {t("table.current")}
                </TableHead>
                <TableHead className="font-medium text-xs uppercase tracking-wider h-10 text-right">
                  {t("table.gainLoss")}
                </TableHead>
                <TableHead className="font-medium text-xs uppercase tracking-wider h-10 w-[60px] px-4 text-right">
                  {t("table.actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    {tCommon("search")}
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((asset) => (
                  <TableRow
                    key={asset.id}
                    className="border-border/60 hover:bg-muted/30 transition-colors group"
                  >
                    <TableCell className="px-4 py-3">
                      <div className="flex flex-col">
                        <Link
                          href={`/assets/${asset.id}`}
                          className="font-medium text-foreground hover:text-primary transition-colors"
                        >
                          {asset.name || asset.platformName || "—"}
                        </Link>
                        {asset.name && asset.platformName && (
                          <span className="text-[11px] text-muted-foreground mt-0.5">
                            {asset.platformName}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-[10px] uppercase font-medium px-1.5 py-0 rounded-sm border-0",
                            typeColor[asset.type],
                          )}
                        >
                          {asset.type}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-[10px] uppercase font-medium px-1.5 py-0 rounded-sm border-0",
                            asset.mode === "INVESTING"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "bg-orange-500/10 text-orange-600 dark:text-orange-400",
                          )}
                        >
                          {asset.mode}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right py-3 text-sm text-muted-foreground px-4 tabular-nums">
                      <CurrencyDisplay value={asset.totalModal} />
                    </TableCell>
                    <TableCell className="text-right py-3 font-medium text-sm text-foreground px-4 tabular-nums">
                      <CurrencyDisplay value={asset.currentValue} />
                    </TableCell>
                    <TableCell className="text-right py-3 px-4">
                      <div className="flex justify-end">
                        <GainLossBadge
                          nominal={asset.gainLoss.nominal}
                          percent={asset.gainLoss.percent}
                          className="px-2 py-0.5 text-xs rounded-md"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100 focus-visible:opacity-100"
                          >
                            <ArrowUpRight size={16} className="text-muted-foreground" />
                            <span className="sr-only">{tCommon("actions")}</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[180px] rounded-xl">
                          <DropdownMenuItem asChild>
                            <Link href={`/assets/${asset.id}`} className="flex items-center cursor-pointer">
                              <Eye size={14} className="mr-2 text-muted-foreground" />
                              Detail
                            </Link>
                          </DropdownMenuItem>
                          {asset.status !== "SOLD" && (
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/assets/${asset.id}/update`}
                                className="flex items-center cursor-pointer text-primary focus:text-primary"
                              >
                                <ArrowUpRight size={14} className="mr-2" />
                                Update Valuasi
                              </Link>
                            </DropdownMenuItem>
                          )}
                          {asset.status !== "SOLD" && asset.mode === "INVESTING" && (
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/assets/${asset.id}/sell`}
                                className="flex items-center cursor-pointer"
                              >
                                <ArrowUpRight size={14} className="mr-2" />
                                Jual
                              </Link>
                            </DropdownMenuItem>
                          )}
                          {asset.status !== "SOLD" && (
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/assets/${asset.id}/deposit`}
                                className="flex items-center cursor-pointer"
                              >
                                <ArrowUpRight size={14} className="mr-2" />
                                Deposit
                              </Link>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          {asset.mode === "TRADING" && (
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/assets/${asset.id}/transaction`}
                                className="flex items-center cursor-pointer"
                              >
                                <ArrowUpRight size={14} className="mr-2" />
                                Withdraw
                              </Link>
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <CardContent className="flex items-center justify-between px-4 py-3 border-t border-border/60 bg-muted/10 rounded-none">
          <div className="text-xs text-muted-foreground">
            {sorted.length > 0 ? (
              <>
                <span className="font-medium text-foreground">{pageStart + 1}</span>–
                <span className="font-medium text-foreground">{Math.min(pageEnd, sorted.length)}</span>{" "}
                / {sorted.length}
              </>
            ) : (
              "0"
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
            >
              <ChevronLeft size={14} />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
            >
              <ChevronRight size={14} />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}