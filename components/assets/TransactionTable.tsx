"use client";

import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CurrencyDisplay } from "@/components/shared/CurrencyDisplay";
import { Transaction } from "@/types";

interface TransactionTableProps {
  transactions: Transaction[];
}

export function TransactionTable({ transactions }: TransactionTableProps) {
  if (transactions.length === 0) {
    return (
      <Card className="bg-card border-border shadow-sm rounded-lg overflow-hidden flex flex-col">
        <CardHeader className="py-4 px-5 border-b border-border/50">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Riwayat Transaksi</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12 text-muted-foreground text-sm">
          Belum ada transaksi tercatat.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border shadow-sm rounded-lg overflow-hidden flex flex-col">
      <CardHeader className="py-4 px-5 border-b border-border/50">
        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Riwayat Transaksi</CardTitle>
      </CardHeader>
      <div className="overflow-x-auto flex-1 max-h-[400px]">
        <Table>
          <TableHeader className="bg-muted/20 sticky top-0 z-10 backdrop-blur-md">
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="font-medium text-xs uppercase tracking-wider h-10 px-5">Tanggal</TableHead>
              <TableHead className="font-medium text-xs uppercase tracking-wider h-10">Tipe</TableHead>
              <TableHead className="font-medium text-xs uppercase tracking-wider h-10 text-right">Nominal</TableHead>
              <TableHead className="font-medium text-xs uppercase tracking-wider h-10">Sumber Dana</TableHead>
              <TableHead className="font-medium text-xs uppercase tracking-wider h-10 px-5">Catatan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((trx) => {
              let badgeColor = "bg-gray-500/10 text-gray-500 border-gray-500/20";
              
              if (trx.type === "BUY") badgeColor = "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
              else if (trx.type === "SELL") badgeColor = "bg-red-500/10 text-red-600 border-red-500/20";
              else if (trx.type === "DEPOSIT") badgeColor = "bg-blue-500/10 text-blue-600 border-blue-500/20";
              else if (trx.type === "WITHDRAWAL") badgeColor = "bg-orange-500/10 text-orange-600 border-orange-500/20";

              return (
                <TableRow key={trx.id} className="border-border/50 hover:bg-muted/30 transition-colors">
                  <TableCell className="px-5 py-3 text-sm text-foreground font-medium">
                    {format(new Date(trx.date), "dd MMM yyyy", { locale: localeId })}
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge variant="outline" className={`text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-md ${badgeColor}`}>
                      {trx.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right py-3 font-medium text-sm text-foreground">
                    <CurrencyDisplay value={trx.amount} />
                  </TableCell>
                  <TableCell className="text-sm py-3 text-muted-foreground">
                    {trx.fundSource || "-"}
                  </TableCell>
                  <TableCell className="px-5 py-3 text-sm text-muted-foreground truncate max-w-[150px]" title={trx.notes || ""}>
                    {trx.notes || "-"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
