import { anthropic } from "@ai-sdk/anthropic";
import { getToolsConfig } from "@/lib/tools";
import {
  streamText,
  appendClientMessage,
  createIdGenerator,
  appendResponseMessages,
} from "ai";
import { type ToolExecuteResult } from "@/app/types/tools";
import { saveChat, loadChat } from "@/utils/store/chat-store";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { message, id } = await req.json();

  console.log("message (single)", message);

  const previousMessages = await loadChat(id);

  const toolsConfig = getToolsConfig();
  const messages = appendClientMessage({
    messages: previousMessages,
    message,
  });
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
    experimental_generateMessageId: createIdGenerator({
      prefix: "msgs",
      size: 16,
    }),
    async onFinish({ response }) {
      await saveChat({
        id,
        messages: appendResponseMessages({
          messages,
          responseMessages: response.messages,
        }),
      });
    },
  });
  result.consumeStream(); // no await

  return result.toDataStreamResponse();
}
