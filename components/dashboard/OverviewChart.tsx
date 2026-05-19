"use client";

import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrency } from "@/components/providers/CurrencyProvider";
import { formatCurrency } from "@/lib/formatters";

interface ChartAsset {
  name?: string | null;
  platformName?: string | null;
  totalModal?: number;
  currentValue?: number;
}

interface OverviewChartProps {
  assets: ChartAsset[];
}

interface AggregatedData {
  name: string;
  "Total Modal": number;
  "Nilai Terkini": number;
  currentValue: number;
}

interface TooltipPayload {
  color: string;
  name: string;
  value: number;
}

const CustomTooltipContent = ({ active, payload, label, currency }: { active?: boolean, payload?: TooltipPayload[], label?: string, currency: "IDR" | "USD" }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1A1D2E] border border-[#2A2D3E] p-3 rounded-lg shadow-xl min-w-[200px]">
        <p className="text-sm font-medium text-muted-foreground mb-3">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex justify-between items-center text-sm mb-1.5 last:mb-0">
            <div className="flex items-center gap-2">
              <div className="size-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-[#F1F5F9]">{entry.name}</span>
            </div>
            <span className="font-bold text-[#F1F5F9] tabular-nums">
              {formatCurrency(entry.value, currency)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function OverviewChart({ assets }: OverviewChartProps) {
  const { currency } = useCurrency();
  const data = useMemo(() => {
    // 1. Kelompokkan aset berdasarkan nama agar tidak ada duplikasi di grafik
    const aggregated = assets.reduce((acc: Record<string, AggregatedData>, asset: ChartAsset) => {
      const name = asset.name || asset.platformName || "Unknown";
      
      if (!acc[name]) {
        acc[name] = { 
          name, 
          "Total Modal": 0, 
          "Nilai Terkini": 0,
          currentValue: 0 // digunakan untuk sorting nanti
        };
      }
      
      acc[name]["Total Modal"] += asset.totalModal || 0;
      acc[name]["Nilai Terkini"] += asset.currentValue || 0;
      acc[name].currentValue += asset.currentValue || 0;
      
      return acc;
    }, {});

    // 2. Ubah object menjadi array, sort berdasarkan nilai terkini terbesar, ambil top 6
    const sorted = Object.values(aggregated)
      .sort((a: AggregatedData, b: AggregatedData) => b.currentValue - a.currentValue)
      .slice(0, 6);
    
    // 3. Hapus properti currentValue sementara karena tidak dibutuhkan oleh Recharts display
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return sorted.map(({ currentValue, ...rest }: AggregatedData) => rest);
  }, [assets]);

  if (data.length === 0) {
    return null;
  }

  return (
    <Card className="bg-card border-border shadow-sm">
      <CardHeader className="py-4 px-5 border-b border-border/50">
        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Perbandingan Modal vs Nilai Terkini (Top Aset)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5">
        <div className="h-[250px] w-full min-h-[250px]">
          <ResponsiveContainer width="100%" height="100%" minHeight={250}>
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
              barGap={4}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2A2D3E" opacity={0.5} />
              <XAxis 
                dataKey="name" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748B', fontSize: 12 }}
                dy={10}
              />
              <YAxis 
                hide 
              />
              <Tooltip content={<CustomTooltipContent currency={currency} />} cursor={{ fill: '#2A2D3E', opacity: 0.2 }} />
              <Legend 
                verticalAlign="top" 
                height={36}
                iconType="circle"
                wrapperStyle={{ fontSize: '12px', color: '#64748B' }}
              />
              <Bar 
                dataKey="Total Modal" 
                fill="#64748B" 
                radius={[4, 4, 0, 0]} 
                maxBarSize={40}
              />
              <Bar 
                dataKey="Nilai Terkini" 
                fill="#10B981" 
                radius={[4, 4, 0, 0]} 
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
