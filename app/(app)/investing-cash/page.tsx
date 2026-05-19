"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { CalendarIcon, ChevronLeft, Loader2, Wallet, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { createTransactionSchema } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { NominalInput } from "@/components/ui/nominal-input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { PageHeader } from "@/components/shared/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCurrency } from "@/components/providers/CurrencyProvider";
import { formatCurrency } from "@/lib/formatters";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type TransactionFormValues = z.infer<typeof createTransactionSchema>;

interface CashTransaction {
  id: string;
  date: string | Date;
  type: string;
  amount: number;
  notes: string;
}

export default function InvestingCashPage() {
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<CashTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<TransactionFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createTransactionSchema) as any,
    defaultValues: {
      type: "DEPOSIT",
      amount: "" as unknown as number,
      date: new Date(),
      notes: "",
    },
  });

  const { watch, setValue } = form;
  const { currency } = useCurrency();
  // eslint-disable-next-line react-hooks/incompatible-library
  const currentType = watch("type");
  const currentAmount = watch("amount") || 0;

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/investing-cash`);
      const json = await res.json();
      if (json.success) {
        setBalance(json.data.balance);
        setTransactions(json.data.transactions);
      }
    } catch (error) {
      console.error(error);
      toast.error("Gagal memuat data kas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onSubmit = async (values: z.infer<typeof createTransactionSchema>) => {
    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/investing-cash`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Transaksi ${values.type.toLowerCase()} berhasil`);
        form.reset({ ...values, amount: "" as unknown as number, notes: "" });
        fetchData();
      } else {
        toast.error(result.error || "Transaksi gagal");
      }
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        <Skeleton className="h-[200px] w-full" />
      </div>
    );
  }

  const isInsufficient = currentType === "WITHDRAWAL" && currentAmount > (balance || 0);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild className="shrink-0">
          <Link href="/dashboard">
            <ChevronLeft size={18} />
          </Link>
        </Button>
        <PageHeader 
          title="Kas Investing" 
          subtitle="Kelola dana idle untuk alokasi investasi Anda" 
          className="mb-0"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Wallet size={16} />
                <CardTitle className="text-sm font-medium">
                  Total Kas Aktif
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold tracking-tight text-foreground">
                {formatCurrency(balance || 0, currency)}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader className="pb-4 border-b border-border/40">
              <CardTitle className="text-base font-semibold">Manajemen Dana</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <Tabs 
                value={currentType} 
                onValueChange={(val) => setValue("type", val as "DEPOSIT" | "WITHDRAWAL")}
                className="w-full mb-6"
              >
                <TabsList className="grid w-full grid-cols-2 p-1">
                  <TabsTrigger value="DEPOSIT" className="text-xs font-medium">
                    <ArrowDownToLine size={14} className="mr-2" />
                    Top Up
                  </TabsTrigger>
                  <TabsTrigger value="WITHDRAWAL" className="text-xs font-medium">
                    <ArrowUpFromLine size={14} className="mr-2" />
                    Tarik
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nominal ({currency === "USD" ? "$" : "Rp"})</FormLabel>
                        <FormControl>
                          <NominalInput placeholder="0" {...field} />
                        </FormControl>
                        {isInsufficient && (
                          <p className="text-xs font-medium text-destructive mt-1">
                            Saldo tidak mencukupi
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Tanggal</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                              >
                                {field.value ? format(field.value as Date, "PPP", { locale: localeId }) : <span>Pilih tanggal</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={(field.value as Date) || undefined}
                              onSelect={field.onChange}
                              disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Catatan (Opsional)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="..." className="resize-none" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={isSubmitting || isInsufficient || currentAmount <= 0} className={cn(
                    "w-full font-medium",
                    currentType === "DEPOSIT" ? "" : "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                  )}>
                    {isSubmitting ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memproses...</>
                    ) : (
                      currentType === "DEPOSIT" ? "Proses Top Up" : "Proses Penarikan"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="h-full border-border shadow-sm flex flex-col overflow-hidden">
            <CardHeader className="border-b border-border/40 pb-4">
              <CardTitle className="text-base font-semibold">Riwayat Kas</CardTitle>
            </CardHeader>
            <div className="flex-1 overflow-auto max-h-[600px]">
              <Table>
                <TableHeader className="bg-muted/30 sticky top-0">
                  <TableRow className="border-b-border/40">
                    <TableHead className="text-xs font-medium text-muted-foreground h-10">Tanggal</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground h-10">Tipe</TableHead>
                    <TableHead className="text-right text-xs font-medium text-muted-foreground h-10">Nominal</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground h-10">Catatan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.length === 0 ? (
                    <TableRow className="hover:bg-transparent border-0">
                      <TableCell colSpan={4} className="text-center py-12 text-muted-foreground/60">
                        <div className="flex flex-col items-center justify-center space-y-3">
                          <Wallet size={32} className="opacity-20" />
                          <span className="text-sm">Belum ada transaksi kas</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions.map((tx) => (
                      <TableRow key={tx.id} className="border-b-border/30 hover:bg-muted/30 transition-colors">
                        <TableCell className="font-medium text-sm text-foreground/80">
                          {format(new Date(tx.date), "dd MMM yyyy", { locale: localeId })}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn(
                            "text-[10px] font-medium px-2 py-0.5",
                            tx.type === "DEPOSIT" || tx.type === "SELL_ASSET" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-orange-500/10 text-orange-600 border-orange-500/20"
                          )}>
                            {tx.type.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium text-sm">
                          <span className={tx.type === "DEPOSIT" || tx.type === "SELL_ASSET" ? "text-emerald-600" : "text-foreground"}>
                            {tx.type === "DEPOSIT" || tx.type === "SELL_ASSET" ? "+" : "-"} {formatCurrency(tx.amount, currency)}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground/80 max-w-[200px] truncate">
                          {tx.notes || "-"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
