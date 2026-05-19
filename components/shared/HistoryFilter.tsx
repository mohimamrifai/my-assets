import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type TimeFilter = "ALL" | "WEEK" | "MONTH" | "YEAR";

interface HistoryFilterProps {
  value: TimeFilter;
  onChange: (value: TimeFilter) => void;
}

export function HistoryFilter({ value, onChange }: HistoryFilterProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Filter Waktu:</span>
      <Select value={value} onValueChange={(val) => onChange(val as TimeFilter)}>
        <SelectTrigger className="w-[130px] h-8 text-xs bg-muted/20">
          <SelectValue placeholder="Semua Waktu" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Semua Waktu</SelectItem>
          <SelectItem value="WEEK">1 Minggu Terakhir</SelectItem>
          <SelectItem value="MONTH">1 Bulan Terakhir</SelectItem>
          <SelectItem value="YEAR">1 Tahun Terakhir</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export function filterByTime<T>(
  data: T[], 
  timeFilter: TimeFilter, 
  dateSelector: (item: T) => string | Date
): T[] {
  if (timeFilter === "ALL") return data;
  
  const now = new Date();
  const filterDate = new Date();
  
  if (timeFilter === "WEEK") {
    filterDate.setDate(now.getDate() - 7);
  } else if (timeFilter === "MONTH") {
    filterDate.setMonth(now.getMonth() - 1);
  } else if (timeFilter === "YEAR") {
    filterDate.setFullYear(now.getFullYear() - 1);
  }
  
  return data.filter(item => {
    const itemDate = new Date(dateSelector(item));
    return itemDate >= filterDate && itemDate <= now;
  });
}
