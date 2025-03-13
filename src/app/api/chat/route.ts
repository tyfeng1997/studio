import { anthropic } from "@ai-sdk/anthropic";
import { getToolsConfig } from "@/lib/tools";
import { deepseek } from "@ai-sdk/deepseek";

import {
  streamText,
  appendClientMessage,
  createIdGenerator,
  appendResponseMessages,
  experimental_createMCPClient,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";

import { saveChat, loadChat } from "@/utils/store/chat-store";
export const maxDuration = 30;

let client = await experimental_createMCPClient({
  transport: {
    type: "sse",
    url: "http://localhost:3001/sse",
  },
});
// const enhancedModel = wrapLanguageModel({
//   model: groq('deepseek-r1-distill-llama-70b'),
//   middleware: extractReasoningMiddleware({ tagName: 'think' }),
// });

export async function POST(req: Request) {
  const { message, id } = await req.json();
  const previousMessages = await loadChat(id);
  const toolsConfig = getToolsConfig();
  const messages = appendClientMessage({
    messages: previousMessages,
    message,
  });
  const tools = await client.tools();
  console.log("tools\n", tools);
  // anthropic("claude-3-7-sonnet-20250219"),
  // deepseek("deepseek-reasoner"),
  const result = streamText({
    model: anthropic("claude-3-7-sonnet-20250219"),
    messages,
    tools: { ...tools, ...toolsConfig },
    toolCallStreaming: true,
    experimental_generateMessageId: createIdGenerator({
      prefix: "msgs",
      size: 16,
    }),
    maxSteps: 20,
    // 添加 reasoning 配置
    providerOptions: {
      anthropic: {
        thinking: { type: "enabled", budgetTokens: 12000 },
      },
    },
    async onFinish({ response }) {
      try {
        // 在保存之前处理消息，移除 reasoning 部分
        const simplifiedMessages = appendResponseMessages({
          messages,
          responseMessages: response.messages.map((msg) => {
            // 如果消息中有 parts 属性，只保留文本部分
            if (msg.parts) {
              return {
                ...msg,
                // 只保留 text 类型的 parts
                parts: msg.parts.filter((part) => part.type === "text"),
                // 从 parts 中提取文本内容并合并
                content: msg.parts
                  .filter((part) => part.type === "text")
                  .map((part) => part.text)
                  .join("\n"),
              };
            }
            return msg;
          }),
        });

        // 保存处理后的聊天记录
        await saveChat({
          id,
          messages: simplifiedMessages,
        });
      } catch (error) {
        console.error("Error saving chat:", error);
      }
    },
    onError: (error) => {
      console.log(error);
    },
  });
  result.consumeStream(); // no await
  return result.toDataStreamResponse({
    sendReasoning: true,
  });
}
