import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { CurrencyDisplay } from "@/components/shared/CurrencyDisplay";
import { GainLossBadge } from "@/components/shared/GainLossBadge";
import { FolderPlus, MoreHorizontal, Eye, ArrowUpRight } from "lucide-react";
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
  if (assets.length === 0) {
    return (
      <Card className="bg-card border-border shadow-sm">
        <CardContent className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="bg-emerald-500/10 p-4 rounded-full mb-4">
            <FolderPlus size={32} className="text-emerald-600" />
          </div>
          <h3 className="text-xl font-medium text-foreground mb-2">Belum ada aset</h3>
          <p className="text-muted-foreground mb-6 max-w-md">
            Mulai pantau portofolio investasi dan trading Anda dengan menambahkan aset pertama.
          </p>
          <Button asChild>
            <Link href="/assets/new">Tambah Aset Pertama</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border shadow-sm overflow-hidden gap-0 rounded-md">
      <CardHeader className="py-1 px-4 border-b border-border/50">
        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Daftar Aset</CardTitle>
      </CardHeader>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/20">
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="font-medium text-xs uppercase tracking-wider h-10 px-4">Aset</TableHead>
              <TableHead className="font-medium text-xs uppercase tracking-wider h-10">Tipe</TableHead>
              <TableHead className="font-medium text-xs uppercase tracking-wider h-10 text-right">Modal</TableHead>
              <TableHead className="font-medium text-xs uppercase tracking-wider h-10 text-right">Nilai Terkini</TableHead>
              <TableHead className="font-medium text-xs uppercase tracking-wider h-10 text-right">Return</TableHead>
              <TableHead className="h-10 w-[50px] px-4"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assets.map((asset) => (
              <TableRow key={asset.id} className="border-border/50 hover:bg-muted/30 transition-colors group">
                <TableCell className="px-4 py-3">
                  <div className="flex flex-col">
                    <Link href={`/assets/${asset.id}`} className="font-medium text-foreground hover:text-emerald-600 transition-colors">
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
                        asset.type === "SAHAM" ? "bg-blue-500/10 text-blue-600" :
                        asset.type === "CRYPTO" ? "bg-purple-500/10 text-purple-600" :
                        "bg-amber-500/10 text-amber-600"
                      )}
                    >
                      {asset.type}
                    </Badge>
                    <Badge 
                      variant="secondary" 
                      className={cn(
                        "text-[10px] uppercase font-medium px-1.5 py-0 rounded-sm border-0",
                        asset.mode === "INVESTING" ? "bg-emerald-500/10 text-emerald-600" : "bg-orange-500/10 text-orange-600"
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
                      <Button variant="ghost" className="size-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity data-[state=open]:opacity-100 focus:opacity-100">
                        <MoreHorizontal size={16} className="text-muted-foreground" />
                        <span className="sr-only">Buka menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[160px] border-border/50 shadow-md rounded-xl">
                      <DropdownMenuItem asChild className="cursor-pointer">
                        <Link href={`/assets/${asset.id}`} className="flex items-center">
                          <Eye size={14} className="mr-2 text-muted-foreground" />
                          <span>Detail Aset</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-border/50" />
                      <DropdownMenuItem asChild className="cursor-pointer">
                        <Link href={`/assets/${asset.id}/update`} className="flex items-center text-emerald-600 focus:text-emerald-700">
                          <ArrowUpRight size={14} className="mr-2" />
                          <span className="font-medium">Update Valuasi</span>
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
