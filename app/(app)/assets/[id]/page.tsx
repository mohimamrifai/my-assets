"use client";

import { useState, useEffect, use, useCallback } from "react";
import { format } from "date-fns";
import { Loader2, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { id as localeId } from "date-fns/locale";
import { toast } from "sonner";
import Link from "next/link";
import { useCurrency } from "@/components/providers/CurrencyProvider";

import { formatCurrency } from "@/lib/formatters";
import { AssetDetailHeader } from "@/components/assets/AssetDetailHeader";
import { PerformanceChart } from "@/components/assets/PerformanceChart";
import { TransactionTable } from "@/components/assets/TransactionTable";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { CurrencyDisplay } from "@/components/shared/CurrencyDisplay";
import { GainLossBadge } from "@/components/shared/GainLossBadge";
import { calcTotalModal, calcGainLoss } from "@/lib/calculations";
import { HistoryFilter, TimeFilter, filterByTime } from "@/components/shared/HistoryFilter";
import { Asset, Valuation, Transaction } from "@/types";

interface ExtendedAsset extends Asset {
  valuations: Valuation[];
  transactions: Transaction[];
}

export default function AssetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [asset, setAsset] = useState<ExtendedAsset | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("ALL");
  const [valToDelete, setValToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { currency } = useCurrency();

  const fetchAsset = useCallback(async () => {
    try {
      const res = await fetch(`/api/assets/${resolvedParams.id}`);
      const json = await res.json();
      if (json.success) {
        setAsset(json.data);
      } else {
        toast.error("Gagal memuat detail aset");
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setLoading(false);
    }
  }, [resolvedParams.id]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await fetch(`/api/assets/${resolvedParams.id}`);
        const json = await res.json();
        if (mounted) {
          if (json.success) {
            setAsset(json.data);
          } else {
            toast.error("Gagal memuat detail aset");
          }
        }
      } catch {
        if (mounted) toast.error("Terjadi kesalahan jaringan");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [resolvedParams.id]);

  const handleDeleteValuation = async () => {
    if (!valToDelete) return;
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/assets/${resolvedParams.id}/valuations/${valToDelete}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Histori valuasi berhasil dihapus");
        fetchAsset();
      } else {
        toast.error(json.error || "Gagal menghapus valuasi");
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setIsDeleting(false);
      setValToDelete(null);
    }
  };

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
    ? calcTotalModal(asset.type, asset.quantity || 0, asset.buyPrice || 0, asset.isNominal, asset.initialCapital || 0)
    : asset.initialCapital || 0;

  const latestValuation = asset.valuations.length > 0 
    ? asset.valuations[asset.valuations.length - 1] 
    : null;

  const currentValue = latestValuation ? latestValuation.value : totalModal;
  const totalRealizedGain = asset.transactions.reduce((sum, t) => sum + (t.realizedGain || 0), 0);
  const gainLoss = calcGainLoss(currentValue, totalModal, totalRealizedGain);

  // Map to AssetWithLatestValuation for the header
  const headerAsset = {
    ...asset,
    latestValuation
  };

  const filteredValuations = filterByTime(
    asset.valuations, 
    timeFilter, 
    (v) => v.recordedAt
  );

  const filteredTransactions = filterByTime(
    asset.transactions, 
    timeFilter, 
    (t) => t.date
  );

  return (
    <div className="space-y-12 pb-16">
      <AssetDetailHeader asset={headerAsset} />

      {/* Hero Stats Section */}
      <div className="relative bg-emerald-50/50 rounded-lg border border-emerald-100/60 overflow-hidden shadow-sm">
        {/* Subtle decorative background shapes */}
        <div className="absolute top-0 right-0 -mr-24 -mt-24 size-72 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 -ml-24 -mb-24 size-72 rounded-full bg-emerald-400/5 blur-3xl" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 p-6 md:p-8">
          <div>
            <p className="text-emerald-800/80 font-semibold uppercase tracking-widest text-xs mb-2">Nilai Terkini</p>
            <h1 className="text-3xl md:text-4xl font-bold text-emerald-950 tracking-tight tabular-nums mb-3">
              <CurrencyDisplay value={currentValue} />
            </h1>
            <div className="inline-block bg-white/60 backdrop-blur-sm px-3 py-1.5 rounded-md border border-emerald-100 shadow-sm">
              <GainLossBadge 
                nominal={gainLoss.nominal} 
                percent={gainLoss.percent} 
                className="text-lg md:text-xl font-bold bg-transparent border-none p-0"
              />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-6 text-left md:text-right pt-4 border-t md:border-t-0 border-emerald-200/50 w-full md:w-auto">
            <div>
              <p className="text-emerald-700/60 font-semibold uppercase tracking-wider text-[10px] mb-1">Total Modal</p>
              <p className="text-lg font-bold text-emerald-900">{formatCurrency(totalModal, currency)}</p>
            </div>
            {asset.mode === "INVESTING" && !asset.isNominal && (
              <div>
                <p className="text-emerald-700/60 font-semibold uppercase tracking-wider text-[10px] mb-1">Harga Beli</p>
                <p className="text-lg font-bold text-emerald-900">{formatCurrency(asset.buyPrice || 0, currency)}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Meta Info Bar (Borderless, Clean) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-card rounded-lg border border-border/50 p-3 md:p-4 shadow-sm">
        {asset.mode === "INVESTING" ? (
          <>
            {asset.isNominal ? (
              <div className="px-3 py-2 bg-muted/30 rounded-md">
                <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1">Pencatatan</p>
                <p className="text-base font-bold text-foreground">Nominal / Kas</p>
              </div>
            ) : (
              <div className="px-3 py-2 bg-muted/30 rounded-md">
                <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1">Kuantitas</p>
                <p className="text-base font-bold text-foreground">
                  {asset.quantity} <span className="text-[10px] font-medium text-muted-foreground ml-1">
                    {asset.type === "SAHAM" ? "Lot" : asset.type === "EMAS" ? "Gram" : "Unit"}
                  </span>
                </p>
              </div>
            )}
            <div className="px-3 py-2 bg-muted/30 rounded-md">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1">Tipe Aset</p>
              <p className="text-base font-bold text-foreground capitalize">{asset.type}</p>
            </div>
            <div className="px-3 py-2 bg-muted/30 rounded-md">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1">Platform</p>
              <p className="text-base font-bold text-foreground">{asset.platformName || "-"}</p>
            </div>
            <div className="px-3 py-2 bg-muted/30 rounded-md">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1">Tanggal Beli</p>
              <p className="text-base font-bold text-foreground">
                {asset.buyDate ? format(new Date(asset.buyDate), "dd MMM yy", { locale: localeId }) : "-"}
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="px-3 py-2 bg-muted/30 rounded-md col-span-2">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1">Platform</p>
              <p className="text-base font-bold text-foreground">{asset.platformName || "-"}</p>
            </div>
            <div className="px-3 py-2 bg-muted/30 rounded-md col-span-2">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1">Tipe Aset</p>
              <p className="text-base font-bold text-foreground capitalize">{asset.type}</p>
            </div>
          </>
        )}
      </div>

      {/* Edge-to-Edge Chart Section (No Card Border) */}
      <div className="py-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-foreground pl-2 border-l-4 border-emerald-500">Pergerakan Valuasi</h3>
          <HistoryFilter value={timeFilter} onChange={setTimeFilter} />
        </div>
        <PerformanceChart valuations={filteredValuations} totalModal={totalModal} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Valuation History */}
        <Card className="bg-card border-border shadow-sm rounded-lg overflow-hidden flex flex-col">
          <CardHeader className="py-4 px-5 border-b border-border/50">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Histori Valuasi</CardTitle>
          </CardHeader>
          <div className="overflow-x-auto flex-1 max-h-[400px]">
            <Table>
              <TableHeader className="bg-muted/20 sticky top-0 z-10 backdrop-blur-md">
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="font-medium text-xs uppercase tracking-wider h-10 px-5">Tanggal</TableHead>
                  <TableHead className="font-medium text-xs uppercase tracking-wider h-10 text-right">Nilai</TableHead>
                  <TableHead className="font-medium text-xs uppercase tracking-wider h-10 text-right px-5">Perubahan</TableHead>
                  <TableHead className="font-medium text-xs uppercase tracking-wider h-10 w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredValuations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                      Belum ada histori valuasi pada periode ini
                    </TableCell>
                  </TableRow>
                ) : (
                  [...filteredValuations].reverse().map((val, index, arr) => {
                    const prevVal = index < arr.length - 1 ? arr[index + 1] : null;
                    
                    // Menghitung Net Cash Flow (Deposit/Withdraw/Buy/Sell) yang terjadi antara prevVal dan val
                    let netCashFlow = 0;
                    if (prevVal) {
                      const valTime = new Date(val.recordedAt).getTime();
                      const prevTime = new Date(prevVal.recordedAt).getTime();
                      
                      netCashFlow = asset.transactions.reduce((sum, t) => {
                        const tTime = new Date(t.date).getTime();
                        // Transaksi yang terjadi SETELAH prevVal hingga TEPAT SAAT val
                        if (tTime > prevTime && tTime <= valTime) {
                          if (t.type === "DEPOSIT" || t.type === "BUY") return sum + t.amount;
                          if (t.type === "WITHDRAWAL" || t.type === "SELL") return sum - t.amount;
                        }
                        return sum;
                      }, 0);
                    } else {
                      // Jika ini valuasi pertama, anggap semua transaksi hingga titik ini sebagai modal awal
                      const valTime = new Date(val.recordedAt).getTime();
                      netCashFlow = asset.transactions.reduce((sum, t) => {
                        const tTime = new Date(t.date).getTime();
                        if (tTime <= valTime) {
                          if (t.type === "DEPOSIT" || t.type === "BUY") return sum + t.amount;
                          if (t.type === "WITHDRAWAL" || t.type === "SELL") return sum - t.amount;
                        }
                        return sum;
                      }, 0);
                    }

                    const adjustedPrevValue = prevVal ? prevVal.value + netCashFlow : netCashFlow;
                    const changeNominal = val.value - adjustedPrevValue;
                    const changePercent = adjustedPrevValue !== 0 ? (changeNominal / adjustedPrevValue) * 100 : 0;
                    
                    return (
                      <TableRow key={val.id} className="border-border/50 hover:bg-muted/30 transition-colors">
                        <TableCell className="px-5 py-3 text-sm text-foreground font-medium">
                          {format(new Date(val.recordedAt), "dd MMM yyyy", { locale: localeId })}
                        </TableCell>
                        <TableCell className="text-right py-3 font-medium text-sm text-foreground">
                            <CurrencyDisplay value={val.value} />
                          </TableCell>
                        <TableCell className="text-right py-3 px-5">
                          <div className="flex justify-end">
                            {prevVal ? (
                              <GainLossBadge nominal={changeNominal} percent={changePercent} className="px-2 py-0.5 text-xs rounded-md" />
                            ) : (
                              <span className="text-muted-foreground text-xs">-</span>
                            )}
                          </div>
                        </TableCell>
                          <TableCell className="py-3 px-2 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                {/* We will use a query param or separate page to edit, but for now we can just push to update page maybe? */}
                                {/* The user asked for "opsi edit", maybe we need a dedicated edit page. Let's link to /assets/[id]/valuations/[valId]/edit */}
                                <Link href={`/assets/${asset.id}/valuations/${val.id}/edit`} className="cursor-pointer flex items-center">
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setValToDelete(val.id)} className="text-destructive focus:text-destructive cursor-pointer">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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
        <TransactionTable transactions={filteredTransactions} onTransactionDeleted={fetchAsset} />
      </div>

      <AlertDialog open={!!valToDelete} onOpenChange={(open) => !open && setValToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Histori Valuasi?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Menghapus histori valuasi dapat memengaruhi perhitungan performa portofolio Anda.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleDeleteValuation();
              }}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
