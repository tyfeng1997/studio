import { z } from "zod";
import type { ToolDefinition, ToolExecuteResult } from "@/app/types/tools";
import axios from "axios";

const DividendParams = z.object({
  symbol: z.string().describe("Stock ticker symbol (e.g., IBM, AAPL)"),
  years: z
    .number()
    .optional()
    .describe("Number of years of dividend history to return (default is 3)"),
});

export const dividendTool: ToolDefinition<typeof DividendParams> = {
  name: "dividends",
  description:
    "Fetch historical and future (declared) dividend distributions for a given stock symbol.",
  parameters: DividendParams,
  execute: async ({ symbol, years = 3 }): Promise<ToolExecuteResult> => {
    try {
      // Input validation
      if (!symbol.trim()) {
        throw new Error("Stock symbol cannot be empty");
      }

      // Alpha Vantage API URL
      const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
      const url = `https://www.alphavantage.co/query?function=DIVIDENDS&symbol=${symbol}&apikey=${apiKey}`;

      const response = await axios.get(url);
      const data = response.data;

      if (!data || !data.data || !Array.isArray(data.data)) {
        return {
          success: false,
          error: "Invalid or empty response from the API",
        };
      }

      // Filter for the most recent years based on the years parameter
      const today = new Date();
      const threeYearsAgo = new Date();
      threeYearsAgo.setFullYear(today.getFullYear() - years);

      const filteredData = data.data.filter((item) => {
        const exDividendDate = new Date(item.ex_dividend_date);
        return exDividendDate >= threeYearsAgo;
      });

      // Calculate some additional statistics
      const totalDividends = filteredData.reduce(
        (total, item) => total + parseFloat(item.amount),
        0
      );
      const averageDividend = totalDividends / filteredData.length;

      // Get yearly totals
      const yearlyTotals = filteredData.reduce((acc, item) => {
        const year = item.ex_dividend_date.split("-")[0];
        acc[year] = (acc[year] || 0) + parseFloat(item.amount);
        return acc;
      }, {});

      // Convert to array for easier display
      const yearlyTotalsArray = Object.entries(yearlyTotals).map(
        ([year, total]) => ({
          year,
          total: parseFloat(total.toFixed(2)),
        })
      );

      // Prepare enriched response
      const enrichedData = {
        symbol: data.symbol,
        dividends: filteredData,
        stats: {
          totalPayouts: filteredData.length,
          totalAmount: parseFloat(totalDividends.toFixed(2)),
          averageAmount: parseFloat(averageDividend.toFixed(2)),
          yearlyTotals: yearlyTotalsArray,
        },
      };

      return {
        success: true,
        data: enrichedData,
      };
    } catch (error) {
      console.error(`Dividend tool error:`, error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch dividend data",
      };
    }
  },
};
