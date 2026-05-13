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
      <Card className="bg-card border-border shadow-lg">
        <CardHeader>
          <CardTitle className="text-base font-medium">Riwayat Transaksi</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8 text-muted-foreground text-sm">
          Belum ada transaksi tercatat.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border shadow-lg overflow-hidden">
      <CardHeader className="pb-0 border-b border-border bg-card/50">
        <CardTitle className="text-base font-medium mb-4">Riwayat Transaksi</CardTitle>
      </CardHeader>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="font-medium">Tanggal</TableHead>
              <TableHead className="font-medium">Tipe</TableHead>
              <TableHead className="font-medium text-right">Nominal</TableHead>
              <TableHead className="font-medium">Sumber Dana</TableHead>
              <TableHead className="font-medium">Catatan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((trx) => {
              let badgeColor = "bg-gray-500/10 text-gray-500 border-gray-500/20";
              
              if (trx.type === "BUY") badgeColor = "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
              else if (trx.type === "SELL") badgeColor = "bg-red-500/10 text-red-500 border-red-500/20";
              else if (trx.type === "DEPOSIT") badgeColor = "bg-blue-500/10 text-blue-500 border-blue-500/20";
              else if (trx.type === "WITHDRAWAL") badgeColor = "bg-orange-500/10 text-orange-500 border-orange-500/20";

              return (
                <TableRow key={trx.id} className="border-border hover:bg-muted/20">
                  <TableCell className="text-sm">
                    {format(new Date(trx.date), "dd MMM yyyy", { locale: localeId })}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] ${badgeColor}`}>
                      {trx.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    <CurrencyDisplay value={trx.amount} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {trx.fundSource || "-"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
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
