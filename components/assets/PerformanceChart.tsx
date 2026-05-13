"use client";

import { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, ReferenceLine } from "recharts";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Valuation } from "@/types";
import { formatIDR } from "@/lib/formatters";

interface PerformanceChartProps {
  valuations: Valuation[];
  totalModal: number;
}

export function PerformanceChart({ valuations, totalModal }: PerformanceChartProps) {
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

  const CustomTooltip = ({ active, payload, label }: { active?: boolean, payload?: { payload: { fullDate: string }, value: number }[], label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1A1D2E] border border-[#2A2D3E] p-3 rounded-lg shadow-xl">
          <p className="text-sm text-muted-foreground mb-1">{payload[0].payload.fullDate}</p>
          <p className="text-lg font-bold text-[#F1F5F9] tabular-nums">
            {formatIDR(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="bg-card border-border shadow-lg">
      <CardHeader>
        <CardTitle className="text-base font-medium">Tren Valuasi</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2A2D3E" />
              <XAxis 
                dataKey="formattedDate" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748B', fontSize: 12 }}
                dy={10}
              />
              <YAxis 
                hide 
                domain={[minVal - padding, maxVal + padding]} 
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine 
                y={totalModal} 
                stroke="#64748B" 
                strokeDasharray="3 3" 
                label={{ 
                  position: 'insideTopLeft', 
                  value: 'Total Modal', 
                  fill: '#64748B', 
                  fontSize: 12 
                }} 
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#6366F1" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorValue)" 
                activeDot={{ r: 6, fill: "#6366F1", stroke: "#1A1D2E", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
