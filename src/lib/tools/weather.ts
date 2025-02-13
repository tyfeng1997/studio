import { z } from "zod";
import type { ToolDefinition, ToolExecuteResult } from "@/app/types/tools";

const WeatherParams = z.object({
  location: z.string().describe("The location to get the weather for"),
});

export const weatherTool: ToolDefinition<typeof WeatherParams> = {
  name: "weather",
  description: "Get the weather in a location (fahrenheit)",
  parameters: WeatherParams,
  execute: async ({ location }): Promise<ToolExecuteResult> => {
    try {
      // 模拟可能的 API 调用错误
      if (!location.trim()) {
        throw new Error("Location cannot be empty");
      }

      const temperature = Math.round(Math.random() * (90 - 32) + 32);
      return {
        success: true,
        data: {
          location,
          temperature,
        },
      };
    } catch (error) {
      console.error(`Weather tool error:`, error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to get weather information",
      };
    }
  },
};
