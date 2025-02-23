import { z } from "zod";
import type { ToolDefinition, ToolExecuteResult } from "@/app/types/tools";
import type { DataStreamWriter } from "ai";
import FirecrawlApp from "@mendable/firecrawl-js";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";

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
    extracted: {
      keyFindings: string[];
      metrics: Record<string, string | number>;
      competitiveAnalysis?: {
        advantages: string[];
        disadvantages: string[];
        marketPosition: string;
      };
      risks: string[];
      opportunities: string[];
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

// Prompts
const SEARCH_PROMPT = `As a buy-side analyst, you need to research {company}'s competitive landscape and market position. 

Current research phase: {phase}

Based on your experience, generate specific search queries to find information about:
1. Major competitors and their market shares
2. Company's competitive advantages and moat
3. Industry structure and dynamics
4. Market share and positioning
5. Key differentiators from competitors
6. Customer base and loyalty
7. Financial performance and metrics
8. Future growth opportunities
9. Potential risks and challenges

Output in the exact JSON format:
{
  "queries": [
    {
      "purpose": "string (what information this query aims to find)",
      "query": "string (the actual search query)",
      "priority": "high" | "medium" | "low",
      "expectedDataType": "market_data" | "competitor_info" | "company_analysis" | "customer_feedback" | "financial_data" | "industry_analysis"
    }
  ],
  "competitorsToTrack": ["competitor1", "competitor2"],
  "keyMetricsToFind": [
    "revenue_growth",
    "market_share",
    "profit_margin",
    "customer_retention"
  ]
}`;

const EXTRACTION_PROMPT = `As a professional buy-side analyst, analyze the provided webpage content about {company} and extract key information in the following format:

{
  "extracted": {
    "keyFindings": [
      "Finding 1 with specific data point or quote",
      "Finding 2 with specific data point or quote"
    ],
    "metrics": {
      "metric_name": "value with unit",
      "revenue_growth": "X%",
      "market_share": "X%"
    },
    "competitiveAnalysis": {
      "advantages": [
        "Specific advantage 1 with supporting evidence",
        "Specific advantage 2 with supporting evidence"
      ],
      "disadvantages": [
        "Specific disadvantage 1 with supporting evidence",
        "Specific disadvantage 2 with supporting evidence"
      ],
      "marketPosition": "Clear description of market position with evidence"
    },
    "risks": [
      "Specific risk 1 with potential impact",
      "Specific risk 2 with potential impact"
    ],
    "opportunities": [
      "Specific opportunity 1 with potential impact",
      "Specific opportunity 2 with potential impact"
    ]
  },
  "sourceAssessment": {
    "relevance": "high" | "medium" | "low",
    "reliability": "high" | "medium" | "low",
    "dataFreshness": "date or period of data",
    "keyLimitations": ["limitation1", "limitation2"]
  }
}`;

// Parameters definition
const CompanyResearchParams = z.object({
  company: z.string().describe("Company name or ticker to research"),
  timeframe: z
    .number()
    .optional()
    .default(90)
    .describe("Research timeframe in days"),
  focusAreas: z
    .array(z.string())
    .optional()
    .describe("Specific areas to focus research on"),
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
    // Get search plan
    const { text: planResult } = await generateText({
      model: anthropic("claude-3-5-sonnet-20241022"),
      prompt: SEARCH_PROMPT.replace("{company}", company).replace(
        "{phase}",
        phase
      ),
    });

    const searchPlan: SearchPlan = JSON.parse(planResult);
    console.log("[SearchPlan]\n", searchPlan);

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
    const prioritizedQueries = searchPlan.queries.sort((a, b) => {
      const priority = { high: 3, medium: 2, low: 1 };
      return priority[b.priority] - priority[a.priority];
    });

    for (const queryInfo of prioritizedQueries) {
      const searchResult = await app.search(queryInfo.query);
      console.log("[SearchResult]\n", searchResult);

      if (searchResult.success && searchResult.data?.length > 0) {
        const urls = searchResult.data.slice(0, 3).map((result) => ({
          url: result.url,
          title: result.title,
          description: result.description,
        }));
        // Process each URL individually
        for (const urlData of urls) {
          try {
            const extractResult = await app.extract([urlData.url], {
              prompt: EXTRACTION_PROMPT.replace("{company}", company),
            });

            if (extractResult.success && extractResult.data) {
              // Create source entry for this specific URL
              console.log("url \n", urlData.url);
              console.log(extractResult.data.extracted);
              sources.push({
                url: urlData.url,
                title: urlData.title || "Untitled",
                type: mapSourceType(urlData.url),
                timestamp: new Date().toISOString(),
                content: {
                  raw: urlData.description || "",
                  extracted: extractResult.data.extracted,
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

              // Log successful extraction
              console.log(`Successfully extracted data from: ${urlData.url}`);
            }
          } catch (extractError) {
            // Log extraction error but continue with other URLs
            console.error(
              `Error extracting from ${urlData.url}:`,
              extractError
            );
          }
        }
      }
    }
  } catch (error) {
    console.error("Search execution error:", error);
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
      { company, timeframe, focusAreas },
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

        const phases = focusAreas?.length ? focusAreas : defaultPhases;
        const allSources: Source[] = [];

        for (const phase of phases) {
          const sources = await executeSearch(company, phase, dataStream);
          allSources.push(...sources);
        }

        // Aggregate results
        const aggregatedData = {
          sources: allSources,
          competitors: [
            ...new Set(allSources.flatMap((s) => s.metadata.competitors || [])),
          ],
          keyMetrics: allSources.reduce((acc, source) => {
            if (source.content.extracted.metrics) {
              Object.assign(acc, source.content.extracted.metrics);
            }
            return acc;
          }, {} as Record<string, string | number>),
          competitivePosition: {
            advantages: [
              ...new Set(
                allSources.flatMap(
                  (s) =>
                    s.content.extracted.competitiveAnalysis?.advantages || []
                )
              ),
            ],
            risks: [
              ...new Set(
                allSources.flatMap((s) => s.content.extracted.risks || [])
              ),
            ],
            opportunities: [
              ...new Set(
                allSources.flatMap(
                  (s) => s.content.extracted.opportunities || []
                )
              ),
            ],
          },
          sourceStats: {
            total: allSources.length,
            byType: allSources.reduce((acc, s) => {
              acc[s.type] = (acc[s.type] || 0) + 1;
              return acc;
            }, {} as Record<Source["type"], number>),
            byReliability: allSources.reduce((acc, s) => {
              acc[s.metadata.reliability] =
                (acc[s.metadata.reliability] || 0) + 1;
              return acc;
            }, {} as Record<"high" | "medium" | "low", number>),
          },
        };

        return {
          success: true,
          data: aggregatedData,
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
