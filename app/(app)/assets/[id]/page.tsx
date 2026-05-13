"use client";

import { useState, useEffect, use } from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { toast } from "sonner";

import { AssetDetailHeader } from "@/components/assets/AssetDetailHeader";
import { PerformanceChart } from "@/components/assets/PerformanceChart";
import { TransactionTable } from "@/components/assets/TransactionTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { CurrencyDisplay } from "@/components/shared/CurrencyDisplay";
import { GainLossBadge } from "@/components/shared/GainLossBadge";
import { calcTotalModal, calcGainLoss } from "@/lib/calculations";
import { Asset, Valuation, Transaction } from "@/types";

interface ExtendedAsset extends Asset {
  valuations: Valuation[];
  transactions: Transaction[];
}

export default function AssetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [asset, setAsset] = useState<ExtendedAsset | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAsset = async () => {
      try {
        const res = await fetch(`/api/assets/${resolvedParams.id}`);
        const json = await res.json();
        if (json.success) {
          setAsset(json.data);
        } else {
          toast.error("Gagal memuat detail aset");
        }
      } catch (error) {
        toast.error("Terjadi kesalahan jaringan");
      } finally {
        setLoading(false);
      }
    };

    fetchAsset();
  }, [resolvedParams.id]);

  if (loading || !asset) {
    return (
      <div className="space-y-6">
        <div className="flex gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  const totalModal = asset.mode === "INVESTING" 
    ? calcTotalModal(asset.type, asset.quantity || 0, asset.buyPrice || 0)
    : asset.initialCapital || 0;

  const latestValuation = asset.valuations.length > 0 
    ? asset.valuations[asset.valuations.length - 1] 
    : null;

  const currentValue = latestValuation ? latestValuation.value : totalModal;
  const gainLoss = calcGainLoss(currentValue, totalModal);

  // Map to AssetWithLatestValuation for the header
  const headerAsset = {
    ...asset,
    latestValuation
  };

  return (
    <div className="space-y-6 pb-12">
      <AssetDetailHeader asset={headerAsset} />

      {/* Info Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {asset.mode === "INVESTING" ? (
          <>
            <Card className="bg-card border-border">
              <CardContent className="p-4 sm:p-6">
                <p className="text-sm font-medium text-muted-foreground mb-1">Kuantitas</p>
                <p className="text-2xl font-bold">
                  {asset.quantity} <span className="text-sm font-normal text-muted-foreground">
                    {asset.type === "SAHAM" ? "Lot" : asset.type === "EMAS" ? "Gram" : "Unit"}
                  </span>
                </p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-4 sm:p-6">
                <p className="text-sm font-medium text-muted-foreground mb-1">Harga Beli</p>
                <div className="text-2xl font-bold">
                  <CurrencyDisplay value={asset.buyPrice || 0} />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-4 sm:p-6">
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Modal</p>
                <div className="text-2xl font-bold">
                  <CurrencyDisplay value={totalModal} />
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <Card className="bg-card border-border">
              <CardContent className="p-4 sm:p-6">
                <p className="text-sm font-medium text-muted-foreground mb-1">Platform</p>
                <p className="text-2xl font-bold">{asset.platformName || "-"}</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border md:col-span-2">
              <CardContent className="p-4 sm:p-6">
                <p className="text-sm font-medium text-muted-foreground mb-1">Modal Awal</p>
                <div className="text-2xl font-bold">
                  <CurrencyDisplay value={totalModal} />
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Common Cards */}
        <Card className="bg-primary/5 border-primary/20 md:col-start-3 md:row-start-2">
          <CardContent className="p-4 sm:p-6">
            <p className="text-sm font-medium text-muted-foreground mb-1">Nilai Terkini</p>
            <div className="text-2xl font-bold text-primary">
              <CurrencyDisplay value={currentValue} />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border md:col-start-4 md:row-start-2">
          <CardContent className="p-4 sm:p-6 flex flex-col justify-center h-full">
            <p className="text-sm font-medium text-muted-foreground mb-2">Gain / Loss</p>
            <GainLossBadge 
              nominal={gainLoss.nominal} 
              percent={gainLoss.percent} 
              variant="text"
              className="text-xl sm:text-2xl"
            />
          </CardContent>
        </Card>
      </div>

      <PerformanceChart valuations={asset.valuations} totalModal={totalModal} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Valuation History */}
        <Card className="bg-card border-border shadow-lg overflow-hidden">
          <CardHeader className="pb-0 border-b border-border bg-card/50">
            <CardTitle className="text-base font-medium mb-4">Histori Valuasi</CardTitle>
          </CardHeader>
          <div className="overflow-x-auto max-h-[400px]">
            <Table>
              <TableHeader className="bg-muted/30 sticky top-0 z-10 backdrop-blur-sm">
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="font-medium">Tanggal</TableHead>
                  <TableHead className="font-medium text-right">Nilai</TableHead>
                  <TableHead className="font-medium text-right">G/L vs Modal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {asset.valuations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                      Belum ada histori valuasi
                    </TableCell>
                  </TableRow>
                ) : (
                  [...asset.valuations].reverse().map((val) => {
                    const valGL = calcGainLoss(val.value, totalModal);
                    return (
                      <TableRow key={val.id} className="border-border hover:bg-muted/20">
                        <TableCell className="text-sm">
                          {format(new Date(val.recordedAt), "dd MMM yyyy", { locale: localeId })}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          <CurrencyDisplay value={val.value} />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end">
                            <GainLossBadge nominal={valGL.nominal} percent={valGL.percent} />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Transaction History */}
        <TransactionTable transactions={asset.transactions} />
      </div>
    </div>
  );
}
