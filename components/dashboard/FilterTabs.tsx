"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type FilterMode = "SEMUA" | "INVESTING" | "TRADING";

interface FilterTabsProps {
  value: FilterMode;
  onChange: (value: FilterMode) => void;
}

export function FilterTabs({ value, onChange }: FilterTabsProps) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as FilterMode)} className="w-full sm:w-auto">
      <TabsList className="grid w-full grid-cols-3 sm:w-[400px]">
        <TabsTrigger value="SEMUA">Semua</TabsTrigger>
        <TabsTrigger value="INVESTING">Investing</TabsTrigger>
        <TabsTrigger value="TRADING">Trading</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
