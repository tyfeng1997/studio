import { z } from "zod";
import type { ToolDefinition, ToolExecuteResult } from "@/app/types/tools";
import axios from "axios";

const CashFlowParams = z.object({
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

export const cashFlowTool: ToolDefinition<typeof CashFlowParams> = {
  name: "cashFlow",

  description:
    "Fetch annual or quarterly cash flow statement data for a given stock symbol, including operating, investing, and financing activities.",
  parameters: CashFlowParams,
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
      const url = `https://www.alphavantage.co/query?function=CASH_FLOW&symbol=${symbol}&apikey=${apiKey}`;

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
          error: `No ${period} cash flow data available for ${symbol}`,
        };
      }

      // Limit the number of periods returned
      const limitedReports = data[reportKey].slice(0, limit);

      // Calculate additional metrics and ratios for each report
      const reportsWithMetrics = limitedReports.map((report) => {
        const enrichedReport = { ...report };

        // Convert string values to numbers for calculations
        const operatingCashflow =
          report.operatingCashflow === "None"
            ? 0
            : Number(report.operatingCashflow);
        const capitalExpenditures =
          report.capitalExpenditures === "None"
            ? 0
            : Number(report.capitalExpenditures);
        const netIncome =
          report.netIncome === "None" ? 0 : Number(report.netIncome);
        const dividendPayout =
          report.dividendPayout === "None" ? 0 : Number(report.dividendPayout);

        // Calculate Free Cash Flow (FCF) = Operating Cash Flow - Capital Expenditures
        enrichedReport.freeCashFlow = operatingCashflow - capitalExpenditures;

        // Calculate Operating Cash Flow to Net Income ratio (Cash Flow Quality)
        if (netIncome !== 0) {
          enrichedReport.operatingCashFlowToNetIncome = (
            operatingCashflow / netIncome
          ).toFixed(2);
        }

        // Calculate Free Cash Flow to Net Income ratio
        if (netIncome !== 0) {
          enrichedReport.freeCashFlowToNetIncome = (
            (operatingCashflow - capitalExpenditures) /
            netIncome
          ).toFixed(2);
        }

        // Calculate Free Cash Flow Yield (if we had market cap, which we don't in this API)
        // This would be: FCF / Market Cap

        // Calculate Dividend Coverage Ratio = Free Cash Flow / Dividend Payout
        if (dividendPayout !== 0) {
          enrichedReport.dividendCoverageRatio = (
            (operatingCashflow - capitalExpenditures) /
            dividendPayout
          ).toFixed(2);
        }

        // Calculate CapEx to Operating Cash Flow ratio
        if (operatingCashflow !== 0) {
          enrichedReport.capExToOperatingCashFlow = (
            capitalExpenditures / operatingCashflow
          ).toFixed(2);
        }

        return enrichedReport;
      });

      // Prepare key metrics for visualization
      const keyMetrics = reportsWithMetrics.map((report) => {
        // Convert string values to numbers or 0 if "None", and to millions for better display
        const operatingCashflow =
          report.operatingCashflow === "None"
            ? 0
            : Number(report.operatingCashflow) / 1000000;
        const investingCashflow =
          report.cashflowFromInvestment === "None"
            ? 0
            : Number(report.cashflowFromInvestment) / 1000000;
        const financingCashflow =
          report.cashflowFromFinancing === "None"
            ? 0
            : Number(report.cashflowFromFinancing) / 1000000;
        const freeCashFlow = report.freeCashFlow / 1000000;
        const netIncome =
          report.netIncome === "None" ? 0 : Number(report.netIncome) / 1000000;
        const capEx =
          report.capitalExpenditures === "None"
            ? 0
            : Number(report.capitalExpenditures) / 1000000;
        const dividendPayout =
          report.dividendPayout === "None"
            ? 0
            : Number(report.dividendPayout) / 1000000;

        return {
          period: report.fiscalDateEnding,
          operatingCashflow,
          investingCashflow,
          financingCashflow,
          freeCashFlow,
          netIncome,
          capEx,
          dividendPayout,
          operatingCashFlowToNetIncome: report.operatingCashFlowToNetIncome,
          freeCashFlowToNetIncome: report.freeCashFlowToNetIncome,
          dividendCoverageRatio: report.dividendCoverageRatio,
          capExToOperatingCashFlow: report.capExToOperatingCashFlow,
        };
      });

      // Prepare response
      const enrichedData = {
        symbol: data.symbol,
        period: period,
        reports: reportsWithMetrics,
        keyMetrics: keyMetrics,
      };

      return {
        success: true,
        data: enrichedData,
      };
    } catch (error) {
      console.error(`Cash Flow tool error:`, error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch cash flow data",
      };
    }
  },
};
