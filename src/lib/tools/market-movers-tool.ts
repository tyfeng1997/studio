// market-movers-tool.ts
import { z } from "zod";
import type { ToolDefinition, ToolExecuteResult } from "@/app/types/tools";

const MarketMoversParams = z
  .object({
    // 这个API不需要额外参数，但保留空对象以保持结构一致
  })
  .describe("No parameters required for market movers");

export const marketMoversTool: ToolDefinition<typeof MarketMoversParams> = {
  name: "marketMovers",
  description: "Get top gainers, losers and most actively traded US stocks",
  parameters: MarketMoversParams,
  execute: async (): Promise<ToolExecuteResult> => {
    try {
      const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
      if (!apiKey) {
        throw new Error("Missing Alpha Vantage API key");
      }

      const response = await fetch(
        `https://www.alphavantage.co/query?function=TOP_GAINERS_LOSERS&apikey=${apiKey}`
      );

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();

      // 数据标准化处理
      return {
        success: true,
        data: {
          metadata: data.metadata,
          lastUpdated: data.last_updated,
          topGainers: data.top_gainers,
          topLosers: data.top_losers,
          mostActive: data.most_actively_traded,
        },
      };
    } catch (error) {
      console.error("Market movers tool error:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch market data",
      };
    }
  },
};
