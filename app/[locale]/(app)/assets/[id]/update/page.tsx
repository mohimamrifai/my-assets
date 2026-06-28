"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { CalendarIcon, ChevronLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { createValuationSchema } from "@/lib/validations";
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

type ValuationFormValues = z.infer<typeof createValuationSchema>;

export default function UpdateValuationPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [asset, setAsset] = useState<ExtendedAsset | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ValuationFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createValuationSchema) as any,
    defaultValues: {
      recordedAt: new Date(),
      fundSource: "",
      notes: "",
    },
  });

  const { watch } = form;
  const { currency, fxRate } = useCurrency();
  // eslint-disable-next-line react-hooks/incompatible-library
  const currentValueInput = Number(watch("value")) || 0;

  useEffect(() => {
    const fetchAsset = async () => {
      try {
        const res = await fetch(`/api/assets/${resolvedParams.id}`);
        const json = await res.json();
        if (json.success) {
          setAsset(json.data);
          // Don't set default value to 0, let the user type it.
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

  const onSubmit = async (values: z.infer<typeof createValuationSchema>) => {
    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/assets/${resolvedParams.id}/valuations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Nilai aset berhasil diperbarui");
        router.push(`/assets/${resolvedParams.id}`);
      } else {
        toast.error(result.error || "Gagal memperbarui nilai aset");
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

  const latestValuation = asset.valuations.length > 0 
    ? asset.valuations[asset.valuations.length - 1] 
    : null;

  // Determine labels and calculations based on mode and type
  let inputLabel = "Nilai Saat Ini";
  let calculatedTotal = currentValueInput;
  let previewText = "";

  if (asset.mode === "INVESTING") {
    if (asset.isNominal) {
      inputLabel = `Nilai Total Saat Ini (${currency === "USD" ? "$" : "Rp"})`;
      calculatedTotal = currentValueInput;
      previewText = `Nilai Total = ${formatCurrency(calculatedTotal, { display: currency, rate: fxRate })}`;
    } else {
      const qty = asset.quantity || 0;
      if (asset.type === "SAHAM") {
        inputLabel = `Harga per Lembar Saat Ini (${currency === "USD" ? "$" : "Rp"})`;
        calculatedTotal = qty * 100 * currentValueInput;
        previewText = `Nilai Total = ${qty} lot × 100 × ${formatCurrency(currentValueInput, { display: currency, rate: fxRate })} = ${formatCurrency(calculatedTotal, { display: currency, rate: fxRate })}`;
      } else if (asset.type === "CRYPTO") {
        inputLabel = `Harga per Unit Saat Ini (${currency === "USD" ? "$" : "Rp"})`;
        calculatedTotal = qty * currentValueInput;
        previewText = `Nilai Total = ${qty} unit × ${formatCurrency(currentValueInput, { display: currency, rate: fxRate })} = ${formatCurrency(calculatedTotal, { display: currency, rate: fxRate })}`;
      } else if (asset.type === "EMAS") {
        inputLabel = `Harga per Gram Saat Ini (${currency === "USD" ? "$" : "Rp"})`;
        calculatedTotal = qty * currentValueInput;
        previewText = `Nilai Total = ${qty} gram × ${formatCurrency(currentValueInput, { display: currency, rate: fxRate })} = ${formatCurrency(calculatedTotal, { display: currency, rate: fxRate })}`;
      }
    }
  } else {
    // TRADING
    inputLabel = `Saldo Akun Saat Ini ${asset.platformName ? `di ${asset.platformName}` : ''} (${currency === "USD" ? "$" : "Rp"})`;
    // calculatedTotal is just the input value
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
          title="Update Nilai Aset" 
          subtitle={asset.name || asset.platformName || "Aset Tidak Bernama"} 
          className="mb-0"
        />
      </div>

      {latestValuation && (
        <div className="bg-muted/30 border border-border p-4 rounded-lg flex items-center justify-between text-sm">
          <div className="text-muted-foreground">
            Nilai tercatat terakhir:
          </div>
          <div className="text-right">
            <div className="font-semibold text-foreground">
              {formatCurrency(latestValuation.value, { display: currency, rate: fxRate })}
            </div>
            <div className="text-xs text-muted-foreground">
              pada {format(new Date(latestValuation.recordedAt), "dd MMM yyyy", { locale: localeId })}
            </div>
          </div>
        </div>
      )}

      <Card className="border-border shadow-lg">
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{inputLabel}</FormLabel>
                    <FormControl>
                      <NominalInput 
                        placeholder="0" 
                        {...field} 
                        className="text-lg py-6"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {asset.mode === "INVESTING" && (
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 flex flex-col gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Kalkulasi Otomatis:</span>
                  <div className="text-sm">{previewText}</div>
                  <div className="mt-2 pt-2 border-t border-primary/10 flex justify-between items-center">
                    <span className="font-semibold">Nilai Portofolio Baru:</span>
                    <span className="text-lg font-bold text-primary">
                      {formatCurrency(calculatedTotal, { display: currency, rate: fxRate })}
                    </span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="recordedAt"
                  render={({ field }) => (
                    <FormItem className="flex flex-col justify-end">
                      <FormLabel>Tanggal Pencatatan</FormLabel>
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

                <FormField
                  control={form.control}
                  name="fundSource"
                  render={({ field }) => (
                    <FormItem className="flex flex-col justify-end">
                      <FormLabel>Sumber Dana (Opsional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: Rekening Utama / Saldo Platform" {...field} />
                      </FormControl>
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
                        placeholder="Contoh: Harga penutupan akhir bulan..." 
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
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    "Simpan Valuasi"
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
