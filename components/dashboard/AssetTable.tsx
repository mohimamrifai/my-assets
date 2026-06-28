"use client";

import { useState, useMemo } from "react";
import { useCurrency } from "@/components/providers/CurrencyProvider";
import { formatCurrency } from "@/lib/formatters";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { CurrencyDisplay } from "@/components/shared/CurrencyDisplay";
import { GainLossBadge } from "@/components/shared/GainLossBadge";
import { FolderPlus, MoreHorizontal, Eye, ArrowUpRight, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { AssetWithLatestValuation } from "@/types";
import { cn } from "@/lib/utils";

type EnrichedAsset = AssetWithLatestValuation & {
  currentValue: number;
  totalModal: number;
  gainLoss: { nominal: number; percent: number };
};

interface AssetTableProps {
  assets: EnrichedAsset[];
}

export function AssetTable({ assets }: AssetTableProps) {
  const { currency, fxRate } = useCurrency();
  const t = useTranslations("assets");
  const tCommon = useTranslations("common");
  const tTx = useTranslations("transactions.type");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      const nameMatch = asset.name?.toLowerCase().includes(searchQuery.toLowerCase());
      const platformMatch = asset.platformName?.toLowerCase().includes(searchQuery.toLowerCase());
      return nameMatch || platformMatch;
    });
  }, [assets, searchQuery]);

  const totalPages = Math.ceil(filteredAssets.length / itemsPerPage);

  const paginatedAssets = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAssets.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAssets, currentPage]);

  if (assets.length === 0) {
    return (
      <Card className="bg-card border-border shadow-sm">
        <CardContent className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="bg-primary/10 p-4 rounded-full mb-4">
            <FolderPlus size={32} className="text-primary" />
          </div>
          <h3 className="text-xl font-medium text-foreground mb-2">{t("empty.title")}</h3>
          <p className="text-muted-foreground mb-6 max-w-md">{t("empty.description")}</p>
          <Button asChild>
            <Link href="/assets/new">{t("empty.cta")}</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border shadow-sm overflow-hidden gap-0 rounded-md flex flex-col">
      <CardHeader className="py-3 px-4 border-b border-border/50 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {t("table.title")}
        </CardTitle>
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <Input
            placeholder={t("searchPlaceholder")}
            className="pl-9 h-9 text-sm bg-muted/50 border-border/50 focus-visible:ring-primary/30"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
      </CardHeader>

      <div className="overflow-x-auto flex-1">
        <Table>
          <TableHeader className="bg-muted/20">
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="font-medium text-xs uppercase tracking-wider h-10 px-4">{t("table.name")}</TableHead>
              <TableHead className="font-medium text-xs uppercase tracking-wider h-10">{t("table.type")}</TableHead>
              <TableHead className="font-medium text-xs uppercase tracking-wider h-10 text-right">{t("table.capital")}</TableHead>
              <TableHead className="font-medium text-xs uppercase tracking-wider h-10 text-right">{t("table.current")}</TableHead>
              <TableHead className="font-medium text-xs uppercase tracking-wider h-10 text-right">{t("table.gainLoss")}</TableHead>
              <TableHead className="h-10 w-[50px] px-4"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedAssets.length > 0 ? paginatedAssets.map((asset: EnrichedAsset) => (
              <TableRow key={asset.id} className="border-border/50 hover:bg-muted/30 transition-colors group">
                <TableCell className="px-4 py-3">
                  <div className="flex flex-col">
                    <Link href={`/assets/${asset.id}`} className="font-medium text-foreground hover:text-primary transition-colors">
                      {asset.name || asset.platformName}
                    </Link>
                    {asset.name && asset.platformName && (
                      <span className="text-[11px] text-muted-foreground mt-0.5">{asset.platformName}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-[10px] uppercase font-medium px-1.5 py-0 rounded-sm border-0",
                        asset.type === "SAHAM" ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" :
                        asset.type === "CRYPTO" ? "bg-purple-500/10 text-purple-600 dark:text-purple-400" :
                        asset.type === "EMAS" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" :
                        asset.type === "REKSA_DANA" ? "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400" :
                        asset.type === "P2P" ? "bg-rose-500/10 text-rose-600 dark:text-rose-400" :
                        "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400"
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
                          : "bg-orange-500/10 text-orange-600 dark:text-orange-400"
                      )}
                    >
                      {asset.mode}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="text-right py-3 text-sm text-muted-foreground px-4">
                  <CurrencyDisplay value={asset.totalModal} />
                </TableCell>
                <TableCell className="text-right py-3 font-medium text-sm text-foreground px-4">
                  {formatCurrency(asset.currentValue, { display: currency, rate: fxRate })}
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
                  <div className="flex items-center justify-end gap-2">
                    {asset.status !== "SOLD" && (
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="h-8"
                      >
                        <Link href={`/assets/${asset.id}/deposit`}>
                          {tTx("DEPOSIT")}
                        </Link>
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="size-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity data-[state=open]:opacity-100 focus:opacity-100">
                          <MoreHorizontal size={16} className="text-muted-foreground" />
                          <span className="sr-only">{tCommon("actions")}</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[180px] rounded-xl">
                        <DropdownMenuItem asChild className="cursor-pointer">
                          <Link href={`/assets/${asset.id}`} className="flex items-center">
                            <Eye size={14} className="mr-2 text-muted-foreground" />
                            <span>{t("table.rowDetail")}</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild className="cursor-pointer">
                          <Link href={`/assets/${asset.id}/update`} className="flex items-center text-primary focus:text-primary">
                            <ArrowUpRight size={14} className="mr-2" />
                            <span className="font-medium">{t("table.updateValue")}</span>
                          </Link>
                        </DropdownMenuItem>
                        {asset.mode === "INVESTING" && asset.status !== "SOLD" && (
                          <DropdownMenuItem asChild className="cursor-pointer">
                            <Link href={`/assets/${asset.id}/sell`} className="flex items-center">
                              <ArrowUpRight size={14} className="mr-2" />
                              <span className="font-medium">{t("table.sellAsset")}</span>
                            </Link>
                          </DropdownMenuItem>
                        )}
                        {asset.mode === "TRADING" && (
                          <DropdownMenuItem asChild className="cursor-pointer">
                            <Link href={`/assets/${asset.id}/transaction`} className="flex items-center">
                              <ArrowUpRight size={14} className="mr-2" />
                              <span className="font-medium">{tTx("WITHDRAWAL")}</span>
                            </Link>
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  {t("table.noResults")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-4 py-3 border-t border-border/50 bg-muted/10">
        <div className="text-xs text-muted-foreground">
          {filteredAssets.length > 0
            ? tCommon("showing", {
                start: (currentPage - 1) * itemsPerPage + 1,
                end: Math.min(currentPage * itemsPerPage, filteredAssets.length),
                total: filteredAssets.length,
              })
            : `0 / 0`}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1 || filteredAssets.length === 0}
          >
            <ChevronLeft size={14} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage >= totalPages || filteredAssets.length === 0}
          >
            <ChevronRight size={14} />
          </Button>
        </div>
      </div>
    </Card>
  );
}
