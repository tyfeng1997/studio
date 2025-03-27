// analytics-tool.ts
import { z } from "zod";
import type { ToolDefinition, ToolExecuteResult } from "@/app/types/tools";

const IntervalEnum = z.enum([
  "1min",
  "5min",
  "15min",
  "30min",
  "60min",
  "DAILY",
  "WEEKLY",
  "MONTHLY",
]);

const CalculationEnum = z.enum([
  "MIN",
  "MAX",
  "MEAN",
  "MEDIAN",
  "CUMULATIVE_RETURN",
  "VARIANCE",
  "STDDEV",
  "MAX_DRAWDOWN",
  "HISTOGRAM",
  "AUTOCORRELATION",
  "COVARIANCE",
  "CORRELATION",
]);

const AnalyticsParams = z.object({
  symbols: z.array(z.string()).min(1).max(50).describe("List of stock symbols"),
  range: z.array(z.string()).min(1).max(2).describe("Date range parameters"),
  interval: IntervalEnum.describe("Time interval for data points"),
  calculations: z
    .array(CalculationEnum)
    .min(1)
    .describe("List of analytics metrics"),
  ohlc: z.enum(["open", "high", "low", "close"]).optional().default("close"),
});

export const analyticsTool: ToolDefinition<typeof AnalyticsParams> = {
  name: "analytics",
  description: "Advanced time series analytics for financial instruments",
  parameters: AnalyticsParams,
  execute: async ({
    symbols,
    range,
    interval,
    calculations,
    ohlc,
  }): Promise<ToolExecuteResult> => {
    try {
      const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
      if (!apiKey) throw new Error("Missing Alpha Vantage API key");

      // 构建请求URL
      const url = new URL("https://alphavantageapi.co/timeseries/analytics");
      url.searchParams.set("function", "ANALYTICS_FIXED_WINDOW");
      url.searchParams.set("SYMBOLS", symbols.join(","));
      range.forEach((r) => url.searchParams.append("RANGE", r));
      url.searchParams.set("INTERVAL", interval);
      url.searchParams.set("CALCULATIONS", calculations.join(","));
      url.searchParams.set("OHLC", ohlc);
      url.searchParams.set("apikey", apiKey);

      const response = await fetch(url.toString(), {
        headers: { "User-Agent": "nextjs-analytics-tool" },
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const data = await response.json();

      // 数据标准化
      return {
        success: true,
        data: {
          meta: {
            symbols: data.meta_data.symbols.split(","),
            dateRange: [data.meta_data.min_dt, data.meta_data.max_dt],
            ohlc: data.meta_data.ohlc,
            interval: data.meta_data.interval,
          },
          results: data.payload.RETURNS_CALCULATIONS,
        },
      };
    } catch (error) {
      console.error("Analytics tool error:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch analytics",
      };
    }
  },
};
