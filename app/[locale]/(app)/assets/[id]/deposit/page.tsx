"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { CalendarIcon, ChevronLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { NominalInput } from "@/components/ui/nominal-input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { PageHeader } from "@/components/shared/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { Asset, Valuation } from "@/types";
import { useCurrency } from "@/components/providers/CurrencyProvider";
import { formatCurrency } from "@/lib/formatters";
import { calcTotalModal } from "@/lib/calculations";

interface ExtendedAsset extends Asset {
  valuations: Valuation[];
}

export default function AssetDepositPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { currency } = useCurrency();

  const [asset, setAsset] = useState<ExtendedAsset | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [amount, setAmount] = useState<number | undefined>(undefined);
  const [quantity, setQuantity] = useState<number | undefined>(undefined);
  const [buyPrice, setBuyPrice] = useState<number | undefined>(undefined);
  const [date, setDate] = useState<Date>(new Date());
  const [fundSource, setFundSource] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const fetchAsset = async () => {
      try {
        const res = await fetch(`/api/assets/${resolvedParams.id}`);
        const json = await res.json();

        if (json.success) {
          if (json.data.status === "SOLD") {
            toast.error("Aset yang sudah terjual habis tidak bisa ditambahkan lagi");
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

  const onSubmit = async (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!asset) {
      return;
    }

    if (asset.mode === "TRADING" || asset.isNominal) {
      if (!amount || amount <= 0) {
        toast.error("Nominal deposit tidak valid");
        return;
      }
    } else {
      if (!quantity || quantity <= 0) {
        toast.error("Kuantitas deposit tidak valid");
        return;
      }

      if (buyPrice === undefined || buyPrice < 0) {
        toast.error("Harga beli tidak valid");
        return;
      }
    }

    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/assets/${resolvedParams.id}/deposit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          quantity,
          buyPrice,
          date,
          fundSource,
          notes,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Deposit aset berhasil dicatat");
        router.push(`/assets/${resolvedParams.id}`);
      } else {
        toast.error(result.error || "Gagal mencatat deposit aset");
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
        <div className="flex gap-4 mb-8">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-10 w-64" />
        </div>
        <Skeleton className="h-[420px] w-full" />
      </div>
    );
  }

  const latestValuation = asset.valuations.length > 0
    ? asset.valuations[asset.valuations.length - 1].value
    : calcTotalModal(asset.type, asset.quantity || 0, asset.buyPrice || 0, asset.isNominal, asset.initialCapital || 0);

  const depositAmount = asset.mode === "TRADING" || asset.isNominal
    ? amount || 0
    : calcTotalModal(asset.type, quantity || 0, buyPrice || 0);

  const newValueEstimate = latestValuation + depositAmount;

  let quantityLabel = "Kuantitas Tambahan";
  let buyPriceLabel = `Harga Beli Tambahan (${currency === "USD" ? "$" : "Rp"})`;

  if (asset.type === "SAHAM") {
    quantityLabel = "Jumlah Lot Tambahan";
    buyPriceLabel = `Harga Beli per Lembar (${currency === "USD" ? "$" : "Rp"})`;
  } else if (asset.type === "EMAS") {
    quantityLabel = "Jumlah Gram Tambahan";
    buyPriceLabel = `Harga Beli per Gram (${currency === "USD" ? "$" : "Rp"})`;
  } else if (asset.type === "CRYPTO") {
    quantityLabel = "Jumlah Unit Tambahan";
    buyPriceLabel = `Harga Beli per Unit (${currency === "USD" ? "$" : "Rp"})`;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" asChild className="shrink-0">
          <Link href={`/assets/${asset.id}`}>
            <ChevronLeft size={18} />
          </Link>
        </Button>
        <PageHeader
          title="Deposit Aset"
          subtitle={asset.name || asset.platformName || "Aset Tidak Bernama"}
          className="mb-0"
        />
      </div>

      <Card className="border-border shadow-lg">
        <CardContent className="pt-6">
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="p-4 rounded-lg bg-muted/30 border border-border flex flex-col gap-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Nilai / Saldo Saat Ini:</span>
                <span className="font-medium">{formatCurrency(latestValuation, currency)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium">Estimasi Nilai Setelah Deposit:</span>
                <span className="font-bold text-blue-600">{formatCurrency(newValueEstimate, currency)}</span>
              </div>
            </div>

            {asset.mode === "TRADING" || asset.isNominal ? (
              <div className="space-y-2">
                <Label>Nominal Deposit ({currency === "USD" ? "$" : "Rp"})</Label>
                <NominalInput
                  value={amount}
                  onChange={setAmount}
                  placeholder="0"
                  className="text-lg py-6"
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>{quantityLabel}</Label>
                  <NominalInput
                    value={quantity}
                    onChange={setQuantity}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{buyPriceLabel}</Label>
                  <NominalInput
                    value={buyPrice}
                    onChange={setBuyPrice}
                    placeholder="0"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Sumber Dana (Opsional)</Label>
                <Input
                  value={fundSource}
                  onChange={(event) => setFundSource(event.target.value)}
                  placeholder="Contoh: Rekening Utama / RDN"
                />
              </div>

              <div className="flex flex-col space-y-2 justify-end">
                <Label>Tanggal Deposit</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
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
                      onSelect={(selectedDate) => selectedDate && setDate(selectedDate)}
                      disabled={(selectedDate) => selectedDate > new Date() || selectedDate < new Date("1900-01-01")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Catatan (Opsional)</Label>
              <Textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Tambahkan catatan deposit..."
                className="resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button type="button" variant="ghost" asChild disabled={isSubmitting}>
                <Link href={`/assets/${asset.id}`}>Batal</Link>
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  "Simpan Deposit"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
