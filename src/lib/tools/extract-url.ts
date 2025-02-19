import { z } from "zod";
import type { ToolDefinition, ToolExecuteResult } from "@/app/types/tools";
import FirecrawlApp from "@mendable/firecrawl-js";
import type { DataStreamWriter } from "ai"; // 正确的导入

const app = new FirecrawlApp({
  apiKey: process.env.FIRECRAWL_API_KEY || "",
});
const ExtractParams = z.object({
  urls: z.array(z.string()).describe("Array of URLs to extract data from"),
  prompt: z.string().describe("Description of what data to extract"),
});

export const extractTool: ToolDefinition<typeof ExtractParams> = {
  name: "extract",
  description:
    "Extract structured data from web pages. Use this to get whatever data you need from a URL. Any time someone needs to gather data from something, use this tool.",
  parameters: ExtractParams,
  execute: async (
    { urls, prompt },
    dataStream?: DataStreamWriter
  ): Promise<ToolExecuteResult> => {
    try {
      // Input validation
      if (!urls.length) {
        throw new Error("URLs array cannot be empty");
      }

      if (!prompt.trim()) {
        throw new Error("Extraction prompt cannot be empty");
      }

      dataStream?.writeData({
        tool: "extract",
        content: {
          params: {
            urls: urls,
            prompt: prompt,
          },
          timestamp: new Date().toISOString(),
        },
      });

      const scrapeResult = await app.extract(urls, {
        prompt,
      });

      if (!scrapeResult.success) {
        return {
          success: false,
          error: `Failed to extract data: ${scrapeResult.error}`,
        };
      }

      dataStream?.writeData({
        tool: "extract",
        content: {
          result: {
            extractedData: scrapeResult.data,
          },
          timestamp: new Date().toISOString(),
        },
      });

      return {
        success: true,
        data: scrapeResult.data,
      };
    } catch (error) {
      console.error("Extraction error:", error);
      if (error instanceof Error) {
        console.error(error.message);
      }
      return {
        success: false,
        error:
          error instanceof Error
            ? `Extraction failed: ${error.message}`
            : "Failed to extract data",
      };
    }
  },
};
