import { z } from "zod";
import type { ToolDefinition, ToolExecuteResult } from "@/app/types/tools";
import type { DataStreamWriter } from "ai";
import FirecrawlApp from "@mendable/firecrawl-js";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import { PHASE_SEARCH_PROMPTS, PHASE_EXTRACTION_PROMPTS } from "./prompts";

const app = new FirecrawlApp({
  apiKey: process.env.FIRECRAWL_API_KEY || "",
});

// Define types
type SearchQuery = {
  purpose: string;
  query: string;
  priority: "high" | "medium" | "low";
  expectedDataType:
    | "market_data"
    | "competitor_info"
    | "company_analysis"
    | "customer_feedback"
    | "financial_data"
    | "industry_analysis";
};

type SearchPlan = {
  queries: SearchQuery[];
  competitorsToTrack: string[];
  keyMetricsToFind: string[];
};

type Source = {
  url: string;
  title: string;
  type: "SEC" | "NEWS" | "RESEARCH" | "SOCIAL" | "OTHER";
  timestamp: string;
  content: {
    raw: string;
    extracted: any; // Using any here as the extracted content structure varies by phase
    sourceAssessment?: {
      relevance: "high" | "medium" | "low";
      reliability: "high" | "medium" | "low";
      dataFreshness: string;
      keyLimitations: string[];
    };
  };
  metadata: {
    competitors?: string[];
    metrics?: Record<string, string | number>;
    dataType?: SearchQuery["expectedDataType"];
    reliability: "high" | "medium" | "low";
    relevance: "high" | "medium" | "low";
  };
};

// Parameters definition
const CompanyResearchParams = z.object({
  company: z.string().describe("Company name or ticker to research"),
});

// Helper functions
function assessSourceReliability(url: string): "high" | "medium" | "low" {
  const highReliabilityDomains = [
    "sec.gov",
    "bloomberg.com",
    "reuters.com",
    "ft.com",
    "wsj.com",
  ];

  const mediumReliabilityDomains = [
    "seekingalpha.com",
    "fool.com",
    "morningstar.com",
    "cnbc.com",
  ];

  if (highReliabilityDomains.some((domain) => url.includes(domain))) {
    return "high";
  }
  if (mediumReliabilityDomains.some((domain) => url.includes(domain))) {
    return "medium";
  }
  return "low";
}

function mapSourceType(url: string): Source["type"] {
  if (url.includes("sec.gov")) return "SEC";
  if (url.includes("twitter.com") || url.includes("linkedin.com"))
    return "SOCIAL";
  if (url.includes(".edu") || url.includes("research")) return "RESEARCH";
  if (
    url.includes("news") ||
    url.includes("bloomberg.com") ||
    url.includes("reuters.com")
  )
    return "NEWS";
  return "OTHER";
}

async function executeSearch(
  company: string,
  phase: string,
  dataStream?: DataStreamWriter
): Promise<Source[]> {
  const sources: Source[] = [];

  try {
    // Get search plan using phase-specific search prompt
    const searchPrompt =
      PHASE_SEARCH_PROMPTS[phase]?.replace("{company}", company) ||
      PHASE_SEARCH_PROMPTS.market_position.replace("{company}", company);

    const { text: planResult } = await generateText({
      model: anthropic("claude-3-5-sonnet-20241022"),
      prompt: searchPrompt,
    });

    console.log(`prompt ${searchPrompt}`);
    console.log(`planResult ${planResult}`);

    const searchPlan: SearchPlan = JSON.parse(planResult);
    console.log(`[SearchPlan for ${phase}]\n`, searchPlan);

    // Log search plan
    dataStream?.writeData({
      tool: "company_research",
      content: {
        phase,
        searchPlan,
        timestamp: new Date().toISOString(),
      },
    });

    // Execute prioritized searches
    const prioritizedQueries = searchPlan.queries
      .sort((a, b) => {
        const priority = { high: 3, medium: 2, low: 1 };
        return priority[b.priority] - priority[a.priority];
      })
      .slice(0, 1);

    console.log(`[prioritizedQueries for ${phase}] 1\n`, prioritizedQueries);

    for (const queryInfo of prioritizedQueries) {
      const searchResult = await app.search(queryInfo.query);
      console.log("[SearchResult]\n", searchResult);

      if (searchResult.success && searchResult.data?.length > 0) {
        const urls = searchResult.data.slice(0, 1).map((result) => ({
          url: result.url,
          title: result.title,
          description: result.description,
        }));
        console.log("[SearchResult] 1\n", urls);

        // Process each URL with phase-specific extraction prompt
        for (const urlData of urls) {
          try {
            const extractionPrompt =
              PHASE_EXTRACTION_PROMPTS[phase]?.replace("{company}", company) ||
              PHASE_EXTRACTION_PROMPTS.market_position.replace(
                "{company}",
                company
              );

            const extractResult = await app.extract([urlData.url], {
              prompt: extractionPrompt,
            });

            if (extractResult.success && extractResult.data) {
              console.log(
                "[EXTRACTED URL ]\n",
                urlData.url,
                extractResult.data.extracted
              );
              sources.push({
                url: urlData.url,
                title: urlData.title || "Untitled",
                type: mapSourceType(urlData.url),
                timestamp: new Date().toISOString(),
                content: {
                  raw: urlData.description || "",
                  extracted: extractResult.data.extracted,
                  sourceAssessment: extractResult.data.sourceAssessment,
                },
                metadata: {
                  competitors: searchPlan.competitorsToTrack,
                  dataType: queryInfo.expectedDataType,
                  reliability:
                    extractResult.data.sourceAssessment?.reliability ||
                    assessSourceReliability(urlData.url),
                  relevance:
                    extractResult.data.sourceAssessment?.relevance || "medium",
                },
              });

              console.log(
                `Successfully extracted ${phase} data from: ${urlData.url}`
              );
            }
          } catch (extractError) {
            console.error(
              `Error extracting ${phase} data from ${urlData.url}:`,
              extractError
            );
          }
        }
      }
    }
  } catch (error) {
    console.error(`${phase} search execution error:`, error);
    throw error;
  }

  return sources;
}

// Main tool definition
export const companyResearchTool: ToolDefinition<typeof CompanyResearchParams> =
  {
    name: "company_research",
    description:
      "Collect and analyze comprehensive information about a company's competitive landscape and market position",
    parameters: CompanyResearchParams,

    execute: async (
      { company },
      dataStream?: DataStreamWriter
    ): Promise<ToolExecuteResult> => {
      try {
        const defaultPhases = [
          "market_position",
          "competitors",
          "financial_performance",
          "customer_analysis",
          "industry_trends",
        ];

        const phases = defaultPhases;
        const allSources: Source[] = [];

        // Execute search for each phase sequentially
        for (const phase of phases) {
          const sources = await executeSearch(company, phase, dataStream);
          allSources.push(...sources);
        }

        // Aggregate and organize results by phase
        const phaseResults = phases.reduce((acc, phase) => {
          const phaseSources = allSources.filter((s) => {
            const extractedData = s.content.extracted;
            return (
              (phase === "market_position" && extractedData.marketPosition) ||
              (phase === "competitors" &&
                (extractedData.competitorAnalysis ||
                  extractedData.competitiveAdvantages)) ||
              (phase === "financial_performance" &&
                extractedData.financialMetrics) ||
              (phase === "customer_analysis" &&
                (extractedData.customerSegments ||
                  extractedData.customerMetrics)) ||
              (phase === "industry_trends" &&
                (extractedData.marketTrends || extractedData.industryTrends))
            );
          });

          acc[phase] = {
            sources: phaseSources.length,
            content: phaseSources.map((s) => s.content.extracted),
            reliability: {
              high: phaseSources.filter(
                (s) => s.metadata.reliability === "high"
              ).length,
              medium: phaseSources.filter(
                (s) => s.metadata.reliability === "medium"
              ).length,
              low: phaseSources.filter((s) => s.metadata.reliability === "low")
                .length,
            },
          };
          return acc;
        }, {} as Record<string, any>);

        // Aggregate metrics and competitors across all phases
        const aggregatedData = {
          summary: {
            totalSources: allSources.length,
            sourcesByType: allSources.reduce((acc, s) => {
              acc[s.type] = (acc[s.type] || 0) + 1;
              return acc;
            }, {} as Record<Source["type"], number>),
            reliability: allSources.reduce((acc, s) => {
              acc[s.metadata.reliability] =
                (acc[s.metadata.reliability] || 0) + 1;
              return acc;
            }, {} as Record<"high" | "medium" | "low", number>),
          },
          competitors: [
            ...new Set(allSources.flatMap((s) => s.metadata.competitors || [])),
          ],
          metrics: allSources.reduce((acc, source) => {
            if (source.content.extracted.metrics) {
              Object.assign(acc, source.content.extracted.metrics);
            }
            return acc;
          }, {} as Record<string, string | number>),
          phaseResults,
          sources: allSources.map((s) => ({
            url: s.url,
            title: s.title,
            type: s.type,
            reliability: s.metadata.reliability,
            relevance: s.metadata.relevance,
            phase:
              phases.find((p) => s.content.extracted[p.replace("_", "")]) ||
              "unknown",
          })),
        };

        console.log("aggregatedData", JSON.stringify(aggregatedData));

        return {
          success: true,
          data: JSON.stringify(aggregatedData),
        };
      } catch (error) {
        console.error("Company research error:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Research failed",
        };
      }
    },
  };
