import { anthropic } from "@ai-sdk/anthropic";
import { getToolsConfig } from "@/lib/tools";
import {
  streamText,
  appendClientMessage,
  createIdGenerator,
  appendResponseMessages,
  createDataStreamResponse,
  DataStreamWriter,
} from "ai";
import { type ToolExecuteResult } from "@/app/types/tools";
import { saveChat, loadChat } from "@/utils/store/chat-store";
export const maxDuration = 30;

export async function POST(req: Request) {
  const { message, id, currentWorkspace } = await req.json();
  const previousMessages = await loadChat(id);
  const toolsConfig = getToolsConfig();
  const messages = appendClientMessage({
    messages: previousMessages,
    message,
  });

  return createDataStreamResponse({
    execute: async (dataStream) => {
      // 包装工具执行函数以处理错误和发送状态
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
                // 发送工具开始执行的状态

                const result = (await config.execute(
                  params,
                  dataStream
                )) as ToolExecuteResult;
                if (!result.success) {
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
        model: anthropic("claude-3-7-sonnet-20250219"),
        messages,
        tools: wrappedTools,
        experimental_generateMessageId: createIdGenerator({
          prefix: "msgs",
          size: 16,
        }),
        maxSteps: 20,
        async onFinish({ response }) {
          // 保存聊天记录
          await saveChat({
            id,
            messages: appendResponseMessages({
              messages,
              responseMessages: response.messages,
            }),
          });

          // 发送完成状态
          dataStream.writeData({
            type: "chat-status",
            content: {
              status: "completed",
              message: "Chat response completed",
              timestamp: new Date().toISOString(),
            },
          });
        },
        onError: (error) => {
          // 发送错误状态
          dataStream.writeData({
            type: "chat-status",
            content: {
              status: "error",
              message:
                error instanceof Error
                  ? error.message
                  : "Unexpected error in chat",
              timestamp: new Date().toISOString(),
            },
          });
        },
      });

      // 合并流
      result.mergeIntoDataStream(dataStream);
    },
    onError: (error) => {
      return error instanceof Error ? error.message : String(error);
    },
  });
}
