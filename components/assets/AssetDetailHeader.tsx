"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Trash2, Edit, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

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
import { AssetWithLatestValuation } from "@/types";

interface AssetDetailHeaderProps {
  asset: AssetWithLatestValuation;
}

export function AssetDetailHeader({ asset }: AssetDetailHeaderProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/assets/${asset.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Aset berhasil dihapus");
        router.push("/dashboard");
      } else {
        toast.error(data.error || "Gagal menghapus aset");
        setIsDeleting(false);
      }
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan jaringan");
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
      <div className="flex items-start gap-4">
        <Button variant="outline" size="icon" asChild className="mt-1 shrink-0">
          <Link href="/dashboard">
            <ChevronLeft size={18} />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
            {asset.name || asset.platformName || "Aset Tidak Bernama"}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <Badge 
              variant="outline" 
              className={`border-transparent ${
                asset.type === "SAHAM" ? "bg-blue-500/10 text-blue-500" :
                asset.type === "CRYPTO" ? "bg-purple-500/10 text-purple-500" :
                "bg-amber-500/10 text-amber-500"
              }`}
            >
              {asset.type}
            </Badge>
            <Badge 
              variant="outline" 
              className={`border-transparent ${
                asset.mode === "INVESTING" ? "bg-emerald-500/10 text-emerald-500" : "bg-orange-500/10 text-orange-500"
              }`}
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

      <div className="flex items-center gap-2 sm:ml-auto">
        {asset.mode === "INVESTING" && asset.status !== "SOLD" && (
          <Button variant="outline" asChild className="border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/10">
            <Link href={`/assets/${asset.id}/sell`}>
              Jual
            </Link>
          </Button>
        )}
        {asset.mode === "TRADING" && (
          <>
            <Button variant="outline" asChild className="border-blue-500/20 text-blue-500 hover:bg-blue-500/10">
              <Link href={`/assets/${asset.id}/transaction?type=deposit`}>
                <ArrowDownToLine size={16} className="mr-2" />
                Deposit
              </Link>
            </Button>
            <Button variant="outline" asChild className="border-orange-500/20 text-orange-500 hover:bg-orange-500/10">
              <Link href={`/assets/${asset.id}/transaction?type=withdraw`}>
                <ArrowUpFromLine size={16} className="mr-2" />
                Withdraw
              </Link>
            </Button>
          </>
        )}
        <Button variant="secondary" asChild className="bg-primary/10 text-primary hover:bg-primary/20">
          <Link href={`/assets/${asset.id}/update`}>
            <Edit size={16} className="mr-2" />
            Update Nilai
          </Link>
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="icon" className="shrink-0 bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-600 border-none">
              <Trash2 size={16} />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-card border-border">
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus Aset Ini?</AlertDialogTitle>
              <AlertDialogDescription>
                Tindakan ini tidak dapat dibatalkan. Semua data valuasi dan riwayat transaksi untuk aset ini akan dihapus secara permanen.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction 
                onClick={(e) => {
                  e.preventDefault();
                  handleDelete();
                }}
                disabled={isDeleting}
                className="bg-red-500 text-white hover:bg-red-600"
              >
                {isDeleting ? "Menghapus..." : "Ya, Hapus"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
