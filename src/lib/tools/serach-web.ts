import { z } from "zod";
import type { ToolDefinition, ToolExecuteResult } from "@/app/types/tools";
import FirecrawlApp from "@mendable/firecrawl-js";

const app = new FirecrawlApp({
  apiKey: process.env.FIRECRAWL_API_KEY || "",
});
const SearchParams = z.object({
  query: z.string().describe("Search query to find relevant web pages"),
  maxResults: z
    .number()
    .optional()
    .describe("Maximum number of results to return (default 10)"),
});

export const searchTool: ToolDefinition<typeof SearchParams> = {
  name: "search",
  description:
    "Search for web pages. Normally you should call the extract tool after this one to get a specific data point if search doesn't return the exact data you need.",
  parameters: SearchParams,
  execute: async ({ query, maxResults = 5 }): Promise<ToolExecuteResult> => {
    try {
      // Input validation
      if (!query.trim()) {
        throw new Error("Search query cannot be empty");
      }

      const searchResult = await app.search(query);

      if (!searchResult.success) {
        return {
          success: false,
          error: `Search failed: ${searchResult.error}`,
        };
      }

      // Add favicon URLs to search results
      const resultsWithFavicons = searchResult.data.map((result: any) => {
        const url = new URL(result.url);
        const favicon = `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=32`;
        return {
          ...result,
          favicon,
        };
      });

      return {
        success: true,
        data: resultsWithFavicons.slice(0, maxResults),
      };
    } catch (error) {
      console.error(`Search tool error:`, error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to perform search",
      };
    }
  },
};
