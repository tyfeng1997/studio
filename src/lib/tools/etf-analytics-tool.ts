// etf-analytics-tool.ts
import { z } from "zod";
import type { ToolDefinition, ToolExecuteResult } from "@/app/types/tools";

const ETFAnalyticsParams = z.object({
  symbol: z.string().describe("ETF ticker symbol (e.g. QQQ)"),
});

export const etfAnalyticsTool: ToolDefinition<typeof ETFAnalyticsParams> = {
  name: "etfAnalytics",
  description: "Get ETF profile and holdings analysis",
  parameters: ETFAnalyticsParams,
  execute: async ({ symbol }): Promise<ToolExecuteResult> => {
    try {
      const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
      if (!apiKey) throw new Error("Missing Alpha Vantage API key");

      const response = await fetch(
        `https://www.alphavantage.co/query?function=ETF_PROFILE&symbol=${symbol}&apikey=${apiKey}`,
        { headers: { "User-Agent": "nextjs-etf-analytics" } }
      );

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const data = await response.json();
      if (Object.keys(data).length === 0) {
        throw new Error("Invalid symbol or no data available");
      }

      // 数据标准化处理
      return {
        success: true,
        data: {
          profile: {
            netAssets: parseInt(data.net_assets),
            expenseRatio: parseFloat(data.net_expense_ratio) * 100,
            turnover: parseFloat(data.portfolio_turnover) * 100,
            dividendYield: parseFloat(data.dividend_yield) * 100,
            inceptionDate: data.inception_date,
            leveraged: data.leveraged === "YES",
          },
          sectors: data.sectors.map((s: any) => ({
            name: s.sector,
            weight: parseFloat(s.weight) * 100,
          })),
          holdings: data.holdings.map((h: any) => ({
            symbol: h.symbol,
            name: h.description,
            weight: parseFloat(h.weight) * 100,
          })),
        },
      };
    } catch (error) {
      console.error("ETF analytics tool error:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch ETF data",
      };
    }
  },
};
