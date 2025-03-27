// etf-analytics-tool-render.tsx
"use client";
import { ToolCard } from "@/components/tool-card";
import { BarChart, PieChart, Wallet, Landmark, Coins } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const SectionHeader = ({
  icon: Icon,
  title,
}: {
  icon: React.ElementType;
  title: string;
}) => (
  <div className="flex items-center gap-2 mb-4">
    <Icon className="w-5 h-5" />
    <h3 className="font-semibold text-lg">{title}</h3>
  </div>
);

const SectorProgress = ({ sector }: { sector: any }) => (
  <div className="space-y-1">
    <div className="flex justify-between text-sm">
      <span>{sector.name}</span>
      <span>{sector.weight.toFixed(1)}%</span>
    </div>
    <Progress value={sector.weight} className="h-2" />
  </div>
);

const HoldingItem = ({ holding }: { holding: any }) => (
  <div className="flex justify-between items-center p-2 border rounded-md hover:bg-muted/50">
    <div className="flex-1">
      <div className="font-medium">{holding.symbol}</div>
      <div className="text-xs text-muted-foreground truncate">
        {holding.name}
      </div>
    </div>
    <div className="text-sm font-medium ml-4 w-20 text-right">
      {holding.weight.toFixed(2)}%
    </div>
  </div>
);

export function ETFAnalyticsRenderer({ data }: { data: any }) {
  return (
    <ToolCard title={`${data.symbol} ETF Analysis`}>
      <div className="space-y-8">
        {/* 基本信息 */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <SectionHeader icon={Wallet} title="Assets" />
            <div className="text-2xl font-bold">
              ${(data.profile.netAssets / 1e9).toFixed(1)}B
            </div>
            <span className="text-sm text-muted-foreground">Net Assets</span>
          </div>

          <div>
            <SectionHeader icon={Coins} title="Cost" />
            <div className="text-2xl font-bold">
              {data.profile.expenseRatio.toFixed(2)}%
            </div>
            <span className="text-sm text-muted-foreground">Expense Ratio</span>
          </div>

          <div>
            <SectionHeader icon={Landmark} title="Activity" />
            <div className="text-2xl font-bold">
              {data.profile.turnover.toFixed(1)}%
            </div>
            <span className="text-sm text-muted-foreground">Turnover</span>
          </div>
        </div>

        {/* 行业分布 */}
        <div>
          <SectionHeader icon={PieChart} title="Sector Allocation" />
          <div className="space-y-4">
            {data.sectors.map((sector: any) => (
              <SectorProgress key={sector.name} sector={sector} />
            ))}
          </div>
        </div>

        {/* 持仓明细 */}
        <div>
          <SectionHeader icon={BarChart} title="Top Holdings" />
          <div className="space-y-2">
            {data.holdings.slice(0, 10).map((holding: any) => (
              <HoldingItem key={holding.symbol} holding={holding} />
            ))}
          </div>
        </div>
      </div>
    </ToolCard>
  );
}
