import { z } from "zod";
import type { ToolDefinition, ToolExecuteResult } from "@/app/types/tools";
import { restClient } from "@polygon.io/client-js";

const StockFinancialsParams = z.object({
  ticker: z.string().describe("Stock ticker symbol (e.g., AAPL, NVDA)"),
  limit: z
    .number()
    .optional()
    .describe("Maximum number of financial reports to return (default 3)"),
  sort: z
    .enum(["filing_date", "period_of_report_date"])
    .optional()
    .describe("Sort field for the financial reports"),
  order: z
    .enum(["asc", "desc"])
    .optional()
    .describe("Ascending or descending order"),
  timeframe: z
    .enum(["quarterly", "annual", "ttm"])
    .optional()
    .describe(
      "Financial report timeframe (quarterly, annual, or trailing twelve months)"
    ),
});

export const stockFinancialsTool: ToolDefinition<typeof StockFinancialsParams> =
  {
    name: "stockFinancials",
    description:
      "Retrieve historical financial data for a specific company by its stock ticker symbol. Returns data from SEC filings including income statements, balance sheets, and cash flow information.",
    parameters: StockFinancialsParams,
    execute: async ({
      ticker,
      limit = 3,
      sort = "filing_date",
      order = "desc",
      timeframe,
    }): Promise<ToolExecuteResult> => {
      try {
        // Input validation
        if (!ticker.trim()) {
          throw new Error("Ticker symbol cannot be empty");
        }

        // Create Polygon.io client
        const rest = restClient(process.env.POLYGON_API_KEY || "");

        // Prepare request parameters
        const requestParams: any = {
          ticker: ticker.toUpperCase(),
          order: order,
          limit: limit,
          sort: sort,
        };

        // Add timeframe filter if specified
        if (timeframe) {
          requestParams.timeframe = timeframe;
        }

        // Fetch financial data for the ticker
        const response = await rest.reference.stockFinancials(requestParams);

        // Check if the request was successful
        if (response.status !== "OK") {
          return {
            success: false,
            error: `Failed to retrieve financial data: ${response.status}`,
          };
        }

        // Process the results
        const financialReports = response.results.map((report) => {
          // Format dates for better readability
          const startDate = new Date(report.start_date).toLocaleDateString();
          const endDate = new Date(report.end_date).toLocaleDateString();
          const filingDate = new Date(report.filing_date).toLocaleDateString();

          // Extract key financial metrics
          const incomeStatement = report.financials.income_statement || {};
          const balanceSheet = report.financials.balance_sheet || {};
          const cashFlowStatement = report.financials.cash_flow_statement || {};

          // Extract key metrics with proper formatting
          const getMetricValue = (source, key) => {
            if (!source[key] || source[key].value === undefined) return null;

            const value = source[key].value;
            const unit = source[key].unit;

            // Format large numbers for better readability
            if (unit === "USD" && Math.abs(value) >= 1000000) {
              if (Math.abs(value) >= 1000000000) {
                return {
                  value: (value / 1000000000).toFixed(2),
                  formatted: `$${(value / 1000000000).toFixed(2)} billion`,
                  raw: value,
                  unit: unit,
                };
              } else {
                return {
                  value: (value / 1000000).toFixed(2),
                  formatted: `$${(value / 1000000).toFixed(2)} million`,
                  raw: value,
                  unit: unit,
                };
              }
            } else if (unit.includes("shares")) {
              return {
                value: (value / 1000000).toFixed(2),
                formatted: `${(value / 1000000).toFixed(2)} million`,
                raw: value,
                unit: unit,
              };
            } else if (unit === "USD / shares") {
              return {
                value: value.toFixed(2),
                formatted: `$${value.toFixed(2)}`,
                raw: value,
                unit: unit,
              };
            }

            return {
              value: value,
              formatted: value.toString(),
              raw: value,
              unit: unit,
            };
          };

          return {
            company_name: report.company_name,
            ticker: ticker.toUpperCase(),
            timeframe: report.timeframe,
            fiscal_period: report.fiscal_period,
            fiscal_year: report.fiscal_year,
            period: `${report.fiscal_period} ${report.fiscal_year}`,
            dates: {
              start_date: startDate,
              end_date: endDate,
              filing_date: filingDate,
            },
            income_statement: {
              revenue: getMetricValue(incomeStatement, "revenues"),
              cost_of_revenue: getMetricValue(
                incomeStatement,
                "cost_of_revenue"
              ),
              gross_profit: getMetricValue(incomeStatement, "gross_profit"),
              operating_expenses: getMetricValue(
                incomeStatement,
                "operating_expenses"
              ),
              operating_income: getMetricValue(
                incomeStatement,
                "operating_income_loss"
              ),
              net_income: getMetricValue(incomeStatement, "net_income_loss"),
              earnings_per_share: {
                basic: getMetricValue(
                  incomeStatement,
                  "basic_earnings_per_share"
                ),
                diluted: getMetricValue(
                  incomeStatement,
                  "diluted_earnings_per_share"
                ),
              },
              research_and_development: getMetricValue(
                incomeStatement,
                "research_and_development"
              ),
              selling_general_admin: getMetricValue(
                incomeStatement,
                "selling_general_and_administrative_expenses"
              ),
            },
            balance_sheet: {
              assets: {
                total: getMetricValue(balanceSheet, "assets"),
                current: getMetricValue(balanceSheet, "current_assets"),
                noncurrent: getMetricValue(balanceSheet, "noncurrent_assets"),
              },
              liabilities: {
                total: getMetricValue(balanceSheet, "liabilities"),
                current: getMetricValue(balanceSheet, "current_liabilities"),
                noncurrent: getMetricValue(
                  balanceSheet,
                  "noncurrent_liabilities"
                ),
                long_term_debt: getMetricValue(balanceSheet, "long_term_debt"),
              },
              equity: getMetricValue(balanceSheet, "equity"),
            },
            cash_flow: {
              operating: getMetricValue(
                cashFlowStatement,
                "net_cash_flow_from_operating_activities"
              ),
              investing: getMetricValue(
                cashFlowStatement,
                "net_cash_flow_from_investing_activities"
              ),
              financing: getMetricValue(
                cashFlowStatement,
                "net_cash_flow_from_financing_activities"
              ),
              net_cash_flow: getMetricValue(cashFlowStatement, "net_cash_flow"),
            },
            source_filing_url: report.source_filing_url,
          };
        });

        return {
          success: true,
          data: {
            ticker: ticker.toUpperCase(),
            company_name: financialReports[0]?.company_name || "",
            reports: financialReports,
            count: financialReports.length,
          },
        };
      } catch (error) {
        console.error(`Stock financials tool error:`, error);
        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to fetch financial data",
        };
      }
    },
  };
