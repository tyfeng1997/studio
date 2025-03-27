import { z } from "zod";
import type { ToolDefinition, ToolExecuteResult } from "@/app/types/tools";
import axios from "axios";

const BalanceSheetParams = z.object({
  symbol: z.string().describe("Stock ticker symbol (e.g., IBM, AAPL)"),
  period: z
    .enum(["annual", "quarterly"])
    .optional()
    .describe("Data period: 'annual' or 'quarterly' (default is annual)"),
  limit: z
    .number()
    .optional()
    .describe("Number of periods to return (default is 3)"),
});

export const balanceSheetTool: ToolDefinition<typeof BalanceSheetParams> = {
  name: "balanceSheet",

  description:
    "Fetch annual or quarterly balance sheet data for a given stock symbol, including assets, liabilities, and shareholder equity.",
  parameters: BalanceSheetParams,
  execute: async ({
    symbol,
    period = "annual",
    limit = 3,
  }): Promise<ToolExecuteResult> => {
    try {
      // Input validation
      if (!symbol.trim()) {
        throw new Error("Stock symbol cannot be empty");
      }

      // Alpha Vantage API URL
      const apiKey = process.env.ALPHA_VANTAGE_API_KEY || "demo";
      const url = `https://www.alphavantage.co/query?function=BALANCE_SHEET&symbol=${symbol}&apikey=${apiKey}`;

      const response = await axios.get(url);
      const data = response.data;

      if (!data) {
        return {
          success: false,
          error: "Invalid or empty response from the API",
        };
      }

      // Determine which data to use based on period
      const reportKey =
        period === "quarterly" ? "quarterlyReports" : "annualReports";

      if (
        !data[reportKey] ||
        !Array.isArray(data[reportKey]) ||
        data[reportKey].length === 0
      ) {
        return {
          success: false,
          error: `No ${period} balance sheet data available for ${symbol}`,
        };
      }

      // Limit the number of periods returned
      const limitedReports = data[reportKey].slice(0, limit);

      // Calculate financial ratios for each report
      const reportsWithRatios = limitedReports.map((report) => {
        const enrichedReport = { ...report };

        // Convert string values to numbers for calculations
        const totalAssets =
          report.totalAssets === "None" ? 0 : Number(report.totalAssets);
        const totalLiabilities =
          report.totalLiabilities === "None"
            ? 0
            : Number(report.totalLiabilities);
        const totalShareholderEquity =
          report.totalShareholderEquity === "None"
            ? 0
            : Number(report.totalShareholderEquity);
        const totalCurrentAssets =
          report.totalCurrentAssets === "None"
            ? 0
            : Number(report.totalCurrentAssets);
        const totalCurrentLiabilities =
          report.totalCurrentLiabilities === "None"
            ? 0
            : Number(report.totalCurrentLiabilities);
        const cash =
          report.cashAndCashEquivalentsAtCarryingValue === "None"
            ? 0
            : Number(report.cashAndCashEquivalentsAtCarryingValue);

        // Calculate key financial ratios

        // Current Ratio = Current Assets / Current Liabilities
        if (totalCurrentAssets && totalCurrentLiabilities) {
          enrichedReport.currentRatio = (
            totalCurrentAssets / totalCurrentLiabilities
          ).toFixed(2);
        }

        // Debt to Equity Ratio = Total Liabilities / Shareholder Equity
        if (totalLiabilities && totalShareholderEquity) {
          enrichedReport.debtToEquityRatio = (
            totalLiabilities / totalShareholderEquity
          ).toFixed(2);
        }

        // Debt to Assets Ratio = Total Liabilities / Total Assets
        if (totalLiabilities && totalAssets) {
          enrichedReport.debtToAssetsRatio = (
            totalLiabilities / totalAssets
          ).toFixed(2);
        }

        // Cash Ratio = Cash / Current Liabilities
        if (cash && totalCurrentLiabilities) {
          enrichedReport.cashRatio = (cash / totalCurrentLiabilities).toFixed(
            2
          );
        }

        // Equity Ratio = Total Shareholder Equity / Total Assets
        if (totalShareholderEquity && totalAssets) {
          enrichedReport.equityRatio = (
            totalShareholderEquity / totalAssets
          ).toFixed(2);
        }

        return enrichedReport;
      });

      // Prepare key metrics for visualization
      const keyMetrics = reportsWithRatios.map((report) => {
        // Convert string values to numbers or 0 if "None"
        const totalAssets =
          report.totalAssets === "None"
            ? 0
            : Number(report.totalAssets) / 1000000; // in millions
        const totalLiabilities =
          report.totalLiabilities === "None"
            ? 0
            : Number(report.totalLiabilities) / 1000000;
        const totalEquity =
          report.totalShareholderEquity === "None"
            ? 0
            : Number(report.totalShareholderEquity) / 1000000;
        const currentAssets =
          report.totalCurrentAssets === "None"
            ? 0
            : Number(report.totalCurrentAssets) / 1000000;
        const nonCurrentAssets =
          report.totalNonCurrentAssets === "None"
            ? 0
            : Number(report.totalNonCurrentAssets) / 1000000;
        const currentLiabilities =
          report.totalCurrentLiabilities === "None"
            ? 0
            : Number(report.totalCurrentLiabilities) / 1000000;
        const nonCurrentLiabilities =
          report.totalNonCurrentLiabilities === "None"
            ? 0
            : Number(report.totalNonCurrentLiabilities) / 1000000;
        const cash =
          report.cashAndCashEquivalentsAtCarryingValue === "None"
            ? 0
            : Number(report.cashAndCashEquivalentsAtCarryingValue) / 1000000;

        return {
          period: report.fiscalDateEnding,
          totalAssets,
          totalLiabilities,
          totalEquity,
          currentAssets,
          nonCurrentAssets,
          currentLiabilities,
          nonCurrentLiabilities,
          cash,
          currentRatio: report.currentRatio,
          debtToEquityRatio: report.debtToEquityRatio,
          debtToAssetsRatio: report.debtToAssetsRatio,
          cashRatio: report.cashRatio,
          equityRatio: report.equityRatio,
        };
      });

      // Prepare response
      const enrichedData = {
        symbol: data.symbol,
        period: period,
        reports: reportsWithRatios,
        keyMetrics: keyMetrics,
      };

      return {
        success: true,
        data: enrichedData,
      };
    } catch (error) {
      console.error(`Balance Sheet tool error:`, error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch balance sheet data",
      };
    }
  },
};
