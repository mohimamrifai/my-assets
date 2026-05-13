import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CurrencyDisplay } from "@/components/shared/CurrencyDisplay";
import { GainLossBadge } from "@/components/shared/GainLossBadge";
import { FolderPlus } from "lucide-react";
import { AssetWithLatestValuation } from "@/types";

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
      <Card className="bg-card border-border shadow-lg">
        <CardContent className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="bg-primary/10 p-4 rounded-full mb-4">
            <FolderPlus size={32} className="text-primary" />
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
    <Card className="bg-card border-border shadow-lg overflow-hidden">
      <CardHeader className="pb-0 border-b border-border bg-card/50">
        <CardTitle className="text-base font-medium mb-4">Daftar Aset</CardTitle>
      </CardHeader>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="font-medium">Nama</TableHead>
              <TableHead className="font-medium">Tipe & Mode</TableHead>
              <TableHead className="font-medium text-right">Modal</TableHead>
              <TableHead className="font-medium text-right">Nilai Terkini</TableHead>
              <TableHead className="font-medium text-right">G/L (Rp & %)</TableHead>
              <TableHead className="font-medium text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assets.map((asset) => (
              <TableRow key={asset.id} className="border-border hover:bg-muted/20">
                <TableCell className="font-medium">
                  <Link href={`/assets/${asset.id}`} className="hover:text-primary transition-colors">
                    {asset.name}
                  </Link>
                  {asset.platformName && (
                    <div className="text-xs text-muted-foreground mt-1">{asset.platformName}</div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1.5 items-start">
                    <Badge 
                      variant="outline" 
                      className={`text-[10px] uppercase border-transparent ${
                        asset.type === "SAHAM" ? "bg-blue-500/10 text-blue-500" :
                        asset.type === "CRYPTO" ? "bg-purple-500/10 text-purple-500" :
                        "bg-amber-500/10 text-amber-500"
                      }`}
                    >
                      {asset.type}
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className={`text-[10px] uppercase border-transparent ${
                        asset.mode === "INVESTING" ? "bg-emerald-500/10 text-emerald-500" : "bg-orange-500/10 text-orange-500"
                      }`}
                    >
                      {asset.mode}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <CurrencyDisplay value={asset.totalModal} />
                </TableCell>
                <TableCell className="text-right font-medium">
                  <CurrencyDisplay value={asset.currentValue} />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end">
                    <GainLossBadge 
                      nominal={asset.gainLoss.nominal} 
                      percent={asset.gainLoss.percent} 
                    />
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm" asChild className="h-8 text-xs">
                      <Link href={`/assets/${asset.id}`}>Detail</Link>
                    </Button>
                    <Button variant="secondary" size="sm" asChild className="h-8 text-xs bg-primary/10 hover:bg-primary/20 text-primary">
                      <Link href={`/assets/${asset.id}/update`}>Update</Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
