"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart2, Bitcoin, Gem } from "lucide-react";
import { useCurrency } from "@/components/providers/CurrencyProvider";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import { useMounted } from "@/hooks/useMounted";

interface SectorBreakdownProps {
  saham: { value: number; percent: number };
  crypto: { value: number; percent: number };
  emas: { value: number; percent: number };
}

const COLORS = {
  SAHAM: "#3B82F6", // Blue
  CRYPTO: "#8B5CF6", // Indigo/Purple
  EMAS: "#F59E0B", // Amber/Yellow
};

export function SectorBreakdown({ saham, crypto, emas }: SectorBreakdownProps) {
  const { currency } = useCurrency();
  const mounted = useMounted();

  const data = [
    { name: "Saham", value: saham.value, percent: saham.percent, color: COLORS.SAHAM, icon: BarChart2 },
    { name: "Crypto", value: crypto.value, percent: crypto.percent, color: COLORS.CRYPTO, icon: Bitcoin },
    { name: "Emas", value: emas.value, percent: emas.percent, color: COLORS.EMAS, icon: Gem },
  ].filter(item => item.value > 0);

  if (data.length === 0) {
    return (
      <Card className="bg-card border-border shadow-lg h-full">
        <CardHeader>
          <CardTitle className="text-base font-medium">Alokasi Sektor</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[250px] text-muted-foreground">
          Belum ada data sektor
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border shadow-lg h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Alokasi Sektor</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-center">

        <div className="h-[300px] w-full min-h-[300px] relative">
          {/* Render setelah mount agar parent sudah punya dimensi, menghindari warning width/height -1 dari recharts */}
          {mounted && (
            <ResponsiveContainer width="100%" height="100%" minHeight={300} minWidth={1}>
              <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <RechartsTooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-[#1A1D2E] border border-[#2A2D3E] p-3 rounded-lg shadow-xl">
                        <p className="text-sm font-medium text-muted-foreground mb-1">{data.name}</p>
                        <p className="text-xl font-bold text-[#F1F5F9] tabular-nums">
                          {formatCurrency(data.value, currency)}
                        </p>
                        <p className="text-sm font-medium text-muted-foreground mt-1">{formatPercent(data.percent)}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          )}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-sm text-muted-foreground font-medium">Sektor</span>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {data.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md" style={{ backgroundColor: `${item.color}20`, color: item.color }}>
                    <Icon size={16} />
                  </div>
                  <span className="font-medium text-foreground">{item.name}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="font-medium tabular-nums">{formatCurrency(item.value, currency)}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">{formatPercent(item.percent)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
