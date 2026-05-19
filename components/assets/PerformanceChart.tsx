"use client";

import { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, ReferenceLine } from "recharts";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Valuation } from "@/types";
import { useCurrency } from "@/components/providers/CurrencyProvider";
import { formatCurrency } from "@/lib/formatters";

interface PerformanceChartProps {
  valuations: Valuation[];
  totalModal: number;
}

const CustomTooltipContent = ({ active, payload, currency }: { active?: boolean, payload?: { payload: { fullDate: string }, value: number }[], label?: string, currency: "IDR" | "USD" }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border/50 p-4 rounded-md shadow-xl">
        <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-1">{payload[0].payload.fullDate}</p>
        <p className="text-xl font-bold text-foreground tabular-nums">
          {formatCurrency(payload[0].value, currency)}
        </p>
      </div>
    );
  }
  return null;
};

export function PerformanceChart({ valuations, totalModal }: PerformanceChartProps) {
  const { currency } = useCurrency();
  const data = useMemo(() => {
    return valuations.map(v => ({
      date: v.recordedAt,
      formattedDate: format(new Date(v.recordedAt), "dd MMM yy", { locale: localeId }),
      fullDate: format(new Date(v.recordedAt), "dd MMMM yyyy", { locale: localeId }),
      value: v.value,
    }));
  }, [valuations]);

  if (data.length <= 1) {
    return (
      <Card className="bg-card border-border shadow-lg">
        <CardHeader>
          <CardTitle className="text-base font-medium">Tren Valuasi</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px] text-muted-foreground bg-muted/10 rounded-md mx-6 mb-6">
          <div className="text-center">
            <p className="mb-2">Data valuasi belum cukup.</p>
            <p className="text-sm">Tambah lebih banyak valuasi untuk melihat tren pergerakan nilai aset Anda.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate min and max for Y-axis to give some padding
  const values = data.map(d => d.value);
  const minVal = Math.min(...values, totalModal);
  const maxVal = Math.max(...values, totalModal);
  const padding = (maxVal - minVal) * 0.1;

  return (
    <div className="bg-card border border-border/50 shadow-sm rounded-lg overflow-hidden pt-4 pb-2">
      <div className="h-[300px] w-full min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%" minHeight={300}>
          <AreaChart
            data={data}
            margin={{ top: 10, right: 0, left: 0, bottom: 20 }}
          >
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" strokeOpacity={0.5} />
            <XAxis 
              dataKey="formattedDate" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
              dy={15}
              minTickGap={30}
            />
            <YAxis 
              hide 
              domain={[minVal - padding, maxVal + padding]} 
            />
            <Tooltip content={<CustomTooltipContent currency={currency} />} />
            <ReferenceLine 
              y={totalModal} 
              stroke="var(--muted-foreground)" 
              strokeDasharray="3 3" 
              label={{ 
                position: 'insideTopLeft', 
                value: 'Total Modal', 
                fill: 'var(--muted-foreground)', 
                fontSize: 12 
              }} 
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="#10B981" 
              strokeWidth={4}
              fillOpacity={1} 
              fill="url(#colorValue)" 
              activeDot={{ r: 6, fill: "#10B981", stroke: "var(--background)", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
