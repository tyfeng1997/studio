import { z } from "zod";
import type { ToolDefinition, ToolExecuteResult } from "@/app/types/tools";
import axios from "axios";

const EarningsParams = z.object({
  symbol: z.string().describe("Stock ticker symbol (e.g., IBM, AAPL)"),
  period: z
    .enum(["annual", "quarterly", "both"])
    .optional()
    .describe(
      "Data period: 'annual', 'quarterly', or 'both' (default is both)"
    ),
  limit: z
    .number()
    .optional()
    .describe(
      "Number of periods to return (default is 12 for quarterly, 3 for annual)"
    ),
});

export const earningsTool: ToolDefinition<typeof EarningsParams> = {
  name: "earnings",

  description:
    "Fetch annual and quarterly EPS (Earnings Per Share) data for a given stock symbol, including analyst estimates and surprise metrics for quarterly data.",
  parameters: EarningsParams,
  execute: async ({
    symbol,
    period = "both",
    limit,
  }): Promise<ToolExecuteResult> => {
    try {
      // Input validation
      if (!symbol.trim()) {
        throw new Error("Stock symbol cannot be empty");
      }

      // Set appropriate limits based on period
      const annualLimit = limit || 3; // Default is 3 years for annual data
      const quarterlyLimit = limit || 12; // Default is 12 quarters (3 years) for quarterly data

      // Alpha Vantage API URL
      const apiKey = process.env.ALPHA_VANTAGE_API_KEY || "demo";
      const url = `https://www.alphavantage.co/query?function=EARNINGS&symbol=${symbol}&apikey=${apiKey}`;

      const response = await axios.get(url);
      const data = response.data;

      if (!data) {
        return {
          success: false,
          error: "Invalid or empty response from the API",
        };
      }

      // Process the data based on the requested period
      let annualEarnings = [];
      let quarterlyEarnings = [];

      if (period === "annual" || period === "both") {
        if (!data.annualEarnings || !Array.isArray(data.annualEarnings)) {
          return {
            success: false,
            error: `No annual earnings data available for ${symbol}`,
          };
        }
        annualEarnings = data.annualEarnings.slice(0, annualLimit);
      }

      if (period === "quarterly" || period === "both") {
        if (!data.quarterlyEarnings || !Array.isArray(data.quarterlyEarnings)) {
          return {
            success: false,
            error: `No quarterly earnings data available for ${symbol}`,
          };
        }
        quarterlyEarnings = data.quarterlyEarnings.slice(0, quarterlyLimit);
      }

      // Calculate year-over-year EPS growth for annual data
      const annualWithGrowth = annualEarnings.map((earning, index) => {
        const enrichedEarning = { ...earning };

        // Convert string values to numbers for calculations
        const currentEPS = parseFloat(earning.reportedEPS);

        // Calculate growth rate if we have previous year data
        if (index < annualEarnings.length - 1) {
          const prevEPS = parseFloat(annualEarnings[index + 1].reportedEPS);
          const growthRate = ((currentEPS - prevEPS) / Math.abs(prevEPS)) * 100;
          enrichedEarning.epsGrowth = growthRate.toFixed(2);
        }

        return enrichedEarning;
      });

      // Calculate quarter-over-quarter and year-over-year growth for quarterly data
      const quarterlyWithGrowth = quarterlyEarnings.map((earning, index) => {
        const enrichedEarning = { ...earning };

        // Convert string values to numbers for calculations
        const currentEPS = parseFloat(earning.reportedEPS);

        // Calculate QoQ growth rate if we have previous quarter data
        if (index < quarterlyEarnings.length - 1) {
          const prevQuarterEPS = parseFloat(
            quarterlyEarnings[index + 1].reportedEPS
          );
          const qoqGrowthRate =
            ((currentEPS - prevQuarterEPS) / Math.abs(prevQuarterEPS)) * 100;
          enrichedEarning.epsQoQGrowth = qoqGrowthRate.toFixed(2);
        }

        // Calculate YoY growth rate if we have same quarter last year data (4 quarters ago)
        if (index < quarterlyEarnings.length - 4) {
          const yearAgoEPS = parseFloat(
            quarterlyEarnings[index + 4].reportedEPS
          );
          const yoyGrowthRate =
            ((currentEPS - yearAgoEPS) / Math.abs(yearAgoEPS)) * 100;
          enrichedEarning.epsYoYGrowth = yoyGrowthRate.toFixed(2);
        }

        // Add calculated fields to make visualization easier
        if (earning.estimatedEPS !== "None" && earning.reportedEPS !== "None") {
          enrichedEarning.beatMissed =
            parseFloat(earning.reportedEPS) >= parseFloat(earning.estimatedEPS)
              ? "Beat"
              : "Missed";
        }

        return enrichedEarning;
      });

      // Prepare annual metrics for visualization
      const annualMetrics = annualWithGrowth.map((earning) => {
        return {
          fiscalYear: new Date(earning.fiscalDateEnding).getFullYear(),
          eps: parseFloat(earning.reportedEPS),
          epsGrowth: earning.epsGrowth ? parseFloat(earning.epsGrowth) : null,
        };
      });

      // Prepare quarterly metrics for visualization
      const quarterlyMetrics = quarterlyWithGrowth.map((earning) => {
        // Format fiscal quarter (e.g., "2023 Q1")
        const date = new Date(earning.fiscalDateEnding);
        const year = date.getFullYear();
        const month = date.getMonth();
        const quarter = Math.floor(month / 3) + 1;
        const formattedQuarter = `${year} Q${quarter}`;

        return {
          fiscalQuarter: formattedQuarter,
          reportedDate: earning.reportedDate,
          eps: parseFloat(earning.reportedEPS),
          estimatedEPS:
            earning.estimatedEPS !== "None"
              ? parseFloat(earning.estimatedEPS)
              : null,
          surprise:
            earning.surprise !== "None" ? parseFloat(earning.surprise) : null,
          surprisePercentage:
            earning.surprisePercentage !== "None"
              ? parseFloat(earning.surprisePercentage)
              : null,
          epsQoQGrowth: earning.epsQoQGrowth
            ? parseFloat(earning.epsQoQGrowth)
            : null,
          epsYoYGrowth: earning.epsYoYGrowth
            ? parseFloat(earning.epsYoYGrowth)
            : null,
          beatMissed: earning.beatMissed || null,
          reportTime: earning.reportTime || null,
        };
      });

      // Calculate beat/miss statistics
      const beatCount = quarterlyWithGrowth.filter(
        (e) => e.beatMissed === "Beat"
      ).length;
      const missCount = quarterlyWithGrowth.filter(
        (e) => e.beatMissed === "Missed"
      ).length;
      const totalReports = quarterlyWithGrowth.length;
      const beatRate =
        totalReports > 0 ? ((beatCount / totalReports) * 100).toFixed(2) : null;

      // Calculate average surprise percentage
      const surprisePercentages = quarterlyWithGrowth
        .map((e) =>
          e.surprisePercentage !== "None"
            ? parseFloat(e.surprisePercentage)
            : null
        )
        .filter((p) => p !== null);
      const avgSurprisePercentage =
        surprisePercentages.length > 0
          ? (
              surprisePercentages.reduce((sum, p) => sum + p, 0) /
              surprisePercentages.length
            ).toFixed(2)
          : null;

      // Prepare enriched data response
      const enrichedData = {
        symbol: data.symbol,
        annualEarnings: annualWithGrowth,
        quarterlyEarnings: quarterlyWithGrowth,
        annualMetrics,
        quarterlyMetrics,
        statistics: {
          latestAnnualEPS:
            annualWithGrowth.length > 0
              ? parseFloat(annualWithGrowth[0].reportedEPS)
              : null,
          latestQuarterlyEPS:
            quarterlyWithGrowth.length > 0
              ? parseFloat(quarterlyWithGrowth[0].reportedEPS)
              : null,
          beatCount,
          missCount,
          beatRate,
          avgSurprisePercentage,
        },
      };

      return {
        success: true,
        data: enrichedData,
      };
    } catch (error) {
      console.error(`Earnings tool error:`, error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch earnings data",
      };
    }
  },
};
