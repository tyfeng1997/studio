import { z } from "zod";
import type { ToolDefinition, ToolExecuteResult } from "@/app/types/tools";

const DeepSearchParams = z.object({
  query: z.string().describe("Search query to get in-depth research results"),

  systemPrompt: z
    .string()
    .optional()
    .default("Be precise and concise.")
    .describe("System prompt to guide the search behavior"),
});

export const deepsearchTool: ToolDefinition<typeof DeepSearchParams> = {
  name: "deepsearch",
  description:
    "Performs an in-depth research search using Perplexity AI to find comprehensive information on a topic.",
  parameters: DeepSearchParams,
  execute: async ({ query, systemPrompt }): Promise<ToolExecuteResult> => {
    try {
      // Input validation
      if (!query.trim()) {
        throw new Error("Search query cannot be empty");
      }

      const apiKey = process.env.PERPLEXITY_API_KEY;
      if (!apiKey) {
        throw new Error("Perplexity API key is not configured");
      }

      const response = await fetch(
        "https://api.perplexity.ai/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
            Accept: "application/json",
          },
          body: JSON.stringify({
            model: "sonar-deep-research",
            messages: [
              {
                role: "system",
                content: systemPrompt,
              },
              {
                role: "user",
                content: query,
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Perplexity API error (${response.status}): ${errorText}`
        );
      }

      const result = await response.json();

      return {
        success: true,
        data: {
          content: result.choices[0].message.content,
          model: result.model,
          query,
          // Include any other relevant info from the response
          usage: result.usage,
        },
      };
    } catch (error) {
      console.error(`Deep search tool error:`, error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to perform deep search",
      };
    }
  },
};
