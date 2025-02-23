import { z } from "zod";
import type { ToolDefinition, ToolExecuteResult } from "@/app/types/tools";
import type { DataStreamWriter } from "ai";
import FirecrawlApp from "@mendable/firecrawl-js";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";

const app = new FirecrawlApp({
  apiKey: process.env.FIRECRAWL_API_KEY || "",
});

// Types remain the same as before...
type SearchQuery = {
  purpose: string;
  query: string;
};

type MarketPosition = {
  overallPosition: string;
  marketShare: {
    overall: string;
    bySegment: Record<string, string>;
    trend: string;
  };
  brandStrength: {
    brandValue: string;
    brandPerception: string;
    brandAwareness: string;
  };
  geographicPresence: {
    strongMarkets: string[];
    emergingMarkets: string[];
    marketExpansionPlans: string[];
  };
  productPortfolio: {
    keyProducts: string[];
    marketShareByProduct: Record<string, string>;
    portfolioStrengths: string[];
    portfolioWeaknesses: string[];
  };
};

type Source = {
  url: string;
  title: string;
  content: {
    raw: string;
    extracted: {
      marketPosition?: MarketPosition;
      keyMetrics?: {
        market_penetration: string;
        market_growth_rate: string;
        relative_market_share: string;
      };
    };
  };
};

// Progress tracking types
type SearchProgress = {
  phase: "data_collection";
  searchState: {
    query: string;
    source: string;
    foundDocuments: number;
    extractedInsights: number;
  };
  progress: {
    totalSources: number;
    processedSources: number;
  };
};

const MarketPositionParams = z.object({
  company: z.string().describe("Company name to analyze market position"),
});
const MARKET_POSITION_SEARCH_PROMPT = `As a buy-side analyst researching {company}'s market position, generate 3-5 specific search queries to find information about:
1. Current market share and positioning
2. Brand strength and recognition
3. Geographic presence and market penetration
4. Product portfolio and market coverage

Output in the exact JSON format:
{
  "queries": [
    {
      "purpose": "string (what information this query aims to find)",
      "query": "string (the actual search query)"
    }
  ]
}`;

// Extraction prompt
const MARKET_POSITION_EXTRACTION_PROMPT = `As a buy-side analyst focusing on market positioning, analyze the provided content about {company} and extract key information in this format:

{
  "extracted": {
    "marketPosition": {
      "overallPosition": "Detailed description of company's current market position",
      "marketShare": {
        "overall": "X%",
        "bySegment": {
          "segment1": "X%",
          "segment2": "Y%"
        },
        "trend": "Description of market share trends"
      },
      "brandStrength": {
        "brandValue": "Quantitative measure if available",
        "brandPerception": "Key findings about brand perception",
        "brandAwareness": "Metrics or qualitative assessment"
      },
      "geographicPresence": {
        "strongMarkets": ["Market1", "Market2"],
        "emergingMarkets": ["Market1", "Market2"],
        "marketExpansionPlans": ["Specific plan 1", "Specific plan 2"]
      },
      "productPortfolio": {
        "keyProducts": ["Product1", "Product2"],
        "marketShareByProduct": {
          "product1": "X%",
          "product2": "Y%"
        },
        "portfolioStrengths": ["Strength1", "Strength2"],
        "portfolioWeaknesses": ["Weakness1", "Weakness2"]
      }
    },
    "keyMetrics": {
      "market_penetration": "X%",
      "market_growth_rate": "X%",
      "relative_market_share": "X%"
    }
  }
}`;

async function executeMarketPositionSearch(
  company: string,
  dataStream?: DataStreamWriter
): Promise<Source[]> {
  const sources: Source[] = [];
  let processedSources = 0;
  let totalSources = 0;

  try {
    // Get search plan
    const searchPrompt = MARKET_POSITION_SEARCH_PROMPT.replace(
      "{company}",
      company
    );
    const { text: planResult } = await generateText({
      model: anthropic("claude-3-5-sonnet-20241022"),
      prompt: searchPrompt,
    });

    const searchPlan = JSON.parse(planResult);

    // Stream search plan
    dataStream?.writeData({
      tool: "market_position_analysis",
      content: {
        phase: "data_collection",
        timestamp: new Date().toISOString(),
        searchState: {
          query: "Initializing search plan",
          source: "Search Planning",
          foundDocuments: 0,
          extractedInsights: 0,
        },
        progress: {
          totalSources: 0,
          processedSources: 0,
        },
      },
    });

    // Execute searches
    for (const queryInfo of searchPlan.queries) {
      // Stream current query info
      dataStream?.writeData({
        tool: "market_position_analysis",
        content: {
          phase: "data_collection",
          timestamp: new Date().toISOString(),
          searchState: {
            query: queryInfo.query,
            source: "Search Execution",
            foundDocuments: 0,
            extractedInsights: 0,
          },
          progress: {
            totalSources,
            processedSources,
          },
        },
      });

      const searchResult = await app.search(queryInfo.query);

      if (searchResult.success && searchResult.data?.length > 0) {
        const urls = searchResult.data.slice(0, 3).map((result) => ({
          url: result.url,
          title: result.title,
          description: result.description,
        }));

        totalSources += urls.length;

        // Stream found documents
        dataStream?.writeData({
          tool: "market_position_analysis",
          content: {
            phase: "data_collection",
            timestamp: new Date().toISOString(),
            searchState: {
              query: queryInfo.query,
              source: "Search Results",
              foundDocuments: urls.length,
              extractedInsights: processedSources,
            },
            progress: {
              totalSources,
              processedSources,
            },
          },
        });

        // Process each URL
        for (const urlData of urls) {
          try {
            // Stream current processing URL
            dataStream?.writeData({
              tool: "market_position_analysis",
              content: {
                phase: "data_collection",
                timestamp: new Date().toISOString(),
                searchState: {
                  query: queryInfo.query,
                  source: urlData.url,
                  foundDocuments: urls.length,
                  extractedInsights: processedSources,
                },
                progress: {
                  totalSources,
                  processedSources,
                },
              },
            });

            const extractionPrompt = MARKET_POSITION_EXTRACTION_PROMPT.replace(
              "{company}",
              company
            );
            const extractResult = await app.extract([urlData.url], {
              prompt: extractionPrompt,
            });

            if (extractResult.success && extractResult.data) {
              const source = {
                url: urlData.url,
                title: urlData.title || "Untitled",
                content: {
                  raw: urlData.description || "",
                  extracted: extractResult.data.extracted,
                },
              };

              sources.push(source);
              processedSources++;

              // Stream extracted content
              dataStream?.writeData({
                tool: "market_position_analysis",
                content: {
                  phase: "data_collection",
                  timestamp: new Date().toISOString(),
                  searchState: {
                    query: queryInfo.query,
                    source: urlData.url,
                    foundDocuments: urls.length,
                    extractedInsights: processedSources,
                  },
                  progress: {
                    totalSources,
                    processedSources,
                  },
                  latestExtraction: {
                    url: urlData.url,
                    title: urlData.title,
                    marketPosition: extractResult.data.extracted.marketPosition,
                    keyMetrics: extractResult.data.extracted.keyMetrics,
                  },
                },
              });
            }
          } catch (extractError) {
            console.error(
              `Error extracting data from ${urlData.url}:`,
              extractError
            );

            // Stream error information
            dataStream?.writeData({
              tool: "market_position_analysis",
              content: {
                phase: "data_collection",
                timestamp: new Date().toISOString(),
                searchState: {
                  query: queryInfo.query,
                  source: urlData.url,
                  foundDocuments: urls.length,
                  extractedInsights: processedSources,
                },
                progress: {
                  totalSources,
                  processedSources,
                },
                error: `Failed to extract data from ${urlData.url}: ${extractError.message}`,
              },
            });
          }
        }
      }
    }
  } catch (error) {
    console.error(`Market position search execution error:`, error);
    throw error;
  }

  return sources;
}

// Main tool definition remains similar but with enhanced error handling
export const marketPositionTool: ToolDefinition<typeof MarketPositionParams> = {
  name: "market_position_analysis",
  description:
    "Analyze a company's market position, including market share, brand strength, and geographic presence",
  parameters: MarketPositionParams,

  execute: async (
    { company },
    dataStream?: DataStreamWriter
  ): Promise<ToolExecuteResult> => {
    try {
      const sources = await executeMarketPositionSearch(company, dataStream);

      const aggregatedData = {
        marketPosition: sources
          .filter((s) => s.content.extracted.marketPosition)
          .map((s) => s.content.extracted.marketPosition),
        metrics: sources.reduce((acc, source) => {
          if (source.content.extracted.keyMetrics) {
            Object.assign(acc, source.content.extracted.keyMetrics);
          }
          return acc;
        }, {} as Record<string, string>),
        sources: sources.map((s) => ({
          url: s.url,
          title: s.title,
        })),
      };

      // Final completion stream
      dataStream?.writeData({
        tool: "market_position_analysis",
        content: {
          phase: "data_collection",
          timestamp: new Date().toISOString(),
          searchState: {
            query: "Analysis complete",
            source: "Final Results",
            foundDocuments: sources.length,
            extractedInsights: sources.length,
          },
          progress: {
            totalSources: sources.length,
            processedSources: sources.length,
          },
          complete: true,
          summary: aggregatedData,
        },
      });
      console.log("aggregatedData \n", JSON.stringify(aggregatedData));
      return {
        success: true,
        data: JSON.stringify(aggregatedData),
      };
    } catch (error) {
      // Stream error state
      dataStream?.writeData({
        tool: "market_position_analysis",
        content: {
          phase: "data_collection",
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : "Analysis failed",
          complete: true,
        },
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : "Analysis failed",
      };
    }
  },
};
