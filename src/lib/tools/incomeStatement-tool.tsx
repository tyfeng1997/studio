import { z } from "zod";
import type { ToolDefinition, ToolExecuteResult } from "@/app/types/tools";
import axios from "axios";

const IncomeStatementParams = z.object({
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

export const incomeStatementTool: ToolDefinition<typeof IncomeStatementParams> =
  {
    name: "incomeStatement",
    description:
      "Fetch annual or quarterly income statement data for a given stock symbol, including revenue, profit, expenses, and key financial metrics.",
    parameters: IncomeStatementParams,
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
        const url = `https://www.alphavantage.co/query?function=INCOME_STATEMENT&symbol=${symbol}&apikey=${apiKey}`;

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
            error: `No ${period} income statement data available for ${symbol}`,
          };
        }

        // Limit the number of periods returned
        const limitedReports = data[reportKey].slice(0, limit);

        // Calculate year-over-year growth for key metrics (for annual reports)
        const reportsWithGrowth = limitedReports.map((report, index) => {
          const enrichedReport = { ...report };

          // Convert string values to numbers for calculations
          const numericReport = Object.entries(report).reduce(
            (acc, [key, value]) => {
              acc[key] = value === "None" ? null : Number(value);
              return acc;
            },
            {}
          );

          // Only calculate growth if we have a previous period to compare with
          if (index < limitedReports.length - 1) {
            const prevReport = limitedReports[index + 1];

            // Calculate revenue growth
            if (
              report.totalRevenue !== "None" &&
              prevReport.totalRevenue !== "None"
            ) {
              const currentRevenue = Number(report.totalRevenue);
              const prevRevenue = Number(prevReport.totalRevenue);
              const revenueGrowth =
                ((currentRevenue - prevRevenue) / prevRevenue) * 100;
              enrichedReport.revenueGrowth = revenueGrowth.toFixed(2);
            }

            // Calculate net income growth
            if (
              report.netIncome !== "None" &&
              prevReport.netIncome !== "None"
            ) {
              const currentIncome = Number(report.netIncome);
              const prevIncome = Number(prevReport.netIncome);
              const incomeGrowth =
                ((currentIncome - prevIncome) / prevIncome) * 100;
              enrichedReport.incomeGrowth = incomeGrowth.toFixed(2);
            }

            // Calculate gross profit margin
            if (
              report.grossProfit !== "None" &&
              report.totalRevenue !== "None"
            ) {
              const grossProfit = Number(report.grossProfit);
              const revenue = Number(report.totalRevenue);
              const grossMargin = (grossProfit / revenue) * 100;
              enrichedReport.grossMargin = grossMargin.toFixed(2);
            }

            // Calculate operating margin
            if (
              report.operatingIncome !== "None" &&
              report.totalRevenue !== "None"
            ) {
              const operatingIncome = Number(report.operatingIncome);
              const revenue = Number(report.totalRevenue);
              const operatingMargin = (operatingIncome / revenue) * 100;
              enrichedReport.operatingMargin = operatingMargin.toFixed(2);
            }

            // Calculate net profit margin
            if (report.netIncome !== "None" && report.totalRevenue !== "None") {
              const netIncome = Number(report.netIncome);
              const revenue = Number(report.totalRevenue);
              const netMargin = (netIncome / revenue) * 100;
              enrichedReport.netMargin = netMargin.toFixed(2);
            }
          } else {
            // For the oldest period in our data, we can still calculate margins
            if (
              report.grossProfit !== "None" &&
              report.totalRevenue !== "None"
            ) {
              const grossProfit = Number(report.grossProfit);
              const revenue = Number(report.totalRevenue);
              const grossMargin = (grossProfit / revenue) * 100;
              enrichedReport.grossMargin = grossMargin.toFixed(2);
            }

            if (
              report.operatingIncome !== "None" &&
              report.totalRevenue !== "None"
            ) {
              const operatingIncome = Number(report.operatingIncome);
              const revenue = Number(report.totalRevenue);
              const operatingMargin = (operatingIncome / revenue) * 100;
              enrichedReport.operatingMargin = operatingMargin.toFixed(2);
            }

            if (report.netIncome !== "None" && report.totalRevenue !== "None") {
              const netIncome = Number(report.netIncome);
              const revenue = Number(report.totalRevenue);
              const netMargin = (netIncome / revenue) * 100;
              enrichedReport.netMargin = netMargin.toFixed(2);
            }
          }

          return enrichedReport;
        });

        // Prepare response with both raw data and key metrics for visualization
        const enrichedData = {
          symbol: data.symbol,
          period: period,
          reports: reportsWithGrowth,
          keyMetrics: reportsWithGrowth.map((report) => {
            // Convert string values to numbers or 0 if "None"
            const revenue =
              report.totalRevenue === "None" ? 0 : Number(report.totalRevenue);
            const grossProfit =
              report.grossProfit === "None" ? 0 : Number(report.grossProfit);
            const operatingIncome =
              report.operatingIncome === "None"
                ? 0
                : Number(report.operatingIncome);
            const netIncome =
              report.netIncome === "None" ? 0 : Number(report.netIncome);

            return {
              period: report.fiscalDateEnding,
              revenue: revenue / 1000000, // Convert to millions
              grossProfit: grossProfit / 1000000,
              operatingIncome: operatingIncome / 1000000,
              netIncome: netIncome / 1000000,
              grossMargin: report.grossMargin,
              operatingMargin: report.operatingMargin,
              netMargin: report.netMargin,
              revenueGrowth: report.revenueGrowth,
              incomeGrowth: report.incomeGrowth,
            };
          }),
        };

        return {
          success: true,
          data: enrichedData,
        };
      } catch (error) {
        console.error(`Income Statement tool error:`, error);
        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to fetch income statement data",
        };
      }
    },
  };
