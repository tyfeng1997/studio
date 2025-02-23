import { z } from "zod";
import type { ToolDefinition, ToolExecuteResult } from "@/app/types/tools";
import type { DataStreamWriter } from "ai";
import FirecrawlApp from "@mendable/firecrawl-js";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";

// 简单的 sleep 方法，用于延时处理
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

/*
使用 MARKET POSITION SEARCH 研究一下 Nvidia，报告尽可能的正式，详细，不要简化内容。像买方分析师的报告一样，每个数据点在报告正文中都应该标注对应的引用编号[n], 以便读者查证，引用要写在报告的结尾。
*/
const MARKET_POSITION_SEARCH_PROMPT = `You are a buy-side analyst tasked with thoroughly researching {company}'s market position. Your objective is to generate 5 highly targeted search queries that yield actionable insights on the following aspects:
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
    // 生成搜索计划
    const searchPrompt = MARKET_POSITION_SEARCH_PROMPT.replace(
      "{company}",
      company
    );
    const { text: planResult } = await generateText({
      model: anthropic("claude-3-5-sonnet-20241022"),
      prompt: searchPrompt,
    });
    const searchPlan = JSON.parse(planResult);

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
    console.log("[searchPlan]\n", searchPlan);

    // 先收集所有查询得到的 URL
    const allUrls: { url: string; title: string; description: string }[] = [];
    for (const queryInfo of searchPlan.queries) {
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
      // 加入延时，防止请求速率过快
      await sleep(1000);

      const searchResult = await app.search(queryInfo.query);
      console.log("[searchResult]", searchResult);
      if (searchResult.success && searchResult.data?.length > 0) {
        const urls = searchResult.data.slice(0, 5).map((result) => ({
          url: result.url,
          title: result.title,
          description: result.description,
        }));
        allUrls.push(...urls);
        totalSources += urls.length;
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
      }
    }
    console.log("[URLS]\n", allUrls);

    // 利用 Firecrawl 的批量提取功能，一次性提取所有 URL 信息，每批3个
    if (allUrls.length > 0) {
      const extractionPrompt = MARKET_POSITION_EXTRACTION_PROMPT.replace(
        "{company}",
        company
      );
      dataStream?.writeData({
        tool: "market_position_analysis",
        content: {
          phase: "data_collection",
          timestamp: new Date().toISOString(),
          searchState: {
            query: "Batch extraction",
            source: "Extraction Execution",
            foundDocuments: totalSources,
            extractedInsights: processedSources,
          },
          progress: {
            totalSources,
            processedSources,
          },
        },
      });

      const urlsToExtract = allUrls.map((item) => item.url);
      console.log("[urlsToExtract]\n", urlsToExtract);

      const batchSize = 2;
      for (let i = 0; i < urlsToExtract.length; i += batchSize) {
        const batch = urlsToExtract.slice(i, i + batchSize);
        const batchExtractResult = await app.extract(batch, {
          prompt: extractionPrompt,
        });
        if (batchExtractResult.success && batchExtractResult.data) {
          for (let j = 0; j < batch.length; j++) {
            const urlIndex = i + j;
            const urlData = allUrls[urlIndex];
            const extractedContent = batchExtractResult.data[j];
            sources.push({
              url: urlData.url,
              title: urlData.title || "Untitled",
              content: {
                raw: urlData.description || "",
                extracted: JSON.stringify(extractedContent),
              },
            });
            processedSources++;
          }
        }
        // 每批提取后等待一段时间，避免触发 API 速率限制
        await sleep(1000);
      }
    }
  } catch (error) {
    console.error(`Market position search execution error:`, error);
    throw error;
  }

  return sources;
}

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
