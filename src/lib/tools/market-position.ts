import { z } from "zod";
import type { ToolDefinition, ToolExecuteResult } from "@/app/types/tools";
import type { DataStreamWriter } from "ai";
import FirecrawlApp from "@mendable/firecrawl-js";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";

const app = new FirecrawlApp({
  apiKey: process.env.FIRECRAWL_API_KEY || "",
});

type Source = {
  url: string;
  title: string;
  content: {
    raw: string;
    extracted: string;
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
const MARKET_POSITION_SEARCH_PROMPT = `You are a buy-side analyst tasked with thoroughly researching {company}'s market position. Your objective is to generate 5-7 highly targeted search queries that yield actionable insights on the following aspects:
1. Current market share and competitive positioning within the industry.
2. Brand strength, recognition, and overall customer sentiment.
3. Geographic presence, market penetration, and regional performance.
4. Product portfolio diversity, market coverage, and recent innovations or expansions.

Each query should be designed to extract both quantitative metrics (e.g., market percentages, revenue figures, growth rates) and qualitative insights (e.g., consumer opinions, brand reputation). Ensure that each query is distinct and avoids redundancy.
Output the results in the exact JSON format:
{
  "queries": [
    {
      "purpose": "string (describe what specific information this query is intended to extract)",
      "query": "string (the precise search query)"
    }
  ]
}`;

// Extraction prompt
const MARKET_POSITION_EXTRACTION_PROMPT = `Extract detailed and comprehensive information on {company}'s market position by focusing on:
- Overall market share and competitive positioning,
- Brand strength, recognition, and customer sentiment,
- Geographic presence, market penetration, and regional performance,
- Product portfolio diversity, including recent product launches, innovations, or market expansions.

Prioritize quantitative data (such as market share percentages, revenue figures, and growth rates) and incorporate qualitative insights to provide context and depth.`;

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
        const urls = searchResult.data.slice(0, 5).map((result) => ({
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
                  extracted: JSON.stringify(extractResult.data),
                },
              };
              console.log("source \n", source);
              sources.push(source);
              processedSources++;
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
        sources: sources.map((s) => ({
          url: s.url,
          title: s.title,
          extracted: s.content.extracted,
          raw: s.content.raw,
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
