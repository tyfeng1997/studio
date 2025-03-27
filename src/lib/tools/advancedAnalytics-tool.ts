import { z } from "zod";
import type { ToolDefinition, ToolExecuteResult } from "@/app/types/tools";
import axios from "axios";

// Define the accepted calculation types as a constant for better maintainability
const VALID_CALCULATIONS = [
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
] as const;

// Define the accepted interval types
const VALID_INTERVALS = [
  "1min",
  "5min",
  "15min",
  "30min",
  "60min",
  "DAILY",
  "WEEKLY",
  "MONTHLY",
] as const;

// Define the accepted OHLC values
const VALID_OHLC = ["open", "high", "low", "close"] as const;

// Define valid time range formats
const VALID_RANGE_FORMATS = [
  "full",
  "{N}day",
  "{N}week",
  "{N}month",
  "{N}year",
  "{N}minute",
  "{N}hour",
  "YYYY-MM-DD",
  "YYYY-MM",
  "YYYY-MM-DDThh:mm:ss",
] as const;

// Helper function to format calculation options with parameters
const formatCalculation = (calc, options) => {
  if (!options) return calc;
  const params = Object.entries(options)
    .map(([key, value]) => `${key}=${value}`)
    .join(",");
  return `${calc}(${params})`;
};

const AdvancedAnalyticsParams = z.object({
  symbols: z
    .string()
    .describe("Comma-separated list of stock symbols (e.g., 'AAPL,MSFT,IBM')"),

  interval: z
    .enum(VALID_INTERVALS)
    .default("DAILY")
    .describe("Time interval between data points (e.g., DAILY, WEEKLY, 1min)"),

  ohlc: z
    .enum(VALID_OHLC)
    .default("close")
    .describe("Price field to use for calculations (open, high, low, close)"),

  startDate: z
    .string()
    .optional()
    .describe(
      "Start date for analysis (YYYY-MM-DD or YYYY-MM-DDThh:mm:ss format)"
    ),

  endDate: z
    .string()
    .optional()
    .describe(
      "End date for analysis (YYYY-MM-DD or YYYY-MM-DDThh:mm:ss format)"
    ),

  range: z
    .string()
    .optional()
    .describe(
      "Alternative to date range: 'full', '1day', '1week', '1month', '1year', etc."
    ),

  calculations: z
    .array(z.enum(VALID_CALCULATIONS))
    .default(["MEAN", "STDDEV", "CORRELATION"])
    .describe("Financial metrics to calculate"),

  // Optional parameters for specific calculations
  histogramBins: z
    .number()
    .optional()
    .describe("Number of bins for HISTOGRAM calculation (default: 10)"),

  autocorrelationLag: z
    .number()
    .optional()
    .describe("Lag value for AUTOCORRELATION calculation (default: 1)"),

  correlationMethod: z
    .enum(["PEARSON", "KENDALL", "SPEARMAN"])
    .default("PEARSON")
    .optional()
    .describe("Method for CORRELATION calculation"),

  annualized: z
    .boolean()
    .default(false)
    .optional()
    .describe(
      "Whether to annualize VARIANCE, STDDEV, and COVARIANCE calculations"
    ),
});

export const advancedAnalyticsTool: ToolDefinition<
  typeof AdvancedAnalyticsParams
> = {
  name: "advancedAnalytics",
  description:
    "Calculate advanced analytics metrics for a set of stock symbols over a fixed time window, including returns, volatility, correlation, and other statistical measures.",
  parameters: AdvancedAnalyticsParams,
  execute: async ({
    symbols,
    interval = "DAILY",
    ohlc = "close",
    startDate,
    endDate,
    range,
    calculations = ["MEAN", "STDDEV", "CORRELATION"],
    histogramBins,
    autocorrelationLag,
    correlationMethod,
    annualized = false,
  }): Promise<ToolExecuteResult> => {
    try {
      // Input validation
      if (!symbols.trim()) {
        throw new Error("At least one stock symbol is required");
      }

      // Count number of symbols to warn about free API key limitations
      const symbolCount = symbols.split(",").length;
      if (symbolCount > 5) {
        console.warn(
          "Warning: Free API keys are limited to 5 symbols per request"
        );
      }

      // Format calculations with their options
      const formattedCalculations = calculations
        .map((calc) => {
          if (calc === "HISTOGRAM" && histogramBins) {
            return formatCalculation(calc, { bins: histogramBins });
          }
          if (calc === "AUTOCORRELATION" && autocorrelationLag) {
            return formatCalculation(calc, { lag: autocorrelationLag });
          }
          if (calc === "CORRELATION" && correlationMethod) {
            return formatCalculation(calc, { method: correlationMethod });
          }
          if (
            ["VARIANCE", "STDDEV", "COVARIANCE"].includes(calc) &&
            annualized
          ) {
            return formatCalculation(calc, { annualized: true });
          }
          return calc;
        })
        .join(",");

      // Alpha Vantage API URL
      const apiKey = process.env.ALPHA_VANTAGE_API_KEY || "demo";
      let url = `https://alphavantageapi.co/timeseries/analytics?SYMBOLS=${symbols}&INTERVAL=${interval}&OHLC=${ohlc}&CALCULATIONS=${formattedCalculations}&apikey=${apiKey}`;

      // Handle date range parameters
      if (startDate && endDate) {
        url += `&RANGE=${startDate}&RANGE=${endDate}`;
      } else if (startDate) {
        url += `&RANGE=${startDate}`;
      } else if (range) {
        url += `&RANGE=${range}`;
      }

      const response = await axios.get(url);
      const data = response.data;

      if (!data || !data.payload) {
        return {
          success: false,
          error: "Invalid or empty response from the API",
        };
      }

      // Process and enrich the response data for better visualization
      const enrichedData = {
        metadata: data.meta_data,
        results: data.payload.RETURNS_CALCULATIONS,
        // Create a processed version of the results for easier rendering
        processedResults: {},
      };

      // Process each calculation type for better visualization
      Object.keys(data.payload.RETURNS_CALCULATIONS).forEach((calcType) => {
        const result = data.payload.RETURNS_CALCULATIONS[calcType];

        if (calcType === "CORRELATION") {
          // Format correlation matrix for heatmap visualization
          const matrix = result.correlation;
          const symbols = result.index;

          const correlationData = [];

          // Transform the lower triangular matrix to a full matrix
          for (let i = 0; i < symbols.length; i++) {
            const row = [];
            for (let j = 0; j < symbols.length; j++) {
              if (i === j) {
                // Diagonal is always 1.0
                row.push(1.0);
              } else if (i > j) {
                // Lower triangular values are provided in the API response
                row.push(matrix[i][j]);
              } else {
                // Upper triangular values need to be mirrored from the lower triangular part
                row.push(matrix[j][i]);
              }
            }
            correlationData.push({
              symbol: symbols[i],
              values: row,
              symbolLabels: symbols,
            });
          }

          enrichedData.processedResults[calcType] = correlationData;
        } else if (calcType === "COVARIANCE") {
          // Similar to correlation processing
          const matrix = result.covariance;
          const symbols = result.index;

          const covarianceData = [];

          for (let i = 0; i < symbols.length; i++) {
            const row = [];
            for (let j = 0; j < symbols.length; j++) {
              if (i === j) {
                // Diagonal is variance of the symbol
                row.push(matrix[i][j]);
              } else if (i > j) {
                // Lower triangular values are provided
                row.push(matrix[i][j]);
              } else {
                // Upper triangular values need to be mirrored
                row.push(matrix[j][i]);
              }
            }
            covarianceData.push({
              symbol: symbols[i],
              values: row,
              symbolLabels: symbols,
            });
          }

          enrichedData.processedResults[calcType] = covarianceData;
        } else if (calcType === "HISTOGRAM") {
          // Format histogram data for visualization
          const histogramData = [];

          Object.keys(result).forEach((symbol) => {
            const bins = result[symbol].bins;
            const counts = result[symbol].counts;

            const symbolData = {
              symbol,
              histogramData: bins
                .map((binEdge, index) => {
                  if (index < bins.length - 1) {
                    return {
                      binStart: binEdge,
                      binEnd: bins[index + 1],
                      count: counts[index],
                      binLabel: `${binEdge.toFixed(4)} to ${bins[
                        index + 1
                      ].toFixed(4)}`,
                    };
                  }
                  return null;
                })
                .filter((item) => item !== null),
            };

            histogramData.push(symbolData);
          });

          enrichedData.processedResults[calcType] = histogramData;
        } else {
          // For simple metrics (MIN, MAX, MEAN, etc.), format for bar/line charts
          const chartData = Object.keys(result).map((symbol) => ({
            symbol,
            value: result[symbol],
          }));

          enrichedData.processedResults[calcType] = chartData;
        }
      });

      return {
        success: true,
        data: enrichedData,
      };
    } catch (error) {
      console.error(`Advanced Analytics tool error:`, error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch advanced analytics data",
      };
    }
  },
};
