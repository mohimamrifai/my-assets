"use client";

import { useState } from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { useCurrency } from "@/components/providers/CurrencyProvider";
import { formatCurrency } from "@/lib/formatters";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Transaction } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface TransactionTableProps {
  transactions: Transaction[];
  assetName?: string;
  onTransactionDeleted?: () => void;
}

export function TransactionTable({ transactions, assetName, onTransactionDeleted }: TransactionTableProps) {
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { currency, fxRate } = useCurrency();
  const router = useRouter();

  const handleDelete = async () => {
    if (!selectedTx) return;
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/assets/${selectedTx.assetId}/transactions/${selectedTx.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Transaksi berhasil dihapus");
        setShowDeleteConfirm(false);
        setSelectedTx(null);
        if (onTransactionDeleted) {
          onTransactionDeleted();
        } else {
          router.refresh();
        }
      } else {
        toast.error(json.error || "Gagal menghapus transaksi");
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setIsDeleting(false);
    }
  };

  if (transactions.length === 0) {
    return (
      <Card className="bg-card border-border shadow-sm rounded-lg overflow-hidden flex flex-col h-full">
        <CardHeader className="py-4 px-5 border-b border-border/50">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Riwayat Transaksi</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12 text-muted-foreground text-sm">
          Belum ada transaksi tercatat.
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-card border-border shadow-sm rounded-lg overflow-hidden flex flex-col h-full">
        <CardHeader className="py-4 px-5 border-b border-border/50">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Riwayat Transaksi</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto flex-1 max-h-[400px]">
          <Table>
            <TableHeader className="bg-muted/20 sticky top-0 z-10 backdrop-blur-md">
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="font-medium text-xs uppercase tracking-wider h-10 px-5">Tanggal</TableHead>
                <TableHead className="font-medium text-xs uppercase tracking-wider h-10">Tipe</TableHead>
                <TableHead className="font-medium text-xs uppercase tracking-wider h-10 text-right">Nominal</TableHead>
                <TableHead className="font-medium text-xs uppercase tracking-wider h-10">Sumber / Tujuan Dana</TableHead>
                {assetName && assetName === "Global" && (
                  <TableHead className="font-medium text-xs uppercase tracking-wider h-10">Aset</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((trx) => {
                let badgeColor = "bg-gray-500/10 text-gray-500 border-gray-500/20";
                
                if (trx.type === "BUY") badgeColor = "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
                else if (trx.type === "SELL") badgeColor = "bg-amber-500/10 text-amber-600 border-amber-500/20";
                else if (trx.type === "DEPOSIT") badgeColor = "bg-blue-500/10 text-blue-600 border-blue-500/20";
                else if (trx.type === "WITHDRAWAL") badgeColor = "bg-orange-500/10 text-orange-600 border-orange-500/20";
                else if (trx.type === "UPDATE") badgeColor = "bg-purple-500/10 text-purple-600 border-purple-500/20";

                // Hack for global table asset name
              const relatedAsset = (trx as Transaction & { assetName?: string }).assetName;

                return (
                  <TableRow 
                    key={trx.id} 
                    className="border-border/50 hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => setSelectedTx(trx)}
                  >
                    <TableCell className="px-5 py-3 text-sm text-foreground font-medium">
                      {format(new Date(trx.date), "dd MMM yyyy", { locale: localeId })}
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge variant="outline" className={`text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-md ${badgeColor}`}>
                        {trx.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right py-3 font-medium text-sm text-foreground">
                    {formatCurrency(trx.amount, { display: currency, rate: fxRate })}
                  </TableCell>
                    <TableCell className="text-sm py-3 text-muted-foreground">
                      {trx.fundSource || "-"}
                    </TableCell>
                    {assetName && assetName === "Global" && (
                      <TableCell className="text-sm py-3 font-medium">
                        {relatedAsset || "-"}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={!!selectedTx} onOpenChange={(open) => !open && setSelectedTx(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Detail Transaksi</DialogTitle>
            <DialogDescription>
              Informasi lengkap mengenai transaksi yang dipilih.
            </DialogDescription>
          </DialogHeader>
          
          {selectedTx && (
            <div className="space-y-4 py-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Tanggal & Waktu</span>
                <span className="font-medium">{format(new Date(selectedTx.date), "dd MMMM yyyy, HH:mm", { locale: localeId })}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Tipe Transaksi</span>
                <Badge variant="outline" className="uppercase">{selectedTx.type}</Badge>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Nominal</span>
                <span className="font-bold text-lg">{formatCurrency(selectedTx.amount, { display: currency, rate: fxRate })}</span>
              </div>
              <Separator />
              
              {assetName && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Aset Terkait</span>
                    <span className="font-medium">{assetName}</span>
                  </div>
                  <Separator />
                </>
              )}
              
              {selectedTx.quantity != null && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Kuantitas</span>
                    <span className="font-medium">{selectedTx.quantity}</span>
                  </div>
                  <Separator />
                </>
              )}
              
              {selectedTx.price != null && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Harga Satuan</span>
                    <span className="font-medium">{formatCurrency(selectedTx.price, { display: currency, rate: fxRate })}</span>
                  </div>
                  <Separator />
                </>
              )}

              {selectedTx.realizedGain != null && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Realized Gain/Loss</span>
                    <span className={`font-bold ${selectedTx.realizedGain > 0 ? "text-emerald-500" : selectedTx.realizedGain < 0 ? "text-red-500" : ""}`}>
                      {selectedTx.realizedGain > 0 ? "+" : ""}{formatCurrency(selectedTx.realizedGain, { display: currency, rate: fxRate })}
                    </span>
                  </div>
                  <Separator />
                </>
              )}

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Sumber/Tujuan Dana</span>
                <span className="font-medium">{selectedTx.fundSource || "-"}</span>
              </div>
              <Separator />
              
              <div className="flex flex-col gap-2">
                <span className="text-sm text-muted-foreground">Catatan / Keterangan</span>
                <p className="text-sm bg-muted/50 p-3 rounded-md min-h-[60px]">
                  {selectedTx.notes || "Tidak ada catatan."}
                </p>
              </div>
            </div>
          )}
          <DialogFooter className="sm:justify-between flex-row justify-between pt-2">
            <Button 
              type="button" 
              variant="destructive" 
              size="sm" 
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Hapus
            </Button>
            {selectedTx && (
              <Button type="button" variant="outline" size="sm" asChild>
                <Link href={`/assets/${selectedTx.assetId}/transactions/${selectedTx.id}/edit`}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </Link>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Transaksi?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Menghapus transaksi ini juga akan memengaruhi total modal/kuantitas aset terkait.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Hapus Transaksi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
