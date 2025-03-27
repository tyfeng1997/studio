// company-overview-tool-render.tsx
"use client";
import { Badge } from "@/components/ui/badge";
import { ToolCard } from "@/components/tool-card";
import { Globe, Building2, Banknote, LineChart, Star } from "lucide-react";

const formatNumber = (num: number) => {
  if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
  return num.toLocaleString();
};

const RatingBar = ({ title, value }: { title: string; value: number }) => (
  <div className="flex items-center gap-4">
    <span className="w-24 text-muted-foreground">{title}</span>
    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
      <div
        className="h-full bg-primary"
        style={{ width: `${(value / 20) * 100}%` }}
      />
    </div>
    <span className="w-8 text-right">{value}</span>
  </div>
);

export function CompanyOverviewRenderer({ data }: { data: any }) {
  return (
    <ToolCard title={`${data.info.name} (${data.info.symbol})`}>
      <div className="space-y-6">
        {/* 基本信息 */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              <h3 className="font-semibold">Company Profile</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              {data.info.description}
            </p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Sector:</span>
                <Badge variant="outline" className="ml-2">
                  {data.info.sector}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Industry:</span>
                <Badge variant="outline" className="ml-2">
                  {data.info.industry}
                </Badge>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">Address:</span>
                <span className="ml-2">{data.info.address}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Banknote className="w-5 h-5" />
              <h3 className="font-semibold">Key Financials</h3>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Market Cap:</span>
                <span className="ml-2 font-medium">
                  {formatNumber(data.financials.marketCap)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">P/E Ratio:</span>
                <Badge variant="outline" className="ml-2">
                  {data.financials.peRatio.toFixed(2)}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground">EPS:</span>
                <Badge variant="outline" className="ml-2">
                  ${data.financials.eps.toFixed(2)}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Dividend Yield:</span>
                <Badge variant="outline" className="ml-2">
                  {data.financials.dividendYield.toFixed(2)}%
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* 分析师评级 */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5" />
            <h3 className="font-semibold">Analyst Ratings</h3>
          </div>
          <div className="space-y-3">
            <RatingBar
              title="Strong Buy"
              value={data.analystRatings.strongBuy}
            />
            <RatingBar title="Buy" value={data.analystRatings.buy} />
            <RatingBar title="Hold" value={data.analystRatings.hold} />
            <RatingBar title="Sell" value={data.analystRatings.sell} />
            <RatingBar
              title="Strong Sell"
              value={data.analystRatings.strongSell}
            />
          </div>
        </div>

        {/* 估值指标 */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <LineChart className="w-5 h-5" />
              <h3 className="font-semibold">Valuation Metrics</h3>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">52W High:</span>
                <span className="ml-2 font-medium">
                  ${data.valuation.high52.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">52W Low:</span>
                <span className="ml-2 font-medium">
                  ${data.valuation.low52.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">50D MA:</span>
                <span className="ml-2 font-medium">
                  ${data.valuation.moving50.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">200D MA:</span>
                <span className="ml-2 font-medium">
                  ${data.valuation.moving200.toFixed(2)}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">Target Price:</span>
                <span className="ml-2 font-medium">
                  ${data.valuation.analystTarget.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ToolCard>
  );
}
