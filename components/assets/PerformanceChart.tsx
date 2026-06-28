"use client";

import { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, ReferenceLine } from "recharts";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Valuation } from "@/types";
import { useCurrency } from "@/components/providers/CurrencyProvider";
import { formatCurrency } from "@/lib/formatters";
import { useMounted } from "@/hooks/useMounted";

interface PerformanceChartProps {
  valuations: Valuation[];
  totalModal: number;
}

const CustomTooltipContent = ({ active, payload, currency, fxRate }: { active?: boolean, payload?: { payload: { fullDate: string }, value: number }[], label?: string, currency: "IDR" | "USD", fxRate: number }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border/50 p-4 rounded-md shadow-xl">
        <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-1">{payload[0].payload.fullDate}</p>
        <p className="text-xl font-bold text-foreground tabular-nums">
          {formatCurrency(payload[0].value, { display: currency, rate: fxRate })}
        </p>
      </div>
    );
  }
  return null;
};

export function PerformanceChart({ valuations, totalModal }: PerformanceChartProps) {
  const { currency, fxRate } = useCurrency();
  const mounted = useMounted();

  const data = useMemo(() => {
    const sortedValuations = [...valuations].sort(
      (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
    );

    const groupedData = sortedValuations.reduce((acc, curr) => {
      const dateKey = format(new Date(curr.recordedAt), "dd MMM yy", { locale: localeId });
      acc[dateKey] = {
        date: curr.recordedAt,
        formattedDate: dateKey,
        fullDate: format(new Date(curr.recordedAt), "dd MMMM yyyy", { locale: localeId }),
        value: Number(curr.value),
      };
      return acc;
    }, {} as Record<string, { date: Date | string, formattedDate: string, fullDate: string, value: number }>);

    return Object.values(groupedData);
  }, [valuations]);

  // DEBUGGING: Tampilkan raw data di console
  console.log("Chart Data Points:", data);

  if (data.length <= 1) {
    return (
      <Card className="bg-card border-border shadow-lg">
        <CardHeader>
          <CardTitle className="text-base font-medium">Tren Valuasi</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px] text-muted-foreground bg-muted/10 rounded-md mx-6 mb-6">
          <div className="text-center">
            <p className="mb-2">Data valuasi belum cukup.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const values = data.map(d => d.value);
  const minVal = Math.min(...values, totalModal);
  const maxVal = Math.max(...values, totalModal);
  const range = maxVal - minVal;

  // Jika range sangat kecil (flat), kita buat padding agar grafik "terpaksa" naik turun
  const padding = range === 0 ? maxVal * 0.05 : range * 0.1;

  return (
    <div className="bg-card border border-border/50 shadow-sm rounded-lg overflow-hidden pt-4 pb-2 relative">
      <div className="h-[300px] w-full min-h-[300px] relative">
        {/* Render setelah mount agar parent sudah punya dimensi, menghindari warning width/height -1 dari recharts */}
        {mounted && (
          <ResponsiveContainer width="100%" height="100%" minHeight={300} minWidth={1}>
            <AreaChart
              data={data}
              margin={{ top: 10, right: 0, left: 0, bottom: 20 }}
            >
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" strokeOpacity={0.5} />
              <XAxis
                dataKey="formattedDate"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                dy={15}
              />
              <YAxis
                hide
                domain={[minVal - padding, maxVal + padding]}
              />
              <Tooltip content={<CustomTooltipContent currency={currency} fxRate={fxRate} />} />
              <ReferenceLine
                y={totalModal}
                stroke="var(--muted-foreground)"
                strokeDasharray="3 3"
                label={{ position: 'insideTopLeft', value: 'Total Modal', fill: 'var(--muted-foreground)', fontSize: 12 }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#10B981"
                strokeWidth={4}
                fillOpacity={1}
                fill="url(#colorValue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}