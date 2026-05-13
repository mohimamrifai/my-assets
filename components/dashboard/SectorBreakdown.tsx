"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart2, Bitcoin, Gem } from "lucide-react";
import { formatIDR, formatPercent } from "@/lib/formatters";

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
        <div className="h-[200px] w-full relative">
          <ResponsiveContainer width="100%" height="100%">
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
                formatter={(value: any) => formatIDR(Number(value))}
                contentStyle={{ backgroundColor: '#1A1D2E', borderColor: '#2A2D3E', color: '#F1F5F9', borderRadius: '8px' }}
                itemStyle={{ color: '#F1F5F9' }}
              />
            </PieChart>
          </ResponsiveContainer>
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
                  <span className="font-medium tabular-nums">{formatIDR(item.value)}</span>
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
