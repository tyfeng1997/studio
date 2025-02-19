import { z } from "zod";
import type { ToolDefinition, ToolExecuteResult } from "@/app/types/tools";
import FirecrawlApp from "@mendable/firecrawl-js";
import type { DataStreamWriter } from "ai"; // 正确的导入

const app = new FirecrawlApp({
  apiKey: process.env.FIRECRAWL_API_KEY || "",
});

const ScrapeParams = z.object({
  url: z.string().describe("URL to scrape"),
});

export const scrapeTool: ToolDefinition<typeof ScrapeParams> = {
  name: "scrape",
  description:
    "Scrape web pages. Use this to get from a page when you have the url.",
  parameters: ScrapeParams,
  execute: async (
    { url },
    dataStream?: DataStreamWriter
  ): Promise<ToolExecuteResult> => {
    try {
      // Input validation
      if (!url.trim()) {
        throw new Error("URL cannot be empty");
      }
      dataStream?.writeData({
        type: "tool-status",
        content: {
          tool: "scrape",
          status: "started",
          message: "Starting extract execution",
          timestamp: new Date().toISOString(),
        },
      });

      // 发送进度初始化
      dataStream?.writeData({
        type: "progress-init",
        content: {
          tool: "scrape",
          totalSteps: 1,
        },
      });

      const scrapeResult = await app.scrapeUrl(url);

      if (!scrapeResult.success) {
        return {
          success: false,
          error: `Failed to extract data: ${scrapeResult.error}`,
        };
      }

      dataStream?.writeData({
        type: "tool-status",
        content: {
          tool: "scrape",
          status: "completed",
          message: `search execution completed`,
          timestamp: new Date().toISOString(),
        },
      });

      return {
        success: true,
        data:
          scrapeResult.markdown ??
          "Could get the page content, try using search or extract",
      };
    } catch (error) {
      console.error("Extraction error:", error);
      if (error instanceof Error) {
        console.error(error.message);
        console.error(error.error);
      }
      return {
        success: false,
        error:
          error instanceof Error
            ? `Extraction failed: ${error.message}`
            : "Failed to scrape data",
      };
    }
  },
};
