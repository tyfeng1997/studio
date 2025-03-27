// analytics-tool-render.tsx
"use client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ToolCard } from "@/components/tool-card";
import { Badge } from "@/components/ui/badge";

const CalculationSection = ({
  title,
  data,
  isMatrix,
}: {
  title: string;
  data: any;
  isMatrix?: boolean;
}) => (
  <div className="space-y-4">
    <h3 className="font-semibold text-lg border-b pb-2">{title}</h3>

    {isMatrix ? (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead></TableHead>
              {data.index.map((symbol: string) => (
                <TableHead key={symbol} className="text-right">
                  {symbol}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.index.map((symbol: string, i: number) => (
              <TableRow key={symbol}>
                <TableCell className="font-medium">{symbol}</TableCell>
                {data.correlation[i].map((value: number, j: number) => (
                  <TableCell key={j} className="text-right">
                    {value.toFixed(4)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    ) : (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {Object.entries(data).map(([symbol, value]) => (
          <div key={symbol} className="border rounded-md p-3">
            <div className="flex justify-between items-center">
              <span className="font-medium">{symbol}</span>
              <Badge variant="outline">
                {typeof value === "number"
                  ? (value * 100).toFixed(2) + "%"
                  : value}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

export function AnalyticsRenderer({ data }: { data: any }) {
  return (
    <ToolCard title="Advanced Analytics">
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Symbols:</span>
            <span className="ml-2 font-medium">
              {data.meta.symbols.join(", ")}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Date Range:</span>
            <span className="ml-2 font-medium">
              {data.meta.dateRange.join(" - ")}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Interval:</span>
            <span className="ml-2 font-medium">{data.meta.interval}</span>
          </div>
          <div>
            <span className="text-muted-foreground">OHLC:</span>
            <span className="ml-2 font-medium">{data.meta.ohlc}</span>
          </div>
        </div>

        {Object.entries(data.results).map(([calc, calcData]) => (
          <CalculationSection
            key={calc}
            title={calc.replace(/_/g, " ")}
            data={calcData}
            isMatrix={["CORRELATION", "COVARIANCE"].includes(calc)}
          />
        ))}
      </div>
    </ToolCard>
  );
}
