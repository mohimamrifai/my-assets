"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { CalendarIcon, ChevronLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { NominalInput } from "@/components/ui/nominal-input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { PageHeader } from "@/components/shared/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { Asset, Valuation } from "@/types";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";

import { formatCurrency } from "@/lib/formatters";
import { calcTotalModal } from "@/lib/calculations";
import { useCurrency } from "@/components/providers/CurrencyProvider";

interface ExtendedAsset extends Asset {
  valuations: Valuation[];
}

export default function SellAssetPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();

  const [asset, setAsset] = useState<ExtendedAsset | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { currency } = useCurrency();
  const [sellAll, setSellAll] = useState(false);
  const [sellPrice, setSellPrice] = useState<number | undefined>(undefined);
  const [quantitySold, setQuantitySold] = useState<number | undefined>(undefined);
  const [date, setDate] = useState<Date>(new Date());
  const [fundSource, setFundSource] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const fetchAsset = async () => {
      try {
        const res = await fetch(`/api/assets/${resolvedParams.id}`);
        const json = await res.json();
        if (json.success) {
          if (json.data.mode !== "INVESTING") {
            toast.error("Hanya aset mode Investing yang bisa dijual melalui fitur ini");
            router.push(`/assets/${resolvedParams.id}`);
            return;
          }
          if (json.data.status === "SOLD") {
            toast.error("Aset ini sudah terjual habis");
            router.push(`/assets/${resolvedParams.id}`);
            return;
          }
          setAsset(json.data);
        } else {
          toast.error("Gagal memuat detail aset");
          router.push("/dashboard");
        }
      } catch {
        toast.error("Terjadi kesalahan jaringan");
        router.push("/dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchAsset();
  }, [resolvedParams.id, router]);

  const onSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    const amount = calculatedAmount;

    if (!amount || amount <= 0) {
      toast.error(asset?.isNominal ? "Nominal penjualan tidak valid" : "Harga jual tidak valid");
      return;
    }

    if (!asset?.isNominal && !sellAll && (!quantitySold || quantitySold <= 0)) {
      toast.error("Kuantitas penjualan tidak valid");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/assets/${resolvedParams.id}/sell`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          quantitySold: sellAll ? asset?.quantity : quantitySold,
          price: asset?.isNominal ? undefined : sellPrice,
          date,
          fundSource,
          notes,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Penjualan aset berhasil dicatat");
        if (result.data.isSoldOut) {
          router.push(`/dashboard`);
        } else {
          router.push(`/assets/${resolvedParams.id}`);
        }
      } else {
        toast.error(result.error || "Gagal mencatat penjualan");
      }
    } catch {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !asset) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 pb-12">
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  const latestValuation = asset.valuations.length > 0 
    ? asset.valuations[asset.valuations.length - 1].value 
    : calcTotalModal(asset.type, asset.quantity || 0, asset.buyPrice || 0, asset.isNominal, asset.initialCapital || 0);

  let qtyLabel = "Kuantitas";
  if (asset.type === "SAHAM") qtyLabel = "Jumlah Lot";
  if (asset.type === "EMAS") qtyLabel = "Jumlah Gram";
  if (asset.type === "CRYPTO") qtyLabel = "Jumlah Unit";

  let sellPriceLabel = `Harga Jual per Unit (${currency === "USD" ? "$" : "Rp"})`;
  if (asset.type === "SAHAM") sellPriceLabel = `Harga Jual per Lembar (${currency === "USD" ? "$" : "Rp"})`;
  if (asset.type === "EMAS") sellPriceLabel = `Harga Jual per Gram (${currency === "USD" ? "$" : "Rp"})`;

  const effectiveQuantity = sellAll ? asset.quantity || 0 : quantitySold || 0;
  const unitMultiplier = asset.type === "SAHAM" ? 100 : 1;
  const calculatedAmount = asset.isNominal
    ? sellPrice
    : effectiveQuantity * unitMultiplier * (sellPrice || 0);
  const estimatedCostBasis = asset.isNominal
    ? 0
    : calcTotalModal(asset.type, effectiveQuantity, asset.buyPrice || 0);
  const estimatedRealizedGain = (calculatedAmount || 0) - estimatedCostBasis;

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" asChild className="shrink-0">
          <Link href={`/assets/${asset.id}`}>
            <ChevronLeft size={18} />
          </Link>
        </Button>
        <PageHeader 
          title="Jual Aset" 
          subtitle={asset.name || "Aset Tidak Bernama"} 
          className="mb-0"
        />
      </div>

      <Card className="border-border shadow-lg">
        <CardContent className="pt-6">
          <form onSubmit={onSubmit} className="space-y-6">
            
            <div className="p-4 rounded-lg bg-muted/30 border border-border flex flex-col gap-3 mb-6">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Nilai Terkini Estimasi:</span>
                <span className="font-medium text-foreground">{formatCurrency(latestValuation, currency)}</span>
              </div>
              {!asset.isNominal && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Kuantitas Dimiliki:</span>
                  <span className="font-medium text-foreground">{asset.quantity} {asset.type === "SAHAM" ? "Lot" : ""}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
              <div className="space-y-0.5">
                <Label className="text-base">Jual Seluruh Aset?</Label>
                <p className="text-sm text-muted-foreground">Aktifkan untuk melikuidasi semua kepemilikan aset ini.</p>
              </div>
              <Switch checked={sellAll} onCheckedChange={(checked) => {
                setSellAll(checked);
                if (checked && !asset.isNominal) {
                  setQuantitySold(asset.quantity || undefined);
                }
              }} />
            </div>

            {!asset.isNominal && !sellAll && (
              <div className="space-y-2">
                <Label>{qtyLabel} yang Dijual</Label>
                <NominalInput 
                  value={quantitySold}
                  onChange={(val) => setQuantitySold(val)}
                  placeholder="0"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>{asset.isNominal ? `Nominal Penjualan (${currency === "USD" ? "$" : "Rp"})` : sellPriceLabel}</Label>
              <NominalInput 
                value={sellPrice}
                onChange={(val) => setSellPrice(val)}
                placeholder="0"
                className="text-lg py-6 border-emerald-500/50 focus-visible:ring-emerald-500"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {asset.isNominal
                  ? "Masukkan total nominal yang diterima dari penjualan aset ini."
                  : "Masukkan harga jual, lalu sistem akan menghitung total penerimaan secara otomatis."}
              </p>
            </div>

            {!asset.isNominal && (
              <div className="p-4 rounded-lg bg-emerald-500/[0.04] border border-emerald-500/20 flex flex-col gap-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Kuantitas Dijual:</span>
                  <span className="font-medium text-foreground">
                    {effectiveQuantity || 0} {asset.type === "SAHAM" ? "Lot" : asset.type === "EMAS" ? "Gram" : "Unit"}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Harga Jual:</span>
                  <span className="font-medium text-foreground">{formatCurrency(sellPrice || 0, currency)}</span>
                </div>
                <div className="flex justify-between items-center text-sm pt-2 border-t border-emerald-500/15">
                  <span className="font-medium text-foreground">Nominal Penerimaan:</span>
                  <span className="text-lg font-bold text-emerald-600">
                    {formatCurrency(calculatedAmount || 0, currency)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Estimasi Gain/Loss Penjualan:</span>
                  <span className={cn(
                    "font-bold",
                    estimatedRealizedGain > 0 ? "text-emerald-600" : estimatedRealizedGain < 0 ? "text-red-500" : "text-foreground"
                  )}>
                    {estimatedRealizedGain > 0 ? "+" : ""}{formatCurrency(estimatedRealizedGain, currency)}
                  </span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Tujuan Dana Masuk (Opsional)</Label>
                <Input
                  value={fundSource}
                  onChange={(e) => setFundSource(e.target.value)}
                  placeholder="Contoh: Saldo RDN / Rekening Bank"
                />
              </div>

              <div className="flex flex-col space-y-2 justify-end">
                <Label>Tanggal Penjualan</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn("w-full pl-3 text-left font-normal", !date && "text-muted-foreground")}
                    >
                      {date ? format(date, "PPP", { locale: localeId }) : <span>Pilih tanggal</span>}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(d) => d && setDate(d)}
                      disabled={(d) => d > new Date() || d < new Date("1900-01-01")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Catatan (Opsional)</Label>
              <Textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Alasan jual..." 
                className="resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button type="button" variant="ghost" asChild disabled={isSubmitting}>
                <Link href={`/assets/${asset.id}`}>Batal</Link>
              </Button>
              <Button type="submit" disabled={isSubmitting || !calculatedAmount} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                {isSubmitting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memproses...</>
                ) : (
                  "Proses Penjualan"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
