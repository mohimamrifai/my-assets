"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { CalendarIcon, BarChart2, Bitcoin, Gem, PiggyBank, ArrowLeftRight, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { createAssetSchema } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { PageHeader } from "@/components/shared/PageHeader";
import { AssetType, AssetMode } from "@/types";

export default function NewAssetPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<any>({
    resolver: zodResolver(createAssetSchema),
    defaultValues: {
      type: "SAHAM",
      mode: "INVESTING",
      name: "",
      quantity: 0,
      buyPrice: 0,
      initialCapital: 0,
      platformName: "",
      notes: "",
      buyDate: new Date(),
    },
  });

  const { watch, setValue } = form;
  const currentType = watch("type");
  const currentMode = watch("mode");
  const currentQuantity = watch("quantity") || 0;
  const currentBuyPrice = watch("buyPrice") || 0;

  const onSubmit = async (values: z.infer<typeof createAssetSchema>) => {
    try {
      setIsSubmitting(true);
      const response = await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Aset berhasil ditambahkan");
        router.push(`/assets/${result.data.id}`);
      } else {
        toast.error(result.error || "Gagal menambahkan aset");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => setStep((s) => Math.min(s + 1, 3));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const renderStep1 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-xl font-semibold mb-1">Pilih Jenis Aset</h2>
        <p className="text-muted-foreground text-sm">Pilih jenis instrumen investasi yang ingin Anda tambahkan.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { type: "SAHAM", icon: BarChart2, label: "Saham", desc: "Pasar modal & sekuritas" },
          { type: "CRYPTO", icon: Bitcoin, label: "Crypto", desc: "Aset digital & token" },
          { type: "EMAS", icon: Gem, label: "Emas", desc: "Logam mulia" },
        ].map((item) => (
          <Card 
            key={item.type}
            className={cn(
              "cursor-pointer transition-all hover:border-primary/50",
              currentType === item.type ? "border-primary bg-primary/5 shadow-md shadow-primary/10" : "border-border"
            )}
            onClick={() => {
              setValue("type", item.type as AssetType);
              nextStep();
            }}
          >
            <CardContent className="flex flex-col items-center justify-center p-6 text-center h-full">
              <div className={cn(
                "p-3 rounded-full mb-4",
                currentType === item.type ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}>
                <item.icon size={32} />
              </div>
              <h3 className="font-semibold text-lg mb-1">{item.label}</h3>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-xl font-semibold mb-1">Pilih Mode Portofolio</h2>
        <p className="text-muted-foreground text-sm">Tentukan tujuan utama dari aset ini.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card 
          className={cn(
            "cursor-pointer transition-all hover:border-emerald-500/50",
            currentMode === "INVESTING" ? "border-emerald-500 bg-emerald-500/5 shadow-md shadow-emerald-500/10" : "border-border"
          )}
          onClick={() => {
            setValue("mode", "INVESTING");
            nextStep();
          }}
        >
          <CardContent className="flex items-start p-6 gap-4">
            <div className={cn(
              "p-3 rounded-full shrink-0",
              currentMode === "INVESTING" ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"
            )}>
              <PiggyBank size={28} />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">Investing</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Fokus pada akumulasi jangka panjang. Pencatatan berbasis kuantitas (lot/unit/gram) dan harga beli rata-rata.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card 
          className={cn(
            "cursor-pointer transition-all hover:border-orange-500/50",
            currentMode === "TRADING" ? "border-orange-500 bg-orange-500/5 shadow-md shadow-orange-500/10" : "border-border"
          )}
          onClick={() => {
            setValue("mode", "TRADING");
            nextStep();
          }}
        >
          <CardContent className="flex items-start p-6 gap-4">
            <div className={cn(
              "p-3 rounded-full shrink-0",
              currentMode === "TRADING" ? "bg-orange-500 text-white" : "bg-muted text-muted-foreground"
            )}>
              <ArrowLeftRight size={28} />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">Trading</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Fokus pada keuntungan jangka pendek. Pencatatan berbasis modal awal (saldo platform) dan fluktuasi nilai total.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="flex justify-start">
        <Button variant="ghost" onClick={prevStep}>
          <ChevronLeft className="mr-2" size={16} /> Kembali
        </Button>
      </div>
    </div>
  );

  const renderStep3 = () => {
    // Dynamic labels based on type
    let qtyLabel = "Kuantitas";
    let qtyHelper = "";
    if (currentType === "SAHAM") {
      qtyLabel = "Jumlah Lot";
      qtyHelper = "1 lot = 100 lembar";
    } else if (currentType === "CRYPTO") {
      qtyLabel = "Jumlah Unit";
      qtyHelper = "Desimal diperbolehkan (contoh: 0.05)";
    } else if (currentType === "EMAS") {
      qtyLabel = "Jumlah Gram";
    }

    const calculatedTotal = currentType === "SAHAM" 
      ? currentQuantity * currentBuyPrice * 100 
      : currentQuantity * currentBuyPrice;

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div>
          <h2 className="text-xl font-semibold mb-1">Detail Aset</h2>
          <p className="text-muted-foreground text-sm">Lengkapi informasi untuk {currentType.toLowerCase()} mode {currentMode.toLowerCase()}.</p>
        </div>

        {currentMode === "INVESTING" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Nama Aset / Ticker</FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: BBCA, Bitcoin, Antam" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{qtyLabel}</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="any"
                      placeholder="0" 
                      {...field} 
                      onChange={e => field.onChange(parseFloat(e.target.value) || 0)} 
                    />
                  </FormControl>
                  {qtyHelper && <FormDescription>{qtyHelper}</FormDescription>}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="buyPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Harga Beli per Unit (Rp)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="0" 
                      {...field} 
                      onChange={e => field.onChange(parseFloat(e.target.value) || 0)} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="md:col-span-2 p-4 rounded-lg bg-primary/5 border border-primary/20 flex items-center justify-between">
              <span className="text-sm font-medium">Estimasi Total Modal:</span>
              <span className="text-lg font-bold text-primary">
                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(calculatedTotal)}
              </span>
            </div>
            
            <FormField
              control={form.control}
              name="buyDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Tanggal Pembelian</FormLabel>
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
                            format(field.value, "PPP", { locale: id })
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
                        selected={field.value || undefined}
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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="platformName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Platform / Bursa</FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: Binance, Ajaib" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Label Portofolio (Opsional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: Akun Swing Trading" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="initialCapital"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Modal Awal (Rp)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="0" 
                      {...field} 
                      onChange={e => field.onChange(parseFloat(e.target.value) || 0)} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="buyDate"
              render={({ field }) => (
                <FormItem className="flex flex-col justify-end">
                  <FormLabel>Tanggal Mulai</FormLabel>
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
                            format(field.value, "PPP", { locale: id })
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
                        selected={field.value || undefined}
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
        )}

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem className="mt-6">
              <FormLabel>Catatan (Opsional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Tambahkan catatan khusus mengenai aset ini..." 
                  className="resize-none"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-between pt-4 border-t border-border">
          <Button type="button" variant="ghost" onClick={prevStep} disabled={isSubmitting}>
            <ChevronLeft className="mr-2" size={16} /> Kembali
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              "Simpan Aset"
            )}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <PageHeader 
        title="Tambah Aset Baru" 
        subtitle="Catat instrumen investasi atau trading Anda" 
      />

      <div className="mb-8">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-border -z-10" />
          {[1, 2, 3].map((i) => (
            <div 
              key={i} 
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-colors",
                step === i ? "bg-primary border-primary text-primary-foreground" : 
                step > i ? "bg-primary border-primary text-primary-foreground" : "bg-card border-border text-muted-foreground"
              )}
            >
              {i}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs font-medium text-muted-foreground">
          <span>Jenis Aset</span>
          <span>Mode Portofolio</span>
          <span>Detail Informasi</span>
        </div>
      </div>

      <Card className="border-border shadow-lg">
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              {step === 1 && renderStep1()}
              {step === 2 && renderStep2()}
              {step === 3 && renderStep3()}
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
