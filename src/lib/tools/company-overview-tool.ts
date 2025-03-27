// company-overview-tool.ts
import { z } from "zod";
import type { ToolDefinition, ToolExecuteResult } from "@/app/types/tools";

const CompanyOverviewParams = z.object({
  symbol: z.string().describe("Stock ticker symbol (e.g. IBM)"),
});

export const companyOverviewTool: ToolDefinition<typeof CompanyOverviewParams> =
  {
    name: "companyOverview",
    description: "Get comprehensive company information and financial metrics",
    parameters: CompanyOverviewParams,
    execute: async ({ symbol }): Promise<ToolExecuteResult> => {
      try {
        const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
        if (!apiKey) throw new Error("Missing Alpha Vantage API key");

        const response = await fetch(
          `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${apiKey}`,
          { headers: { "User-Agent": "nextjs-company-overview" } }
        );

        if (!response.ok) {
          throw new Error(`API request failed: ${response.statusText}`);
        }

        const data = await response.json();
        if (Object.keys(data).length === 0) {
          throw new Error("Invalid symbol or no data available");
        }

        // 数据标准化和格式化
        return {
          success: true,
          data: {
            info: {
              name: data.Name,
              symbol: data.Symbol,
              description: data.Description,
              sector: data.Sector,
              industry: data.Industry,
              address: data.Address,
              website: data.OfficialSite,
              employees: data.FullTimeEmployees,
            },
            financials: {
              marketCap: parseInt(data.MarketCapitalization),
              peRatio: parseFloat(data.PERatio),
              eps: parseFloat(data.EPS),
              dividendYield: parseFloat(data.DividendYield) * 100,
              beta: parseFloat(data.Beta),
              profitMargin: parseFloat(data.ProfitMargin) * 100,
            },
            valuation: {
              analystTarget: parseFloat(data.AnalystTargetPrice),
              high52: parseFloat(data["52WeekHigh"]),
              low52: parseFloat(data["52WeekLow"]),
              moving50: parseFloat(data["50DayMovingAverage"]),
              moving200: parseFloat(data["200DayMovingAverage"]),
            },
            analystRatings: {
              strongBuy: parseInt(data.AnalystRatingStrongBuy),
              buy: parseInt(data.AnalystRatingBuy),
              hold: parseInt(data.AnalystRatingHold),
              sell: parseInt(data.AnalystRatingSell),
              strongSell: parseInt(data.AnalystRatingStrongSell),
            },
          },
        };
      } catch (error) {
        console.error("Company overview tool error:", error);
        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to fetch company data",
        };
      }
    },
  };
