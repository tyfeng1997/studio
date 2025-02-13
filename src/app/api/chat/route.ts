import { anthropic } from "@ai-sdk/anthropic";
import { getToolsConfig } from "@/lib/tools";
import { streamText } from "ai";
import { type ToolExecuteResult } from "@/app/types/tools";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();
  console.log("message ", messages);
  const toolsConfig = getToolsConfig();

  // 包装工具执行函数以处理错误
  const wrappedTools = Object.entries(toolsConfig).reduce(
    (acc, [name, config]) => {
      if (!config || typeof config.execute !== "function") {
        console.warn(`Invalid tool configuration for ${name}`);
        return acc;
      }
      acc[name] = {
        ...config,
        execute: async (params: any) => {
          try {
            const result = (await config.execute(params)) as ToolExecuteResult;
            if (!result.success) {
              // 将错误信息返回给 LLM
              return {
                error: result.error || `Failed to execute ${name} tool`,
              };
            }
            return result.data;
          } catch (error) {
            console.error(`Error executing tool ${name}:`, error);
            return {
              error:
                error instanceof Error
                  ? error.message
                  : `Unexpected error in ${name} tool`,
            };
          }
        },
      };
      return acc;
    },
    {} as Record<string, any>
  );

  const result = streamText({
    model: anthropic("claude-3-5-sonnet-20241022"),
    messages,
    tools: wrappedTools,
  });

  return result.toDataStreamResponse();
}
