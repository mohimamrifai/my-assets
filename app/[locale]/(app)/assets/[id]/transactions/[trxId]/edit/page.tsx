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
import { editTransactionSchema } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { NominalInput } from "@/components/ui/nominal-input";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { PageHeader } from "@/components/shared/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { Asset, Transaction } from "@/types";

import { useCurrency } from "@/components/providers/CurrencyProvider";

type TransactionFormValues = z.infer<typeof editTransactionSchema>;

export default function EditTransactionPage({ params }: { params: Promise<{ id: string; trxId: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<TransactionFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(editTransactionSchema) as any,
    defaultValues: {
      type: "DEPOSIT",
      amount: 0,
      date: new Date(),
      notes: "",
      fundSource: "",
    },
  });

  const { reset } = form;
  const { currency } = useCurrency();

  useEffect(() => {
    const fetchTransaction = async () => {
      try {
        const res = await fetch(`/api/assets/${resolvedParams.id}/transactions/${resolvedParams.trxId}`);
        const json = await res.json();
        if (json.success) {
          setAsset(json.data.asset);
          setTransaction(json.data.transaction);
          
          reset({
            type: json.data.transaction.type,
            amount: json.data.transaction.amount,
            date: new Date(json.data.transaction.date),
            notes: json.data.transaction.notes || "",
            fundSource: json.data.transaction.fundSource || "",
          });
        } else {
          toast.error("Gagal memuat detail transaksi");
          router.push(`/assets/${resolvedParams.id}`);
        }
      } catch {
        toast.error("Terjadi kesalahan jaringan");
        router.push(`/assets/${resolvedParams.id}`);
      } finally {
        setLoading(false);
      }
    };

    fetchTransaction();
  }, [resolvedParams.id, resolvedParams.trxId, router, reset]);

  const onSubmit = async (values: z.infer<typeof editTransactionSchema>) => {
    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/assets/${resolvedParams.id}/transactions/${resolvedParams.trxId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Transaksi berhasil diperbarui");
        router.push(`/assets/${resolvedParams.id}`);
      } else {
        toast.error(result.error || "Gagal memperbarui transaksi");
      }
    } catch {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !asset || !transaction) {
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

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" asChild className="shrink-0">
          <Link href={`/assets/${asset.id}`}>
            <ChevronLeft size={18} />
          </Link>
        </Button>
        <PageHeader 
          title="Edit Transaksi" 
          subtitle={`${transaction.type} - ${asset.name || asset.platformName || "Aset Tidak Bernama"}`} 
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
                  <input type="hidden" {...field} />
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="fundSource"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sumber / Tujuan Dana</FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: Rekening / Saldo" {...field} />
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
                        placeholder="Catatan transaksi..." 
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
                    "Simpan Perubahan"
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
