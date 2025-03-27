// market-movers-tool-render.tsx
"use client";
import { ArrowUp, ArrowDown, Activity } from "lucide-react";
import { ToolCard } from "@/components/tool-card";

const MoversList = ({
  items,
  type,
}: {
  items: any[];
  type: "gainers" | "losers" | "active";
}) => (
  <div className="space-y-2">
    {items.map((item, index) => (
      <div
        key={index}
        className="flex items-center justify-between p-2 border rounded-md"
      >
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{item.ticker}</span>
            <span className="text-sm">${item.price}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            {type === "gainers" && (
              <ArrowUp className="w-4 h-4 text-green-600" />
            )}
            {type === "losers" && (
              <ArrowDown className="w-4 h-4 text-red-600" />
            )}
            {type === "active" && (
              <Activity className="w-4 h-4 text-blue-600" />
            )}
            <span
              className={type === "losers" ? "text-red-600" : "text-green-600"}
            >
              {item.change_amount} ({item.change_percentage})
            </span>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          Vol: {Intl.NumberFormat().format(Number(item.volume))}
        </div>
      </div>
    ))}
  </div>
);

export function MarketMoversRenderer({ data }: { data: any }) {
  return (
    <ToolCard title="US Market Movers">
      <div className="grid gap-6 md:grid-cols-3">
        <div>
          <h3 className="mb-3 font-semibold flex items-center gap-2">
            <ArrowUp className="text-green-600" /> Top Gainers
          </h3>
          <MoversList items={data.topGainers} type="gainers" />
        </div>

        <div>
          <h3 className="mb-3 font-semibold flex items-center gap-2">
            <ArrowDown className="text-red-600" /> Top Losers
          </h3>
          <MoversList items={data.topLosers} type="losers" />
        </div>

        <div>
          <h3 className="mb-3 font-semibold flex items-center gap-2">
            <Activity className="text-blue-600" /> Most Active
          </h3>
          <MoversList items={data.mostActive} type="active" />
        </div>
      </div>

      <div className="mt-4 text-xs text-muted-foreground">
        Last updated: {new Date(data.lastUpdated).toLocaleString()}
      </div>
    </ToolCard>
  );
}
