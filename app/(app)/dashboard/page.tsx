"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { NetWorthCard } from "@/components/dashboard/NetWorthCard";
import { GainLossCard } from "@/components/dashboard/GainLossCard";
import { FilterTabs, FilterMode } from "@/components/dashboard/FilterTabs";
import { SectorBreakdown } from "@/components/dashboard/SectorBreakdown";
import { AssetTable } from "@/components/dashboard/AssetTable";
import { OverviewChart } from "@/components/dashboard/OverviewChart";
import { DashboardData } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { PlusCircle, RefreshCw } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { HistoryFilter, TimeFilter, filterByTime } from "@/components/shared/HistoryFilter";
import { TransactionTable } from "@/components/assets/TransactionTable";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterMode>("SEMUA");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("ALL");

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/dashboard");
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        toast.error("Gagal memuat data dashboard");
      }
    } catch (error) {
      console.error("Error fetching dashboard:", error);
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/dashboard");
        const json = await res.json();
        if (mounted) {
          if (json.success) {
            setData(json.data);
          } else {
            toast.error("Gagal memuat data dashboard");
          }
        }
      } catch (error) {
        console.error("Error fetching dashboard:", error);
        if (mounted) {
          toast.error("Terjadi kesalahan jaringan");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" subtitle="Ringkasan portofolio aset Anda" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-[140px] w-full" />
          <Skeleton className="h-[140px] w-full" />
        </div>
        <Skeleton className="h-[300px] w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  // Derive display values based on filter
  const displayNetWorth = 
    filter === "SEMUA" ? data.netWorth :
    filter === "INVESTING" ? data.byMode.investing.netWorth :
    data.byMode.trading.netWorth;

  const displayTotalModal = 
    filter === "SEMUA" ? data.totalCapital :
    filter === "INVESTING" ? data.byMode.investing.totalModal :
    data.byMode.trading.totalModal;

  const displayGainLossNominal = 
    filter === "SEMUA" ? data.totalGainLossNominal :
    filter === "INVESTING" ? data.byMode.investing.gainLoss.nominal :
    data.byMode.trading.gainLoss.nominal;

  const displayGainLossPercent = 
    filter === "SEMUA" ? data.totalGainLossPercent :
    filter === "INVESTING" ? data.byMode.investing.gainLoss.percent :
    data.byMode.trading.gainLoss.percent;

  const displayAssets = data.assets.filter(asset => {
    if (filter === "SEMUA") return true;
    return asset.mode === filter;
  });

  const filteredTransactions = filterByTime(
    data.allTransactions || [], 
    timeFilter, 
    (t) => t.date
  ).filter(t => {
    if (filter === "SEMUA") return true;
    const relatedAsset = data.assets.find(a => a.id === t.assetId);
    return relatedAsset?.mode === filter;
  });

  return (
    <div className="space-y-6 pb-12">
      <PageHeader title="Dashboard" subtitle="Ringkasan portofolio aset Anda">
        <Button variant="outline" size="icon" onClick={fetchDashboardData} disabled={loading}>
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
        </Button>
        <Button asChild>
          <Link href="/assets/new">
            <PlusCircle size={18} className="mr-2" />
            Tambah Aset
          </Link>
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start content-start">
            <NetWorthCard netWorth={displayNetWorth} totalModal={displayTotalModal} />
            <GainLossCard nominal={displayGainLossNominal} percent={displayGainLossPercent} />
          </div>
          <OverviewChart assets={displayAssets} />
        </div>
        <div className="lg:col-span-1">
          <SectorBreakdown 
            saham={data.bySector.SAHAM}
            crypto={data.bySector.CRYPTO}
            emas={data.bySector.EMAS}
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight">Rincian Aset</h2>
          <FilterTabs value={filter} onChange={setFilter} />
        </div>
        <AssetTable assets={displayAssets} />
      </div>

      <div className="space-y-4 pt-4 border-t border-border/50">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight">Riwayat Transaksi Global</h2>
          <HistoryFilter value={timeFilter} onChange={setTimeFilter} />
        </div>
        <div className="h-[400px]">
          <TransactionTable transactions={filteredTransactions} assetName="Global" onTransactionDeleted={fetchDashboardData} />
        </div>
      </div>
    </div>
  );
}
