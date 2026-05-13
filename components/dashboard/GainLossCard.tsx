import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GainLossBadge } from "@/components/shared/GainLossBadge";

interface GainLossCardProps {
  nominal: number;
  percent: number;
}

export function GainLossCard({ nominal, percent }: GainLossCardProps) {
  return (
    <Card className="bg-card border-border shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-base font-medium text-muted-foreground">
          Total Gain / Loss
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        <GainLossBadge 
          nominal={nominal} 
          percent={percent} 
          variant="text" 
          className="text-3xl font-bold tracking-tight mb-2"
          showPercent={false}
        />
        <div className="mt-2">
          <GainLossBadge 
            nominal={nominal} 
            percent={percent} 
            showNominal={false}
            className="text-sm px-2.5 py-1"
          />
        </div>
      </CardContent>
    </Card>
  );
}
