import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet } from "lucide-react";
import { CurrencyDisplay } from "@/components/shared/CurrencyDisplay";

interface NetWorthCardProps {
  netWorth: number;
  totalModal: number;
}

export function NetWorthCard({ netWorth, totalModal }: NetWorthCardProps) {
  return (
    <Card className="overflow-hidden relative bg-gradient-to-br from-card to-card/50 border-border shadow-lg">
      {/* Background decoration */}
      <div className="absolute -right-12 -top-12 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute -left-12 -bottom-12 w-40 h-40 bg-primary/5 rounded-full blur-3xl" />
      
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 relative z-10">
        <CardTitle className="text-base font-medium text-muted-foreground">
          Total Net Worth
        </CardTitle>
        <div className="p-2 bg-primary/10 rounded-lg">
          <Wallet size={20} className="text-primary" />
        </div>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="text-4xl font-bold tracking-tight text-foreground mb-4">
          <CurrencyDisplay value={netWorth} />
        </div>
        <div className="flex items-center text-sm">
          <span className="text-muted-foreground mr-2">Total Modal:</span>
          <CurrencyDisplay value={totalModal} className="font-medium text-foreground" />
        </div>
      </CardContent>
    </Card>
  );
}
