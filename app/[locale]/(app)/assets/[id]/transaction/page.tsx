"use client";

import { Suspense, useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { CalendarIcon, ChevronLeft, Loader2, ArrowUpFromLine } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { createTransactionSchema } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
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

interface ExtendedAsset extends Asset {
  valuations: Valuation[];
}

type TransactionFormValues = z.infer<typeof createTransactionSchema>;

export default function TransactionPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="flex items-center justify-center p-12"><Loader2 className="animate-spin text-muted-foreground" /></div>}>
      <TransactionForm params={params} />
    </Suspense>
  );
}

function TransactionForm({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();

  const [asset, setAsset] = useState<ExtendedAsset | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<TransactionFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createTransactionSchema) as any,
    defaultValues: {
      type: "WITHDRAWAL",
      amount: "" as unknown as number,
      date: new Date(),
      fundSource: "",
      notes: "",
    },
  });

  const { watch } = form;
  const { currency, fxRate } = useCurrency();
  // eslint-disable-next-line react-hooks/incompatible-library
  const currentAmount = watch("amount") || 0;

  useEffect(() => {
    const fetchAsset = async () => {
      try {
        const res = await fetch(`/api/assets/${resolvedParams.id}`);
        const json = await res.json();
        if (json.success) {
          if (json.data.mode !== "TRADING") {
            toast.error("Transaksi Deposit/Withdraw hanya untuk aset Trading");
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

  const onSubmit = async (values: z.infer<typeof createTransactionSchema>) => {
    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/assets/${resolvedParams.id}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Transaksi ${values.type.toLowerCase()} berhasil dicatat`);
        router.push(`/assets/${resolvedParams.id}`);
      } else {
        toast.error(result.error || `Gagal mencatat transaksi ${values.type.toLowerCase()}`);
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
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  const currentCapital = asset.initialCapital || 0;
  const latestValuation = asset.valuations.length > 0 
    ? asset.valuations[asset.valuations.length - 1].value 
    : currentCapital;

  const currentProfit = latestValuation - currentCapital;
  
  let newCapital = currentCapital;
  let realizedGainPred = 0;
  
  if (currentProfit > 0) {
    if (currentAmount <= currentProfit) {
      realizedGainPred = currentAmount;
      // Modal tidak berkurang
    } else {
      realizedGainPred = currentProfit;
      const excessWithdraw = currentAmount - currentProfit;
      newCapital = currentCapital - excessWithdraw;
    }
  } else {
    newCapital = currentCapital - currentAmount;
  }
  
  if (newCapital < 0) newCapital = 0;

  const newValuationValue = latestValuation - currentAmount;
  const isInsufficient = currentAmount > latestValuation;

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" asChild className="shrink-0">
          <Link href={`/assets/${asset.id}`}>
            <ChevronLeft size={18} />
          </Link>
        </Button>
        <PageHeader 
          title="Withdraw" 
          subtitle={asset.name || asset.platformName || "Aset Tidak Bernama"} 
          className="mb-0"
        />
      </div>

      <Card className="border-border shadow-lg">
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <input type="hidden" {...field} value="WITHDRAWAL" />
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nominal ({currency === "USD" ? "$" : "Rp"})</FormLabel>
                    <FormControl>
                      <NominalInput
                        placeholder="0"
                        {...field}
                        className="text-lg py-6"
                      />
                    </FormControl>
                    {isInsufficient && (
                      <p className="text-[0.8rem] font-medium text-destructive">
                        Saldo tidak mencukupi untuk penarikan ini.
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="p-4 rounded-lg bg-muted/30 border border-border flex flex-col gap-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Saldo Saat Ini:</span>
                  <span className="font-medium">{formatCurrency(latestValuation, { display: currency, rate: fxRate })}</span>
                </div>
                <div className="flex justify-between items-center text-sm border-b border-border pb-3">
                  <span className="text-muted-foreground">Modal Awal Saat Ini:</span>
                  <span className="font-medium">{formatCurrency(currentCapital, { display: currency, rate: fxRate })}</span>
                </div>
                <div className="flex justify-between items-center text-sm pt-1">
                  <span className="font-medium">Estimasi Saldo Baru:</span>
                  <span className={cn(
                    "font-bold",
                    isInsufficient ? "text-destructive" : "text-orange-600"
                  )}>
                    {formatCurrency(newValuationValue, { display: currency, rate: fxRate })}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium">Estimasi Modal Baru:</span>
                  <span className={cn(
                    "font-bold",
                    isInsufficient ? "text-destructive" : "text-orange-600"
                  )}>
                    {formatCurrency(newCapital, { display: currency, rate: fxRate })}
                  </span>
                </div>
                {realizedGainPred > 0 && (
                  <div className="flex justify-between items-center text-sm border-t border-border pt-2 mt-1">
                    <span className="font-medium text-emerald-600">Pemotongan Profit (Realized Gain):</span>
                    <span className="font-bold text-emerald-600">
                      +{formatCurrency(realizedGainPred, { display: currency, rate: fxRate })}
                    </span>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1 text-center bg-card p-2 rounded border border-border/50">
                  💡 Withdraw diprioritaskan memotong profit terlebih dahulu agar modal utuh. Total Gain/Loss tidak akan berkurang.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="fundSource"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tujuan Dana (Opsional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: Rekening Utama" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col justify-end">
                      <FormLabel>Tanggal Transaksi</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value as Date, "PPP", { locale: localeId })
                              ) : (
                                <span>Pilih tanggal</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={(field.value as Date) || undefined}
                            onSelect={field.onChange}
                            disabled={(date: Date) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Catatan (Opsional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tambahkan catatan khusus..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button type="button" variant="ghost" asChild disabled={isSubmitting}>
                  <Link href={`/assets/${asset.id}`}>Batal</Link>
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || isInsufficient}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    <>
                      <ArrowUpFromLine size={16} className="mr-2" />
                      Proses Withdraw
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
